import { describe, expect, it } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import {
  createBoard,
  createCircuit,
  createLoad,
  createProject,
} from "../src/domain/project";
import { calculateProject } from "../src/engine/electrical";
import { simulateRange } from "../src/engine/simulation";
import {
  bomCsv,
  deriveBOM,
  pricedBOMLines,
  procurementQuantity,
} from "../src/import-export/bom";
import {
  calculateBill,
  createEngineeringPdf,
} from "../src/import-export/reports";
import { freezeReportSnapshot } from "../src/import-export/reportSnapshot";
import { reportBlocks } from "../src/import-export/reportSections";
import {
  circuitScheduleCsv,
  reportSeriesCsv,
  scenarioComparisonCsv,
} from "../src/import-export/scenarioExports";
import { createDiagramPdf } from "../src/import-export/diagramPdf";
import { buildDiagramSnapshot } from "../src/commands/diagram";

function fixture() {
  const p = createProject("Analytical Überprüfung — Àyẹ̀wò Yorùbá");
  const board = p.boards[0];
  board.feeder = {
    lengthM: 20,
    resistanceOhmPerKm: 0.8,
    reactanceOhmPerKm: 0.08,
    source: "Explicit analytical feeder data",
  };
  const circuit = createCircuit(board.id, {
    name: "Entered circuit",
    protectiveA: 16,
    cable: {
      lengthM: 12.5,
      areaMm2: 2.5,
      source: "Explicit measured route fixture",
    },
  });
  p.circuits = [circuit];
  p.loads = [
    createLoad({
      name: "=Analytical heater",
      rating: 1,
      quantity: 3,
      hoursPerDay: 24,
      startHour: 0,
      boardId: board.id,
      circuitId: circuit.id,
    }),
  ];
  p.equipmentLibrary = [createLoad({ name: "Unused template", quantity: 20 })];
  p.reportDetails = {
    reference: "QA-REPORT",
    preparedBy: "Analytical verification fixture only",
    customer: "No real customer data",
    scopeNotes: "Entered analytical inputs; no installation certification.",
  };
  return p;
}
describe("model reports and real portable exports", () => {
  it("BOM counts only modeled components and entered cable lengths, never templates or drawings", () => {
    const p = fixture(),
      bom = deriveBOM(p);
    expect(
      bom.rows
        .filter((row) => row.kind === "cable")
        .reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(32.5);
    expect(bom.rows.find((row) => row.kind === "load")?.quantity).toBe(3);
    expect(bom.rows.filter((row) => row.kind === "board")).toHaveLength(1);
    expect(bom.rows.filter((row) => row.kind === "protection")).toHaveLength(1);
    expect(
      bom.rows.some((row) => row.description.includes("Unused template")),
    ).toBe(false);
    expect(bomCsv(bom)).toContain("'=Analytical heater");
  });
  it("waste and explicit prices use upward procurement rounding and independent exact billing arithmetic", () => {
    expect(procurementQuantity(12.5, "10", "m")).toBe("13.750");
    expect(procurementQuantity(2, "10", "piece")).toBe("3");
    expect(() => procurementQuantity(1, "101")).toThrow(/100/);
    const p = fixture(),
      bom = deriveBOM(p),
      cable = bom.rows.find((row) => row.kind === "cable")!;
    cable.quantity = 10;
    const lines = pricedBOMLines(bom, {
      [cable.id]: {
        unitPrice: "2.50",
        wastePercent: "10",
        labourQuantity: "2",
        labourRate: "20",
      },
    });
    expect(lines).toHaveLength(2);
    expect(lines[0].quantity).toBe("11.000");
    expect(lines[0].source).toMatchObject({
      projectId: p.id,
      revision: 1,
      quantity: 10,
      unit: "m",
    });
    expect(
      calculateBill({
        currency: "EUR",
        lines,
        taxPercent: "0",
        discountPercent: "0",
      }).totalMinor,
    ).toBe(6750);
  });
  it("freezes one project revision and rejects stale or cross-project simulation evidence", () => {
    const p = fixture(),
      r = calculateProject(p),
      s = freezeReportSnapshot(p, r);
    p.loads[0].rating = 99;
    expect(s.project.loads[0].rating).toBe(1);
    expect(Object.isFrozen(s.project.loads)).toBe(true);
    expect(() => freezeReportSnapshot({ ...p, revision: 2 }, r)).toThrow(
      /revision/,
    );
    expect(() =>
      freezeReportSnapshot(s.project, r, {
        context: {
          calendar: {
            projectId: "another-project",
            revision: 1,
            calculatedAt: new Date().toISOString(),
            source: "Wrong scope",
            result: {
              revision: 1,
              engineVersion: r.engineVersion,
              points: [],
              totalKWh: 0,
              peakKW: 0,
              elapsedHours: 0,
              energyCost: 0,
              issues: [],
            },
          },
        },
      }),
    ).toThrow(/another project/);
  });
  it("exports complete calendar evidence and explicit circuit/scenario values with safe text cells", () => {
    const p = fixture(),
      r = calculateProject(p),
      options = {
        start: "2026-01-01T00:00:00+01:00",
        end: "2026-01-02T00:00:00+01:00",
        intervalMinutes: 15 as const,
      },
      calendar = simulateRange(p, options);
    const s = freezeReportSnapshot(p, r, {
      context: {
        calendar: {
          projectId: p.id,
          revision: p.revision,
          calculatedAt: new Date().toISOString(),
          source: "Actual test execution of the calendar engine",
          inputs: options,
          result: calendar,
        },
      },
    });
    expect(calendar.totalKWh).toBeCloseTo(72, 8);
    expect(reportSeriesCsv(s, "calendar").split("\r\n")).toHaveLength(97);
    expect(circuitScheduleCsv(p)).toContain("12.5");
    expect(scenarioComparisonCsv({ project: p, result: r }, [])).toContain(
      "daily_kWh_estimate",
    );
    expect(JSON.stringify(reportBlocks(s, "measurements"))).toContain(
      "No validated saved measurement",
    );
    expect(() => reportSeriesCsv(s, "energy")).toThrow(
      /Run an energy simulation/,
    );
  });
  it("creates actual multi-section Yoruba and vector German PDFs using an embedded font", async () => {
    const p = fixture(),
      r = calculateProject(p),
      fontBase64 = readFileSync("public/assets/fonts/DejaVuSans.ttf").toString(
        "base64",
      );
    const s = freezeReportSnapshot(p, r, { locale: "yo" });
    const pdf = await createEngineeringPdf(p, r, {
      locale: "yo",
      fontBase64,
      snapshot: s,
      sections: [
        "summary",
        "boards",
        "assessments",
        "motors",
        "energy",
        "storage",
        "ev",
        "scenarios",
        "bom",
        "measurements",
        "series",
        "trace",
        "diagram",
      ],
    });
    const diagram = await createDiagramPdf(buildDiagramSnapshot(p, r), {
      locale: "de",
      fontBase64,
    });
    for (const blob of [pdf, diagram]) {
      const bytes = Buffer.from(await blob.arrayBuffer());
      expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
      expect(bytes.length).toBeGreaterThan(10000);
    }
    if (process.env.POWERLAB_PDF_QA_DIR) {
      mkdirSync(process.env.POWERLAB_PDF_QA_DIR, { recursive: true });
      writeFileSync(
        process.env.POWERLAB_PDF_QA_DIR + "/report-sections-yo.pdf",
        Buffer.from(await pdf.arrayBuffer()),
      );
      writeFileSync(
        process.env.POWERLAB_PDF_QA_DIR + "/diagram-vector-de.pdf",
        Buffer.from(await diagram.arrayBuffer()),
      );
    }
  }, 30000);
});
