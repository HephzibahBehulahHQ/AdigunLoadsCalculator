import type { CalculationResult, Project } from "../domain/types";
import type {
  CalendarResult,
  EnergyResult,
  RangeOptions,
  EnergyOptions,
} from "../engine/simulation";
import type { EVPlan } from "../engine/planning";
import type { DiagramSnapshot } from "../commands/diagram";
import type { MeasurementPayload } from "../storage/measurements";
import { validateMeasurementPayload } from "../storage/measurements";
import { validateProjectImport } from "../domain/project";
import type { BillDocument, ReportLocale } from "./reports";
import { parseBillJson } from "./reports";

export interface ReportEvidence<T, I = unknown> {
  projectId: string;
  revision: number;
  calculatedAt: string;
  result: T;
  inputs?: I;
  source: string;
}
export interface ReportContext {
  calendar?: ReportEvidence<CalendarResult, RangeOptions>;
  energy?: ReportEvidence<EnergyResult, EnergyOptions>;
  ev?: ReportEvidence<{ sessionId: string; plan: EVPlan }[]>;
  measurements?: {
    projectId: string;
    savedAt: string;
    payload: MeasurementPayload;
  };
  scenarios?: { project: Project; result: CalculationResult; label?: string }[];
  bill?: BillDocument;
  diagram?: DiagramSnapshot;
}
export interface ReportSnapshot {
  format: "adigunpowerlab-report-snapshot";
  version: 1;
  generatedAt: string;
  locale: ReportLocale;
  project: Project;
  result: CalculationResult;
  context: ReportContext;
}
function validatePair(project: Project, result: CalculationResult): void {
  const validation = validateProjectImport(project);
  if (!validation.valid)
    throw new Error(
      "Correct project validation errors before freezing a report: " +
        validation.errors.slice(0, 3).join(" "),
    );
  if (
    project.revision !== result.revision ||
    result.trace.revision !== project.revision ||
    result.trace.inputTimestamp !== project.updatedAt ||
    result.loads.length !== project.loads.length ||
    result.loads.some(
      (row) => !project.loads.some((load) => load.id === row.id),
    )
  )
    throw new Error(
      "The report result does not match this project revision. Recalculate before exporting.",
    );
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
export function freezeReportSnapshot(
  projectInput: Project,
  resultInput: CalculationResult,
  options: {
    locale?: ReportLocale;
    context?: ReportContext;
    generatedAt?: string;
  } = {},
): ReportSnapshot {
  const project = structuredClone(projectInput),
    result = structuredClone(resultInput),
    context = structuredClone(options.context ?? {});
  validatePair(project, result);
  for (const name of ["calendar", "energy", "ev"] as const) {
    const evidence = context[name];
    if (!evidence) continue;
    if (
      evidence.projectId !== project.id ||
      evidence.revision !== project.revision ||
      !Number.isFinite(Date.parse(evidence.calculatedAt)) ||
      !evidence.source.trim()
    )
      throw new Error(
        `The ${name} evidence belongs to another project/revision or lacks provenance. Run it again before reporting.`,
      );
    if (
      "revision" in evidence.result &&
      evidence.result.revision !== project.revision
    )
      throw new Error(`The ${name} result is stale.`);
  }
  if (context.measurements) {
    if (
      context.measurements.projectId !== project.id ||
      !Number.isFinite(Date.parse(context.measurements.savedAt))
    )
      throw new Error(
        "Measurement evidence belongs to another project or has invalid metadata.",
      );
    validateMeasurementPayload(context.measurements.payload);
  }
  for (const scenario of context.scenarios ?? [])
    validatePair(scenario.project, scenario.result);
  if (context.bill) context.bill = parseBillJson(JSON.stringify(context.bill));
  if (context.diagram && context.diagram.revision !== project.revision)
    throw new Error("The diagram is from another project revision.");
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(generatedAt)))
    throw new Error("Invalid report generation timestamp.");
  return freeze({
    format: "adigunpowerlab-report-snapshot",
    version: 1,
    generatedAt,
    locale: options.locale ?? "en",
    project,
    result,
    context,
  });
}

export function reportSnapshotJson(snapshot: ReportSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
