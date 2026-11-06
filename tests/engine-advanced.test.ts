import { describe, expect, it } from "vitest";
import { createBoard, createCircuit, createLoad, createProject, validateProjectImport } from "../src/domain/project";
import type { Cable, Load, Project, StartEvent } from "../src/domain/types";
import { resolveSchedule } from "../src/engine/calendar";
import { calculateProject, dailyProfile, normalizeLoad } from "../src/engine/electrical";
import { simulateRange } from "../src/engine/simulation";
import { simulateStartEvents } from "../src/engine/start-events";
import { calculateIntervalBill, tariffRate, validateTariff } from "../src/engine/tariffs";
import { assessEndpointRoute } from "../src/engine/feeders";
import { applyFlexiblePlan, scheduleFlexibleLoads } from "../src/engine/flexible";

const day = (project: Project, date: string) => simulateRange(project, { start: `${date}T00:00:00Z`, end: new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString(), intervalMinutes: 15 });
const cable = (r: number, overrides: Partial<Cable> = {}): Cable => ({ lengthM: 100, resistanceOhmPerKm: r, reactanceOhmPerKm: 0, source: "Entered independent test impedance", voltageDropLimitPercent: 5, baseAmpacityA: 63, correctionFactors: [1], ...overrides });
const startEvent = (load: Load, id: string, start = "2026-01-01T00:00:00Z", overrides: Partial<StartEvent> = {}): StartEvent => ({ id, loadId: load.id, start, durationSeconds: 10, multiplier: 2, pf: 0.5, method: "user", source: "Entered test current/PF/time", ...overrides });

describe("calendar operating rules and explicit start events", () => {
  it("unions overlapping seasonal windows without doubling energy", () => {
    const project = createProject(); project.timezone = "UTC";
    const load = createLoad({ rating: 1, schedule: { windows: [{ id: "a", startHour: 8, durationHours: 4, months: [1] }, { id: "b", startHour: 10, durationHours: 4, months: [1] }] } });
    project.loads = [load];
    expect(resolveSchedule(load, "2026-01-01")).toEqual([[8, 14]]);
    expect(day(project, "2026-01-01").totalKWh).toBeCloseTo(6, 10);
    expect(day(project, "2026-02-01").totalKWh).toBe(0);
    expect(normalizeLoad(load).currentA).toBeCloseTo(1000 / 230, 10);
  });
  it("closed date overrides overnight carry-in; replacement date has deterministic precedence", () => {
    const project = createProject(); project.timezone = "UTC";
    project.loads = [createLoad({ rating: 1, schedule: { windows: [{ id: "night", startHour: 22, durationHours: 4 }], exceptions: [{ date: "2026-01-02", mode: "closed" }, { date: "2026-01-03", mode: "replace", windows: [{ id: "special", startHour: 12, durationHours: 1 }] }] } })];
    expect(day(project, "2026-01-01").totalKWh).toBeCloseTo(4);
    expect(day(project, "2026-01-02").totalKWh).toBe(0);
    expect(day(project, "2026-01-03").totalKWh).toBeCloseTo(1);
  });
  it("timed on/off cycles replace average duty rather than multiplying it", () => {
    const load = createLoad({ rating: 2, duty: 0.25, schedule: { windows: [{ id: "day", startHour: 0, durationHours: 1 }], timedCycle: { onMinutes: 15, offMinutes: 15, offsetMinutes: 0 } } });
    const profile = dailyProfile([load], 15);
    expect(profile.slice(0, 4).map((row) => row.kw)).toEqual([2, 0, 2, 0]);
    expect(profile.reduce((sum, row) => sum + row.kWh, 0)).toBeCloseTo(1);
    expect(normalizeLoad(load).currentA).toBeCloseTo(2000 / 230);
  });
  it("effective dates and weekday ownership apply to overnight starts", () => {
    const load = createLoad({ schedule: { windows: [{ id: "one", startHour: 23, durationHours: 3, weekdays: [1], effectiveFrom: "2026-01-05", effectiveTo: "2026-01-05" }] } });
    expect(resolveSchedule(load, "2026-01-06")).toEqual([[0, 2]]);
    expect(resolveSchedule(load, "2026-01-12")).toEqual([]);
  });
  it("explicit-offset absolute windows select only one occurrence in a DST fold", () => {
    const project = createProject();
    project.loads = [createLoad({ rating: 1, schedule: { windows: [], absoluteWindows: [{ start: "2026-10-25T02:00:00+02:00", end: "2026-10-25T02:30:00+02:00" }] } })];
    const result = simulateRange(project, { start: "2026-10-25T00:00:00+02:00", end: "2026-10-26T00:00:00+01:00", intervalMinutes: 15 });
    expect(result.elapsedHours).toBe(25);
    expect(result.totalKWh).toBeCloseTo(0.5, 10);
  });
  it("start current/PF replaces running demand and integrates seconds once", () => {
    const project = createProject(); project.timezone = "UTC";
    const load = createLoad({ rating: 2.3, startHour: 0, hoursPerDay: 24 }); project.loads = [load];
    project.startEvents = [startEvent(load, "start", "2026-01-01T00:00:10Z", { durationSeconds: 20, multiplier: 4, pf: 0.5 })];
    const result = simulateRange(project, { start: "2026-01-01T00:00:00Z", end: "2026-01-01T01:00:00Z", intervalMinutes: 15 });
    expect(result.totalKWh).toBeCloseTo(2.3 + (4.6 - 2.3) * 20 / 3600, 10);
    const starts = simulateStartEvents(project);
    expect(starts.peakPhaseA.L1).toBeCloseTo(40);
    expect(starts.peakKW).toBeCloseTo(4.6);
    expect(starts.peakKVA).toBeCloseTo(9.2);
    expect(starts.energyKWh).toBeCloseTo(4.6 * 20 / 3600);
  });
  it("staggering start events reduces the independently calculated phase peak", () => {
    const project = createProject(); project.timezone = "UTC";
    project.loads = [createLoad({ rating: 2.3, startHour: 0, hoursPerDay: 24 }), createLoad({ rating: 2.3, startHour: 0, hoursPerDay: 24 })];
    project.startEvents = project.loads.map((load, i) => startEvent(load, `e${i}`, "2026-01-01T00:00:00Z", { pf: 1, multiplier: 3 }));
    expect(simulateStartEvents(project).peakPhaseA.L1).toBeCloseTo(60);
    project.startEvents[1].start = "2026-01-01T00:00:10Z";
    expect(simulateStartEvents(project).peakPhaseA.L1).toBeCloseTo(40);
  });
  it("rejects ambiguous timestamps, bad dates, overlapping starts and invalid nested cycles", () => {
    const project = createProject(); const load = createLoad(); project.loads = [load];
    load.schedule = { windows: [{ id: "bad", startHour: 8, durationHours: 1, effectiveFrom: "2026-02-30" }] };
    expect(validateProjectImport(project).valid).toBe(false);
    load.schedule = { windows: [], timedCycle: { onMinutes: 0, offMinutes: 10, offsetMinutes: 0 } };
    expect(validateProjectImport(project).valid).toBe(false);
    delete load.schedule;
    project.startEvents = [startEvent(load, "e1"), startEvent(load, "e2", "2026-01-01T00:00:05Z")];
    expect(validateProjectImport(project).valid).toBe(false);
    project.startEvents = [startEvent(load, "e1", "2026-01-01T00:00:00")];
    expect(validateProjectImport(project).valid).toBe(false);
  });
});

describe("calendar tariffs and separate physical billing lines", () => {
  it("accepts nonoverlapping effective dates and rejects overlapping dated prices", () => {
    const tariff = createProject().tariff;
    tariff.bands = [{ id: "jan", name: "January", startHour: 0, endHour: 24, importRate: 0.2, effectiveFrom: "2026-01-01", effectiveTo: "2026-01-31" }, { id: "feb", name: "February", startHour: 0, endHour: 24, importRate: 0.4, effectiveFrom: "2026-02-01", effectiveTo: "2026-02-28" }];
    expect(validateTariff(tariff)).toEqual([]);
    expect(tariffRate(tariff, 12, 0, "2026-02-01")).toBe(0.4);
    tariff.bands[1].effectiveFrom = "2026-01-31";
    expect(validateTariff(tariff).some((issue) => issue.id.includes("overlap"))).toBe(true);
  });
  it("rolling 15-minute demand finds 3 kW across an aligned boundary that reports 2 kW", () => {
    const tariff = createProject().tariff; tariff.demandPerKW = 10;
    const powers = [0, 0, 3, 3, 3, 0];
    const rows = powers.map((kw, i) => ({ timestamp: new Date(Date.parse("2026-01-01T00:00:00Z") + i * 300000).toISOString(), durationMinutes: 5, importKWh: kw / 12, exportKWh: 0 }));
    tariff.demandRule = { method: "aligned", windowMinutes: 15, stepMinutes: 15, period: "range" };
    expect(calculateIntervalBill(tariff, rows, { timezone: "UTC" }).demandPeaks[0].kw).toBeCloseTo(2);
    tariff.demandRule = { method: "rolling", windowMinutes: 15, stepMinutes: 5, period: "range" };
    const bill = calculateIntervalBill(tariff, rows, { timezone: "UTC" });
    expect(bill.demandPeaks[0].kw).toBeCloseTo(3);
    expect(bill.demandCharge).toBe(30);
  });
  it("hourly energy cannot establish a 15-minute billed demand peak", () => {
    const tariff = createProject().tariff; tariff.demandPerKW = 10;
    const bill = calculateIntervalBill(tariff, [{ timestamp: "2026-01-01T00:00:00Z", durationMinutes: 60, importKWh: 2, exportKWh: 0 }], { timezone: "UTC" });
    expect(bill.complete).toBe(false); expect(bill.demandPeaks).toEqual([]); expect(bill.demandCharge).toBe(0);
  });
  it("separates export credit, negative import prices, fixed charges and declared tax basis", () => {
    const tariff = { ...createProject().tariff, importRate: -0.1, exportRate: 0.2, standingPerDay: 24, taxPercent: 10, taxBasis: "imports-and-fixed" as const };
    const bill = calculateIntervalBill(tariff, [{ timestamp: "2026-01-01T00:00:00Z", durationMinutes: 60, importKWh: 2, exportKWh: 1 }], { timezone: "UTC" });
    expect(bill.energyCharge).toBe(-0.2); expect(bill.exportCredit).toBe(0.2); expect(bill.standingCharge).toBe(1); expect(bill.tax).toBe(0.08); expect(bill.total).toBe(0.68);
  });
  it("calendar-day standing charge distinguishes the 23-hour spring date from elapsed-day charging", () => {
    const tariff = { ...createProject().tariff, standingPerDay: 24, standingBasis: "local-calendar-days" as const };
    const rows = [{ timestamp: "2026-03-29T00:00:00+01:00", durationMinutes: 23 * 60, importKWh: 0, exportKWh: 0 }];
    expect(calculateIntervalBill(tariff, rows, { timezone: "Europe/Berlin" }).standingCharge).toBe(24);
    expect(calculateIntervalBill({ ...tariff, standingBasis: "elapsed-24h" }, rows, { timezone: "Europe/Berlin" }).standingCharge).toBe(23);
  });
  it("rejects coverage gaps and missing physical intervals", () => {
    const tariff = createProject().tariff; tariff.coverage = "complete-bands";
    expect(() => tariffRate(tariff, 12, 1, "2026-01-05")).toThrow(/coverage gap/);
    tariff.coverage = "base-rate";
    expect(() => calculateIntervalBill(tariff, [{ timestamp: "2026-01-01T00:00:00Z", durationMinutes: 15, importKWh: 1, exportKWh: 0 }, { timestamp: "2026-01-01T01:00:00Z", durationMinutes: 15, importKWh: 1, exportKWh: 0 }], { timezone: "UTC" })).toThrow(/contiguous/);
  });
});

function routeProject() {
  const project = createProject(); project.boards[0].feeder = cable(1);
  const circuit = createCircuit(project.boards[0].id, { cable: cable(2) }); project.circuits = [circuit];
  const target = createLoad({ rating: 2.3, boardId: project.boards[0].id, circuitId: circuit.id });
  project.loads = [target, createLoad({ rating: 2.3, boardId: project.boards[0].id })];
  return { project, target, circuit };
}
describe("cumulative radial feeder assessment", () => {
  it("adds shared feeder and final branch contributions under one current scenario", () => {
    const { project, target } = routeProject();
    const route = assessEndpointRoute(project, target.id);
    expect(route.complete).toBe(true); expect(route.totalDropV).toBeCloseTo(8); expect(route.receivingVoltage).toBeCloseTo(222); expect(route.lossW).toBeCloseTo(120);
    expect(route.segments.map((row) => row.currentA)).toEqual([20, 10]);
  });
  it("balanced shared feeder neutral cancels without deleting endpoint neutral drop", () => {
    const { project, target } = routeProject();
    project.loads[1].phase = "L2";
    project.loads.push(createLoad({ rating: 2.3, phase: "L3", boardId: project.boards[0].id }));
    const route = assessEndpointRoute(project, target.id);
    expect(route.segments[0].neutralA).toBeCloseTo(0, 10); expect(route.totalDropV).toBeCloseTo(5, 10);
  });
  it("supports separate neutral return impedance and retains an incomplete missing feeder", () => {
    const { project, target } = routeProject(); project.loads = [target]; project.boards[0].feeder!.returnResistanceOhmPerKm = 2;
    expect(assessEndpointRoute(project, target.id).totalDropV).toBeCloseTo(7);
    delete project.boards[0].feeder;
    const result = assessEndpointRoute(project, target.id);
    expect(result.totalDropV).toBeNull(); expect(result.assessment).toBe("incomplete"); expect(result.segments[1].channelDropV["L1-N"]).toBeCloseTo(4);
  });
  it("line-line return uses its second phase and does not invent neutral current", () => {
    const { project, target, circuit } = routeProject(); Object.assign(target, { connection: "line-line", phasePair: ["L1", "L2"], voltage: 400, rating: 4 }); project.loads = [target]; circuit.phase = "L1";
    const result = assessEndpointRoute(project, target.id);
    expect(result.totalDropV).toBeCloseTo(6, 10); expect(result.segments[0].neutralA).toBeCloseTo(0, 10);
  });
  it("retains signed leading-reactive voltage rise", () => {
    const { project, target, circuit } = routeProject(); project.loads = [target]; project.boards[0].feeder = cable(0); circuit.cable = cable(0, { reactanceOhmPerKm: 1 }); target.pf = 0.8; target.reactive = "leading";
    expect(assessEndpointRoute(project, target.id).totalDropV).toBeCloseTo(-1.5, 10);
  });
  it("starting route uses the selected event current/PF, with no invented multiplier", () => {
    const { project, target } = routeProject(); project.timezone = "UTC"; project.loads = [target]; target.hoursPerDay = 24; target.startHour = 0;
    project.startEvents = [startEvent(target, "e", undefined, { multiplier: 4, pf: 1 })];
    expect(assessEndpointRoute(project, target.id, { scenario: "starting", at: "2026-01-01T00:00:01Z" }).totalDropV).toBeCloseTo(24);
    expect(() => assessEndpointRoute(project, target.id, { scenario: "starting" })).toThrow(/instant/);
  });
});

function flexibleProject() {
  const project = createProject(); project.timezone = "UTC";
  const load = createLoad({ rating: 2, hoursPerDay: 0, boardId: project.boards[0].id }); project.loads = [load];
  project.flexibleLoads = [{ id: "process", name: "Entered pump", loadId: load.id, windows: [{ start: "2026-01-01T00:00:00Z", end: "2026-01-01T03:00:00Z" }], requiredKWh: 2, minimumRunMinutes: 30, interruptible: true, locked: false, priority: 0, source: "User-authorized operating window" }];
  return { project, load, options: { start: "2026-01-01T00:00:00Z", end: "2026-01-01T03:00:00Z", intervalMinutes: 15 as const, strategy: "cheapest" as const } };
}
describe("constrained flexible-load proposals", () => {
  it("chooses the cheaper hour, applies exact energy and retains on-state current", () => {
    const { project, load, options } = flexibleProject(); project.tariff.bands = [{ id: "cheap", name: "Entered cheap hour", startHour: 1, endHour: 2, importRate: 0.1 }];
    const plan = scheduleFlexibleLoads(project, options);
    expect(plan.feasible).toBe(true); expect(plan.blocks[0].start).toBe("2026-01-01T01:00:00.000Z"); expect(plan.requirements[0].deliveredKWh).toBeCloseTo(2);
    applyFlexiblePlan(project, plan);
    expect(simulateRange(project, options).totalKWh).toBeCloseTo(2, 10); expect(normalizeLoad(load).currentA).toBeCloseTo(2000 / 230);
  });
  it("a minimum run longer than the required on-time is infeasible without overdelivery", () => {
    const { project, options } = flexibleProject(); project.flexibleLoads![0].requiredKWh = 1; project.flexibleLoads![0].minimumRunMinutes = 60;
    const plan = scheduleFlexibleLoads(project, options); expect(plan.feasible).toBe(false); expect(plan.blocks).toEqual([]); expect(plan.requirements[0].unmetKWh).toBe(1);
  });
  it("board and phase limits block schedules even when site kW headroom exists", () => {
    const { project, options } = flexibleProject(); project.boards[0].ratedA = 5;
    expect(scheduleFlexibleLoads(project, options).feasible).toBe(false);
    project.boards[0].ratedA = 63; project.supply.limitA = 10;
    project.loads.push(createLoad({ rating: 1.15, hoursPerDay: 24, startHour: 0, boardId: project.boards[0].id }));
    expect(scheduleFlexibleLoads(project, options).feasible).toBe(false);
  });
  it("noninterruptible work cannot jump between disjoint allowed windows", () => {
    const { project, options } = flexibleProject(); const row = project.flexibleLoads![0]; row.requiredKWh = 4; row.interruptible = false; row.windows = [{ start: "2026-01-01T00:00:00Z", end: "2026-01-01T01:00:00Z" }, { start: "2026-01-01T02:00:00Z", end: "2026-01-01T03:00:00Z" }];
    expect(scheduleFlexibleLoads(project, options).feasible).toBe(false);
  });
  it("rejects stale and edited proposals without changing the project", () => {
    const { project, options } = flexibleProject(); const plan = scheduleFlexibleLoads(project, options); project.revision++;
    expect(() => applyFlexiblePlan(project, plan)).toThrow(/stale/);
    project.revision--; plan.blocks[0].kw = 0.01;
    expect(() => applyFlexiblePlan(project, plan)).toThrow(/validated/); expect(project.loads[0].schedule).toBeUndefined();
  });
  it("solar-following requires supplied values and never treats forecast kW as phase headroom", () => {
    const { project, options } = flexibleProject();
    expect(() => scheduleFlexibleLoads(project, { ...options, strategy: "solar" })).toThrow(/generation/);
    const generation = Array(12).fill(0); generation.fill(3, 8, 12);
    const plan = scheduleFlexibleLoads(project, { ...options, strategy: "solar", generationKW: generation });
    expect(plan.blocks[0].start).toBe("2026-01-01T02:00:00.000Z");
    project.supply.limitA = 5;
    expect(scheduleFlexibleLoads(project, { ...options, strategy: "solar", generationKW: generation }).feasible).toBe(false);
  });
});

describe("optional metadata trust boundaries", () => {
  it("validates detached equipment templates, diagram geometry and frozen snapshots", () => {
    const project = createProject(); project.equipmentLibrary = [createLoad()];
    const baseline = structuredClone(project); project.scenarioBaseline = { capturedAt: project.createdAt, projectId: baseline.id, revision: baseline.revision, project: baseline };
    expect(validateProjectImport(project).valid).toBe(true);
    project.equipmentLibrary[0].boardId = project.boards[0].id;
    expect(validateProjectImport(project).valid).toBe(false);
    delete project.equipmentLibrary[0].boardId; project.scenarioBaseline.revision++;
    expect(validateProjectImport(project).valid).toBe(false);
  });
});
