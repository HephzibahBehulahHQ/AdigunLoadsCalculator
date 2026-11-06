import { translate, numberFormat } from "../i18n";
import { assessCircuit } from "../engine/assessments";
import { assessEndpointRoute } from "../engine/feeders";
import { simulateStartEvents } from "../engine/start-events";
import { assessSourceEquipment } from "../engine/sources";
import { validateMeasurementPayload } from "../storage/measurements";
import { deriveBOM } from "./bom";
import type { ReportSnapshot } from "./reportSnapshot";
import type { EngineeringReportSection } from "./reports";

export const REPORT_SECTIONS: {
  id: EngineeringReportSection;
  title: string;
}[] = [
  { id: "summary", title: "Calculation summary" },
  { id: "loads", title: "Load schedule" },
  { id: "boards", title: "Board and phase summary" },
  { id: "circuits", title: "Circuit schedule" },
  { id: "assessments", title: "Cable, protection and feeder checks" },
  { id: "motors", title: "Motor starts and supply capacity" },
  { id: "energy", title: "Energy, tariffs and carbon" },
  { id: "storage", title: "Renewables and storage evidence" },
  { id: "ev", title: "Charging requirements and feasibility" },
  { id: "scenarios", title: "Scenario comparison" },
  { id: "bom", title: "Model-derived bill of materials" },
  { id: "diagram", title: "Vector single-line diagram" },
  { id: "measurements", title: "Measurement provenance" },
  { id: "series", title: "Time-series evidence" },
  { id: "issues", title: "Issues and incomplete checks" },
  { id: "trace", title: "Methods, assumptions and sources" },
];
export type ReportBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "table"; headers: string[]; rows: string[][]; widths?: number[] };

export function reportBlocks(
  snapshot: ReportSnapshot,
  section: EngineeringReportSection,
): ReportBlock[] {
  const { project: p, result: r, context: c, locale } = snapshot,
    blocks: ReportBlock[] = [];
  const t = (key: string) => translate(key, locale),
    n = (value: number | null | undefined, digits = 3) =>
      value === null || value === undefined || !Number.isFinite(value)
        ? t("Not available")
        : numberFormat(value, digits, locale);
  const heading = (text: string) =>
    blocks.push({ kind: "heading", text: t(text) });
  const paragraph = (text: string) =>
    blocks.push({ kind: "paragraph", text: t(text) });
  const table = (headers: string[], rows: unknown[][], widths?: number[]) =>
    blocks.push({
      kind: "table",
      headers: headers.map(t),
      rows: rows.map((row) => row.map((value) => String(value ?? ""))),
      widths,
    });
  const title =
    REPORT_SECTIONS.find((item) => item.id === section)?.title ?? section;
  heading(title);
  if (section === "summary") {
    table(
      ["Quantity", "Value"],
      [
        [t("Installed power"), `${n(r.installedKW)} kW`],
        [t("On-state operating demand"), `${n(r.operatingKW)} kW`],
        [t("Design demand"), `${n(r.designKW)} kW`],
        [t("Net apparent power"), `${n(r.apparentKVA)} kVA`],
        [t("Power factor"), n(r.powerFactor, 4)],
        [t("Daily energy estimate"), `${n(r.dailyKWh)} kWh`],
        [t("Daily energy cost estimate"), `${n(r.dailyCost, 2)} ${p.currency}`],
        [t("Profile peak"), `${n(r.peakKW)} kW`],
        [t("Neutral current"), `${n(r.neutralA)} A`],
        [t("Phase imbalance"), `${n(r.imbalancePercent)} %`],
      ],
    );
    table(
      ["Phase", "Design current (A)", "On-state current (A)"],
      (["L1", "L2", "L3"] as const).map((phase) => [
        phase,
        n(r.phaseCurrents[phase]),
        n(r.phaseOnStateCurrents[phase]),
      ]),
    );
    paragraph(
      r.complete
        ? "Calculated within the declared model; review all issue and evidence sections."
        : "Some checks are incomplete or unsupported. Review the issue register before using these values.",
    );
  } else if (section === "loads") {
    table(
      ["Name", "Qty", "kW", "A", "kWh/day", "Source"],
      p.loads.map((load) => {
        const value = r.loads.find((item) => item.id === load.id);
        return [
          load.name,
          load.quantity,
          n(value?.operatingKW),
          n(value?.currentA),
          n(value?.energyKWh),
          t(load.source.kind),
        ];
      }),
      [55, 15, 25, 25, 25, 37],
    );
  } else if (section === "circuits") {
    table(
      ["Circuit", "Board", "Phase", "Protection (A)", "Cable (m)"],
      p.circuits.map((row) => [
        row.name,
        p.boards.find((b) => b.id === row.boardId)?.name ?? row.boardId,
        row.phase,
        n(row.protectiveA),
        n(row.cable?.lengthM),
      ]),
    );
  } else if (section === "boards") {
    table(
      ["Board", "Parent", "Rating (A)", "Used / ways", "Feeder (m)"],
      p.boards.map((board) => [
        board.name,
        p.boards.find((b) => b.id === board.parentId)?.name ?? t("Source"),
        n(board.ratedA),
        `${p.circuits.filter((row) => row.boardId === board.id).length} / ${board.ways}`,
        n(board.feeder?.lengthM),
      ]),
    );
    paragraph(
      "Board and phase values describe the entered model. Missing cable and device evidence remains unresolved.",
    );
  } else if (section === "assessments") {
    if (!p.circuits.length) paragraph("No circuits have been entered.");
    for (const circuit of p.circuits) {
      const assessment = assessCircuit(p, circuit.id);
      heading(circuit.name);
      paragraph(
        `${t("Design current")}: ${n(assessment.designCurrentA)} A · ${t("Revision")} ${assessment.revision}`,
      );
      table(
        ["Check", "Assessment", "Value / limit", "Method and evidence"],
        assessment.checks.map((check) => [
          t(check.label),
          t(check.assessment),
          `${n(check.value)} / ${n(check.limit)} ${check.unit ?? ""}`,
          `${t(check.detail)}${check.formula ? "\n" + check.formula : ""}${check.source ? "\n" + check.source : ""}`,
        ]),
        [40, 25, 32, 85],
      );
    }
    heading("Source-to-load route assessment");
    const routes = p.loads.map((load) => ({
      load,
      route: assessEndpointRoute(p, load.id),
    }));
    table(
      [
        "Endpoint",
        "Drop (V)",
        "Drop (%)",
        "Receiving (V)",
        "Loss (W)",
        "Route result",
        "Capacity check",
      ],
      routes.map(({ load, route }) => {
        const capacityStatus = route.segments.length
          ? ((["failed", "unsupported", "incomplete"] as const).find((state) =>
              route.segments.some(
                (segment) => segment.capacityAssessment === state,
              ),
            ) ?? "passed")
          : "incomplete";
        return [
          load.name,
          n(route.totalDropV),
          n(route.percent),
          n(route.receivingVoltage),
          n(route.lossW),
          t(route.assessment),
          t(capacityStatus),
        ];
      }),
      [34, 18, 18, 22, 18, 30, 42],
    );
    paragraph(
      "Nominal-current radial phasor model. A missing upstream segment makes the route total unavailable; it is not treated as zero.",
    );
    heading("Capacity check");
    const segments = new Map(
      routes.flatMap(({ route }) =>
        route.segments.map(
          (segment) => [`${segment.kind}:${segment.id}`, segment] as const,
        ),
      ),
    );
    table(
      [
        "Segment",
        "Capacity check",
        "Value / limit",
        "Neutral current",
        "Source",
      ],
      [...segments.values()].map((segment) => [
        segment.name,
        t(segment.capacityAssessment),
        `${n(segment.currentA)} / ${n(segment.capacityA)} A`,
        `${n(segment.neutralA)} A`,
        segment.source || t("Not available"),
      ]),
      [42, 30, 32, 30, 48],
    );
  } else if (section === "motors") {
    const motors = p.loads.filter(
      (load) =>
        load.entryMode === "motor" || load.startingMultiplier !== undefined,
    );
    table(
      [
        "Load",
        "Input mode",
        "Efficiency",
        "Starting multiplier",
        "Starting PF / seconds",
      ],
      motors.map((load) => [
        load.name,
        load.entryMode,
        n(load.efficiency),
        n(load.startingMultiplier),
        `${n(load.startingPF)} / ${n(load.startingSeconds)}`,
      ]),
    );
    if (p.startEvents?.length) {
      const starts = simulateStartEvents(p);
      table(
        ["Quantity", "Value"],
        [
          [t("Peak real power"), `${n(starts.peakKW)} kW`],
          [t("Peak apparent power"), `${n(starts.peakKVA)} kVA`],
          [t("Evaluated sequence energy"), `${n(starts.energyKWh)} kWh`],
        ],
      );
      table(
        ["Timestamp", "Duration (s)", "kW", "kVA", "L1/L2/L3 (A)"],
        starts.points.map((point) => [
          point.timestamp,
          n(point.durationSeconds),
          n(point.kw),
          n(point.kva),
          `${n(point.phaseCurrents.L1)} / ${n(point.phaseCurrents.L2)} / ${n(point.phaseCurrents.L3)}`,
        ]),
        [52, 25, 25, 25, 55],
      );
      for (const issue of starts.issues) paragraph(t(issue.message));
    } else
      paragraph(
        "No timestamped start events were entered. Motor-start sequence results are unavailable.",
      );
    paragraph(
      "Starting-event values use entered current multipliers and starting power factors. They do not predict electromagnetic transients or generator voltage/frequency dips.",
    );
    for (const source of p.sources ?? []) {
      const assessment = assessSourceEquipment(p, source.id);
      heading(source.name);
      paragraph(assessment.method);
      table(
        ["Check", "Assessment", "Value / limit", "Method and evidence"],
        assessment.checks.map((check) => [
          t(check.label),
          t(check.assessment),
          `${n(check.value)} / ${n(check.limit)} ${check.unit ?? ""}`,
          t(check.detail),
        ]),
        [40, 25, 32, 85],
      );
    }
  } else if (section === "energy") {
    table(
      ["Quantity", "Entered value / estimate"],
      [
        [t("Import price"), `${n(p.tariff.importRate)} ${p.currency}/kWh`],
        [t("Export price"), `${n(p.tariff.exportRate)} ${p.currency}/kWh`],
        [
          t("Standing charge"),
          `${n(p.tariff.standingPerDay)} ${p.currency}/day`,
        ],
        [t("Demand charge"), `${n(p.tariff.demandPerKW)} ${p.currency}/kW`],
        [t("Tax"), `${n(p.tariff.taxPercent)} %`],
        [
          t("Operational carbon factor"),
          `${n(p.tariff.carbonKgPerKWh)} kg CO₂e/kWh`,
        ],
        [
          t("Daily carbon estimate"),
          p.tariff.carbonKgPerKWh === undefined
            ? t("Not available")
            : `${n(r.dailyKWh * p.tariff.carbonKgPerKWh)} kg CO₂e`,
        ],
      ],
    );
    paragraph(p.tariff.source);
    if (c.calendar) {
      table(
        ["Calendar result", "Value"],
        [
          [t("Actual elapsed hours"), n(c.calendar.result.elapsedHours)],
          [t("Energy"), `${n(c.calendar.result.totalKWh)} kWh`],
          [t("Peak demand"), `${n(c.calendar.result.peakKW)} kW`],
          [
            t("Energy charge"),
            `${n(c.calendar.result.energyCost, 2)} ${p.currency}`,
          ],
        ],
      );
      paragraph(`${c.calendar.source} · ${c.calendar.calculatedAt}`);
      if (c.calendar.result.bill) {
        const bill = c.calendar.result.bill;
        table(
          ["Bill component", p.currency],
          [
            [t("Energy charge"), n(bill.energyCharge, 2)],
            [t("Export credit"), n(bill.exportCredit, 2)],
            [t("Standing charge"), n(bill.standingCharge, 2)],
            [t("Demand charge"), n(bill.demandCharge, 2)],
            [t("Tax"), n(bill.tax, 2)],
            [t("Total"), n(bill.total, 2)],
          ],
        );
        paragraph(bill.method);
        table(
          ["Demand period", "Peak kW", "Window start", "Window end"],
          bill.demandPeaks.map((peak) => [
            peak.period,
            n(peak.kw),
            peak.start,
            peak.end,
          ]),
        );
        for (const issue of bill.issues) paragraph(issue.message);
      }
    } else
      paragraph(
        "No completed calendar simulation was supplied. Daily values are representative estimates, not a calendar bill.",
      );
  } else if (section === "storage") {
    table(
      ["Quantity", "Entered value"],
      [
        [t("PV capacity"), `${n(p.energy.pvKW)} kW`],
        [t("Peak sun hours"), n(p.energy.peakSunHours)],
        [t("PV performance ratio"), n(p.energy.pvPerformanceRatio)],
        [t("Battery capacity"), `${n(p.energy.battery.capacityKWh)} kWh`],
        [
          t("Initial / minimum / maximum SOC"),
          `${n(p.energy.battery.initialSoc)} / ${n(p.energy.battery.minSoc)} / ${n(p.energy.battery.maxSoc)}`,
        ],
        [
          t("Charge / discharge power"),
          `${n(p.energy.battery.chargeKW)} / ${n(p.energy.battery.dischargeKW)} kW`,
        ],
        [
          t("Charge / discharge efficiency"),
          `${n(p.energy.battery.chargeEfficiency)} / ${n(p.energy.battery.dischargeEfficiency)}`,
        ],
        [
          t("Entered island capability"),
          t(p.energy.battery.islandCapable ? "Yes" : "No"),
        ],
      ],
    );
    paragraph(p.energy.source);
    if (c.energy) {
      const e = c.energy.result;
      table(
        ["Flow", "kWh"],
        [
          [t("Load"), n(e.loadKWh)],
          [t("Generation"), n(e.generationKWh)],
          [t("Grid import"), n(e.importKWh)],
          [t("Grid export"), n(e.exportKWh)],
          [t("Charge"), n(e.chargeKWh)],
          [t("Discharge"), n(e.dischargeKWh)],
          [t("Conversion losses"), n(e.lossesKWh)],
          [t("Unserved energy"), n(e.unservedKWh)],
          [t("Curtailed energy"), n(e.curtailedKWh)],
          [t("Final stored energy"), n(e.finalStoredKWh)],
        ],
      );
      paragraph(`${c.energy.source} · ${c.energy.calculatedAt}`);
      for (const issue of e.issues) paragraph(t(issue.message));
    } else
      paragraph(
        "No completed chronological dispatch was supplied. Installed capacity alone does not establish import, export or outage service.",
      );
  } else if (section === "ev") {
    table(
      [
        "Session",
        "Arrival / deadline",
        "Required battery kWh",
        "Charger / vehicle kW",
        "Efficiency",
      ],
      p.evSessions.map((session) => [
        session.name,
        `${n(session.arrivalHour)} / ${n(session.departureHour)}`,
        n(session.requiredKWh),
        `${n(session.chargerKW)} / ${n(session.vehicleKW)}`,
        n(session.efficiency),
      ]),
    );
    if (c.ev) {
      table(
        ["Session", "Meter kWh", "Delivered kWh", "Unmet kWh", "Feasibility"],
        c.ev.result.map((row) => [
          p.evSessions.find((session) => session.id === row.sessionId)?.name ??
            row.sessionId,
          n(row.plan.meterKWh),
          n(row.plan.deliveredKWh),
          n(row.plan.unmetKWh),
          t(row.plan.feasible ? "Feasible" : "Infeasible"),
        ]),
      );
      paragraph(`${c.ev.source} · ${c.ev.calculatedAt}`);
      for (const row of c.ev.result)
        for (const issue of row.plan.issues) paragraph(t(issue.message));
    } else
      paragraph(
        "No completed charging plan was supplied. Entered requirements are not evidence of delivered energy.",
      );
  } else if (section === "scenarios") {
    const rows = [{ project: p, result: r }, ...(c.scenarios ?? [])];
    table(
      [
        "Project / revision",
        "Design kW",
        "Daily kWh",
        "Daily cost",
        "Energy difference",
        "Issues",
      ],
      rows.map((row) => [
        `${row.project.name} · ${row.project.revision}`,
        n(row.result.designKW),
        n(row.result.dailyKWh),
        `${n(row.result.dailyCost, 2)} ${row.project.currency}`,
        n(row.result.dailyKWh - r.dailyKWh),
        row.result.issues.length,
      ]),
      [57, 25, 25, 25, 25, 25],
    );
    if (!c.scenarios?.length)
      paragraph(
        "No comparison snapshot was supplied. Open or select a saved scenario before exporting a comparison.",
      );
    paragraph(
      "Differences use the first listed project as the reference. Each scenario retains its own revision and entered assumptions.",
    );
  } else if (section === "bom") {
    const bom = deriveBOM(p);
    table(
      ["Item", "Qty", "Unit", "Source IDs", "Evidence"],
      bom.rows.map((row) => [
        row.description,
        n(row.quantity),
        t(row.unit),
        row.sourceIds.join(", "),
        row.evidence,
      ]),
      [55, 17, 15, 40, 55],
    );
    for (const note of bom.notes) paragraph(note);
    if (c.bill) {
      paragraph(
        "Entered customer-bill prices are separate from engineering quantities. Review any overridden quantities and source revision before procurement.",
      );
      table(
        ["Entered priced line", "Qty", "Unit price", "Source revision"],
        c.bill.lines.map((row) => [
          row.description,
          row.quantity,
          `${row.unitPrice} ${c.bill!.currency}`,
          row.source ? row.source.revision : t("Manually entered"),
        ]),
      );
    }
  } else if (section === "measurements") {
    if (c.measurements) {
      const { parsed } = validateMeasurementPayload(c.measurements.payload);
      table(
        ["Evidence", "Value"],
        [
          [t("File"), c.measurements.payload.filename],
          [t("Saved at"), c.measurements.savedAt],
          [
            t("Declared elapsed interval"),
            `${c.measurements.payload.options.intervalMinutes} min`,
          ],
          [
            t("Timestamp column"),
            c.measurements.payload.options.timestampColumn,
          ],
          [
            t("Interval-average power column"),
            c.measurements.payload.options.powerColumn,
          ],
          [t("Observed import energy"), `${n(parsed.importKWh)} kWh`],
          [t("Observed export energy"), `${n(parsed.exportKWh)} kWh`],
          [t("Observed net energy"), `${n(parsed.totalKWh)} kWh`],
        ],
      );
      for (const warning of parsed.warnings) paragraph(warning);
    } else paragraph("No validated saved measurement dataset was supplied.");
    paragraph(
      "Observed totals cover supplied intervals only. Missing intervals are not filled with assumed measurements.",
    );
  } else if (section === "series") {
    const points = c.calendar?.result.points;
    if (points) {
      paragraph(
        `${t("Actual calendar intervals")}: ${points.length}. ${t("The PDF shows at most the first 96 intervals; export CSV or the frozen JSON snapshot for the complete series.")}`,
      );
      table(
        ["Timestamp", "Local time", "Average kW", "Interval kWh", "Hours"],
        points
          .slice(0, 96)
          .map((point) => [
            point.timestamp,
            point.localTime,
            n(point.kw),
            n(point.kWh),
            n(point.elapsedHours),
          ]),
        [50, 50, 28, 28, 26],
      );
    } else {
      paragraph(
        "Representative daily profile; not timestamped measurement data. Export the complete machine-readable series alongside this report.",
      );
      table(
        ["Model hour", "Average kW", "Interval kWh"],
        r.profile.map((point) => [n(point.hour), n(point.kw), n(point.kWh)]),
      );
    }
  } else if (section === "issues") {
    if (!r.issues.length)
      paragraph(
        "No issues were emitted for the entered model; this is not installation certification.",
      );
    else
      table(
        ["Severity / assessment", "Message", "Entity ID"],
        r.issues.map((issue) => [
          `${t(issue.severity)} / ${t(issue.assessment)}`,
          t(issue.message),
          issue.entityId ?? "",
        ]),
        [40, 105, 37],
      );
  } else if (section === "trace") {
    paragraph(r.trace.method);
    paragraph(r.trace.formula);
    for (const item of r.trace.assumptions) paragraph(item);
    for (const item of r.trace.sources) paragraph(item);
    table(
      ["Load", "Source type", "Reference / date"],
      p.loads.map((load) => [
        load.name,
        t(load.source.kind),
        `${load.source.reference}${load.source.date ? " · " + load.source.date : ""}`,
      ]),
      [50, 30, 102],
    );
    if (p.notes) paragraph(p.notes);
  } else if (section === "diagram")
    paragraph(
      "The PDF contains the model's vector topology with a legend and readable overlapping pages when required. Cable quantities use entered lengths, not diagram geometry.",
    );
  return blocks;
}
