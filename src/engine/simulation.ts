import {
  ENGINE_VERSION,
  type BatterySettings,
  type Issue,
  type Load,
  type Phase,
  type Project,
} from "../domain/types";
import { dailyProfile, normalizeLoad } from "./electrical";
import { explicitInstant, makeCalendarClock, resolveSchedule, scheduleDuty, unionSpans, validCalendarDate } from "./calendar";
import { normalizedPhasePower, startEventLoad } from "./start-events";
import { validateProjectExtensions } from "../domain/project";
import { energyCharge, roundCurrency } from "./money";
import { calculateIntervalBill, tariffRate, validateTariff, type BillingInterval, type IntervalBill } from "./tariffs";
export { tariffRate, validateTariff, tariffPrices, calculateIntervalBill } from "./tariffs";
export { energyCharge, roundCurrency } from "./money";

export interface RangeOptions {
  start: string;
  end: string;
  intervalMinutes: 15 | 60;
  /** Detailed standing/demand/tax bill is opt-in; energy cost is always calculated. */
  includeBilling?: boolean;
}
export interface CalendarPoint {
  timestamp: string;
  localTime: string;
  elapsedHours: number;
  kw: number;
  kWh: number;
  phaseKW: Record<Phase, number>;
  importRate: number;
  cumulativeKWh: number;
  startEventIds: string[];
}
export interface CalendarResult {
  revision: number;
  engineVersion: string;
  points: CalendarPoint[];
  totalKWh: number;
  peakKW: number;
  elapsedHours: number;
  energyCost: number;
  bill?: IntervalBill;
  issues: Issue[];
}
const fail = (message: string): never => {
  throw new Error(message);
};
const finite = (
  value: number,
  name: string,
  min = -Infinity,
  max = Infinity,
) => {
  if (!Number.isFinite(value) || value < min || value > max)
    fail(`${name} must be finite and between ${min} and ${max}.`);
};

/** Actual elapsed instants; Intl applies the specified IANA timezone including DST folds/gaps. */
export function simulateRange(
  project: Project,
  options: RangeOptions,
): CalendarResult {
  const start = Date.parse(options.start);
  const end = Date.parse(options.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    fail("Enter an increasing timestamp range.");
  if (start % 60_000 !== 0 || end % 60_000 !== 0)
    fail("Calendar simulation requires whole-minute boundary timestamps.");
  if (
    !/(Z|[+-]\d\d:\d\d)$/.test(options.start) ||
    !/(Z|[+-]\d\d:\d\d)$/.test(options.end)
  )
    fail("Calendar timestamps require explicit UTC offsets or Z.");
  if (![15, 60].includes(options.intervalMinutes))
    fail("Calendar interval must be 15 or 60 minutes.");
  if (end - start > 367 * 24 * 3600_000)
    fail("A single simulation is limited to 367 elapsed days.");
  if (project.loads.some((load) => !normalizeLoad(load).valid))
    fail("Correct invalid load inputs before running a calendar simulation.");
  const tariffIssues = validateTariff(project.tariff);
  if (tariffIssues.length) fail(tariffIssues[0].message);
  const extensionErrors = validateProjectExtensions(project as unknown as Record<string, unknown>);
  if (extensionErrors.length) fail(extensionErrors[0]);
  const clock = makeCalendarClock(project.timezone);
  const normalizedInputs = new Map(project.loads.map((load) => [load.id, normalizeLoad(load)]));
  const calendarDependent = project.loads.some((load) => load.schedule?.exceptions?.length || load.schedule?.windows.some((window) => window.months || window.effectiveFrom || window.effectiveTo));
  // Minute tables preserve fractional operating windows and arbitrary timezone offsets while bounding work.
  const days = Array.from({ length: 7 }, (_, weekday) =>
    dailyProfile(project.loads, 1, weekday, undefined, normalizedInputs),
  );
  let cachedDate = "";
  let datedProfile = days[0];
  const absolute = project.loads.flatMap((load) => unionSpans((load.schedule?.absoluteWindows ?? []).map((window) => [Date.parse(window.start), Date.parse(window.end)])).map(([a, b]) => ({ a, b, load, normalized: normalizedInputs.get(load.id)! })) ).sort((a, b) => a.a - b.a);
  const starts = (project.startEvents ?? []).map((event) => {
    const load = project.loads.find((item) => item.id === event.loadId)!;
    const n = normalizedInputs.get(load.id)!;
    const starting = startEventLoad(load, event, n);
    return { a: Date.parse(event.start), b: Date.parse(event.start) + event.durationSeconds * 1000, load, normalized: n, event, starting: normalizeLoad(starting), phase: normalizedPhasePower(starting, normalizeLoad(starting)) };
  }).sort((a, b) => a.a - b.a);
  let absoluteIndex = 0, startIndex = 0;
  let activeAbsolute: typeof absolute = [], activeStarts: typeof starts = [];
  const phasePowers = new Map(project.loads.map((load) => [load.id, normalizedPhasePower(load, normalizedInputs.get(load.id)!)]));
  const standbyPhase = (load: Load): Record<Phase, number> => normalizedPhasePower({ ...load, entryMode: "kw", pf: 1, pfKind: "displacement", reactive: "lagging", rating: load.standbyW / 1000, utilization: 1 }, normalizeLoad({ ...load, entryMode: "kw", pf: 1, pfKind: "displacement", reactive: "lagging", rating: load.standbyW / 1000, utilization: 1 }));
  const standbyPhases = new Map([...new Set([...absolute.map((row) => row.load), ...starts.map((row) => row.load)])].map((load) => [load.id, standbyPhase(load)]));
  const points: CalendarPoint[] = [];
  const charges: { kWh: number; rate: number }[] = [];
  const billing: BillingInterval[] = [];
  const step = options.intervalMinutes * 60_000;
  let totalKWh = 0;
  let peakKW = 0;
  for (let timestamp = start; timestamp < end; timestamp += step) {
    const finish = Math.min(timestamp + step, end);
    const elapsedHours = (finish - timestamp) / 3600_000;
    let kWh = 0;
    const phaseEnergy: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
    let localTime = "";
    let firstRate = project.tariff.importRate;
    const eventIds = new Set<string>();
    // Quarter-hour/hour averages are built from actual elapsed minute slices across DST transitions.
    for (let minute = timestamp; minute < finish; minute += 60_000) {
      const dt = (Math.min(minute + 60_000, finish) - minute) / 3600_000;
      const fields = clock(minute);
      const { weekday, date } = fields;
      const minuteOfDay = Math.floor(fields.hour * 60 + 1e-7);
      if (calendarDependent && cachedDate !== date) { datedProfile = dailyProfile(project.loads, 1, weekday, date, normalizedInputs); cachedDate = date; }
      const sample = (calendarDependent ? datedProfile : days[weekday])[minuteOfDay];
      const rate = !project.tariff.bands.length && project.tariff.coverage !== "complete-bands" ? project.tariff.importRate : tariffRate(project.tariff, fields.hour, weekday, date);
      let intervalEnergy = sample.kw * dt;
      const localPhaseEnergy = { L1: sample.phaseKW.L1 * dt, L2: sample.phaseKW.L2 * dt, L3: sample.phaseKW.L3 * dt };
      const minuteEnd = Math.min(minute + 60000, finish);
      while (absoluteIndex < absolute.length && absolute[absoluteIndex].a < minuteEnd) activeAbsolute.push(absolute[absoluteIndex++]);
      activeAbsolute = activeAbsolute.filter((row) => row.b > minute);
      for (const row of activeAbsolute) {
        const duration = Math.max(0, Math.min(minuteEnd, row.b) - Math.max(minute, row.a)) / 3600000 * scheduleDuty(row.load);
        intervalEnergy += (row.normalized.operatingKW - row.load.standbyW * row.load.quantity / 1000) * duration;
        for (const phase of ["L1", "L2", "L3"] as Phase[]) localPhaseEnergy[phase] += (phasePowers.get(row.load.id)![phase] - standbyPhases.get(row.load.id)![phase]) * duration;
      }
      while (startIndex < starts.length && starts[startIndex].a < minuteEnd) activeStarts.push(starts[startIndex++]);
      activeStarts = activeStarts.filter((row) => row.b > minute);
      for (const row of activeStarts) {
        const a = Math.max(minute, row.a), b = Math.min(minuteEnd, row.b), duration = Math.max(0, b - a) / 3600000;
        if (!duration) continue;
        eventIds.add(row.event.id);
        const intervals = row.load.schedule?.absoluteWindows !== undefined ? unionSpans(row.load.schedule.absoluteWindows.map((window) => [Date.parse(window.start), Date.parse(window.end)])) : resolveSchedule(row.load, date, weekday).map(([left, right]): [number, number] => [minute + (left - fields.hour) * 3600000, minute + (right - fields.hour) * 3600000]);
        const onHours = intervals.reduce((sum, [left, right]) => sum + Math.max(0, Math.min(b, right) - Math.max(a, left)) / 3600000, 0) * scheduleDuty(row.load);
        const standbyKW = row.load.standbyW * row.load.quantity / 1000;
        intervalEnergy += row.starting.operatingKW * duration - standbyKW * duration - (row.normalized.operatingKW - standbyKW) * onHours;
        for (const phase of ["L1", "L2", "L3"] as Phase[]) localPhaseEnergy[phase] += row.phase[phase] * duration - standbyPhases.get(row.load.id)![phase] * duration - (phasePowers.get(row.load.id)![phase] - standbyPhases.get(row.load.id)![phase]) * onHours;
      }
      kWh += intervalEnergy;
      for (const phase of ["L1", "L2", "L3"] as Phase[])
        phaseEnergy[phase] += localPhaseEnergy[phase];
      charges.push({ kWh: intervalEnergy, rate });
      if (options.includeBilling) billing.push({ timestamp: new Date(minute).toISOString(), durationMinutes: dt * 60, importKWh: Math.max(0, intervalEnergy), exportKWh: 0 });
      if (minute === timestamp) {
        localTime = fields.localTime;
        firstRate = rate;
      }
    }
    const kw = kWh / elapsedHours;
    totalKWh += kWh;
    peakKW = Math.max(peakKW, kw);
    points.push({
      timestamp: new Date(timestamp).toISOString(),
      localTime,
      elapsedHours,
      kw,
      kWh,
      phaseKW: {
        L1: phaseEnergy.L1 / elapsedHours,
        L2: phaseEnergy.L2 / elapsedHours,
        L3: phaseEnergy.L3 / elapsedHours,
      },
      importRate: firstRate,
      cumulativeKWh: totalKWh,
      startEventIds: [...eventIds],
    });
  }
  return {
    revision: project.revision,
    engineVersion: ENGINE_VERSION,
    points,
    totalKWh,
    peakKW,
    elapsedHours: (end - start) / 3600_000,
    energyCost: energyCharge(charges),
    bill: options.includeBilling ? calculateIntervalBill(project.tariff, billing, { timezone: project.timezone }) : undefined,
    issues: [{ id: "calendar-meter-boundary", severity: "info", assessment: "warning", message: "This calendar models scheduled consumption at a grid-supplied load boundary. Renewable/storage import/export flows use the separate chronological dispatch model. Calendar peaks are interval averages; use start analysis for event peaks." }],
  };
}

export interface BatteryStepInput {
  storedKWh: number;
  generationKW: number;
  loadKW: number;
  hours: number;
  battery: BatterySettings;
  gridAvailable?: boolean;
  islandCapable?: boolean;
  minimumStoredKWh?: number;
  dischargeLimitKW?: number;
  gridChargeKW?: number;
  gridChargeTargetKWh?: number;
  importLimitKW?: number;
  exportLimitKW?: number;
  islandOutputLimitKW?: number;
}
export interface BatteryStep {
  storedKWh: number;
  importKWh: number;
  exportKWh: number;
  chargeKWh: number;
  dischargeKWh: number;
  lossesKWh: number;
  unservedKWh: number;
  curtailedKWh: number;
  directKWh: number;
  balanceErrorKWh: number;
  gridChargeKWh: number;
}
export function validateBattery(battery: BatterySettings): void {
  finite(battery.capacityKWh, "Battery capacity", 0);
  finite(battery.minSoc, "Minimum SOC", 0, 1);
  finite(battery.maxSoc, "Maximum SOC", 0, 1);
  finite(battery.initialSoc, "Initial SOC", battery.minSoc, battery.maxSoc);
  if (battery.minSoc > battery.maxSoc)
    fail("Minimum SOC cannot exceed maximum SOC.");
  finite(battery.chargeKW, "Charge limit", 0);
  finite(battery.dischargeKW, "Discharge limit", 0);
  finite(battery.chargeEfficiency, "Charge efficiency", Number.MIN_VALUE, 1);
  finite(
    battery.dischargeEfficiency,
    "Discharge efficiency",
    Number.MIN_VALUE,
    1,
  );
}

/** AC-coupled self-consumption dispatch. SOC uses nominal DC stored energy; every conversion loss is applied once. */
export function batteryStep(input: BatteryStepInput): BatteryStep {
  const { battery, hours } = input;
  validateBattery(battery);
  finite(hours, "Interval hours", Number.MIN_VALUE);
  finite(input.generationKW, "Generation", 0);
  finite(input.loadKW, "Load", 0);
  const minimum = battery.capacityKWh * battery.minSoc;
  const maximum = battery.capacityKWh * battery.maxSoc;
  for (const key of ["minimumStoredKWh", "dischargeLimitKW", "gridChargeKW", "gridChargeTargetKWh", "importLimitKW", "exportLimitKW", "islandOutputLimitKW"] as const) if (input[key] !== undefined) finite(input[key]!, key, 0);
  const dischargeFloor = Math.max(minimum, input.minimumStoredKWh ?? minimum);
  if (dischargeFloor > maximum) fail("Battery reserve cannot exceed the upper stored-energy bound.");
  finite(input.storedKWh, "Stored energy", minimum - 1e-9, maximum + 1e-9);
  const gridAvailable = input.gridAvailable !== false;
  const islandCapable = input.islandCapable ?? battery.islandCapable;
  const unavailableGeneration =
    !gridAvailable && !islandCapable ? input.generationKW * hours : 0;
  const generation = input.generationKW * hours - unavailableGeneration;
  const demand = input.loadKW * hours;
  const outputEnergy = gridAvailable ? Infinity : (input.islandOutputLimitKW ?? Infinity) * hours;
  const directKWh = Math.min(generation, demand, outputEnergy);
  let surplus = generation - directKWh;
  let deficit = demand - directKWh;
  let storedKWh = Math.min(maximum, Math.max(minimum, input.storedKWh));
  let chargeKWh = 0;
  let dischargeKWh = 0;
  let lossesKWh = 0;
  const usableInverter = gridAvailable || islandCapable;
  if (surplus > 0 && usableInverter) {
    chargeKWh = Math.min(
      surplus,
      battery.chargeKW * hours,
      Math.max(0, maximum - storedKWh) / battery.chargeEfficiency,
    );
    storedKWh += chargeKWh * battery.chargeEfficiency;
    lossesKWh = chargeKWh * (1 - battery.chargeEfficiency);
    surplus -= chargeKWh;
  } else if (deficit > 0 && usableInverter && !(gridAvailable && (input.gridChargeKW ?? 0) > 0)) {
    dischargeKWh = Math.min(
      deficit,
      battery.dischargeKW * hours,
      (input.dischargeLimitKW ?? Infinity) * hours,
      Math.max(0, outputEnergy - directKWh),
      Math.max(0, storedKWh - dischargeFloor) * battery.dischargeEfficiency,
    );
    storedKWh -= dischargeKWh / battery.dischargeEfficiency;
    lossesKWh = dischargeKWh * (1 / battery.dischargeEfficiency - 1);
    deficit -= dischargeKWh;
  }
  let importKWh = gridAvailable ? Math.min(deficit, (input.importLimitKW ?? Infinity) * hours) : 0;
  const unservedKWh = Math.max(0, deficit - importKWh);
  let gridChargeKWh = 0;
  if (gridAvailable && dischargeKWh === 0 && (input.gridChargeKW ?? 0) > 0) {
    gridChargeKWh = Math.min(input.gridChargeKW! * hours, Math.max(0, battery.chargeKW * hours - chargeKWh), Math.max(0, Math.min(maximum, input.gridChargeTargetKWh ?? maximum) - storedKWh) / battery.chargeEfficiency, Math.max(0, (input.importLimitKW ?? Infinity) * hours - importKWh));
    importKWh += gridChargeKWh; chargeKWh += gridChargeKWh; storedKWh += gridChargeKWh * battery.chargeEfficiency; lossesKWh += gridChargeKWh * (1 - battery.chargeEfficiency);
  }
  const exportKWh = gridAvailable ? Math.min(surplus, (input.exportLimitKW ?? Infinity) * hours) : 0;
  const curtailedKWh = surplus - exportKWh + unavailableGeneration;
  const balanceErrorKWh =
    input.generationKW * hours +
    importKWh +
    input.storedKWh -
    (demand - unservedKWh + exportKWh + storedKWh + lossesKWh + curtailedKWh);
  return {
    storedKWh,
    importKWh,
    exportKWh,
    chargeKWh,
    dischargeKWh,
    lossesKWh,
    unservedKWh,
    curtailedKWh,
    directKWh,
    balanceErrorKWh,
    gridChargeKWh,
  };
}

export interface EnergyPoint extends BatteryStep {
  hour: number;
  loadKW: number;
  generationKW: number;
  soc: number;
  gridAvailable: boolean;
  timestamp?: string;
  durationHours: number;
  shedKWh: number;
  criticalUnservedKWh: number;
  servedLoadIds?: string[];
  unservedLoadIds?: string[];
}
export interface EnergyResult {
  revision: number;
  points: EnergyPoint[];
  loadKWh: number;
  generationKWh: number;
  importKWh: number;
  exportKWh: number;
  chargeKWh: number;
  dischargeKWh: number;
  lossesKWh: number;
  unservedKWh: number;
  curtailedKWh: number;
  finalStoredKWh: number;
  energyCharge: number;
  exportCredit: number;
  totalCost: number;
  issues: Issue[];
  complete: boolean;
  gridChargeKWh: number;
  shedKWh: number;
  criticalUnservedKWh: number;
  bill?: IntervalBill;
  method: string;
}
export interface EnergyOptions {
  intervalMinutes?: 15 | 60;
  generationKW?: number[];
  outage?: { startHour: number; durationHours: number };
  date?: string;
  range?: { start: string; end: string };
  outageRange?: { start: string; end: string };
}
export function pvDailyEstimate(project: Project): number {
  finite(project.energy.pvKW, "PV installed capacity", 0);
  finite(project.energy.peakSunHours, "Peak sun hours", 0, 24);
  finite(project.energy.pvPerformanceRatio, "PV performance ratio", 0, 1);
  return (
    project.energy.pvKW *
    project.energy.peakSunHours *
    project.energy.pvPerformanceRatio
  );
}
export function simulateEnergy(project: Project, options: EnergyOptions = {}): EnergyResult {
  const intervalMinutes = options.intervalMinutes ?? 15;
  if (![15, 60].includes(intervalMinutes)) fail("Energy interval must be 15 or 60 minutes.");
  if (options.date !== undefined && !validCalendarDate(options.date)) fail("Dispatch date must be an actual YYYY-MM-DD date.");
  const extensionErrors = validateProjectExtensions(project as unknown as Record<string, unknown>);
  if (extensionErrors.length) fail(extensionErrors[0]);
  const tariffIssues = validateTariff(project.tariff);
  if (tariffIssues.length) fail(tariffIssues[0].message);
  const battery = project.energy.battery;
  validateBattery(battery); pvDailyEstimate(project);
  const clock = makeCalendarClock(project.timezone);
  const normalized = new Map(project.loads.map((load) => [load.id, normalizeLoad(load)]));
  if ([...normalized.values()].some((load) => !load.valid)) fail("Correct invalid load inputs before running an energy simulation.");
  const date = options.date ?? project.createdAt.slice(0, 10);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const calendar = options.range ? simulateRange(project, { ...options.range, intervalMinutes }) : undefined;
  const profile = calendar ? calendar.points.map((point) => ({ hour: clock(Date.parse(point.timestamp)).hour, kw: point.kw, kWh: point.kWh, hours: point.elapsedHours, timestamp: point.timestamp })) : dailyProfile(project.loads, intervalMinutes, options.date ? weekday : undefined, options.date).map((point) => ({ ...point, hours: intervalMinutes / 60, timestamp: undefined as string | undefined }));
  const issues: Issue[] = [];
  const issue = (id: string, message: string, assessment: Issue["assessment"] = "warning") => { if (!issues.some((row) => row.id === id)) issues.push({ id, message, assessment, severity: "warning" }); };
  if (!options.range && (project.startEvents?.length || project.loads.some((load) => load.schedule?.absoluteWindows))) issue("dispatch-calendar-required", "The representative day excludes absolute operating windows and dated start events. Select an actual calendar range to include them.", "incomplete");
  if (!options.generationKW && project.energy.pvKW > 0 && !project.energy.pvHourlyProfile) issue("pv-profile", "Chronological PV generation requires an entered hourly profile. Peak-sun-hours supports only the separate daily-energy estimate.", "incomplete");
  if (options.generationKW && options.generationKW.length !== profile.length) fail(`Generation profile must have ${profile.length} interval values.`);
  if (options.generationKW) options.generationKW.forEach((value) => finite(value, "Entered AC generation", 0));
  if (project.energy.pvHourlyProfile && (project.energy.pvHourlyProfile.length !== 24 || project.energy.pvHourlyProfile.some((value) => !Number.isFinite(value) || value < 0 || value > 1))) fail("PV profile requires 24 finite normalized values from 0 to 1.");
  if (project.energy.windHourlyKW?.some((value) => value > 0) && !project.energy.windSource?.trim()) issue("wind-source", "Record the supplied wind profile's source, period and AC output basis.", "incomplete");
  if (options.outageRange && (!options.range || !explicitInstant(options.outageRange.start) || !explicitInstant(options.outageRange.end) || Date.parse(options.outageRange.end) <= Date.parse(options.outageRange.start))) fail("An absolute outage needs an actual calendar range and increasing explicit-offset instants.");
  if (options.outage) {
    finite(options.outage.startHour, "Outage start", 0, 24); finite(options.outage.durationHours, "Outage duration", 0, 24);
    if (Math.abs(options.outage.startHour * 60 / intervalMinutes - Math.round(options.outage.startHour * 60 / intervalMinutes)) > 1e-9 || Math.abs(options.outage.durationHours * 60 / intervalMinutes - Math.round(options.outage.durationHours * 60 / intervalMinutes)) > 1e-9) fail("Daily outage boundaries must align with the simulation interval.");
    if (options.range) fail("Use explicit outage timestamps with an actual calendar range.");
  }
  if (options.outageRange && options.range) for (const value of [options.outageRange.start, options.outageRange.end]) if ((Date.parse(value) - Date.parse(options.range.start)) % (intervalMinutes * 60000) !== 0) fail("Absolute outage boundaries must align with the selected simulation interval.");
  const dispatch = project.energy.dispatch;
  if (dispatch && (dispatch.reserveSoc < battery.minSoc || dispatch.reserveSoc > battery.maxSoc)) fail("Reserve SOC must lie within the entered absolute battery operating bounds.");
  if (dispatch?.strategy === "peak-shaving" && dispatch.peakLimitKW === undefined) fail("Enter a grid-import peak-shaving target.");
  const backup = project.energy.backup;
  const source = project.sources?.find((row) => row.id === backup?.sourceId);
  const outageRequested = Boolean(options.outage || options.outageRange);
  if (outageRequested && !backup && battery.islandCapable) issue("backup-evidence", "Legacy island-capable flag is an entered conditional model only. Configure an evidenced grid-forming source, transfer/isolation, phase capacity and restart settings before treating backup availability as established.", "incomplete");
  const sourceReady = Boolean(source && source.source.reference.trim() && source.islandCapable && source.gridForming && source.transferIsolationVerified && (!backup?.requireBlackStart || source.blackStart));
  if (outageRequested && backup && !sourceReady) issue("backup-source", "Backup is unavailable without an evidenced compatible island-capable, grid-forming source and transfer/isolation arrangement, plus required black-start capability.", "incomplete");
  const boardMap = new Map(project.boards.map((board) => [board.id, board]));
  const sourceServes = (load: Load) => {
    if (!source) return false;
    const voltageCompatible = source.connection === "dc" ? load.connection === "dc" && Math.abs(load.voltage - source.voltageV) < 0.01 : load.connection !== "dc" && (source.connection === "three" ? Math.abs(source.voltageV - project.supply.voltageLL) < 0.01 : load.connection === "single" && load.phase === source.phase && Math.abs(load.voltage - source.voltageV) < 0.01);
    if (!voltageCompatible) return false;
    if (!source.boardId) return true;
    let id = project.circuits.find((row) => row.id === load.circuitId)?.boardId ?? load.boardId;
    const seen = new Set<string>();
    while (id && !seen.has(id)) { if (id === source.boardId) return true; seen.add(id); id = boardMap.get(id)?.parentId; }
    return false;
  };
  const loadEnergy = (load: Load, point: (typeof profile)[number], index: number): number => {
    if (!point.timestamp) return dailyProfile([load], intervalMinutes, options.date ? weekday : undefined, options.date, normalized)[index].kWh;
    const a = Date.parse(point.timestamp), b = a + point.hours * 3600000;
    const n = normalized.get(load.id)!;
    const standby = load.standbyW * load.quantity / 1000;
    let energy = 0;
    const absolute = load.schedule?.absoluteWindows !== undefined ? unionSpans(load.schedule.absoluteWindows.map((window) => [Date.parse(window.start), Date.parse(window.end)])) : undefined;
    for (let t = a; t < b;) {
      const finish = Math.min(b, Math.floor(t / 60000 + 1) * 60000), fields = clock(t);
      const spans = absolute ?? resolveSchedule(load, fields.date, fields.weekday).map(([left, right]): [number, number] => [t + (left - fields.hour) * 3600000, t + (right - fields.hour) * 3600000]);
      const on = (left: number, right: number) => spans.reduce((sum, [begin, end]) => sum + Math.max(0, Math.min(right, end) - Math.max(left, begin)) / 3600000, 0) * scheduleDuty(load);
      energy += standby * (finish - t) / 3600000 + (n.operatingKW - standby) * on(t, finish);
      for (const event of project.startEvents ?? []) if (event.loadId === load.id) {
        const left = Math.max(t, Date.parse(event.start)), right = Math.min(finish, Date.parse(event.start) + event.durationSeconds * 1000);
        if (right > left) energy += (normalizeLoad(startEventLoad(load, event, n)).operatingKW - standby) * (right - left) / 3600000 - (n.operatingKW - standby) * on(left, right);
      }
      t = finish;
    }
    return energy;
  };
  const points: EnergyPoint[] = [];
  let stored = battery.capacityKWh * battery.initialSoc;
  const totals = { loadKWh: 0, generationKWh: 0, importKWh: 0, exportKWh: 0, chargeKWh: 0, dischargeKWh: 0, lossesKWh: 0, unservedKWh: 0, curtailedKWh: 0, gridChargeKWh: 0, shedKWh: 0, criticalUnservedKWh: 0 };
  const billRows: BillingInterval[] = [];
  for (let index = 0; index < profile.length; index++) {
    const point = profile[index], hours = point.hours;
    const timestamp = point.timestamp ? Date.parse(point.timestamp) : undefined;
    const inOutage = options.outageRange ? timestamp! >= Date.parse(options.outageRange.start) && timestamp! < Date.parse(options.outageRange.end) : options.outage ? (point.hour - options.outage.startHour + 24) % 24 < options.outage.durationHours : false;
    const elapsedOutageMinutes = !inOutage ? 0 : options.outageRange ? (timestamp! - Date.parse(options.outageRange.start)) / 60000 : (point.hour - options.outage!.startHour + 24) % 24 * 60;
    const islandReady = backup ? sourceReady && elapsedOutageMinutes >= Math.max(backup.restartDelayMinutes, (source?.restartSeconds ?? 0) / 60) : battery.islandCapable;
    const hour = Math.floor(point.hour) % 24;
    const rawPV = options.generationKW ? 0 : (project.energy.pvHourlyProfile?.[hour] ?? 0) * project.energy.pvKW * project.energy.pvPerformanceRatio;
    const pv = Math.min(rawPV, project.energy.inverterACLimitKW ?? Infinity);
    const rawGeneration = options.generationKW?.[index] ?? rawPV + (project.energy.windHourlyKW?.[hour] ?? 0);
    const generation = options.generationKW?.[index] ?? pv + (project.energy.windHourlyKW?.[hour] ?? 0);
    const clippedKWh = (rawGeneration - generation) * hours;
    const reserve = dispatch && dispatch.strategy !== "self-consumption" && !inOutage ? battery.capacityKWh * dispatch.reserveSoc : battery.capacityKWh * battery.minSoc;
    const windows = dispatch?.gridChargeWindows.filter((window) => window.startHour < window.endHour ? point.hour >= window.startHour && point.hour < window.endHour : point.hour >= window.startHour || point.hour < window.endHour) ?? [];
    if (windows.length > 1) fail("Grid-charge windows overlap; enter one target for each interval.");
    if (windows.some((window) => window.targetSoc < battery.minSoc || window.targetSoc > battery.maxSoc)) fail("Grid-charge target must lie within battery operating SOC bounds.");
    const gridChargeKW = !inOutage && dispatch?.allowGridCharge && windows[0] ? Math.max(0, battery.capacityKWh * windows[0].targetSoc - stored) / (battery.chargeEfficiency * hours) : 0;
    let loadKW = point.kw, shedKWh = 0, criticalUnservedKWh = 0;
    let servedLoadIds: string[] | undefined, unservedLoadIds: string[] | undefined;
    if (inOutage && backup) {
      servedLoadIds = []; unservedLoadIds = []; loadKW = 0;
      const remainingA: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
      const sourceKW = source ? source.continuousKW * source.derating : 0;
      const sourceKVA = source ? source.continuousKVA * source.derating : 0;
      const phaseLimit = source ? sourceKVA * 1000 / ((source.connection === "three" ? Math.sqrt(3) : 1) * source.voltageV) : 0;
      const availableKW = islandReady ? Math.min(sourceKW, generation + Math.min(battery.dischargeKW, Math.max(0, stored - battery.capacityKWh * battery.minSoc) * battery.dischargeEfficiency / hours)) : 0;
      let runningKW = 0, runningKVA = 0;
      const order = [...project.loads].sort((a, b) => {
        const ai = backup.priorityLoadIds.indexOf(a.id), bi = backup.priorityLoadIds.indexOf(b.id);
        return (ai < 0 ? 100000 : ai) - (bi < 0 ? 100000 : bi) || Number(b.critical) - Number(a.critical) || a.id.localeCompare(b.id);
      });
      for (const load of order) {
        const energy = loadEnergy(load, point, index), kw = energy / hours;
        if (energy <= 1e-12) continue;
        const n = normalized.get(load.id)!;
        const standbyKW = load.standbyW * load.quantity / 1000;
        const active = kw > standbyKW + 1e-9;
        let onKW = active ? n.operatingKW : standbyKW, onKVA = active ? n.apparentKVA : standbyKW;
        let current = active ? n.currentA : standbyKW * 1000 / ((load.connection === "three" ? Math.sqrt(3) : 1) * load.voltage);
        if (timestamp !== undefined) for (const event of project.startEvents ?? []) if (event.loadId === load.id && Date.parse(event.start) < timestamp + hours * 3600000 && Date.parse(event.start) + event.durationSeconds * 1000 > timestamp) {
          const starting = normalizeLoad(startEventLoad(load, event, n)); onKW = Math.max(onKW, starting.operatingKW); onKVA = Math.max(onKVA, starting.apparentKVA); current = Math.max(current, starting.currentA);
        }
        const phases: Phase[] = load.connection === "three" ? ["L1", "L2", "L3"] : load.connection === "line-line" ? load.phasePair! : load.connection === "single" ? [load.phase] : [];
        const allowed = islandReady && sourceServes(load) && (!backup.criticalOnly || load.critical) && loadKW + kw <= availableKW + 1e-9 && runningKW + onKW <= sourceKW + 1e-9 && runningKVA + onKVA <= sourceKVA + 1e-9 && phases.every((phase) => remainingA[phase] + current <= phaseLimit + 1e-9);
        if (allowed) { servedLoadIds.push(load.id); loadKW += kw; runningKW += onKW; runningKVA += onKVA; for (const phase of phases) remainingA[phase] += current; }
        else { unservedLoadIds.push(load.id); shedKWh += energy; if (load.critical) criticalUnservedKWh += energy; }
      }
      if (Math.abs(loadKW * hours + shedKWh - point.kWh) > 1e-7) fail("Per-load backup allocation does not reconcile with the common calendar energy boundary.");
    }
    const dischargeLimitKW = !inOutage && dispatch?.strategy === "peak-shaving" ? Math.max(0, loadKW - generation - dispatch.peakLimitKW!) : undefined;
    const step = batteryStep({ storedKWh: stored, generationKW: generation, loadKW, hours, battery, gridAvailable: !inOutage, islandCapable: islandReady, minimumStoredKWh: reserve, dischargeLimitKW, gridChargeKW, gridChargeTargetKWh: windows[0] ? battery.capacityKWh * windows[0].targetSoc : undefined, importLimitKW: project.energy.gridImportLimitKW, exportLimitKW: project.energy.gridExportLimitKW, islandOutputLimitKW: source && backup ? source.continuousKW * source.derating : undefined });
    stored = step.storedKWh;
    step.curtailedKWh += clippedKWh; step.unservedKWh += shedKWh;
    if (!inOutage && step.unservedKWh > 1e-9) issue("grid-import-limit", "Entered grid-import constraints leave unserved demand. Critical-load attribution is applied only to configured outage shedding.", "failed");
    if (!inOutage && dispatch?.strategy === "peak-shaving" && step.importKWh / hours > dispatch.peakLimitKW! + 1e-8) issue("peak-target", "The requested grid-import peak target cannot be maintained at every interval within entered storage power/energy/reserve limits.", "failed");
    const balance = rawGeneration * hours + step.importKWh + (points.length ? points[points.length - 1].storedKWh : battery.capacityKWh * battery.initialSoc) - ((point.kWh - step.unservedKWh) + step.exportKWh + stored + step.lossesKWh + step.curtailedKWh);
    step.balanceErrorKWh = balance;
    if (Math.abs(balance) > 1e-7) fail("Energy dispatch conservation failed; result was not accepted.");
    points.push({ ...step, hour: point.hour, timestamp: point.timestamp, durationHours: hours, loadKW: point.kw, generationKW: rawGeneration, soc: battery.capacityKWh === 0 ? 0 : stored / battery.capacityKWh, gridAvailable: !inOutage, shedKWh, criticalUnservedKWh, servedLoadIds, unservedLoadIds });
    totals.loadKWh += point.kWh; totals.generationKWh += rawGeneration * hours;
    for (const key of ["importKWh", "exportKWh", "chargeKWh", "dischargeKWh", "lossesKWh", "unservedKWh", "curtailedKWh", "gridChargeKWh"] as const) totals[key] += step[key];
    totals.shedKWh += shedKWh; totals.criticalUnservedKWh += criticalUnservedKWh;
    billRows.push({ timestamp: point.timestamp ?? new Date(Date.parse(`${date}T00:00:00Z`) + point.hour * 3600000).toISOString(), durationMinutes: hours * 60, importKWh: step.importKWh, exportKWh: step.exportKWh });
  }
  const billTariff = options.range ? project.tariff : { ...project.tariff, demandPerKW: 0, standingBasis: "elapsed-24h" as const };
  const bill = calculateIntervalBill(billTariff, billRows, { timezone: options.range ? project.timezone : "UTC" });
  issues.push(...bill.issues);
  if (!options.range && project.tariff.demandPerKW > 0) issue("dispatch-demand-period", "This representative-day cost excludes the billing-period demand charge. Select an actual calendar period for aligned/rolling demand billing.", "incomplete");
  return { revision: project.revision, points, ...totals, finalStoredKWh: stored, energyCharge: bill.energyCharge, exportCredit: bill.exportCredit, totalCost: bill.total, bill, issues, complete: issues.every((row) => row.assessment !== "incomplete" && row.assessment !== "unsupported" && row.assessment !== "failed"), method: options.range ? "Actual elapsed calendar AC energy dispatch. Supplied PV/wind profiles repeat by local hour; no weather is retrieved. Grid energy, storage conversions, curtailment and served/unserved demand reconcile at each step. Backup selection uses conservative per-load power/phase limits and entered source/transfer/restart evidence." : "Representative 24-hour AC energy dispatch, distinct from an actual DST calendar day. Battery capacity/SOC are stored DC energy; charging/discharging/grid energy are AC. Optional explicit dispatch, reserve and whole-load priority shedding use entered limits; no physical control is performed." };
}
