import type { FlexibleLoad, Issue, Load, Phase, Project } from "../domain/types";
import { validateProjectExtensions } from "../domain/project";
import { explicitInstant, makeCalendarClock, resolveSchedule, unionSpans, type CalendarFields } from "./calendar";
import { magnitude, normalizeLoad, PHASES, validateTopology } from "./electrical";
import { startEventLoad } from "./start-events";
import { tariffRate, validateTariff } from "./tariffs";

export interface FlexiblePlanOptions {
  start: string;
  end: string;
  intervalMinutes: 15 | 60;
  strategy: "deadline" | "cheapest" | "solar";
  siteLimitKW?: number;
  /** Entered AC generation at each interval; used as an objective, never as unverified phase headroom. */
  generationKW?: number[];
  maxCandidates?: number;
}
export interface FlexibleBlock { requirementId: string; loadId: string; start: string; end: string; kw: number; kWh: number }
export interface FlexiblePlan {
  projectId: string;
  revision: number;
  options: FlexiblePlanOptions;
  blocks: FlexibleBlock[];
  requirements: { id: string; name: string; deliveredKWh: number; unmetKWh: number; feasible: boolean }[];
  points: { timestamp: string; durationMinutes: number; baseKW: number; scheduledKW: number; phaseAmps: Record<Phase, number> }[];
  feasible: boolean;
  issues: Issue[];
  method: string;
  candidateCount: number;
}
interface Slot { a: number; b: number; fields: CalendarFields; kw: number; phase: Record<Phase, number>; groups: Map<string, Record<Phase, number>>; rate: number }
const phasesFor = (load: Load): Phase[] => load.connection === "three" ? PHASES : load.connection === "line-line" ? load.phasePair! : load.connection === "single" ? [load.phase] : [];
const zero = (): Record<Phase, number> => ({ L1: 0, L2: 0, L3: 0 });

/** Deterministic bounded greedy allocation. Rated on-state power, site/phase/board/circuit limits and minimum uninterrupted run time are hard constraints. */
export function scheduleFlexibleLoads(project: Project, options: FlexiblePlanOptions): FlexiblePlan {
  const errors = validateProjectExtensions(project as unknown as Record<string, unknown>);
  if (errors.length) throw new Error(errors[0]);
  const tariffs = validateTariff(project.tariff);
  if (tariffs.length) throw new Error(tariffs[0].message);
  const start = Date.parse(options.start), end = Date.parse(options.end);
  if (!explicitInstant(options.start) || !explicitInstant(options.end) || end <= start || end - start > 31 * 86400000 || start % 60000 || end % 60000 || ![15, 60].includes(options.intervalMinutes) || !["deadline", "cheapest", "solar"].includes(options.strategy)) throw new Error("Flexible planning requires whole-minute explicit instants, an increasing range of at most 31 days, and a supported interval/strategy.");
  const siteLimit = options.siteLimitKW ?? project.supply.voltageLN * project.supply.limitA * 3 / 1000;
  if (!Number.isFinite(siteLimit) || siteLimit <= 0) throw new Error("Enter a finite positive site kW constraint.");
  const maxCandidates = options.maxCandidates ?? 50000;
  if (!Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 500000) throw new Error("Candidate budget must be 1–500,000.");
  const requirements = project.flexibleLoads ?? [];
  if (requirements.length > 200) throw new Error("A flexible planning batch is limited to 200 processes.");
  const missing = requirements.find((row) => !project.loads.some((load) => load.id === row.loadId));
  if (missing) throw new Error("A flexible requirement references a missing load.");
  const clock = makeCalendarClock(project.timezone);
  const step = options.intervalMinutes * 60000;
  const count = Math.ceil((end - start) / step);
  if (options.generationKW && (options.generationKW.length !== count || options.generationKW.some((value) => !Number.isFinite(value) || value < 0))) throw new Error("Generation objective requires one nonnegative finite AC kW value per interval.");
  if (options.strategy === "solar" && !options.generationKW) throw new Error("Solar-following needs an actual entered generation profile for this planning period.");
  const normalized = new Map(project.loads.map((load) => [load.id, normalizeLoad(load)]));
  if ([...normalized.values()].some((load) => !load.valid)) throw new Error("Correct invalid load inputs before flexible planning.");
  const issues: Issue[] = validateTopology(project);
  if (issues.some((issue) => issue.severity === "error")) throw new Error(issues.find((issue) => issue.severity === "error")!.message);
  const boardMap = new Map(project.boards.map((board) => [board.id, board]));
  const limits = new Map<string, number>([["supply", project.supply.limitA]]);
  for (const board of project.boards) limits.set(`board:${board.id}`, board.ratedA);
  for (const circuit of project.circuits) if (circuit.protectiveA !== undefined) limits.set(`circuit:${circuit.id}`, circuit.protectiveA);
  const groupsFor = (load: Load): string[] => {
    const result = ["supply"];
    const circuit = project.circuits.find((row) => row.id === load.circuitId);
    if (circuit?.protectiveA !== undefined) result.push(`circuit:${circuit.id}`);
    let id = circuit?.boardId ?? load.boardId;
    const seen = new Set<string>();
    while (id && !seen.has(id)) { seen.add(id); result.push(`board:${id}`); id = boardMap.get(id)?.parentId; }
    return result;
  };
  const mutable = new Set(requirements.filter((row) => { const load = project.loads.find((item) => item.id === row.loadId)!; return !row.locked && !load.locked && !load.critical && load.connection !== "dc" && !project.startEvents?.some((event) => event.loadId === load.id && Date.parse(event.start) < end && Date.parse(event.start) + event.durationSeconds * 1000 > start); }).map((row) => row.loadId));
  const background = project.loads;
  const groupIds = new Map(project.loads.map((load) => [load.id, groupsFor(load)]));
  const absolute = new Map(project.loads.filter((load) => load.schedule?.absoluteWindows !== undefined).map((load) => [load.id, unionSpans(load.schedule!.absoluteWindows!.map((window) => [Date.parse(window.start), Date.parse(window.end)]))]));
  let cachedDate = "";
  let localSpans = new Map<string, [number, number][]>();
  const active = (load: Load, a: number, b: number, fields: CalendarFields): boolean => {
    const instants = absolute.get(load.id);
    if (instants) return instants.some(([left, right]) => Math.min(right, b) > Math.max(left, a));
    if (cachedDate !== fields.date) { localSpans = new Map(); cachedDate = fields.date; }
    let spans = localSpans.get(load.id);
    if (!spans) { spans = resolveSchedule(load, fields.date, fields.weekday); localSpans.set(load.id, spans); }
    const elapsed = (b - a) / 3600000;
    return spans.some(([left, right]) => Math.min(right, fields.hour + elapsed) > Math.max(left, fields.hour));
  };
  const slots: Slot[] = [];
  for (let index = 0; index < count; index++) {
    const a = start + index * step, b = Math.min(end, a + step), fields = clock(a);
    const slot: Slot = { a, b, fields, kw: 0, phase: zero(), groups: new Map(), rate: tariffRate(project.tariff, fields.hour, fields.weekday, fields.date) };
    const finishFields = clock(b - 1);
    const simple = finishFields.date === fields.date && Math.abs((finishFields.hour - fields.hour) * 3600000 + 1 - (b - a)) < 1;
    for (const load of background) {
      const normal = normalized.get(load.id)!;
      let on = !mutable.has(load.id) && simple ? active(load, a, b, fields) : false;
      if (!mutable.has(load.id) && !simple) for (let t = a; t < b && !on; t = Math.min(b, Math.floor(t / 60000 + 1) * 60000)) on = active(load, t, Math.min(b, Math.floor(t / 60000 + 1) * 60000), clock(t));
      const standbyKW = load.standbyW * load.quantity / 1000;
      const standbyA = standbyKW * 1000 / ((load.connection === "three" ? Math.sqrt(3) : 1) * load.voltage);
      let kw = on ? Math.max(normal.operatingKW, standbyKW) : standbyKW;
      let current = on ? Math.max(normal.currentA, standbyA) : standbyA;
      for (const event of project.startEvents ?? []) if (event.loadId === load.id && Date.parse(event.start) < b && Date.parse(event.start) + event.durationSeconds * 1000 > a) {
        const n = normalizeLoad(startEventLoad(load, event, normal)); kw = Math.max(kw, n.operatingKW); current = Math.max(current, n.currentA);
      }
      slot.kw += kw;
      for (const phase of phasesFor(load)) {
        slot.phase[phase] += current;
        for (const key of groupIds.get(load.id)!) { const values = slot.groups.get(key) ?? zero(); values[phase] += current; slot.groups.set(key, values); }
      }
    }
    slots.push(slot);
  }
  const baseKW = slots.map((slot) => slot.kw);
  const blocks: FlexibleBlock[] = [];
  const summaries: FlexiblePlan["requirements"] = [];
  let candidateCount = 0;
  const reserved = new Set<string>();
  const ordered = [...requirements].sort((a, b) => b.priority - a.priority || Math.max(...a.windows.map((window) => Date.parse(window.end))) - Math.max(...b.windows.map((window) => Date.parse(window.end))) || a.id.localeCompare(b.id));
  for (const requirement of ordered) {
    const load = project.loads.find((row) => row.id === requirement.loadId)!;
    const n = normalized.get(load.id)!;
    const standbyKW = load.standbyW * load.quantity / 1000;
    const standbyA = standbyKW * 1000 / ((load.connection === "three" ? Math.sqrt(3) : 1) * load.voltage);
    const addedKW = Math.max(0, n.operatingKW - standbyKW), addedA = Math.max(0, n.currentA - standbyA);
    let remainingHours = n.operatingKW > 0 ? requirement.requiredKWh / n.operatingKW : Infinity;
    const minimumHours = requirement.minimumRunMinutes / 60;
    const allowed = unionSpans(requirement.windows.map((window) => [Math.max(start, Date.parse(window.start)), Math.min(end, Date.parse(window.end))]));
    if (!mutable.has(load.id)) issues.push({ id: `${requirement.id}-locked`, entityId: load.id, severity: "warning", assessment: "failed", message: "Locked or critical equipment is unchanged. Remove this requirement from the batch or explicitly authorize an eligible noncritical process." });
    if (project.startEvents?.some((event) => event.loadId === load.id && Date.parse(event.start) < end && Date.parse(event.start) + event.durationSeconds * 1000 > start)) {
      mutable.delete(load.id); issues.push({ id: `${requirement.id}-starts`, entityId: load.id, severity: "warning", assessment: "incomplete", message: "This flexible load has explicit start events in the planning range. Resolve its start sequence before rescheduling." });
    }
    const capacity = (slot: Slot) => slot.kw + (reserved.has(`${load.id}:${slot.a}`) ? 0 : addedKW) <= siteLimit + 1e-9 && phasesFor(load).every((phase) => groupIds.get(load.id)!.every((key) => (slot.groups.get(key)?.[phase] ?? 0) + (reserved.has(`${load.id}:${slot.a}`) ? 0 : addedA) <= (limits.get(key) ?? 0) + 1e-9));
    while (mutable.has(load.id) && Number.isFinite(remainingHours) && remainingHours > 1e-9 && candidateCount < maxCandidates) {
      if (remainingHours + 1e-9 < minimumHours) break;
      const duration = !requirement.interruptible || remainingHours < 2 * minimumHours - 1e-9 ? remainingHours : minimumHours;
      const available = unionSpans(slots.filter(capacity).flatMap((slot) => allowed.map(([left, right]): [number, number] => [Math.max(left, slot.a), Math.min(right, slot.b)])));
      const candidates: { a: number; b: number; score: number }[] = [];
      for (const [left, right] of available) {
        const starts = [left];
        for (let t = start + Math.ceil((left - start) / step) * step; t + duration * 3600000 <= right + 0.001; t += step) if (t > left) starts.push(t);
        for (const a of starts) {
          if (++candidateCount > maxCandidates) break;
          const b = a + duration * 3600000;
          if (b > right + 0.001 || blocks.some((block) => block.loadId === load.id && Date.parse(block.start) < b && Date.parse(block.end) > a)) continue;
          let score = 0;
          for (let index = Math.max(0, Math.floor((a - start) / step)); index < slots.length && slots[index].a < b; index++) {
            const slot = slots[index], hours = Math.max(0, Math.min(slot.b, b) - Math.max(slot.a, a)) / 3600000;
            score += options.strategy === "solar" ? -Math.min(n.operatingKW, Math.max(0, options.generationKW![index] - slot.kw)) * hours : options.strategy === "cheapest" ? slot.rate * n.operatingKW * hours : (a - start) / 3600000;
          }
          candidates.push({ a, b, score });
        }
        if (candidateCount >= maxCandidates) break;
      }
      candidates.sort((a, b) => a.score - b.score || a.a - b.a);
      const chosen = candidates[0];
      if (!chosen) break;
      blocks.push({ requirementId: requirement.id, loadId: load.id, start: new Date(chosen.a).toISOString(), end: new Date(chosen.b).toISOString(), kw: n.operatingKW, kWh: duration * n.operatingKW });
      for (const slot of slots) if (slot.a < chosen.b && slot.b > chosen.a) {
        // Reserve the complete interval at on-state power, even for a partial final block.
        if (reserved.has(`${load.id}:${slot.a}`)) continue;
        reserved.add(`${load.id}:${slot.a}`);
        slot.kw += addedKW;
        for (const phase of phasesFor(load)) { slot.phase[phase] += addedA; for (const key of groupIds.get(load.id)!) { const values = slot.groups.get(key) ?? zero(); values[phase] += addedA; slot.groups.set(key, values); } }
      }
      remainingHours = Math.max(0, remainingHours - duration);
    }
    const deliveredKWh = blocks.filter((block) => block.requirementId === requirement.id).reduce((sum, block) => sum + block.kWh, 0);
    const unmetKWh = Math.max(0, requirement.requiredKWh - deliveredKWh);
    summaries.push({ id: requirement.id, name: requirement.name, deliveredKWh, unmetKWh, feasible: unmetKWh < 1e-7 });
    if (unmetKWh >= 1e-7) issues.push({ id: `${requirement.id}-unmet`, entityId: load.id, severity: "warning", assessment: "failed", message: `${requirement.name}: ${unmetKWh.toFixed(4)} kWh cannot be allocated by the bounded heuristic within the entered windows, minimum runs and capacity limits. This is not proof of global infeasibility.` });
  }
  if (candidateCount >= maxCandidates) issues.push({ id: "flex-budget", severity: "warning", assessment: "incomplete", message: "The declared candidate-search budget was reached; unallocated requirements remain explicit." });
  if (slots.some((slot) => slot.kw > siteLimit + 1e-9 || [...slot.groups].some(([key, values]) => PHASES.some((phase) => values[phase] > (limits.get(key) ?? 0) + 1e-9)))) issues.push({ id: "flex-existing-limit", severity: "warning", assessment: "failed", message: "Existing background demand exceeds an entered site/phase/board/circuit limit; the plan cannot resolve that overload." });
  const feasible = summaries.every((row) => row.feasible) && !issues.some((issue) => issue.assessment === "failed" || issue.assessment === "incomplete");
  return { projectId: project.id, revision: project.revision, options: structuredClone(options), blocks: blocks.sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.loadId.localeCompare(b.loadId)), requirements: summaries, points: slots.map((slot, index) => ({ timestamp: new Date(slot.a).toISOString(), durationMinutes: (slot.b - slot.a) / 60000, baseKW: baseKW[index], scheduledKW: slot.kw, phaseAmps: slot.phase })), feasible, issues, candidateCount, method: "Bounded priority/deadline greedy search at entered on-state power. Each uninterrupted block respects minimum run time; exact required energy is preserved. Whole intervals reserve full power for partial blocks, so the heuristic is conservative. Existing duty-average loads retain on-state headroom. Board/circuit limits are entered current ratings; this does not establish cable/protection approval. Solar values select timing only; they do not relax unverified phase constraints." };
}

/** Recompute against the same revision and reject modified/stale proposals before the undoable host mutation. */
export function applyFlexiblePlan(project: Project, plan: FlexiblePlan): void {
  if (project.id !== plan.projectId || project.revision !== plan.revision) throw new Error("This schedule proposal is stale; preview it again.");
  const verified = scheduleFlexibleLoads(project, plan.options);
  if (!verified.feasible || !plan.feasible || JSON.stringify(verified.blocks) !== JSON.stringify(plan.blocks)) throw new Error("The schedule is infeasible or no longer matches the validated proposal.");
  for (const requirement of project.flexibleLoads ?? []) {
    const load = project.loads.find((row) => row.id === requirement.loadId)!;
    if (load.locked || load.critical || requirement.locked) throw new Error("Locked/critical equipment cannot be rescheduled by this proposal.");
    load.schedule = { windows: [], absoluteWindows: unionSpans(verified.blocks.filter((block) => block.loadId === load.id).map((block) => [Date.parse(block.start), Date.parse(block.end)])).map(([a, b]) => ({ start: new Date(a).toISOString(), end: new Date(b).toISOString() })) };
    load.duty = 1;
  }
}
