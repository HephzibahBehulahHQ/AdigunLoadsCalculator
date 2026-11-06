import type { Load, LoadSchedule, ScheduleWindow } from "../domain/types";

export type HourSpan = [number, number];
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
export function validCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value
  );
}
export function explicitInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value)) &&
    validCalendarDate(value.slice(0, 10))
  );
}
export function validateInstantWindows(
  value: unknown,
  label = "Operating windows",
): string[] {
  if (!Array.isArray(value) || value.length > 10000)
    return [`${label} must be an array of at most 10,000 intervals.`];
  const errors: string[] = [];
  for (const item of value)
    if (
      !object(item) ||
      !explicitInstant(item.start) ||
      !explicitInstant(item.end) ||
      Date.parse(item.end) <= Date.parse(item.start)
    )
      errors.push(
        `${label} require increasing timestamps with explicit UTC offsets.`,
      );
  return errors;
}
export function validateSchedule(value: unknown): string[] {
  if (
    !object(value) ||
    !Array.isArray(value.windows) ||
    value.windows.length > 1000
  )
    return ["Schedule requires at most 1,000 operating windows."];
  const errors: string[] = [];
  function windows(rows: unknown[]) {
    const ids = new Set<string>();
    for (const row of rows) {
      if (!object(row)) {
        errors.push("Invalid schedule window.");
        continue;
      }
      if (typeof row.id !== "string" || !row.id || ids.has(row.id))
        errors.push(
          "Schedule window IDs must be nonempty and unique within their list.",
        );
      else ids.add(row.id);
      if (
        !finite(row.startHour) ||
        row.startHour < 0 ||
        row.startHour >= 24 ||
        !finite(row.durationHours) ||
        row.durationHours <= 0 ||
        row.durationHours > 24
      )
        errors.push(
          "Schedule starts must be 0–24 hours and durations greater than 0 through 24 hours.",
        );
      for (const [key, low, high] of [
        ["weekdays", 0, 6],
        ["months", 1, 12],
      ] as const)
        if (
          row[key] !== undefined &&
          (!Array.isArray(row[key]) ||
            !row[key].length ||
            row[key].some((n) => !Number.isInteger(n) || n < low || n > high))
        )
          errors.push(`Invalid schedule ${key}.`);
      for (const key of ["effectiveFrom", "effectiveTo"])
        if (row[key] !== undefined && !validCalendarDate(row[key]))
          errors.push(
            "Schedule effective dates must be actual YYYY-MM-DD dates.",
          );
      if (
        typeof row.effectiveFrom === "string" &&
        typeof row.effectiveTo === "string" &&
        row.effectiveFrom > row.effectiveTo
      )
        errors.push("Schedule effective-date range is reversed.");
    }
  }
  windows(value.windows);
  if (value.exceptions !== undefined) {
    if (!Array.isArray(value.exceptions) || value.exceptions.length > 1000)
      errors.push(
        "Schedule exceptions must be an array of at most 1,000 dates.",
      );
    else {
      const seen = new Set<string>();
      for (const item of value.exceptions) {
        if (
          !object(item) ||
          !validCalendarDate(item.date) ||
          !["closed", "replace"].includes(String(item.mode))
        ) {
          errors.push("Invalid dated schedule exception.");
          continue;
        }
        if (seen.has(item.date))
          errors.push("Only one schedule exception is permitted per date.");
        seen.add(item.date);
        if (
          item.mode === "replace" &&
          (!Array.isArray(item.windows) || item.windows.length > 1000)
        )
          errors.push("Replacement exceptions require an array of windows.");
        if (Array.isArray(item.windows)) windows(item.windows);
      }
    }
  }
  if (value.timedCycle !== undefined) {
    const cycle = value.timedCycle;
    if (
      !object(cycle) ||
      !finite(cycle.onMinutes) ||
      cycle.onMinutes <= 0 ||
      !finite(cycle.offMinutes) ||
      cycle.offMinutes <= 0 ||
      cycle.onMinutes + cycle.offMinutes < 1 ||
      cycle.onMinutes + cycle.offMinutes > 1440 ||
      !finite(cycle.offsetMinutes) ||
      cycle.offsetMinutes < 0 ||
      cycle.offsetMinutes >= 1440
    )
      errors.push(
        "Timed cycles require positive on/off minutes, a 1–1,440 minute period, and a 0–1,440 minute offset.",
      );
  }
  if (value.absoluteWindows !== undefined)
    errors.push(...validateInstantWindows(value.absoluteWindows));
  return errors;
}
export function unionSpans(spans: HourSpan[]): HourSpan[] {
  const sorted = spans
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: HourSpan[] = [];
  for (const [a, b] of sorted) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1] + 1e-12) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return merged;
}
function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
function matching(
  window: ScheduleWindow,
  date?: string,
  weekday?: number,
): boolean {
  return (
    (weekday === undefined ||
      !window.weekdays ||
      window.weekdays.includes(weekday)) &&
    (!date ||
      ((!window.months || window.months.includes(Number(date.slice(5, 7)))) &&
        (!window.effectiveFrom || date >= window.effectiveFrom) &&
        (!window.effectiveTo || date <= window.effectiveTo)))
  );
}

/** Local wall-clock union. A date exception overrides the complete date, including yesterday's carry-in. */
export function resolveSchedule(
  load: Load,
  date?: string,
  weekday?: number,
): HourSpan[] {
  if (date && !validCalendarDate(date))
    throw new Error("A real local calendar date is required.");
  const day = date ? new Date(`${date}T00:00:00Z`).getUTCDay() : weekday;
  const schedule: LoadSchedule = load.schedule ?? {
    windows:
      load.hoursPerDay > 0
        ? [
            {
              id: "daily",
              startHour: load.startHour,
              durationHours: load.hoursPerDay,
              weekdays: load.weekdays,
            },
          ]
        : [],
  };
  if (schedule.absoluteWindows !== undefined) return [];
  const today = date
    ? schedule.exceptions?.find((entry) => entry.date === date)
    : undefined;
  if (today?.mode === "closed") return [];
  let spans: HourSpan[] = [];
  for (const offset of [-1, 0]) {
    if (today && offset === -1) continue;
    const sourceDate = date ? shiftDate(date, offset) : undefined;
    const exception = sourceDate
      ? schedule.exceptions?.find((entry) => entry.date === sourceDate)
      : undefined;
    const windows = exception
      ? exception.mode === "closed"
        ? []
        : (exception.windows ?? [])
      : schedule.windows;
    const sourceWeekday =
      day === undefined ? undefined : (day + offset + 7) % 7;
    for (const window of windows) {
      if (!matching(window, sourceDate, sourceWeekday)) continue;
      const a = Math.max(0, window.startHour + offset * 24);
      const b = Math.min(
        24,
        window.startHour + window.durationHours + offset * 24,
      );
      if (b > a) spans.push([a, b]);
    }
  }
  spans = unionSpans(spans);
  const cycle = schedule.timedCycle;
  if (cycle) {
    const cycles: HourSpan[] = [];
    const period = (cycle.onMinutes + cycle.offMinutes) / 60;
    const offset = cycle.offsetMinutes / 60;
    for (
      let start = offset - Math.ceil(offset / period) * period;
      start < 24;
      start += period
    )
      for (const [a, b] of spans) {
        const left = Math.max(a, start);
        const right = Math.min(b, start + cycle.onMinutes / 60);
        if (right > left) cycles.push([left, right]);
      }
    spans = unionSpans(cycles);
  }
  return spans;
}
export function scheduleDuty(load: Load): number {
  return load.schedule?.timedCycle ? 1 : load.duty;
}
export interface CalendarFields {
  date: string;
  weekday: number;
  month: number;
  hour: number;
  localTime: string;
}
export function makeCalendarClock(
  timezone: string,
): (timestamp: number) => CalendarFields {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "shortOffset",
    hourCycle: "h23",
  });
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return (timestamp) => {
    const p = Object.fromEntries(
      formatter.formatToParts(timestamp).map((part) => [part.type, part.value]),
    );
    return {
      date: `${p.year}-${p.month}-${p.day}`,
      weekday: weekdays[p.weekday],
      month: Number(p.month),
      hour:
        Number(p.hour) +
        Number(p.minute) / 60 +
        Number(p.second) / 3600 +
        (((timestamp % 1000) + 1000) % 1000) / 3600000,
      localTime: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`,
    };
  };
}
export function scheduleFractionAt(
  load: Load,
  timestamp: number,
  fields: CalendarFields,
): number {
  if (load.schedule?.absoluteWindows !== undefined)
    return load.schedule.absoluteWindows.some(
      (w) => timestamp >= Date.parse(w.start) && timestamp < Date.parse(w.end),
    )
      ? scheduleDuty(load)
      : 0;
  return resolveSchedule(load, fields.date, fields.weekday).some(
    ([a, b]) => fields.hour >= a && fields.hour < b,
  )
    ? scheduleDuty(load)
    : 0;
}
