import type { DemandRule, Issue, Tariff, TariffBand } from "../domain/types";
import { explicitInstant, makeCalendarClock, validCalendarDate } from "./calendar";
import { energyCharge, roundCurrency } from "./money";

const within = (hour: number, start: number, end: number) => start < end ? hour >= start && hour < end : hour >= start || hour < end;
function matchingBand(band: TariffBand, hour: number, weekday?: number, date?: string) {
  return (!band.weekdays || weekday === undefined || band.weekdays.includes(weekday)) && within(hour, band.startHour, band.endHour) && (!date || ((!band.effectiveFrom || date >= band.effectiveFrom) && (!band.effectiveTo || date <= band.effectiveTo)));
}
export function tariffPrices(tariff: Tariff, hour: number, weekday?: number, date?: string): { importRate: number; exportRate: number } {
  if (!Number.isFinite(hour) || hour < 0 || hour >= 24 || (weekday !== undefined && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) || (date !== undefined && !validCalendarDate(date))) throw new Error("Tariff lookup requires a valid local time/date.");
  const bands = tariff.bands.filter((band) => matchingBand(band, hour, weekday, date));
  if (bands.length > 1) throw new Error(date ? "Time-of-use tariff bands overlap at the selected interval." : "Select a calendar date and weekday to resolve dated/time-of-use tariff bands.");
  if (!bands.length && tariff.coverage === "complete-bands") throw new Error(`Tariff coverage gap at ${date ?? "representative day"} ${hour.toFixed(4)} h; enter a band or choose an explicit base-rate fallback.`);
  return { importRate: bands[0]?.importRate ?? tariff.importRate, exportRate: bands[0]?.exportRate ?? tariff.exportRate };
}
export function tariffRate(tariff: Tariff, hour: number, weekday?: number, date?: string): number { return tariffPrices(tariff, hour, weekday, date).importRate; }

export function validateTariff(tariff: Tariff): Issue[] {
  const issues: Issue[] = [];
  const error = (message: string, id: string) => issues.push({ id, severity: "error", assessment: "incomplete", message });
  for (const key of ["importRate", "exportRate", "standingPerDay", "demandPerKW", "taxPercent"] as const) if (!Number.isFinite(tariff[key])) error(`Enter a finite tariff ${key}.`, `tariff-${key}`);
  if (tariff.standingPerDay < 0 || tariff.demandPerKW < 0 || tariff.taxPercent < 0) error("Standing, demand and tax amounts must be nonnegative.", "tariff-fixed");
  if (!Array.isArray(tariff.bands)) { error("Tariff bands must be an array.", "tariff-bands"); return issues; }
  const ids = new Set<string>();
  for (const band of tariff.bands) {
    if (!band.id || ids.has(band.id)) error("Tariff band IDs must be nonempty and unique.", "tariff-ids");
    ids.add(band.id);
    if (!Number.isFinite(band.importRate) || !Number.isFinite(band.startHour) || !Number.isFinite(band.endHour) || band.startHour < 0 || band.startHour >= 24 || band.endHour < 0 || band.endHour > 24 || band.startHour === band.endHour || (band.exportRate !== undefined && !Number.isFinite(band.exportRate))) error(`Tariff band ${band.name} has invalid boundaries or rate.`, `${band.id}-bounds`);
    if (band.weekdays && (!band.weekdays.length || band.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))) error(`Tariff band ${band.name} has invalid weekdays.`, `${band.id}-days`);
    if ((band.effectiveFrom && !validCalendarDate(band.effectiveFrom)) || (band.effectiveTo && !validCalendarDate(band.effectiveTo)) || (band.effectiveFrom && band.effectiveTo && band.effectiveFrom > band.effectiveTo)) error(`Tariff band ${band.name} has invalid effective dates.`, `${band.id}-dates`);
  }
  const segments = (start: number, end: number): [number, number][] => start < end ? [[start, end]] : [[start, 24], [0, end]];
  for (let i = 0; i < tariff.bands.length; i++) for (let j = i + 1; j < tariff.bands.length; j++) {
    const a = tariff.bands[i], b = tariff.bands[j];
    const from = [a.effectiveFrom ?? "0001-01-01", b.effectiveFrom ?? "0001-01-01"].sort()[1];
    const to = [a.effectiveTo ?? "9999-12-31", b.effectiveTo ?? "9999-12-31"].sort()[0];
    let sameDate = false;
    if (from <= to && validCalendarDate(from) && validCalendarDate(to)) {
      const initial = Date.parse(`${from}T00:00:00Z`);
      for (let day = 0; day < 7 && initial + day * 86400000 <= Date.parse(`${to}T00:00:00Z`); day++) {
        const weekday = new Date(initial + day * 86400000).getUTCDay();
        if ((!a.weekdays || a.weekdays.includes(weekday)) && (!b.weekdays || b.weekdays.includes(weekday))) sameDate = true;
      }
    }
    if (sameDate && segments(a.startHour, a.endHour).some(([start, end]) => segments(b.startHour, b.endHour).some(([otherStart, otherEnd]) => Math.min(end, otherEnd) > Math.max(start, otherStart)))) error(`Tariff bands ${a.name} and ${b.name} overlap.`, `tariff-overlap-${a.id}-${b.id}`);
  }
  const rule = tariff.demandRule;
  if (rule) {
    if (!["aligned", "rolling"].includes(rule.method) || !["range", "calendar-month"].includes(rule.period) || !Number.isInteger(rule.windowMinutes) || rule.windowMinutes < 1 || rule.windowMinutes > 1440 || !Number.isInteger(rule.stepMinutes) || rule.stepMinutes < 1 || rule.stepMinutes > rule.windowMinutes || (rule.alignmentOrigin !== undefined && !explicitInstant(rule.alignmentOrigin))) error("Enter a valid demand averaging window, step, alignment instant and billing period.", "tariff-demand-rule");
    if ((rule.startHour === undefined) !== (rule.endHour === undefined) || (rule.startHour !== undefined && (!Number.isFinite(rule.startHour) || rule.startHour < 0 || rule.startHour >= 24 || !Number.isFinite(rule.endHour) || rule.endHour! < 0 || rule.endHour! > 24 || rule.startHour === rule.endHour)) || (rule.weekdays && (!rule.weekdays.length || rule.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)))) error("Invalid demand-charge time/weekday window.", "tariff-demand-times");
  }
  return issues;
}

export interface BillingInterval { timestamp: string; durationMinutes: number; importKWh: number; exportKWh: number }
export interface IntervalBill {
  start: string;
  end: string;
  importKWh: number;
  exportKWh: number;
  energyCharge: number;
  exportCredit: number;
  standingCharge: number;
  demandCharge: number;
  tax: number;
  total: number;
  standingDays: number;
  demandPeaks: { period: string; kw: number; start: string; end: string }[];
  complete: boolean;
  issues: Issue[];
  method: string;
}

/** Physical import/export stay separate. Coarse interval values never fabricate finer demand peaks. */
export function calculateIntervalBill(tariff: Tariff, intervals: BillingInterval[], options: { timezone: string }): IntervalBill {
  const invalid = validateTariff(tariff);
  if (invalid.length) throw new Error(invalid[0].message);
  if (!intervals.length || intervals.length > 600000) throw new Error("Billing requires a bounded, nonempty interval series.");
  const clock = makeCalendarClock(options.timezone);
  const rows = intervals.map((row) => {
    if (!explicitInstant(row.timestamp) || !Number.isFinite(row.durationMinutes) || row.durationMinutes <= 0 || row.durationMinutes > 1440 || !Number.isFinite(row.importKWh) || row.importKWh < 0 || !Number.isFinite(row.exportKWh) || row.exportKWh < 0) throw new Error("Billing intervals require explicit instants, positive durations and separate nonnegative import/export energy.");
    return { ...row, a: Date.parse(row.timestamp), b: Date.parse(row.timestamp) + row.durationMinutes * 60000 };
  });
  for (let i = 1; i < rows.length; i++) if (Math.abs(rows[i].a - rows[i - 1].b) > 0.001) throw new Error("Billing intervals must be ordered, contiguous and nonoverlapping. Missing data cannot be billed as zero.");
  const first = rows[0].a, last = rows[rows.length - 1].b;
  if (last - first > 367 * 86400000) throw new Error("Billing is limited to 367 elapsed days per calculation.");
  const energyEntries: { kWh: number; rate: number }[] = [], exportEntries: { kWh: number; rate: number }[] = [];
  const dates = new Set<string>();
  const issues: Issue[] = [];
  let coarseRateSplit = false;
  for (const row of rows) {
    let priorRate: string | undefined;
    for (let t = row.a; t < row.b;) {
      const finish = Math.min(row.b, Math.floor(t / 60000 + 1) * 60000);
      const fields = clock(t);
      const rate = tariffPrices(tariff, fields.hour, fields.weekday, fields.date);
      const key = `${rate.importRate}/${rate.exportRate}`;
      if (priorRate !== undefined && priorRate !== key) coarseRateSplit = true;
      priorRate = key;
      const share = (finish - t) / (row.b - row.a);
      energyEntries.push({ kWh: row.importKWh * share, rate: rate.importRate });
      exportEntries.push({ kWh: row.exportKWh * share, rate: rate.exportRate });
      dates.add(fields.date); t = finish;
    }
  }
  if (coarseRateSplit) issues.push({ id: "bill-rate-resolution", severity: "warning", assessment: "warning", message: "Some input intervals cross tariff changes. Their energy is allocated uniformly within the supplied interval; finer measured peaks or subinterval behavior are not inferred." });
  const demandPeaks: IntervalBill["demandPeaks"] = [];
  const rule: DemandRule = tariff.demandRule ?? { method: "aligned", windowMinutes: 15, stepMinutes: 15, period: "range" };
  const eligible = (timestamp: number) => {
    const f = clock(timestamp);
    return (!rule.weekdays || rule.weekdays.includes(f.weekday)) && (rule.startHour === undefined || within(f.hour, rule.startHour, rule.endHour!));
  };
  let complete = true;
  if (tariff.demandPerKW > 0) {
    const resolution = Math.max(...rows.map((row) => row.durationMinutes));
    if (resolution > rule.windowMinutes + 1e-9) {
      complete = false;
      issues.push({ id: "demand-resolution", severity: "warning", assessment: "incomplete", message: `Input resolution (${resolution} minutes) is coarser than the ${rule.windowMinutes}-minute demand window. Demand charge is incomplete; no finer peak is invented.` });
    } else {
      const ends = rows.map((row) => row.b);
      const cumulative = [0];
      for (const row of rows) cumulative.push(cumulative[cumulative.length - 1] + row.importKWh);
      const energyAt = (time: number): number => {
        if (time <= first) return 0;
        if (time >= last) return cumulative[cumulative.length - 1];
        let lo = 0, hi = ends.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (ends[mid] < time) lo = mid + 1; else hi = mid; }
        const row = rows[lo];
        return cumulative[lo] + row.importKWh * Math.max(0, Math.min(1, (time - row.a) / (row.b - row.a)));
      };
      const width = rule.windowMinutes * 60000;
      const step = (rule.method === "aligned" ? rule.windowMinutes : rule.stepMinutes) * 60000;
      const origin = rule.alignmentOrigin ? Date.parse(rule.alignmentOrigin) : 0;
      const firstWindow = rule.method === "aligned" ? origin + Math.ceil((first - origin) / step) * step : first;
      const peaks = new Map<string, { period: string; kw: number; start: string; end: string }>();
      let any = false;
      for (let t = firstWindow; t + width <= last + 0.001; t += step) {
        const end = t + width;
        const period = rule.period === "calendar-month" ? clock(t).date.slice(0, 7) : "selected period";
        if (rule.period === "calendar-month" && clock(end - 1).date.slice(0, 7) !== period) continue;
        let allowed = true;
        if (rule.weekdays || rule.startHour !== undefined) for (let sample = t; sample < end; sample = Math.min(end, Math.floor(sample / 60000 + 1) * 60000)) if (!eligible(sample)) { allowed = false; break; }
        if (!allowed) continue;
        any = true;
        const kw = (energyAt(end) - energyAt(t)) / (rule.windowMinutes / 60);
        if (!peaks.has(period) || kw > peaks.get(period)!.kw) peaks.set(period, { period, kw, start: new Date(t).toISOString(), end: new Date(end).toISOString() });
      }
      demandPeaks.push(...peaks.values());
      if (!any) { complete = false; issues.push({ id: "demand-no-full-window", severity: "warning", assessment: "incomplete", message: "No complete eligible demand window lies in the supplied billing period." }); }
      if (resolution > rule.stepMinutes && rule.method === "rolling") issues.push({ id: "rolling-resolution", severity: "info", assessment: "warning", message: "Rolling demand uses uniform average power within each supplied interval. Use finer measured data to assess within-interval variation." });
    }
  }
  const importKWh = rows.reduce((sum, row) => sum + row.importKWh, 0), exportKWh = rows.reduce((sum, row) => sum + row.exportKWh, 0);
  const energy = energyCharge(energyEntries), exportCredit = energyCharge(exportEntries);
  const standingDays = tariff.standingBasis === "local-calendar-days" ? dates.size : (last - first) / 86400000;
  const standingCharge = energyCharge([{ kWh: standingDays, rate: tariff.standingPerDay }]);
  const demandCharge = energyCharge(demandPeaks.map((peak) => ({ kWh: peak.kw, rate: tariff.demandPerKW })));
  const taxable = energy + standingCharge + demandCharge - (tariff.taxBasis === "imports-and-fixed" ? 0 : exportCredit);
  const tax = roundCurrency(taxable * tariff.taxPercent / 100);
  return { start: new Date(first).toISOString(), end: new Date(last).toISOString(), importKWh, exportKWh, energyCharge: energy, exportCredit, standingCharge, demandCharge, tax, total: roundCurrency(energy - exportCredit + standingCharge + demandCharge + tax), standingDays, demandPeaks, complete, issues, method: `${rule.method} ${rule.windowMinutes}-minute demand; ${rule.period}; ${tariff.standingBasis ?? "elapsed-24h"} standing charges; ${tariff.taxBasis ?? "net"} tax basis; each billing line rounded half away from zero to two decimals.` };
}
