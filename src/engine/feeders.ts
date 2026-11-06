import type { Assessment, Cable, Complex, Issue, Load, Phase, Project } from "../domain/types";
import { addComplex, magnitude, normalizeLoad, PHASES, validateTopology, zeroPhases } from "./electrical";
import { explicitInstant } from "./calendar";
import { operatingLoadsAt } from "./start-events";

const angles: Record<Phase, number> = { L1: 0, L2: -2 * Math.PI / 3, L3: 2 * Math.PI / 3 };
const polar = (size: number, angle: number): Complex => ({ re: size * Math.cos(angle), im: size * Math.sin(angle) });
const subtract = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const multiply = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export interface FeederRouteOptions { scenario?: "running" | "starting"; at?: string; limitPercent?: number }
export interface FeederSegment {
  id: string;
  name: string;
  kind: "feeder" | "final-circuit";
  downstreamLoadIds: string[];
  phaseCurrents: Record<Phase, number>;
  neutralA: number | null;
  currentA: number;
  lossW: number | null;
  channelDropV: Record<string, number>;
  capacityA?: number;
  capacityAssessment: Assessment;
  source: string;
  complete: boolean;
}
export interface FeederRouteResult {
  revision: number;
  loadId: string;
  scenario: "running" | "starting";
  at?: string;
  segments: FeederSegment[];
  channels: { name: string; dropV: number; percent: number; receivingVoltage: number }[];
  totalDropV: number | null;
  percent: number | null;
  receivingVoltage: number | null;
  lossW: number | null;
  voltageBasis: number;
  limitPercent?: number;
  assessment: Assessment;
  complete: boolean;
  issues: Issue[];
  method: string;
}

/** Nominal-current radial phasor approximation, including shared neutral return impedance. */
export function assessEndpointRoute(project: Project, loadId: string, options: FeederRouteOptions = {}): FeederRouteResult {
  const endpoint = project.loads.find((load) => load.id === loadId);
  if (!endpoint) throw new Error("Select an existing endpoint load.");
  if (options.at !== undefined && !explicitInstant(options.at)) throw new Error("A scenario instant requires an explicit UTC offset.");
  if (options.scenario === "starting" && !options.at) throw new Error("Select the instant of an entered start event for starting assessment.");
  if (options.limitPercent !== undefined && (!Number.isFinite(options.limitPercent) || options.limitPercent <= 0 || options.limitPercent > 100)) throw new Error("Enter a finite positive route voltage criterion, at most 100%.");
  const issues: Issue[] = [];
  const problem = (id: string, message: string, entityId?: string, assessment: Assessment = "incomplete") => issues.push({ id, message, entityId, assessment, severity: assessment === "unsupported" ? "warning" : "error" });
  const circuit = project.circuits.find((row) => row.id === endpoint.circuitId);
  if (!circuit) problem("route-circuit", "Assign the endpoint to a final circuit before route assessment.", endpoint.id);
  const boardMap = new Map(project.boards.map((board) => [board.id, board]));
  const routeBoards: typeof project.boards = [];
  let boardId = circuit?.boardId ?? endpoint.boardId;
  const seen = new Set<string>();
  while (boardId) {
    if (seen.has(boardId)) { problem("route-cycle", "The source-to-load route contains a cycle.", boardId); break; }
    seen.add(boardId);
    const board = boardMap.get(boardId);
    if (!board) { problem("route-board", "A board on the endpoint route is missing.", boardId); break; }
    routeBoards.unshift(board); boardId = board.parentId;
  }
  if (!routeBoards.length) problem("route-source", "The endpoint has no connected source-to-board route.", endpoint.id);
  const scenario = options.scenario ?? "running";
  if (scenario === "starting" && !project.startEvents?.some((event) => Date.parse(options.at!) >= Date.parse(event.start) && Date.parse(options.at!) < Date.parse(event.start) + event.durationSeconds * 1000)) problem("route-no-start", "The selected instant does not intersect an entered start event.");
  const loads = options.at ? operatingLoadsAt(scenario === "starting" ? project : { ...project, startEvents: [] }, Date.parse(options.at)) : project.loads;
  const loadBoards = new Map(project.loads.map((load) => [load.id, project.circuits.find((row) => row.id === load.circuitId)?.boardId ?? load.boardId]));
  const inSubtree = (load: Load, ancestor: string): boolean => {
    let id = loadBoards.get(load.id);
    const visited = new Set<string>();
    while (id && !visited.has(id)) { if (id === ancestor) return true; visited.add(id); id = boardMap.get(id)?.parentId; }
    return false;
  };
  const descriptors: { id: string; name: string; kind: FeederSegment["kind"]; cable?: Cable; loads: Load[] }[] = routeBoards.map((board) => ({ id: board.id, name: `${board.name} feeder`, kind: "feeder", cable: board.feeder, loads: loads.filter((load) => inSubtree(load, board.id)) }));
  if (circuit) descriptors.push({ id: circuit.id, name: circuit.name, kind: "final-circuit", cable: circuit.cable, loads: loads.filter((load) => load.circuitId === circuit.id) });
  const involved = new Set([...routeBoards.map((board) => board.id), ...(circuit ? [circuit.id] : []), ...descriptors.flatMap((row) => row.loads.map((load) => load.id))]);
  issues.push(...validateTopology(project).filter((issue) => issue.entityId && involved.has(issue.entityId)));
  const channels: { name: string; nominal: Complex; delta: (phases: Record<Phase, Complex>, neutral: Complex, dc: number) => Complex }[] = [];
  if (endpoint.connection === "dc") channels.push({ name: "DC terminals", nominal: { re: endpoint.voltage, im: 0 }, delta: (_p, _n, dc) => ({ re: dc, im: 0 }) });
  else if (endpoint.connection === "single") channels.push({ name: `${endpoint.phase}-N`, nominal: polar(endpoint.voltage, angles[endpoint.phase]), delta: (p, n) => addComplex(p[endpoint.phase], n) });
  else {
    const pairs: [Phase, Phase][] = endpoint.connection === "line-line" ? [endpoint.phasePair!] : [["L1", "L2"], ["L2", "L3"], ["L3", "L1"]];
    for (const [a, b] of pairs) {
      const nominalDirection = subtract(polar(1, angles[a]), polar(1, angles[b]));
      channels.push({ name: `${a}-${b}`, nominal: polar(endpoint.voltage, Math.atan2(nominalDirection.im, nominalDirection.re)), delta: (p) => subtract(p[a], p[b]) });
    }
  }
  const totalDelta = new Map(channels.map((channel) => [channel.name, { re: 0, im: 0 }]));
  const segments: FeederSegment[] = [];
  const nonnegative = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  for (const descriptor of descriptors) {
    const normalized = descriptor.loads.map(normalizeLoad);
    const cable = descriptor.cable;
    const dc = endpoint.connection === "dc";
    const compatible = descriptor.loads.every((load) => (load.connection === "dc") === dc && (!dc || load.voltage === endpoint.voltage));
    const validLoads = normalized.every((load) => load.valid && (dc || load.reactiveKvar !== null));
    if (!compatible) problem(`${descriptor.id}-boundary`, "This route mixes AC/DC or incompatible DC voltages; supply/converter modelling is required.", descriptor.id, "unsupported");
    if (!validLoads) problem(`${descriptor.id}-loads`, "All downstream loads need valid magnitudes and displacement-PF or complex-power evidence.", descriptor.id);
    const currents = zeroPhases();
    let dcCurrent = 0;
    if (validLoads && compatible) for (let index = 0; index < normalized.length; index++) {
      const load = normalized[index];
      if (dc) dcCurrent += load.currentA;
      else for (const phase of PHASES) currents[phase] = addComplex(currents[phase], load.phaseCurrents[phase]);
    }
    const neutralCurrent = addComplex(addComplex(currents.L1, currents.L2), currents.L3);
    const currentA = dc ? dcCurrent : Math.max(...PHASES.map((phase) => magnitude(currents[phase])));
    const complete = Boolean(cable && nonnegative(cable.lengthM) && nonnegative(cable.resistanceOhmPerKm) && (dc || nonnegative(cable.reactanceOhmPerKm)) && (cable.returnResistanceOhmPerKm === undefined || nonnegative(cable.returnResistanceOhmPerKm)) && (cable.returnReactanceOhmPerKm === undefined || nonnegative(cable.returnReactanceOhmPerKm)) && cable.source?.trim() && validLoads && compatible);
    if (!complete) problem(`${descriptor.id}-impedance`, "Enter this segment's one-way length, per-conductor R (and AC X, including explicit zero), return-path data if unequal, and impedance provenance. Missing feeder data is not zero impedance.", descriptor.id);
    const contributions: Record<string, number> = {};
    let lossW: number | null = null;
    if (complete && cable) {
      const factor = cable.lengthM / 1000;
      const z = { re: cable.resistanceOhmPerKm! * factor, im: dc ? 0 : cable.reactanceOhmPerKm! * factor };
      const zn = { re: (cable.returnResistanceOhmPerKm ?? cable.resistanceOhmPerKm!) * factor, im: dc ? 0 : (cable.returnReactanceOhmPerKm ?? cable.reactanceOhmPerKm!) * factor };
      const phaseDrop = Object.fromEntries(PHASES.map((phase) => [phase, multiply(z, currents[phase])])) as Record<Phase, Complex>;
      const neutralDrop = multiply(zn, neutralCurrent);
      lossW = dc ? dcCurrent ** 2 * (z.re + zn.re) : PHASES.reduce((sum, phase) => sum + magnitude(currents[phase]) ** 2 * z.re, 0) + magnitude(neutralCurrent) ** 2 * zn.re;
      for (const channel of channels) {
        const drop = channel.delta(phaseDrop, neutralDrop, dcCurrent * (z.re + zn.re));
        totalDelta.set(channel.name, addComplex(totalDelta.get(channel.name)!, drop));
        contributions[channel.name] = (drop.re * channel.nominal.re + drop.im * channel.nominal.im) / endpoint.voltage;
      }
    }
    const factors = cable?.correctionFactors;
    const capacityA = cable?.source?.trim() && nonnegative(cable.baseAmpacityA) && cable.baseAmpacityA > 0 && factors?.length && factors.every((value) => Number.isFinite(value) && value > 0) ? cable.baseAmpacityA * factors.reduce((a, b) => a * b, 1) : undefined;
    segments.push({ id: descriptor.id, name: descriptor.name, kind: descriptor.kind, downstreamLoadIds: descriptor.loads.map((load) => load.id), phaseCurrents: Object.fromEntries(PHASES.map((phase) => [phase, magnitude(currents[phase])])) as Record<Phase, number>, neutralA: validLoads ? magnitude(neutralCurrent) : null, currentA, lossW, channelDropV: contributions, capacityA, capacityAssessment: capacityA === undefined || !validLoads ? "incomplete" : currentA <= capacityA ? "passed" : "failed", source: cable?.source ?? "", complete });
  }
  const numericalComplete = segments.length > 0 && segments.every((segment) => segment.complete) && !issues.some((issue) => issue.assessment === "incomplete" || issue.assessment === "unsupported" || issue.severity === "error");
  const results = numericalComplete ? channels.map((channel) => {
    const drop = totalDelta.get(channel.name)!;
    const dropV = (drop.re * channel.nominal.re + drop.im * channel.nominal.im) / endpoint.voltage;
    return { name: channel.name, dropV, percent: dropV / endpoint.voltage * 100, receivingVoltage: magnitude(subtract(channel.nominal, drop)) };
  }) : [];
  const controlling = [...results].sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))[0];
  const limitPercent = options.limitPercent ?? circuit?.cable?.voltageDropLimitPercent;
  const limitValid = typeof limitPercent === "number" && Number.isFinite(limitPercent) && limitPercent > 0;
  if (!limitValid) problem("route-limit", "Enter a sourced or user-selected cumulative voltage-drop criterion; no universal limit is assumed.", endpoint.id);
  return { revision: project.revision, loadId, scenario, at: options.at, segments, channels: results, totalDropV: controlling?.dropV ?? null, percent: controlling?.percent ?? null, receivingVoltage: controlling?.receivingVoltage ?? null, lossW: numericalComplete ? segments.reduce((sum, segment) => sum + segment.lossW!, 0) : null, voltageBasis: endpoint.voltage, limitPercent, assessment: !numericalComplete || !limitValid ? "incomplete" : results.every((channel) => Math.abs(channel.percent) <= limitPercent!) ? "passed" : "failed", complete: numericalComplete && limitValid, issues, method: "Radial nominal-current phasor approximation with a fixed source neutral; each feeder carries all descendant loads under the same selected scenario. Neutral return impedance is included for L–N endpoints and cancels for L–L. Omitted return data assumes equal outgoing/return conductors. Signed projected voltage drop is separate from the receiving-voltage phasor magnitude. Shared segment losses include all downstream loads, not an allocated endpoint loss. This voltage-route result does not establish protection/disconnection compliance." };
}
