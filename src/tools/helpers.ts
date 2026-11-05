import type { EngineeringTool, ToolInput, ToolResult, ToolValues } from './types';

export const SQRT3 = Math.sqrt(3);
export const GUIDE = 'https://www.electrical-installation.org/enwiki/';
export const numberInput = (key: string, label: string, unit = '', min?: number, max?: number, required = true): ToolInput => ({ key, label, unit, min, max, required, type: 'number', step: 'any' });
export const textInput = (key: string, label: string, hint = '', required = true): ToolInput => ({ key, label, hint, required, type: 'text' });
export const selectInput = (key: string, label: string, options: Array<[string, string]>, value?: string): ToolInput => ({ key, label, type: 'select', options: options.map(([value, label]) => ({ value, label })), default: value ?? options[0][0] });
export const connectionInput = () => selectInput('connection', 'Supply connection', [['single', 'Single phase'], ['three', 'Balanced three phase']], 'three');
export const sourceInput = (key = 'source', label = 'Source / document / conditions') => textInput(key, label, 'Enter the actual datasheet, table or design criterion and its conditions.', false);
export const row = (label: string, value: number | string, unit = '') => ({ label, value, unit });
export function n(v: ToolValues, key: string, min = -Infinity, max = Infinity): number {
  const raw = v[key];
  if (raw === undefined || (typeof raw === 'string' && raw.trim() === '')) throw new Error(`Enter ${key}.`);
  const result = Number(raw);
  if (!Number.isFinite(result)) throw new Error(`${key} must be a finite number.`);
  if (result < min || result > max) throw new Error(`${key} must be between ${min} and ${max}.`);
  return result;
}
export function positive(v: ToolValues, key: string): number {
  const value = n(v, key, 0);
  if (value === 0) throw new Error(`${key} must be greater than zero.`);
  return value;
}
export function fraction(v: ToolValues, key: string): number {
  const value = n(v, key, 0, 1);
  if (value === 0) throw new Error(`${key} must be greater than zero and at most 1.`);
  return value;
}
export function integer(v: ToolValues, key: string, min = 1, max = 10000): number {
  const value = n(v, key, min, max);
  if (!Number.isInteger(value)) throw new Error(`${key} must be a whole number.`);
  return value;
}
export function list(v: ToolValues, key: string, min = -Infinity, allowEmpty = false): number[] {
  const raw = String(v[key] ?? '').trim();
  if (!raw) { if (allowEmpty) return []; throw new Error(`Enter ${key}.`); }
  if (/(^|[,;])\s*([,;]|$)/.test(raw)) throw new Error(`${key} contains an empty value. Enter an explicit zero if intended.`);
  const items = raw.split(/[\s,;]+/);
  if (items.length > 4096) throw new Error(`${key} is limited to 4,096 values per worksheet.`);
  return items.map((item, i) => {
    const value = Number(item);
    if (!Number.isFinite(value) || value < min) throw new Error(`${key}: value ${i + 1} must be finite and at least ${min}.`);
    return value;
  });
}
export function expand(values: number[], count: number, label: string): number[] {
  if (values.length === 1) return Array(count).fill(values[0]);
  if (values.length !== count) throw new Error(`${label} needs one value or exactly ${count} values.`);
  return values;
}
export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
export const factor = (v: ToolValues) => v.connection === 'three' ? SQRT3 : 1;
export const signedQ = (p: number, pf: number, leading = false) => (leading ? -1 : 1) * p * Math.sqrt(Math.max(0, 1 - pf * pf)) / pf;
export const outcome = (condition: boolean, criterion = 'entered criterion') => condition ? `Meets ${criterion}` : `Exceeds / fails ${criterion}`;
export function result(values: ToolResult['values'], formula: string, notes: string[] = [], warnings: string[] = [], sources: string[] = []): ToolResult {
  return { values, formula, notes, warnings, sources, status: 'calculated' };
}
export function evidence(output: ToolResult, v: ToolValues, keys: string[] = ['source']): ToolResult {
  const missing = keys.filter(key => !String(v[key] ?? '').trim());
  if (missing.length) {
    output.status = 'incomplete';
    output.warnings.push(`Assessment incomplete: enter ${missing.join(', ')}. Numerical results use unverified entered values.`);
  } else {
    output.notes.push(`User-entered evidence: ${keys.map(key => `${key}: ${v[key]}`).join(' | ')}`);
    output.notes.push('A source reference records provenance; this application has not independently validated its applicability.');
  }
  return output;
}
export function defineTool(tool: EngineeringTool): EngineeringTool {
  const calculate = tool.calculate;
  return {
    ...tool,
    calculate(v) {
      const filled = { ...v };
      for (const input of tool.inputs) {
        if ((filled[input.key] === undefined || filled[input.key] === '') && input.default !== undefined) filled[input.key] = input.default;
        const raw = filled[input.key];
        const missing = raw === undefined || String(raw).trim() === '';
        if (missing) {
          if (input.required !== false) throw new Error(`Enter ${input.label}.`);
          continue;
        }
        if (input.type === 'number') n(filled, input.key, input.min ?? -Infinity, input.max ?? Infinity);
        if (input.type === 'select' && !input.options?.some(option => option.value === String(raw))) throw new Error(`Choose a supported ${input.label}.`);
      }
      const output = calculate(filled);
      if (output.values.some(entry => typeof entry.value === 'number' && !Number.isFinite(entry.value))) throw new Error('The selected values exceed the supported numerical range.');
      if (output.series?.some(entry => Object.values(entry).some(value => typeof value === 'number' && !Number.isFinite(value)))) throw new Error('The profile exceeds the supported numerical range.');
      return output;
    }
  };
}
