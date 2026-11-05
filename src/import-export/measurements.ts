export interface MeasurementOptions { powerUnit: 'W' | 'kW'; timestampColumn: string; powerColumn: string; intervalMinutes: number }
export interface MeasurementPoint { timestamp: string; epochMs: number; kw: number; kWh: number; row: number }
export interface MeasurementImport {
  points: MeasurementPoint[];
  totalKWh: number | null;
  importKWh: number | null;
  exportKWh: number | null;
  intervalMinutes: number;
  errors: string[];
  warnings: string[];
}

function parseRecords(text: string): string[][] {
  const rows: string[][] = []; let cells: string[] = [], value = '', quoted = false, closed = false;
  const cell = () => { cells.push(value); value = ''; closed = false; };
  const row = () => { cell(); if (cells.some(value => value.trim())) rows.push(cells); cells = []; if (rows.length > 100001) throw new Error('Measurement import is limited to 100,000 data rows.'); };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) { if (char === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; } } else value += char; continue; }
    if (char === ',') { cell(); continue; }
    if (char === '\r' || char === '\n') { if (char === '\r' && text[i + 1] === '\n') i++; row(); continue; }
    if (closed) { if (char === ' ' || char === '\t') continue; throw new Error('Unexpected data after a closing CSV quote.'); }
    if (char === '"') { if (value !== '') throw new Error('Unexpected quotation mark in an unquoted field.'); quoted = true; }
    else value += char;
  }
  if (quoted) throw new Error('Unclosed quoted CSV field.');
  row(); return rows;
}

function parseInstant(timestamp: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(timestamp);
  if (!match) throw new Error('timestamp needs ISO date/time with an explicit Z or ±HH:MM offset; local ambiguous times are not inferred.');
  const [, yy, mm, dd, hh, minute, second = '0', , offset] = match;
  const year = Number(yy), month = Number(mm), day = Number(dd), hour = Number(hh), min = Number(minute), sec = Number(second);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0), days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || min > 59 || sec > 59) throw new Error('timestamp contains an impossible date/time or unsupported leap second.');
  if (offset !== 'Z' && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59)) throw new Error('timestamp has an invalid UTC offset.');
  const instant = Date.parse(timestamp);
  if (!Number.isFinite(instant)) throw new Error('timestamp cannot be resolved to a finite instant.');
  return instant;
}

/** Signed interval-average measurements; timestamps identify each interval START. */
export function parseMeasurementCSV(text: string, options: MeasurementOptions): MeasurementImport {
  const errors: string[] = [], warnings: string[] = [];
  const output: MeasurementImport = { points: [], totalKWh: null, importKWh: null, exportKWh: null, intervalMinutes: options.intervalMinutes, errors, warnings };
  if (typeof text !== 'string' || text.length > 5_000_000 || new TextEncoder().encode(text).byteLength > 5_000_000) { errors.push('Measurement CSV must be text no larger than 5 MB.'); return output; }
  const intervalMs = options.intervalMinutes * 60000;
  if (!['W', 'kW'].includes(options.powerUnit) || !Number.isFinite(intervalMs) || !Number.isInteger(intervalMs) || intervalMs < 1 || intervalMs > 86400000) { errors.push('Choose W or kW and an explicit interval duration between 1 millisecond and 24 hours.'); return output; }
  let records: string[][];
  try { records = parseRecords(text.replace(/^\uFEFF/, '')); } catch (error) { errors.push((error as Error).message); return output; }
  if (records.length < 2) { errors.push('CSV requires a header and at least one measured interval.'); return output; }
  const headers = records[0].map(header => header.trim());
  if (headers.some(header => !header) || new Set(headers).size !== headers.length) { errors.push('CSV column names must be non-empty and unique.'); return output; }
  const timeIndex = headers.indexOf(options.timestampColumn.trim()), powerIndex = headers.indexOf(options.powerColumn.trim());
  if (timeIndex < 0 || powerIndex < 0 || timeIndex === powerIndex) { errors.push('Select two distinct existing columns for timestamp and interval-average power.'); return output; }
  const points: MeasurementPoint[] = [], seen = new Set<number>(); let previous: number | undefined, gaps = 0;
  for (let index = 1; index < records.length; index++) {
    if (errors.length >= 100) { errors.push('Further row errors omitted after the first 100.'); break; }
    try {
      const record = records[index]; if (record.length !== headers.length) throw new Error(`expected ${headers.length} cells, found ${record.length}.`);
      const timestamp = record[timeIndex].trim(), rawPower = record[powerIndex].trim();
      if (!timestamp) throw new Error('timestamp is missing.');
      if (!rawPower) throw new Error('power is missing; missing measurements are not zero.');
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(rawPower)) throw new Error('power must be a finite decimal number, not a formula or unit-bearing text.');
      const power = Number(rawPower), kw = power / (options.powerUnit === 'W' ? 1000 : 1), kWh = kw * options.intervalMinutes / 60;
      if (!Number.isFinite(kw) || !Number.isFinite(kWh)) throw new Error('power/energy exceeds the supported finite range.');
      const epochMs = parseInstant(timestamp);
      if (seen.has(epochMs)) throw new Error('duplicate instant, including differently written offsets for the same UTC time.');
      if (previous !== undefined) {
        const elapsed = epochMs - previous;
        if (elapsed < 0) throw new Error('timestamps are out of chronological order; no automatic sorting is applied.');
        if (elapsed < intervalMs) throw new Error('declared measurement intervals overlap.');
        if (elapsed > intervalMs) { gaps++; if (gaps <= 20) warnings.push(`Row ${index + 1}: ${(elapsed - intervalMs) / 60000} minutes of missing coverage before this interval. No energy is invented for the gap.`); }
      }
      seen.add(epochMs); previous = epochMs; points.push({ timestamp, epochMs, kw: kw === 0 ? 0 : kw, kWh: kWh === 0 ? 0 : kWh, row: index + 1 });
    } catch (error) { errors.push(`Row ${index + 1}: ${(error as Error).message}`); }
  }
  if (errors.length) return output;
  const total = points.reduce((sum, point) => sum + point.kWh, 0), imported = points.reduce((sum, point) => sum + Math.max(0, point.kWh), 0), exported = points.reduce((sum, point) => sum + Math.max(0, -point.kWh), 0);
  if (![total, imported, exported].every(Number.isFinite)) { errors.push('Summed measured energy exceeds the supported numerical range.'); return output; }
  if (gaps) warnings.push(`${gaps} gap(s): totals cover recorded intervals only, not the full calendar span.`);
  warnings.push('Power must represent the average over each declared interval beginning at its timestamp. Instantaneous samples need a separately chosen integration method.');
  warnings.push('Interval averages do not establish instantaneous peaks, inrush or conductor design current.');
  output.points = points; output.totalKWh = total; output.importKWh = imported; output.exportKWh = exported; return output;
}
