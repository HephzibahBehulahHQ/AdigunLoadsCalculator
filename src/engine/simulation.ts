import { ENGINE_VERSION, type BatterySettings, type Issue, type Phase, type Project, type Tariff } from '../domain/types';
import { dailyProfile, normalizeLoad } from './electrical';

export interface RangeOptions { start: string; end: string; intervalMinutes: 15 | 60 }
export interface CalendarPoint {
  timestamp: string; localTime: string; elapsedHours: number; kw: number; kWh: number;
  phaseKW: Record<Phase, number>; importRate: number;
}
export interface CalendarResult { revision: number; engineVersion: string; points: CalendarPoint[]; totalKWh: number; peakKW: number; elapsedHours: number; energyCost: number; issues: Issue[] }
const fail = (message: string): never => { throw new Error(message); };
const finite = (value: number, name: string, min = -Infinity, max = Infinity) => { if (!Number.isFinite(value) || value < min || value > max) fail(`${name} must be finite and between ${min} and ${max}.`); };

export function tariffRate(tariff: Tariff, hour: number, weekday?: number): number {
  const bands = tariff.bands.filter((band) => (!band.weekdays || weekday === undefined || band.weekdays.includes(weekday)) &&
    (band.startHour < band.endHour ? hour >= band.startHour && hour < band.endHour : hour >= band.startHour || hour < band.endHour));
  if (bands.length > 1) fail('Time-of-use tariff bands overlap at the selected interval.');
  return bands[0]?.importRate ?? tariff.importRate;
}

export function validateTariff(tariff: Tariff): Issue[] {
  const issues: Issue[] = [];
  const error = (message: string, id: string) => issues.push({ id, severity: 'error', assessment: 'incomplete', message } as Issue);
  for (const key of ['importRate', 'exportRate', 'standingPerDay', 'demandPerKW', 'taxPercent'] as const) if (!Number.isFinite(tariff[key])) error(`Enter a finite tariff ${key}.`, `tariff-${key}`);
  if (tariff.standingPerDay < 0 || tariff.demandPerKW < 0 || tariff.taxPercent < 0) error('Standing, demand and tax amounts must be nonnegative.', 'tariff-fixed');
  for (const band of tariff.bands) {
    if (!Number.isFinite(band.importRate) || !Number.isFinite(band.startHour) || !Number.isFinite(band.endHour) || band.startHour < 0 || band.startHour >= 24 || band.endHour < 0 || band.endHour > 24 || band.startHour === band.endHour) error(`Tariff band ${band.name} has invalid boundaries or rate.`, `${band.id}-bounds`);
  }
  for (let i = 0; i < tariff.bands.length; i++) for (let j = i + 1; j < tariff.bands.length; j++) {
    const a = tariff.bands[i]; const b = tariff.bands[j];
    const sameDay = [0, 1, 2, 3, 4, 5, 6].some((day) => (!a.weekdays || a.weekdays.includes(day)) && (!b.weekdays || b.weekdays.includes(day)));
    const segments = (start: number, end: number) => start < end ? [[start, end]] : [[start, 24], [0, end]];
    if (sameDay && segments(a.startHour, a.endHour).some(([start, end]) => segments(b.startHour, b.endHour).some(([otherStart, otherEnd]) => Math.min(end, otherEnd) > Math.max(start, otherStart)))) error(`Tariff bands ${a.name} and ${b.name} overlap.`, `tariff-overlap-${a.id}-${b.id}`);
  }
  return issues;
}

/** Converts a finite decimal to integer micro-units using decimal notation, not binary multiplication. */
function scaled(value: number, precision = 6): bigint {
  finite(value, 'Decimal amount');
  const decimal = value.toFixed(precision);
  return BigInt(decimal.replace('.', ''));
}
const roundedDivision = (numerator: bigint, denominator: bigint): bigint => {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return sign * ((absolute + denominator / 2n) / denominator);
};
/** Round half away from zero to currency minor units. Internal energy/price products use 1e-12 currency units. */
export function roundCurrency(value: number, minorDigits = 2): number {
  const micro = scaled(value);
  const divisor = 10n ** BigInt(6 - minorDigits);
  return Number(roundedDivision(micro, divisor)) / 10 ** minorDigits;
}
export function energyCharge(entries: { kWh: number; rate: number }[]): number {
  // Accumulate physical energy per rate at full floating precision, then apply decimal billing once.
  const byRate = new Map<number, number>();
  for (const entry of entries) {
    finite(entry.kWh, 'Billable energy'); finite(entry.rate, 'Energy rate');
    byRate.set(entry.rate, (byRate.get(entry.rate) ?? 0) + entry.kWh);
  }
  const decimal = (value: number): { numerator: bigint; places: number } => {
    const [mantissa, exponent = '0'] = value.toString().toLowerCase().split('e');
    const fraction = mantissa.split('.')[1]?.length ?? 0;
    let numerator = BigInt(mantissa.replace('.', '')); let places = fraction - Number(exponent);
    if (places < 0) { numerator *= 10n ** BigInt(-places); places = 0; }
    return { numerator, places };
  };
  let total = 0n; let places = 2;
  for (const [rate, energy] of byRate) {
    const a = decimal(energy); const b = decimal(rate); const productPlaces = a.places + b.places;
    if (productPlaces > places) { total *= 10n ** BigInt(productPlaces - places); places = productPlaces; }
    total += a.numerator * b.numerator * 10n ** BigInt(places - productPlaces);
  }
  return Number(roundedDivision(total, 10n ** BigInt(places - 2))) / 100;
}

/** Actual elapsed instants; Intl applies the specified IANA timezone including DST folds/gaps. */
export function simulateRange(project: Project, options: RangeOptions): CalendarResult {
  const start = Date.parse(options.start); const end = Date.parse(options.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) fail('Enter an increasing timestamp range.');
  if (start % 60_000 !== 0 || end % 60_000 !== 0) fail('Calendar simulation requires whole-minute boundary timestamps.');
  if (!/(Z|[+-]\d\d:\d\d)$/.test(options.start) || !/(Z|[+-]\d\d:\d\d)$/.test(options.end)) fail('Calendar timestamps require explicit UTC offsets or Z.');
  if (![15, 60].includes(options.intervalMinutes)) fail('Calendar interval must be 15 or 60 minutes.');
  if (end - start > 367 * 24 * 3600_000) fail('A single simulation is limited to 367 elapsed days.');
  if (project.loads.some((load) => !normalizeLoad(load).valid)) fail('Correct invalid load inputs before running a calendar simulation.');
  const tariffIssues = validateTariff(project.tariff);
  if (tariffIssues.length) fail(tariffIssues[0].message);
  const minuteFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: project.timezone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset', hourCycle: 'h23' });
  const weekdayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  // Minute tables preserve fractional operating windows and arbitrary timezone offsets while bounding work.
  const days = Array.from({ length: 7 }, (_, weekday) => dailyProfile(project.loads, 1, weekday));
  const points: CalendarPoint[] = []; const charges: { kWh: number; rate: number }[] = [];
  const step = options.intervalMinutes * 60_000;
  let totalKWh = 0; let peakKW = 0;
  for (let timestamp = start; timestamp < end; timestamp += step) {
    const finish = Math.min(timestamp + step, end); const elapsedHours = (finish - timestamp) / 3600_000;
    let kWh = 0; const phaseEnergy: Record<Phase, number> = { L1: 0, L2: 0, L3: 0 };
    let localTime = ''; let firstRate = project.tariff.importRate;
    // Quarter-hour/hour averages are built from actual elapsed minute slices across DST transitions.
    for (let minute = timestamp; minute < finish; minute += 60_000) {
      const dt = (Math.min(minute + 60_000, finish) - minute) / 3600_000;
      const parts = Object.fromEntries(minuteFormatter.formatToParts(minute).map((part) => [part.type, part.value]));
      const weekday = weekdayIndex[parts.weekday];
      const hour = Number(parts.hour); const minuteOfDay = hour * 60 + Number(parts.minute);
      const sample = days[weekday][minuteOfDay]; const rate = tariffRate(project.tariff, minuteOfDay / 60, weekday);
      const intervalEnergy = sample.kw * dt;
      kWh += intervalEnergy;
      for (const phase of ['L1', 'L2', 'L3'] as Phase[]) phaseEnergy[phase] += sample.phaseKW[phase] * dt;
      charges.push({ kWh: intervalEnergy, rate });
      if (minute === timestamp) { localTime = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${parts.timeZoneName}`; firstRate = rate; }
    }
    const kw = kWh / elapsedHours; totalKWh += kWh; peakKW = Math.max(peakKW, kw);
    points.push({ timestamp: new Date(timestamp).toISOString(), localTime, elapsedHours, kw, kWh, phaseKW: { L1: phaseEnergy.L1 / elapsedHours, L2: phaseEnergy.L2 / elapsedHours, L3: phaseEnergy.L3 / elapsedHours }, importRate: firstRate });
  }
  return { revision: project.revision, engineVersion: ENGINE_VERSION, points, totalKWh, peakKW, elapsedHours: (end - start) / 3600_000, energyCost: energyCharge(charges), issues: [] };
}

export interface BatteryStepInput { storedKWh: number; generationKW: number; loadKW: number; hours: number; battery: BatterySettings; gridAvailable?: boolean; islandCapable?: boolean }
export interface BatteryStep {
  storedKWh: number; importKWh: number; exportKWh: number; chargeKWh: number; dischargeKWh: number;
  lossesKWh: number; unservedKWh: number; curtailedKWh: number; directKWh: number; balanceErrorKWh: number;
}
export function validateBattery(battery: BatterySettings): void {
  finite(battery.capacityKWh, 'Battery capacity', 0);
  finite(battery.minSoc, 'Minimum SOC', 0, 1); finite(battery.maxSoc, 'Maximum SOC', 0, 1);
  finite(battery.initialSoc, 'Initial SOC', battery.minSoc, battery.maxSoc);
  if (battery.minSoc > battery.maxSoc) fail('Minimum SOC cannot exceed maximum SOC.');
  finite(battery.chargeKW, 'Charge limit', 0); finite(battery.dischargeKW, 'Discharge limit', 0);
  finite(battery.chargeEfficiency, 'Charge efficiency', Number.MIN_VALUE, 1); finite(battery.dischargeEfficiency, 'Discharge efficiency', Number.MIN_VALUE, 1);
}

/** AC-coupled self-consumption dispatch. SOC uses nominal DC stored energy; every conversion loss is applied once. */
export function batteryStep(input: BatteryStepInput): BatteryStep {
  const { battery, hours } = input;
  validateBattery(battery); finite(hours, 'Interval hours', Number.MIN_VALUE); finite(input.generationKW, 'Generation', 0); finite(input.loadKW, 'Load', 0);
  const minimum = battery.capacityKWh * battery.minSoc; const maximum = battery.capacityKWh * battery.maxSoc;
  finite(input.storedKWh, 'Stored energy', minimum - 1e-9, maximum + 1e-9);
  const gridAvailable = input.gridAvailable !== false;
  const islandCapable = input.islandCapable ?? battery.islandCapable;
  const unavailableGeneration = !gridAvailable && !islandCapable ? input.generationKW * hours : 0;
  const generation = input.generationKW * hours - unavailableGeneration;
  const demand = input.loadKW * hours;
  const directKWh = Math.min(generation, demand);
  let surplus = generation - directKWh; let deficit = demand - directKWh;
  let storedKWh = Math.min(maximum, Math.max(minimum, input.storedKWh));
  let chargeKWh = 0; let dischargeKWh = 0; let lossesKWh = 0;
  const usableInverter = gridAvailable || islandCapable;
  if (surplus > 0 && usableInverter) {
    chargeKWh = Math.min(surplus, battery.chargeKW * hours, Math.max(0, maximum - storedKWh) / battery.chargeEfficiency);
    storedKWh += chargeKWh * battery.chargeEfficiency;
    lossesKWh = chargeKWh * (1 - battery.chargeEfficiency); surplus -= chargeKWh;
  } else if (deficit > 0 && usableInverter) {
    dischargeKWh = Math.min(deficit, battery.dischargeKW * hours, Math.max(0, storedKWh - minimum) * battery.dischargeEfficiency);
    storedKWh -= dischargeKWh / battery.dischargeEfficiency;
    lossesKWh = dischargeKWh * (1 / battery.dischargeEfficiency - 1); deficit -= dischargeKWh;
  }
  const importKWh = gridAvailable ? deficit : 0; const exportKWh = gridAvailable ? surplus : 0;
  const unservedKWh = gridAvailable ? 0 : deficit;
  const curtailedKWh = (gridAvailable ? 0 : surplus) + unavailableGeneration;
  const balanceErrorKWh = input.generationKW * hours + importKWh + input.storedKWh - (demand - unservedKWh + exportKWh + storedKWh + lossesKWh + curtailedKWh);
  return { storedKWh, importKWh, exportKWh, chargeKWh, dischargeKWh, lossesKWh, unservedKWh, curtailedKWh, directKWh, balanceErrorKWh };
}

export interface EnergyPoint extends BatteryStep { hour: number; loadKW: number; generationKW: number; soc: number; gridAvailable: boolean }
export interface EnergyResult {
  revision: number; points: EnergyPoint[]; loadKWh: number; generationKWh: number; importKWh: number; exportKWh: number;
  chargeKWh: number; dischargeKWh: number; lossesKWh: number; unservedKWh: number; curtailedKWh: number; finalStoredKWh: number;
  energyCharge: number; exportCredit: number; totalCost: number; issues: Issue[]; complete: boolean;
}
export interface EnergyOptions { intervalMinutes?: 15 | 60; generationKW?: number[]; outage?: { startHour: number; durationHours: number } }
export function pvDailyEstimate(project: Project): number {
  finite(project.energy.pvKW, 'PV installed capacity', 0); finite(project.energy.peakSunHours, 'Peak sun hours', 0, 24);
  finite(project.energy.pvPerformanceRatio, 'PV performance ratio', 0, 1);
  return project.energy.pvKW * project.energy.peakSunHours * project.energy.pvPerformanceRatio;
}
export function simulateEnergy(project: Project, options: EnergyOptions = {}): EnergyResult {
  const intervalMinutes = options.intervalMinutes ?? 15; const hours = intervalMinutes / 60;
  const profile = dailyProfile(project.loads, intervalMinutes);
  const battery = project.energy.battery; validateBattery(battery);
  pvDailyEstimate(project); // Validate entered PV assumptions even when chronology has not been supplied.
  const issues: Issue[] = [];
  for (const load of project.loads) if (!normalizeLoad(load).valid) fail('Correct invalid load inputs before running an energy simulation.');
  const tariffIssues = validateTariff(project.tariff);
  if (tariffIssues.length) fail(tariffIssues[0].message);
  let generation = options.generationKW;
  if (!generation && project.energy.pvHourlyProfile) {
    if (project.energy.pvHourlyProfile.length !== 24) fail('PV hourly profile requires exactly 24 normalized values.');
    generation = profile.map((point) => project.energy.pvHourlyProfile![Math.floor(point.hour)] * project.energy.pvKW * project.energy.pvPerformanceRatio);
  }
  if (!generation) {
    generation = profile.map(() => 0);
    if (project.energy.pvKW > 0) issues.push({ id: 'pv-profile', severity: 'warning', assessment: 'incomplete', message: 'Chronological PV generation requires an entered hourly profile. Peak-sun-hours supports the separate daily-energy estimate only.' });
  }
  if (generation.length !== profile.length) fail(`Generation profile must have ${profile.length} interval values.`);
  generation.forEach((value) => finite(value, 'Generation profile value', 0));
  if (options.outage) {
    finite(options.outage.startHour, 'Outage start', 0, 24); finite(options.outage.durationHours, 'Outage duration', 0, 24);
    if (Math.abs(options.outage.startHour / hours - Math.round(options.outage.startHour / hours)) > 1e-9 || Math.abs(options.outage.durationHours / hours - Math.round(options.outage.durationHours / hours)) > 1e-9) fail('Outage start and duration must align with the selected simulation interval.');
  }
  const points: EnergyPoint[] = []; let stored = battery.capacityKWh * battery.initialSoc;
  const totals = { loadKWh: 0, generationKWh: 0, importKWh: 0, exportKWh: 0, chargeKWh: 0, dischargeKWh: 0, lossesKWh: 0, unservedKWh: 0, curtailedKWh: 0 };
  const charges: { kWh: number; rate: number }[] = [];
  for (let i = 0; i < profile.length; i++) {
    const point = profile[i];
    const inOutage = options.outage ? (point.hour - options.outage.startHour + 24) % 24 < options.outage.durationHours : false;
    const step = batteryStep({ storedKWh: stored, generationKW: generation[i], loadKW: point.kw, hours, battery, gridAvailable: !inOutage });
    stored = step.storedKWh;
    points.push({ ...step, hour: point.hour, loadKW: point.kw, generationKW: generation[i], soc: battery.capacityKWh === 0 ? 0 : stored / battery.capacityKWh, gridAvailable: !inOutage });
    totals.loadKWh += point.kWh; totals.generationKWh += generation[i] * hours;
    for (const key of ['importKWh', 'exportKWh', 'chargeKWh', 'dischargeKWh', 'lossesKWh', 'unservedKWh', 'curtailedKWh'] as const) totals[key] += step[key];
    charges.push({ kWh: step.importKWh, rate: tariffRate(project.tariff, point.hour) });
  }
  const energy = energyCharge(charges); const exportCredit = energyCharge([{ kWh: totals.exportKWh, rate: project.tariff.exportRate }]);
  const totalCost = roundCurrency((energy - exportCredit + project.tariff.standingPerDay) * (1 + project.tariff.taxPercent / 100));
  return { revision: project.revision, points, ...totals, finalStoredKWh: stored, energyCharge: energy, exportCredit, totalCost, issues, complete: issues.length === 0 };
}
