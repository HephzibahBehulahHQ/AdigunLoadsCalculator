import type { Phase, Project } from "../domain/types";
import { validateProjectExtensions } from "../domain/project";
import {
  addComplex,
  magnitude,
  normalizeLoad,
  PHASES,
  zeroPhases,
} from "./electrical";
import {
  operatingLoadsAt,
  simulateStartEvents,
  type StartResult,
} from "./start-events";
import type { EngineeringCheck } from "./assessments";
import { explicitInstant } from "./calendar";

export interface SourceAssessment {
  revision: number;
  sourceId: string;
  runningKW: number;
  runningKVA: number;
  runningPhaseA: Record<Phase, number>;
  continuousKW: number;
  continuousKVA: number;
  phaseLimitA: number;
  start?: StartResult;
  maximumOverloadSeconds: number;
  checks: EngineeringCheck[];
  complete: boolean;
  method: string;
}
export function assessSourceEquipment(
  project: Project,
  sourceId: string,
  options: {
    scenario?: "running" | "starting";
    at?: string;
    range?: { start: string; end: string };
  } = {},
): SourceAssessment {
  const invalid = validateProjectExtensions(
    project as unknown as Record<string, unknown>,
  );
  if (invalid.length) throw new Error(invalid[0]);
  const source = project.sources?.find((row) => row.id === sourceId);
  if (!source) throw new Error("Select an entered source equipment record.");
  if (options.at && !explicitInstant(options.at))
    throw new Error("Source assessment instant needs an explicit UTC offset.");
  const boards = new Map(project.boards.map((board) => [board.id, board]));
  const scoped = project.loads.filter((load) => {
    if (!source.boardId) return true;
    let id =
      project.circuits.find((row) => row.id === load.circuitId)?.boardId ??
      load.boardId;
    const seen = new Set<string>();
    while (id && !seen.has(id)) {
      if (id === source.boardId) return true;
      seen.add(id);
      id = boards.get(id)?.parentId;
    }
    return false;
  });
  const selectedIds = new Set(scoped.map((load) => load.id));
  const sourceProject = {
    ...project,
    loads: scoped,
    startEvents: project.startEvents?.filter((event) =>
      selectedIds.has(event.loadId),
    ),
    flexibleLoads: project.flexibleLoads?.filter((row) =>
      selectedIds.has(row.loadId),
    ),
    energy: { ...project.energy, backup: undefined },
  };
  const runningLoads = options.at
    ? operatingLoadsAt(
        { ...sourceProject, startEvents: [] },
        Date.parse(options.at),
      )
    : scoped;
  const normalized = runningLoads.map(normalizeLoad);
  const valid = normalized.every(
    (load) => load.valid && load.reactiveKvar !== null,
  );
  const checks: EngineeringCheck[] = [];
  const evidenced = Boolean(source.source.reference.trim());
  if (!evidenced)
    checks.push({
      id: "source-provenance",
      label: "Equipment evidence",
      assessment: "incomplete",
      detail:
        "Enter the nameplate/datasheet reference and applicable rating conditions.",
    });
  if (!valid || !scoped.length)
    checks.push({
      id: "source-load-data",
      label: "Served load data",
      assessment: "incomplete",
      detail:
        "Assign valid loads with displacement-PF or P/Q evidence to the selected source boundary.",
    });
  const compatible = scoped.every((load) =>
    source.connection === "dc"
      ? load.connection === "dc" &&
        Math.abs(load.voltage - source.voltageV) < 0.01
      : load.connection !== "dc" &&
        (source.connection === "three"
          ? Math.abs(source.voltageV - project.supply.voltageLL) < 0.01 &&
            Math.abs(
              load.voltage -
                (load.connection === "single"
                  ? project.supply.voltageLN
                  : source.voltageV),
            ) < 0.01
          : load.connection === "single" &&
            load.phase === source.phase &&
            Math.abs(load.voltage - source.voltageV) < 0.01),
  );
  checks.push({
    id: "source-connection",
    label: "Entered voltage/phase compatibility",
    assessment: compatible ? "passed" : "incomplete",
    detail: compatible
      ? "The supplied nominal connection supports the selected AC or DC boundary."
      : "Correct incompatible phase/voltage assignments or provide an explicit supported converter model.",
  });
  const currents = zeroPhases();
  let runningKW = 0,
    q = 0,
    scalarKVA = 0;
  for (const load of normalized.filter((row) => row.valid)) {
    runningKW += load.operatingKW;
    q += load.reactiveKvar ?? 0;
    scalarKVA += load.apparentKVA;
    for (const phase of PHASES)
      currents[phase] = addComplex(currents[phase], load.phaseCurrents[phase]);
  }
  const runningKVA = valid ? Math.hypot(runningKW, q) : scalarKVA;
  const runningPhaseA = Object.fromEntries(
    PHASES.map((phase) => [
      phase,
      valid
        ? magnitude(currents[phase])
        : normalized
            .filter((load) => load.valid)
            .reduce(
              (sum, load) =>
                sum +
                (Number.isFinite(magnitude(load.phaseCurrents[phase]))
                  ? magnitude(load.phaseCurrents[phase])
                  : load.currentA),
              0,
            ),
    ]),
  ) as Record<Phase, number>;
  const continuousKW = source.continuousKW * source.derating,
    continuousKVA = source.continuousKVA * source.derating;
  const phaseLimitA =
    (continuousKVA * 1000) /
    ((source.connection === "three" ? Math.sqrt(3) : 1) * source.voltageV);
  const numerical = valid && compatible && evidenced && scoped.length > 0;
  for (const [id, label, value, limit, unit] of [
    [
      "source-running-kw",
      "Continuous real-power loading",
      runningKW,
      continuousKW,
      "kW",
    ],
    [
      "source-running-kva",
      "Continuous apparent-power loading",
      runningKVA,
      continuousKVA,
      "kVA",
    ],
    [
      "source-running-phase",
      "Maximum phase current",
      source.connection === "dc"
        ? (runningKW * 1000) / source.voltageV
        : Math.max(...Object.values(runningPhaseA)),
      phaseLimitA,
      "A",
    ],
  ] as const)
    checks.push({
      id,
      label,
      value,
      limit,
      unit,
      assessment: !numerical
        ? "incomplete"
        : value <= limit + 1e-9
          ? "passed"
          : "failed",
      detail:
        "Entered continuous rating multiplied by the explicit derating factor. Duty and project diversity do not reduce on-state loading.",
      source: source.source.reference,
    });
  let start: StartResult | undefined;
  let maximumOverloadSeconds = 0;
  if (options.scenario === "starting") {
    start = simulateStartEvents(
      sourceProject,
      options.range ??
        (options.at
          ? {
              start: options.at,
              end: new Date(Date.parse(options.at) + 60000).toISOString(),
            }
          : undefined),
    );
    let currentOverload = 0;
    for (const point of start.points) {
      if (
        point.kw > continuousKW + 1e-9 ||
        point.kva > continuousKVA + 1e-9 ||
        Math.max(...Object.values(point.phaseCurrents)) > phaseLimitA + 1e-9
      )
        currentOverload += point.durationSeconds;
      else currentOverload = 0;
      maximumOverloadSeconds = Math.max(
        maximumOverloadSeconds,
        currentOverload,
      );
    }
    const overload = source.overload;
    const durationLimit = overload?.durationSeconds ?? 0;
    const peakKWLimit = overload ? overload.kw * source.derating : continuousKW;
    const peakKVALimit = overload
      ? overload.kva * source.derating
      : continuousKVA;
    const peakCurrentLimit =
      (peakKVALimit * 1000) /
      ((source.connection === "three" ? Math.sqrt(3) : 1) * source.voltageV);
    const eventEvidence =
      start.points.some((point) => point.eventIds.length) &&
      !start.issues.some((issue) => issue.assessment === "incomplete");
    checks.push({
      id: "source-start-capacity",
      label: "Entered start/overload envelope",
      value: start.peakKVA,
      limit: peakKVALimit,
      unit: "kVA",
      assessment:
        !numerical ||
        !eventEvidence ||
        (maximumOverloadSeconds > 0 && (!overload || !overload.source.trim()))
          ? "incomplete"
          : start.peakKW <= peakKWLimit + 1e-9 &&
              start.peakKVA <= peakKVALimit + 1e-9 &&
              Math.max(...Object.values(start.peakPhaseA)) <=
                peakCurrentLimit + 1e-9 &&
              maximumOverloadSeconds <= durationLimit + 1e-9
            ? "passed"
            : "failed",
      detail: `Start peak ${start.peakKW.toFixed(4)} kW / ${start.peakKVA.toFixed(4)} kVA; longest overload ${maximumOverloadSeconds.toFixed(3)} s. Entered envelope ${peakKWLimit} kW / ${peakKVALimit} kVA for ${durationLimit} s. No universal start multiplier or voltage/frequency-dip model is inferred.`,
      source: overload?.source ?? source.source.reference,
    });
  }
  return {
    revision: project.revision,
    sourceId,
    runningKW,
    runningKVA,
    runningPhaseA,
    continuousKW,
    continuousKVA,
    phaseLimitA,
    start,
    maximumOverloadSeconds,
    checks,
    complete: checks.every(
      (check) =>
        check.assessment !== "incomplete" && check.assessment !== "unsupported",
    ),
    method:
      "Source-boundary nominal-voltage current/P/Q assessment with supplied ratings, independent continuous/phase/overload checks and explicit event duration. It is not a validated dynamic voltage/frequency response, manufacturer coordination study or regulatory approval.",
  };
}
