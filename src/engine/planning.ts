import { type EVSession, type Issue, type Phase, type Project } from '../domain/types';
import { activeHours, calculateProject, normalizeLoad, PHASES } from './electrical';

export interface EVOptions {
  strategy?: 'immediate' | 'cheapest';
  /** Remaining AC power at the charger phase for each hourly interval. */
  phaseHeadroomKW?: number[];
}
export interface EVPlan {
  points: { hour: number; startHour: number; durationHours: number; acKW: number; acKWh: number; batteryKWh: number; rate: number }[];
  deliveredKWh: number;
  meterKWh: number;
  unmetKWh: number;
  feasible: boolean;
  cost: number;
  issues: Issue[];
}

/** Bounded hourly schedule. Site and optional phase headroom are hard limits; efficiency applies once. */
export function scheduleEV(session: EVSession, baseKW: number[] = Array(24).fill(0), rates: number[] = Array(24).fill(0), options: EVOptions | 'immediate' | 'cheapest' = {}): EVPlan {
  const config = typeof options === 'string' ? { strategy: options } : options;
  if (baseKW.length !== 24 || rates.length !== 24 || config.phaseHeadroomKW && config.phaseHeadroomKW.length !== 24) throw new Error('EV scheduling requires 24 hourly site, tariff and phase values.');
  for (const value of [session.requiredKWh, session.chargerKW, session.vehicleKW, session.siteLimitKW, ...baseKW, ...(config.phaseHeadroomKW ?? [])]) if (!Number.isFinite(value) || value < 0) throw new Error('EV energy, powers and site/phase headroom must be nonnegative finite numbers.');
  if (!Number.isFinite(session.efficiency) || session.efficiency <= 0 || session.efficiency > 1) throw new Error('Charging efficiency must be greater than 0 and at most 1.');
  if (![session.arrivalHour, session.departureHour].every((n) => Number.isFinite(n) && n >= 0 && n <= 24)) throw new Error('EV arrival/departure must be between 0 and 24 hours.');
  if (!rates.every(Number.isFinite)) throw new Error('Tariff rates must be finite.');
  const points = Array.from({ length: 24 }, (_, hour) => ({ hour, startHour: hour, durationHours: 0, acKW: 0, acKWh: 0, batteryKWh: 0, rate: rates[hour] }));
  const duration = session.departureHour > session.arrivalHour ? session.departureHour - session.arrivalHour : session.departureHour === session.arrivalHour ? 0 : 24 - session.arrivalHour + session.departureHour;
  const availability = (hour: number) => {
    let overlap = 0; let startHour = hour + 1;
    for (const offset of [-24, 0, 24]) {
      const start = Math.max(session.arrivalHour + offset, hour);
      const active = Math.max(0, Math.min(session.arrivalHour + duration + offset, hour + 1) - start);
      overlap += active; if (active > 0) startHour = Math.min(startHour, start);
    }
    return { overlap, startHour: overlap > 0 ? startHour : hour };
  };
  const slots = points.map((point) => ({ hour: point.hour, ...availability(point.hour), rate: point.rate }));
  slots.sort(config.strategy === 'cheapest'
    ? (a, b) => a.rate - b.rate || (a.hour - session.arrivalHour + 24) % 24 - (b.hour - session.arrivalHour + 24) % 24
    : (a, b) => (a.hour - session.arrivalHour + 24) % 24 - (b.hour - session.arrivalHour + 24) % 24);
  let required = session.requiredKWh;
  for (const slot of slots) {
    if (slot.overlap === 0 || required <= 1e-12) continue;
    const availableKW = Math.min(session.chargerKW, session.vehicleKW, Math.max(0, session.siteLimitKW - baseKW[slot.hour]), config.phaseHeadroomKW?.[slot.hour] ?? Infinity);
    const acKWh = Math.min(availableKW * slot.overlap, required / session.efficiency);
    const batteryKWh = acKWh * session.efficiency;
    points[slot.hour] = { hour: slot.hour, startHour: slot.startHour, durationHours: slot.overlap, acKW: slot.overlap > 0 ? acKWh / slot.overlap : 0, acKWh, batteryKWh, rate: rates[slot.hour] };
    required = Math.max(0, required - batteryKWh);
  }
  const issues: Issue[] = [];
  if (required > 1e-8) issues.push({ id: `${session.id}-deadline`, entityId: session.id, severity: 'warning', assessment: 'failed', message: `Charging deadline is infeasible: ${required.toFixed(3)} kWh remains unmet within the entered limits.` });
  if (!config.phaseHeadroomKW) issues.push({ id: `${session.id}-phase`, entityId: session.id, severity: 'info', assessment: 'warning', message: 'The site kW limit was checked. Phase headroom was not supplied and requires a separate circuit check.' });
  return { points, deliveredKWh: session.requiredKWh - required, meterKWh: points.reduce((sum, p) => sum + p.acKWh, 0), unmetKWh: required, feasible: required <= 1e-8, cost: points.reduce((sum, p) => sum + p.acKWh * p.rate, 0), issues };
}

/** Conservative same-interval running envelope; unknown energy duty timing never reduces this cap. */
export function conservativeDemandProfile(project: Project, intervalMinutes = 60): { kw: number[]; phaseHeadroomKW: Record<Phase, number[]> } {
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || 1440 % intervalMinutes !== 0) throw new Error('Unsupported demand-envelope interval.');
  const step = intervalMinutes / 60; const count = 1440 / intervalMinutes;
  const kw = Array<number>(count).fill(0); const phaseAmps: Record<Phase, number[]> = { L1: Array<number>(count).fill(0), L2: Array<number>(count).fill(0), L3: Array<number>(count).fill(0) };
  for (const load of project.loads) {
    const normalized = normalizeLoad(load); if (!normalized.valid) throw new Error('Correct invalid loads before calculating charging headroom.');
    const phases: Phase[] = load.connection === 'three' ? PHASES : load.connection === 'line-line' ? load.phasePair! : load.connection === 'single' ? [load.phase] : [];
    const standbyKW = load.standbyW * load.quantity / 1000;
    const standbyA = standbyKW * 1000 / ((load.connection === 'three' ? Math.sqrt(3) : 1) * load.voltage);
    for (let index = 0; index < count; index++) {
      const active = activeHours(load.startHour, load.hoursPerDay, index * step, (index + 1) * step) > 0;
      kw[index] += active ? Math.max(normalized.operatingKW, standbyKW) : standbyKW;
      for (const phase of phases) phaseAmps[phase][index] += active ? Math.max(normalized.currentA, standbyA) : standbyA;
    }
  }
  const phaseHeadroomKW = Object.fromEntries(PHASES.map((phase) => [phase, phaseAmps[phase].map((current) => Math.max(0, project.supply.limitA - current) * project.supply.voltageLN / 1000)])) as Record<Phase, number[]>;
  return { kw, phaseHeadroomKW };
}

export function conservativePhaseHeadroom(project: Project, intervalMinutes = 60): Record<Phase, number[]> { return conservativeDemandProfile(project, intervalMinutes).phaseHeadroomKW; }

export interface PhaseMove { loadId: string; from: Phase; to: Phase; circuitId?: string }
export interface BalancePlan {
  revision: number; moves: PhaseMove[]; before: Record<Phase, number>; after: Record<Phase, number>;
  beforeImbalance: number; afterImbalance: number; improvement: number; issues: Issue[]; method: string;
}
/** Greedy whole-circuit reassignment, accepted only when the same engine improves the objective. */
export function previewPhaseBalance(project: Project): BalancePlan {
  const baseline = calculateProject(project);
  const candidate = structuredClone(project);
  const groups = new Map<string, string[]>();
  for (const load of project.loads) {
    if (load.connection !== 'single' || load.locked || !normalizeLoad(load).valid) continue;
    const circuit = project.circuits.find((c) => c.id === load.circuitId);
    if (circuit?.locked || (circuit && project.loads.some((other) => other.circuitId === circuit.id && (other.locked || other.connection !== 'single')))) continue;
    const key = load.circuitId ?? load.id;
    groups.set(key, [...(groups.get(key) ?? []), load.id]);
  }
  const ordered = [...groups.values()].sort((a, b) => {
    const size = (ids: string[]) => ids.reduce((sum, id) => sum + normalizeLoad(project.loads.find((load) => load.id === id)!).currentA, 0);
    return size(b) - size(a);
  });
  let current = baseline;
  const withinLimits = (working: Project) => {
    const result = calculateProject(working);
    // Existing overloads may improve; proposals cannot increase the largest current.
    if (Math.max(...Object.values(result.phaseCurrents)) > Math.max(project.supply.limitA, ...Object.values(baseline.phaseCurrents)) + 1e-9) return false;
    for (const board of working.boards) {
      const boardLoads = working.loads.filter((load) => load.boardId === board.id || working.circuits.some((c) => c.id === load.circuitId && c.boardId === board.id));
      const beforeLoads = project.loads.filter((load) => load.boardId === board.id || project.circuits.some((c) => c.id === load.circuitId && c.boardId === board.id));
      const boardProject = { ...working, loads: boardLoads };
      const oldProject = { ...project, loads: beforeLoads };
      const peak = Math.max(...Object.values(calculateProject(boardProject).phaseCurrents));
      const oldPeak = Math.max(...Object.values(calculateProject(oldProject).phaseCurrents));
      if (peak > Math.max(board.ratedA, oldPeak) + 1e-9) return false;
    }
    return true;
  };
  // Limit exhaustive work; descending greedy candidates cover typical installations without claiming an optimum.
  for (const ids of ordered.slice(0, 250)) {
    const originalPhases = ids.map((id) => candidate.loads.find((load) => load.id === id)!.phase);
    const circuitId = candidate.loads.find((load) => load.id === ids[0])!.circuitId;
    const circuit = candidate.circuits.find((item) => item.id === circuitId);
    const oldCircuitPhase = circuit?.phase;
    let bestPhase: Phase | undefined; let best = current;
    for (const phase of PHASES) {
      for (const id of ids) candidate.loads.find((load) => load.id === id)!.phase = phase;
      if (circuit) circuit.phase = phase;
      const result = calculateProject(candidate);
      if (result.imbalancePercent < best.imbalancePercent - 1e-8 && withinLimits(candidate)) { best = result; bestPhase = phase; }
    }
    ids.forEach((id, index) => { candidate.loads.find((load) => load.id === id)!.phase = bestPhase ?? originalPhases[index]; });
    if (circuit) circuit.phase = bestPhase ?? oldCircuitPhase!;
    current = best;
  }
  const moves = candidate.loads.flatMap((load) => {
    const original = project.loads.find((item) => item.id === load.id)!;
    return original.phase !== load.phase ? [{ loadId: load.id, from: original.phase, to: load.phase, circuitId: load.circuitId }] : [];
  });
  const issues: Issue[] = [];
  if (ordered.length > 250) issues.push({ id: 'balance-budget', severity: 'info', assessment: 'warning', message: 'Greedy search considered the 250 highest-current movable groups. No global optimum is claimed.' });
  if (!moves.length) issues.push({ id: 'balance-no-improvement', severity: 'info', assessment: 'warning', message: 'No improving phase moves were found within locks, grouping and current limits.' });
  return { revision: project.revision, moves, before: baseline.phaseCurrents, after: current.phaseCurrents, beforeImbalance: baseline.imbalancePercent, afterImbalance: current.imbalancePercent, improvement: baseline.imbalancePercent - current.imbalancePercent, issues, method: 'Descending-current greedy whole-circuit heuristic; verified against the electrical engine.' };
}

export function applyPhaseBalance(project: Project, moves: PhaseMove[], expectedRevision = project.revision): Project {
  if (project.revision !== expectedRevision) throw new Error('Project changed after the phase-balance preview; run the preview again.');
  const result = structuredClone(project);
  for (const move of moves) {
    const load = result.loads.find((item) => item.id === move.loadId);
    if (!load || load.locked || load.connection !== 'single' || load.phase !== move.from || !PHASES.includes(move.to)) throw new Error('Phase proposal is stale or violates a load lock.');
    const circuit = result.circuits.find((item) => item.id === load.circuitId);
    if (circuit?.locked) throw new Error('Phase proposal violates a circuit lock.');
    load.phase = move.to;
    if (circuit) circuit.phase = move.to;
  }
  for (const circuit of result.circuits) if (result.loads.some((load) => load.circuitId === circuit.id && load.connection === 'single' && load.phase !== circuit.phase)) throw new Error('A phase proposal must move every single-phase load on the circuit together.');
  result.revision += 1;
  return result;
}

export function powerFactorCorrection(realKW: number, initialPF: number, targetPF: number): { compensationKvar: number; beforeKVA: number; afterKVA: number } {
  if (!Number.isFinite(realKW) || realKW < 0 || ![initialPF, targetPF].every((pf) => Number.isFinite(pf) && pf > 0 && pf <= 1) || targetPF < initialPF) throw new Error('Use nonnegative kW and 0 < initial PF ≤ target PF ≤ 1.');
  return { compensationKvar: realKW * (Math.tan(Math.acos(initialPF)) - Math.tan(Math.acos(targetPF))), beforeKVA: realKW / initialPF, afterKVA: realKW / targetPF };
}
