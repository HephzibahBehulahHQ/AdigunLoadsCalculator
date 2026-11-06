import {
  ENGINE_VERSION,
  type BatterySettings,
  type Issue,
  type Load,
  type Phase,
  type Project,
} from "../domain/types";
import { dailyProfile, normalizeLoad } from "./electrical";
import { makeCalendarClock, resolveSchedule, scheduleDuty, unionSpans } from "./calendar";
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
  finite(input.storedKWh, "Stored energy", minimum - 1e-9, maximum + 1e-9);
  const gridAvailable = input.gridAvailable !== false;
  const islandCapable = input.islandCapable ?? battery.islandCapable;
  const unavailableGeneration =
    !gridAvailable && !islandCapable ? input.generationKW * hours : 0;
  const generation = input.generationKW * hours - unavailableGeneration;
  const demand = input.loadKW * hours;
  const directKWh = Math.min(generation, demand);
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
  } else if (deficit > 0 && usableInverter) {
    dischargeKWh = Math.min(
      deficit,
      battery.dischargeKW * hours,
      Math.max(0, storedKWh - minimum) * battery.dischargeEfficiency,
    );
    storedKWh -= dischargeKWh / battery.dischargeEfficiency;
    lossesKWh = dischargeKWh * (1 / battery.dischargeEfficiency - 1);
    deficit -= dischargeKWh;
  }
  const importKWh = gridAvailable ? deficit : 0;
  const exportKWh = gridAvailable ? surplus : 0;
  const unservedKWh = gridAvailable ? 0 : deficit;
  const curtailedKWh = (gridAvailable ? 0 : surplus) + unavailableGeneration;
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
  };
}

export interface EnergyPoint extends BatteryStep {
  hour: number;
  loadKW: number;
  generationKW: number;
  soc: number;
  gridAvailable: boolean;
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
}
export interface EnergyOptions {
  intervalMinutes?: 15 | 60;
  generationKW?: number[];
  outage?: { startHour: number; durationHours: number };
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
export function simulateEnergy(
  project: Project,
  options: EnergyOptions = {},
): EnergyResult {
  const intervalMinutes = options.intervalMinutes ?? 15;
  const hours = intervalMinutes / 60;
  const profile = dailyProfile(project.loads, intervalMinutes);
  const battery = project.energy.battery;
  validateBattery(battery);
  pvDailyEstimate(project); // Validate entered PV assumptions even when chronology has not been supplied.
  const issues: Issue[] = [];
  for (const load of project.loads)
    if (!normalizeLoad(load).valid)
      fail("Correct invalid load inputs before running an energy simulation.");
  const tariffIssues = validateTariff(project.tariff);
  if (tariffIssues.length) fail(tariffIssues[0].message);
  let generation = options.generationKW;
  if (!generation && project.energy.pvHourlyProfile) {
    if (project.energy.pvHourlyProfile.length !== 24)
      fail("PV hourly profile requires exactly 24 normalized values.");
    generation = profile.map(
      (point) =>
        project.energy.pvHourlyProfile![Math.floor(point.hour)] *
        project.energy.pvKW *
        project.energy.pvPerformanceRatio,
    );
  }
  if (!generation) {
    generation = profile.map(() => 0);
    if (project.energy.pvKW > 0)
      issues.push({
        id: "pv-profile",
        severity: "warning",
        assessment: "incomplete",
        message:
          "Chronological PV generation requires an entered hourly profile. Peak-sun-hours supports the separate daily-energy estimate only.",
      });
  }
  if (generation.length !== profile.length)
    fail(`Generation profile must have ${profile.length} interval values.`);
  generation.forEach((value) => finite(value, "Generation profile value", 0));
  if (options.outage) {
    finite(options.outage.startHour, "Outage start", 0, 24);
    finite(options.outage.durationHours, "Outage duration", 0, 24);
    if (
      Math.abs(
        options.outage.startHour / hours -
          Math.round(options.outage.startHour / hours),
      ) > 1e-9 ||
      Math.abs(
        options.outage.durationHours / hours -
          Math.round(options.outage.durationHours / hours),
      ) > 1e-9
    )
      fail(
        "Outage start and duration must align with the selected simulation interval.",
      );
  }
  const points: EnergyPoint[] = [];
  let stored = battery.capacityKWh * battery.initialSoc;
  const totals = {
    loadKWh: 0,
    generationKWh: 0,
    importKWh: 0,
    exportKWh: 0,
    chargeKWh: 0,
    dischargeKWh: 0,
    lossesKWh: 0,
    unservedKWh: 0,
    curtailedKWh: 0,
  };
  const charges: { kWh: number; rate: number }[] = [];
  for (let i = 0; i < profile.length; i++) {
    const point = profile[i];
    const inOutage = options.outage
      ? (point.hour - options.outage.startHour + 24) % 24 <
        options.outage.durationHours
      : false;
    const step = batteryStep({
      storedKWh: stored,
      generationKW: generation[i],
      loadKW: point.kw,
      hours,
      battery,
      gridAvailable: !inOutage,
    });
    stored = step.storedKWh;
    points.push({
      ...step,
      hour: point.hour,
      loadKW: point.kw,
      generationKW: generation[i],
      soc: battery.capacityKWh === 0 ? 0 : stored / battery.capacityKWh,
      gridAvailable: !inOutage,
    });
    totals.loadKWh += point.kWh;
    totals.generationKWh += generation[i] * hours;
    for (const key of [
      "importKWh",
      "exportKWh",
      "chargeKWh",
      "dischargeKWh",
      "lossesKWh",
      "unservedKWh",
      "curtailedKWh",
    ] as const)
      totals[key] += step[key];
    charges.push({
      kWh: step.importKWh,
      rate: tariffRate(project.tariff, point.hour),
    });
  }
  const energy = energyCharge(charges);
  const exportCredit = energyCharge([
    { kWh: totals.exportKWh, rate: project.tariff.exportRate },
  ]);
  const totalCost = roundCurrency(
    (energy - exportCredit + project.tariff.standingPerDay) *
      (1 + project.tariff.taxPercent / 100),
  );
  return {
    revision: project.revision,
    points,
    ...totals,
    finalStoredKWh: stored,
    energyCharge: energy,
    exportCredit,
    totalCost,
    issues,
    complete: issues.length === 0,
  };
}
