import type { Project, CalculationResult } from "../domain/types";
import type { ReportSnapshot } from "./reportSnapshot";
import { makeCSV } from "./files";

export function circuitScheduleCsv(project: Project): string {
  return makeCSV([
    [
      "project_id",
      "revision",
      "circuit_id",
      "name",
      "board_id",
      "board_name",
      "phase",
      "locked",
      "protective_A",
      "breaking_capacity_kA",
      "prospective_fault_kA",
      "one_way_cable_m",
      "area_mm2",
      "cable_source",
      "load_ids",
    ],
    ...project.circuits.map((c) => [
      project.id,
      project.revision,
      c.id,
      c.name,
      c.boardId,
      project.boards.find((b) => b.id === c.boardId)?.name ?? "",
      c.phase,
      String(c.locked),
      c.protectiveA ?? "",
      c.breakingCapacityKA ?? "",
      c.prospectiveFaultKA ?? "",
      c.cable?.lengthM ?? "",
      c.cable?.areaMm2 ?? "",
      c.cable?.source ?? "",
      project.loads
        .filter((l) => l.circuitId === c.id)
        .map((l) => l.id)
        .join(";"),
    ]),
  ]);
}
export function scenarioComparisonCsv(
  base: { project: Project; result: CalculationResult },
  scenarios: { project: Project; result: CalculationResult; label?: string }[],
): string {
  const rows = [base, ...scenarios];
  for (const row of rows)
    if (row.project.revision !== row.result.revision)
      throw new Error(
        "A scenario result is stale. Recalculate before comparison export.",
      );
  return makeCSV([
    [
      "project_id",
      "name",
      "revision",
      "engine_version",
      "currency",
      "installed_kW",
      "design_kW",
      "daily_kWh_estimate",
      "daily_cost_estimate",
      "energy_delta_vs_baseline_kWh",
      "cost_delta_vs_baseline",
      "issue_count",
      "complete",
    ],
    ...rows.map(({ project, result }) => [
      project.id,
      project.name,
      project.revision,
      result.engineVersion,
      project.currency,
      result.installedKW,
      result.designKW,
      result.dailyKWh,
      result.dailyCost,
      result.dailyKWh - base.result.dailyKWh,
      project.currency === base.project.currency
        ? result.dailyCost - base.result.dailyCost
        : "different currency",
      result.issues.length,
      String(result.complete),
    ]),
  ]);
}
export function reportSeriesCsv(
  snapshot: ReportSnapshot,
  kind: "calendar" | "energy" | "ev" | "profile",
): string {
  const prefix = [
    snapshot.project.id,
    snapshot.project.revision,
    snapshot.result.engineVersion,
  ];
  if (kind === "calendar") {
    const evidence = snapshot.context.calendar;
    if (!evidence)
      throw new Error("Run a calendar simulation before exporting its series.");
    return makeCSV([
      [
        "project_id",
        "revision",
        "engine_version",
        "timestamp_utc",
        "local_time",
        "average_kW",
        "interval_kWh",
        "elapsed_hours",
        "import_rate",
        "source",
      ],
      ...evidence.result.points.map((p) => [
        ...prefix,
        p.timestamp,
        p.localTime,
        p.kw,
        p.kWh,
        p.elapsedHours,
        p.importRate,
        evidence.source,
      ]),
    ]);
  }
  if (kind === "energy") {
    const evidence = snapshot.context.energy;
    if (!evidence)
      throw new Error("Run an energy simulation before exporting its series.");
    return makeCSV([
      [
        "project_id",
        "revision",
        "engine_version",
        "model_hour",
        "load_kW",
        "generation_kW",
        "import_kWh",
        "export_kWh",
        "charge_kWh",
        "discharge_kWh",
        "losses_kWh",
        "unserved_kWh",
        "curtailed_kWh",
        "stored_kWh",
        "soc_fraction",
        "grid_available",
        "source",
      ],
      ...evidence.result.points.map((p) => [
        ...prefix,
        p.hour,
        p.loadKW,
        p.generationKW,
        p.importKWh,
        p.exportKWh,
        p.chargeKWh,
        p.dischargeKWh,
        p.lossesKWh,
        p.unservedKWh,
        p.curtailedKWh,
        p.storedKWh,
        p.soc,
        String(p.gridAvailable),
        evidence.source,
      ]),
    ]);
  }
  if (kind === "ev") {
    const evidence = snapshot.context.ev;
    if (!evidence)
      throw new Error("Run a charging plan before exporting its series.");
    return makeCSV([
      [
        "project_id",
        "revision",
        "engine_version",
        "session_id",
        "start_model_hour",
        "elapsed_hours",
        "ac_kW",
        "meter_kWh",
        "battery_kWh",
        "rate",
        "source",
      ],
      ...evidence.result.flatMap((row) =>
        row.plan.points.map((p) => [
          ...prefix,
          row.sessionId,
          p.startHour,
          p.durationHours,
          p.acKW,
          p.acKWh,
          p.batteryKWh,
          p.rate,
          evidence.source,
        ]),
      ),
    ]);
  }
  return makeCSV([
    [
      "project_id",
      "revision",
      "engine_version",
      "model_hour",
      "average_kW",
      "interval_kWh",
      "L1_kW",
      "L2_kW",
      "L3_kW",
      "scope",
    ],
    ...snapshot.result.profile.map((p) => [
      ...prefix,
      p.hour,
      p.kw,
      p.kWh,
      p.phaseKW.L1,
      p.phaseKW.L2,
      p.phaseKW.L3,
      "Representative daily model; not timestamped measurements.",
    ]),
  ]);
}
