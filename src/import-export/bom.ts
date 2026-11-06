import type { Cable, Project } from "../domain/types";
import { makeCSV } from "./files";
import { decimalInteger, type BillLine } from "./reports";

export interface BOMRow {
  id: string;
  sourceIds: string[];
  kind: "load" | "board" | "protection" | "cable";
  description: string;
  quantity: number;
  unit: "piece" | "m";
  evidence: string;
}
export interface BOMSnapshot {
  projectId: string;
  revision: number;
  currency: string;
  rows: BOMRow[];
  notes: string[];
}
export interface BOMPrice {
  unitPrice: string;
  wastePercent: string;
  labourQuantity: string;
  labourRate: string;
}
export type BOMPricing = Record<string, BOMPrice>;

/** Counts modeled components and entered one-way cable routes. No drawing geometry is measured. */
export function deriveBOM(project: Project): BOMSnapshot {
  const rows: BOMRow[] = [],
    notes: string[] = [];
  for (const load of project.loads)
    rows.push({
      id: `load:${load.id}`,
      sourceIds: [load.id],
      kind: "load",
      description: load.name,
      quantity: load.quantity,
      unit: "piece",
      evidence: load.source.reference,
    });
  const cable = (id: string, name: string, value: Cable | undefined) => {
    if (!value) return;
    if (!Number.isFinite(value.lengthM) || value.lengthM < 0)
      throw new Error(`Invalid entered cable route length: ${name}.`);
    rows.push({
      id: `cable:${id}`,
      sourceIds: [id],
      kind: "cable",
      description: `${name}${value.areaMm2 !== undefined ? ` · ${value.areaMm2} mm²` : ""}`,
      quantity: value.lengthM,
      unit: "m",
      evidence: value.source || "Entered cable length; source not supplied.",
    });
  };
  for (const board of project.boards) {
    rows.push({
      id: `board:${board.id}`,
      sourceIds: [board.id],
      kind: "board",
      description: `${board.name} · ${board.ratedA} A · ${board.ways} ways`,
      quantity: 1,
      unit: "piece",
      evidence: "Entered board model; verify actual equipment specification.",
    });
    cable(board.id, `${board.name} — feeder cable`, board.feeder);
  }
  for (const circuit of project.circuits) {
    if (circuit.protectiveA !== undefined)
      rows.push({
        id: `protection:${circuit.id}`,
        sourceIds: [circuit.id],
        kind: "protection",
        description: `${circuit.name} — protective device · ${circuit.protectiveA} A`,
        quantity: 1,
        unit: "piece",
        evidence:
          "Entered protective rating; device model and manufacturer approval are not inferred.",
      });
    cable(circuit.id, `${circuit.name} — cable`, circuit.cable);
  }
  if (project.energy.pvKW > 0 || project.energy.battery.capacityKWh > 0)
    notes.push(
      "PV power and battery capacity do not establish module counts. Add their actual billable components explicitly.",
    );
  if (project.evSessions.length)
    notes.push(
      "Charging sessions are energy requirements, not a count of installed chargers.",
    );
  notes.push(
    "Cable quantities are entered one-way route lengths. Conductor count, offcuts, waste and procurement packaging require explicit review.",
  );
  return {
    projectId: project.id,
    revision: project.revision,
    currency: project.currency,
    rows,
    notes,
  };
}

export function bomCsv(bom: BOMSnapshot): string {
  return makeCSV([
    [
      "project_id",
      "revision",
      "item_id",
      "source_ids",
      "category",
      "description",
      "quantity",
      "unit",
      "evidence",
    ],
    ...bom.rows.map((row) => [
      bom.projectId,
      bom.revision,
      row.id,
      row.sourceIds.join(";"),
      row.kind,
      row.description,
      row.quantity,
      row.unit,
      row.evidence,
    ]),
  ]);
}

/** Applies an explicit waste percentage with decimal arithmetic and upward 0.001-unit procurement rounding. */
export function procurementQuantity(
  quantity: number,
  wastePercent: string,
  unit: "piece" | "m" = "m",
): string {
  if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1_000_000_000)
    throw new Error("BOM quantity is outside the supported range.");
  const raw = quantity.toFixed(3);
  if (Math.abs(Number(raw) - quantity) > 0.0000001)
    throw new Error(
      "Review quantities with more than three decimal places before billing.",
    );
  const base = decimalInteger(raw, 3, "BOM quantity"),
    waste = decimalInteger(wastePercent, 2, "Waste allowance");
  if (waste < 0n || waste > 10000n)
    throw new Error("Waste allowance must be between 0 and 100 percent.");
  const scaled = (base * (10000n + waste) + 9999n) / 10000n;
  if (unit === "piece") return String((scaled + 999n) / 1000n);
  return `${scaled / 1000n}.${String(scaled % 1000n).padStart(3, "0")}`;
}
export function pricedBOMLines(
  bom: BOMSnapshot,
  prices: BOMPricing,
): BillLine[] {
  const lines: BillLine[] = [];
  for (const row of bom.rows) {
    const price = prices[row.id];
    if (!price || !price.unitPrice.trim() || row.quantity === 0) continue;
    const quantity = procurementQuantity(
      row.quantity,
      price.wastePercent || "0",
      row.unit,
    );
    lines.push({
      id: `bom:${bom.projectId}:${row.id}`,
      category: "material",
      description: `${row.description} (${row.unit})${Number(price.wastePercent) ? ` · waste ${price.wastePercent}%` : ""}`,
      quantity,
      unitPrice: price.unitPrice,
      source: {
        projectId: bom.projectId,
        revision: bom.revision,
        entityIds: row.sourceIds,
        kind: row.kind,
        quantity: row.quantity,
        unit: row.unit,
        wastePercent: price.wastePercent || "0",
      },
    });
    if (price.labourQuantity.trim() && Number(price.labourQuantity) > 0) {
      if (!price.labourRate.trim())
        throw new Error(
          "Enter a labour rate for each entered labour quantity.",
        );
      lines.push({
        id: `bom-labour:${bom.projectId}:${row.id}`,
        category: "labour",
        description: `${row.description} — entered labour`,
        quantity: price.labourQuantity,
        unitPrice: price.labourRate,
      });
    }
  }
  if (!lines.length)
    throw new Error("Enter a price for at least one positive model quantity.");
  return lines;
}
