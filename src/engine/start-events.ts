import type {
  Complex,
  Issue,
  Load,
  NormalizedLoad,
  Phase,
  Project,
  StartEvent,
} from "../domain/types";
import { ENGINE_VERSION } from "../domain/types";
import { validateProjectExtensions } from "../domain/project";
import {
  addComplex,
  magnitude,
  normalizeLoad,
  PHASES,
  zeroPhases,
} from "./electrical";
import {
  explicitInstant,
  makeCalendarClock,
  resolveSchedule,
  scheduleFractionAt,
} from "./calendar";

export function startEventLoad(
  load: Load,
  event: StartEvent,
  normalized = normalizeLoad(load),
): Load {
  if (
    !normalized.valid ||
    !Number.isFinite(event.pf) ||
    event.pf <= 0 ||
    event.pf > 1
  )
    throw new Error(
      "A valid load and explicitly entered starting PF are required.",
    );
  const current = event.currentA ?? normalized.currentA * event.multiplier!;
  if (!Number.isFinite(current) || current <= 0)
    throw new Error("A finite positive starting current is required.");
  return {
    ...load,
    entryMode: "amps",
    quantity: 1,
    rating: current,
    pf: load.connection === "dc" ? 1 : event.pf,
    pfKind: "displacement",
    reactive: "lagging",
    utilization: 1,
    schedule: undefined,
    hoursPerDay: 24,
    startHour: 0,
    duty: 1,
    standbyW: 0,
  };
}

export function standbyLoad(load: Load): Load {
  return {
    ...load,
    entryMode: "kw",
    rating: load.standbyW / 1000,
    utilization: 1,
    pf: 1,
    pfKind: "displacement",
    reactive: "lagging",
    schedule: undefined,
    hoursPerDay: 24,
    startHour: 0,
    duty: 1,
  };
}

/** Conservative scheduled on-state snapshot. Unknown duty timing does not derate running current. */
export function operatingLoadsAt(
  project: Project,
  timestamp: number,
  conservativeDuty = true,
): Load[] {
  const clock = makeCalendarClock(project.timezone);
  const fields = clock(timestamp);
  return project.loads.map((load) => {
    const event = project.startEvents?.find(
      (item) =>
        item.loadId === load.id &&
        timestamp >= Date.parse(item.start) &&
        timestamp < Date.parse(item.start) + item.durationSeconds * 1000,
    );
    if (event) return startEventLoad(load, event);
    const fraction = scheduleFractionAt(load, timestamp, fields);
    if (fraction <= 0) return standbyLoad(load);
    if (conservativeDuty || fraction === 1)
      return { ...load, schedule: undefined };
    const n = normalizeLoad(load);
    const standbyKW = (load.standbyW * load.quantity) / 1000;
    return {
      ...load,
      quantity: 1,
      utilization: 1,
      entryMode: "complex",
      rating: n.operatingKW * fraction + standbyKW * (1 - fraction),
      reactiveKvar:
        n.reactiveKvar === null ? undefined : n.reactiveKvar * fraction,
      schedule: undefined,
    };
  });
}

export function normalizedPhasePower(
  load: Load,
  normalized: NormalizedLoad,
): Record<Phase, number> {
  const result: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
  if (load.connection === "dc") return result;
  if (load.connection === "single") result[load.phase] = normalized.operatingKW;
  else if (load.connection === "three")
    for (const phase of PHASES) result[phase] = normalized.operatingKW / 3;
  else {
    const angles = { L1: 0, L2: (-2 * Math.PI) / 3, L3: (2 * Math.PI) / 3 };
    for (const phase of PHASES) {
      const current = normalized.phaseCurrents[phase];
      result[phase] =
        normalized.reactiveKvar === null
          ? load.phasePair?.includes(phase)
            ? normalized.operatingKW / 2
            : 0
          : ((load.voltage / Math.sqrt(3)) *
              (Math.cos(angles[phase]) * current.re +
                Math.sin(angles[phase]) * current.im)) /
            1000;
    }
  }
  return result;
}

export interface StartPoint {
  timestamp: string;
  durationSeconds: number;
  kw: number;
  kva: number;
  phaseCurrents: Record<Phase, number>;
  neutralA: number | null;
  eventIds: string[];
}
export interface StartResult {
  revision: number;
  engineVersion: string;
  points: StartPoint[];
  peakKW: number;
  peakKVA: number;
  peakPhaseA: Record<Phase, number>;
  /** Energy during the evaluated sequence using conservative scheduled on-state loads. */
  energyKWh: number;
  issues: Issue[];
}

/** Event-boundary analysis, not an electromagnetic transient or voltage/frequency-dip prediction. */
export function simulateStartEvents(
  project: Project,
  range?: { start: string; end: string },
): StartResult {
  const errors = validateProjectExtensions(
    project as unknown as Record<string, unknown>,
  );
  if (errors.length) throw new Error(errors[0]);
  const events = project.startEvents ?? [];
  const start = range
    ? Date.parse(range.start)
    : Math.min(...events.map((event) => Date.parse(event.start)));
  const end = range
    ? Date.parse(range.end)
    : Math.max(
        ...events.map(
          (event) => Date.parse(event.start) + event.durationSeconds * 1000,
        ),
      );
  if (
    range &&
    (!explicitInstant(range.start) ||
      !explicitInstant(range.end) ||
      end <= start)
  )
    throw new Error(
      "Start analysis requires an increasing explicit-offset range.",
    );
  if (Number.isFinite(end - start) && end - start > 7 * 86400000)
    throw new Error(
      "Start sequence detail is limited to seven elapsed days; calendar energy supports longer ranges.",
    );
  const issues: Issue[] = [
    {
      id: "start-model",
      severity: "info",
      assessment: "warning",
      message:
        "Entered constant-current/PF start segments replace the running load for their duration. Other scheduled loads use conservative on-state current; energy-average duty is not a guaranteed instantaneous reduction. No transient voltage/frequency dip is predicted.",
    },
  ];
  if (!events.length && !range)
    return {
      revision: project.revision,
      engineVersion: ENGINE_VERSION,
      points: [],
      peakKW: 0,
      peakKVA: 0,
      peakPhaseA: { L1: 0, L2: 0, L3: 0 },
      energyKWh: 0,
      issues,
    };
  const boundaries = new Set<number>([start, end]);
  for (const event of events) {
    const a = Date.parse(event.start),
      b = a + event.durationSeconds * 1000;
    if (a > start && a < end) boundaries.add(a);
    if (b > start && b < end) boundaries.add(b);
    if (!event.source.trim())
      issues.push({
        id: `${event.id}-source`,
        entityId: event.loadId,
        severity: "warning",
        assessment: "incomplete",
        message: "Starting current/PF/time provenance has not been recorded.",
      });
  }
  // Minute boundaries make schedule changes visible without imposing subsecond annual stepping.
  for (let t = Math.ceil(start / 60000) * 60000; t < end; t += 60000)
    boundaries.add(t);
  for (const load of project.loads)
    for (const window of load.schedule?.absoluteWindows ?? [])
      for (const t of [Date.parse(window.start), Date.parse(window.end)])
        if (t > start && t < end) boundaries.add(t);
  const ordered = [...boundaries].sort((a, b) => a - b);
  const points: StartPoint[] = [];
  let unknownPhaseEvidence = false;
  const peakPhaseA: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
  let peakKW = 0,
    peakKVA = 0,
    energyKWh = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const timestamp = ordered[i],
      finish = ordered[i + 1];
    const normalized = operatingLoadsAt(project, (timestamp + finish) / 2).map(
      normalizeLoad,
    );
    if (normalized.some((load) => !load.valid))
      throw new Error("Correct invalid loads before start-sequence analysis.");
    const currents = zeroPhases();
    let kw = 0,
      q = 0,
      scalarKVA = 0;
    const unknown = normalized.some((load) => load.reactiveKvar === null);
    unknownPhaseEvidence ||= unknown;
    for (const load of normalized) {
      kw += load.operatingKW;
      q += load.reactiveKvar ?? 0;
      scalarKVA += load.apparentKVA;
      for (const phase of PHASES)
        currents[phase] = addComplex(
          currents[phase],
          load.phaseCurrents[phase],
        );
    }
    const phaseCurrents = Object.fromEntries(
      PHASES.map((phase) => [
        phase,
        unknown
          ? normalized.reduce(
              (sum, load) =>
                sum +
                (Number.isFinite(magnitude(load.phaseCurrents[phase]))
                  ? magnitude(load.phaseCurrents[phase])
                  : load.currentA),
              0,
            )
          : magnitude(currents[phase]),
      ]),
    ) as Record<Phase, number>;
    const kva = unknown ? scalarKVA : Math.hypot(kw, q);
    const neutral: Complex = addComplex(
      addComplex(currents.L1, currents.L2),
      currents.L3,
    );
    const durationSeconds = (finish - timestamp) / 1000;
    points.push({
      timestamp: new Date(timestamp).toISOString(),
      durationSeconds,
      kw,
      kva,
      phaseCurrents,
      neutralA: unknown ? null : magnitude(neutral),
      eventIds: events
        .filter(
          (event) =>
            timestamp >= Date.parse(event.start) &&
            timestamp < Date.parse(event.start) + event.durationSeconds * 1000,
        )
        .map((event) => event.id),
    });
    peakKW = Math.max(peakKW, kw);
    peakKVA = Math.max(peakKVA, kva);
    energyKWh += (kw * durationSeconds) / 3600;
    for (const phase of PHASES)
      peakPhaseA[phase] = Math.max(peakPhaseA[phase], phaseCurrents[phase]);
  }
  if (unknownPhaseEvidence)
    issues.push({
      id: "start-phase-evidence",
      severity: "warning",
      assessment: "incomplete",
      message:
        "True PF alone does not establish phase angle. Start-sequence kVA and phase current use conservative magnitude bounds where displacement PF or measured P/Q is missing; neutral current is unavailable.",
    });
  return {
    revision: project.revision,
    engineVersion: ENGINE_VERSION,
    points,
    peakKW,
    peakKVA,
    peakPhaseA,
    energyKWh,
    issues,
  };
}
