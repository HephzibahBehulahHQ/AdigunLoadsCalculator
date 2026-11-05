import { createLoad, createProject, validateProjectImport } from '../domain/project';
import type { Project } from '../domain/types';

export const LEGACY_SOURCE_REVISION = '2e4f24e0ccb7fc92a78c7632bc54d7cc13fccf12';
export interface LegacyMigratedProject extends Project {
  /** Inert original text is exported with the new project; it is never executed or merged into state. */
  legacyImport: { format: 'adigun-electrical-load'; version: 1 | 2; sourceRevision: string; originalJson: string; semantics: string[] };
}
export interface LegacyMigrationResult {
  supported: boolean;
  version?: 1 | 2;
  project?: LegacyMigratedProject;
  errors: string[];
  warnings: string[];
  original: unknown;
}
type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const deviceFields = ['name', 'watts', 'powerUnit', 'quantity', 'hoursPerDay', 'dutyCycle', 'standbyW', 'seasonalFactor', 'pf', 'type'];
const settingsFields = ['phase', 'voltage', 'measurementInterval', 'households', 'diversityFactor', 'demandFactor', 'growthMargin', 'tariff', 'co2Factor', 'renewableOffsetKWh', 'solarKWh', 'windKWh', 'batteryKWh', 'gridLimitKW', 'peakThresholdKW', 'occupancySchedule', 'currency'];
const extensionFields = ['resolutionMinutes', 'breakerRatingA', 'gridCurrentLimitA', 'cableLengthM', 'conductorMM2', 'material', 'frequencyHz', 'capacitorConnection', 'pfOld', 'pfNew', 'pfRealKW', 'penaltyRate', 'touEnabled', 'tariffBands', 'monthlyFactors', 'selectedMonth'];

/** Only the actual persisted V1/V2 format is recognized, never a vaguely similar object. */
export function migrateLegacy(input: unknown): LegacyMigrationResult | null {
  let data: unknown = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input); } catch { return null; }
  }
  if (!object(data) || data.format !== 'adigun-electrical-load') return null;
  const errors: string[] = [], warnings: string[] = [];
  const fail = (message: string) => { if (errors.length < 100) errors.push(message); };
  const output: LegacyMigrationResult = { supported: data.version === 1 || data.version === 2, errors, warnings, original: input };
  if (!output.supported) { fail('Unsupported legacy profile version. Supported exported versions are 1 and 2.'); return output; }
  const version = data.version as 1 | 2; output.version = version;
  let originalJson: string;
  try { originalJson = typeof input === 'string' ? input : JSON.stringify(input); } catch { fail('Legacy input must be JSON-serializable.'); return output; }
  if (!originalJson || originalJson.length > 1_000_000) { fail('Legacy profile exceeds its original 1 MB storage-format limit.'); return output; }
  // Detach the original object so later edits cannot change this recovery record.
  output.original = typeof input === 'string' ? input : JSON.parse(originalJson);
  const fields = (value: unknown, names: string[], prefix: string): value is RecordValue => {
    if (!object(value)) { fail(`${prefix}: expected an object.`); return false; }
    for (const key of names) if (!Object.hasOwn(value, key)) fail(`${prefix}: missing persisted field ${key}.`);
    return true;
  };
  const num = (record: RecordValue, key: string, prefix: string, minimum = 0, maximum = Number.MAX_VALUE, whole = false): number => {
    const value = record[key];
    if (!finite(value) || value < minimum || value > maximum || (whole && !Number.isSafeInteger(value))) { fail(`${prefix}.${key}: expected ${whole ? 'a whole' : 'a finite'} number in ${minimum}…${maximum}.`); return 0; }
    return value;
  };
  const window = (value: unknown, prefix: string): { startHour: number; endHour: number } | null => {
    if (value === null) return null;
    if (!fields(value, ['startHour', 'endHour'], prefix)) return null;
    return { startHour: num(value, 'startHour', prefix, 0, 23.999999), endHour: num(value, 'endHour', prefix, 0, 24) };
  };
  if (!fields(data.settings, settingsFields, 'Settings')) return output;
  if (!Array.isArray(data.devices) || data.devices.length > 500) { fail('Devices must be an array of at most 500 persisted records.'); return output; }
  const settings = data.settings;
  if (!['single', 'three'].includes(String(settings.phase))) fail('Settings.phase must be single or three.');
  if (!['second', 'minute'].includes(String(settings.measurementInterval))) fail('Settings.measurementInterval must be second or minute.');
  if (!['EUR', 'NGN', 'USD', 'GBP'].includes(String(settings.currency))) fail('Unsupported legacy currency.');
  const voltage = num(settings, 'voltage', 'Settings', .01, 1e6), households = num(settings, 'households', 'Settings', 0, 1e6, true);
  const demand = num(settings, 'demandFactor', 'Settings', 0, 1), diversity = num(settings, 'diversityFactor', 'Settings', 0, 1), growth = num(settings, 'growthMargin', 'Settings', 0, 10000);
  const tariff = num(settings, 'tariff', 'Settings', 0, 1e6); num(settings, 'co2Factor', 'Settings', 0, 1000);
  for (const key of ['renewableOffsetKWh', 'solarKWh', 'windKWh', 'batteryKWh']) num(settings, key, 'Settings', 0, 1e12);
  for (const key of ['gridLimitKW', 'peakThresholdKW']) if (settings[key] !== null) num(settings, key, 'Settings', 0, 1e12);
  const globalWindow = window(settings.occupancySchedule, 'Settings.occupancySchedule');
  let ext: RecordValue | undefined;
  if (version === 2) {
    if (!fields(data.extensions, extensionFields, 'Extensions')) return output;
    ext = data.extensions;
    for (const key of ['resolutionMinutes', 'frequencyHz', 'conductorMM2']) if (!finite(ext[key])) fail(`Extensions.${key} must be a finite number, without string coercion.`);
    if (![15, 60].includes(Number(ext.resolutionMinutes))) fail('Extensions.resolutionMinutes must be 15 or 60.');
    if (![50, 60].includes(Number(ext.frequencyHz))) fail('Extensions.frequencyHz must be 50 or 60.');
    if (!['copper', 'aluminium'].includes(String(ext.material))) fail('Extensions.material is unsupported.');
    if (!['delta', 'wye'].includes(String(ext.capacitorConnection))) fail('Extensions.capacitorConnection is unsupported.');
    if (![1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300].includes(Number(ext.conductorMM2))) fail('Extensions.conductorMM2 is not supported by the original format.');
    for (const key of ['breakerRatingA', 'gridCurrentLimitA']) if (ext[key] !== null) num(ext, key, 'Extensions', 0, 1e12);
    num(ext, 'cableLengthM', 'Extensions', Number.MIN_VALUE, 1e12);
    const p = num(ext, 'pfRealKW', 'Extensions', 0, 1e12), old = num(ext, 'pfOld', 'Extensions', 0, 1), next = num(ext, 'pfNew', 'Extensions', 0, 1);
    if (p > 0 && (old === 0 || next === 0)) fail('Extensions PF-correction values require positive PF for positive real power.');
    num(ext, 'penaltyRate', 'Extensions', 0, 1e6); num(ext, 'selectedMonth', 'Extensions', 1, 12, true);
    if (typeof ext.touEnabled !== 'boolean') fail('Extensions.touEnabled must be boolean.');
    if (!Array.isArray(ext.monthlyFactors) || ext.monthlyFactors.length !== 12 || ext.monthlyFactors.some(value => !finite(value) || value < 0 || value > 1000)) fail('Extensions.monthlyFactors needs twelve finite values in 0…1000.');
    if (!Array.isArray(ext.tariffBands) || ext.tariffBands.length !== 3) fail('Legacy tariff bands need exactly three named records.');
    else {
      const ids = new Set<string>();
      for (const [index, raw] of ext.tariffBands.entries()) {
        if (!fields(raw, ['id', 'startHour', 'endHour', 'rate'], `Tariff band ${index + 1}`)) continue;
        if (!['peak', 'offPeak', 'standard'].includes(String(raw.id)) || ids.has(String(raw.id))) fail('Legacy tariff band IDs must be unique peak/offPeak/standard.');
        ids.add(String(raw.id));
        const start = num(raw, 'startHour', `Tariff band ${index + 1}`, 0, 23.75), end = num(raw, 'endHour', `Tariff band ${index + 1}`, 0, 24);
        if (!Number.isInteger(start * 4) || !Number.isInteger(end * 4)) fail('Legacy tariff band boundaries must align to quarter hours.');
        num(raw, 'rate', `Tariff band ${index + 1}`, 0, 1e6);
      }
      if (!errors.length) for (let quarter = 0; quarter < 96; quarter++) {
        const hour = quarter / 4;
        const coverage = (ext.tariffBands as RecordValue[]).filter(band => Number(band.startHour) !== Number(band.endHour) && (Number(band.endHour) > Number(band.startHour) ? hour >= Number(band.startHour) && hour < Number(band.endHour) : hour >= Number(band.startHour) || hour < Number(band.endHour))).length;
        if (coverage !== 1) { fail('Legacy tariff bands contain an overlap or gap, including when TOU is disabled.'); break; }
      }
    }
  }
  if (growth > 1000) fail('Legacy growth exceeds PowerLab’s 1000% supported project limit; revise the source assumption before migration.');
  const project = createProject(`Imported calculator V${version} profile`) as LegacyMigratedProject;
  project.currency = String(settings.currency);
  project.context = 'Imported electrical calculator';
  project.supply.voltageLN = settings.phase === 'single' ? voltage : voltage / Math.sqrt(3);
  project.supply.voltageLL = settings.phase === 'three' ? voltage : voltage * Math.sqrt(3);
  project.supply.frequency = ext ? Number(ext.frequencyHz) : 50;
  project.tariff.importRate = tariff;
  project.tariff.source = `Imported legacy flat tariff; source revision ${LEGACY_SOURCE_REVISION}. Verify current applicability.`;
  project.growthPercent = Math.min(growth, 1000);
  project.coincidence = demand === 1 ? diversity : diversity === 1 ? demand : 1;
  warnings.push('Review before applying: nameplate/on-state power is now separate from energy duty; legacy “instantaneous” power was duty-adjusted.');
  warnings.push('Legacy demand/diversity/growth factors no longer scale energy. Growth is design-only; a sole non-unity demand/diversity factor becomes a reviewable design coincidence factor.');
  if (demand !== 1 && diversity !== 1) warnings.push('Both legacy demand and diversity reductions are present. Neither is silently combined: design coincidence starts at 1 until you confirm a non-overlapping criterion.');
  warnings.push('Legacy standby was outside operating hours only. PowerLab also counts standby during the duty-off portion of a scheduled window; energy may differ.');
  warnings.push('Legacy 30/365-day projections and daily renewable netting are historical approximations. No hourly PV/wind, battery dispatch or physical import/export is inferred.');
  warnings.push('Legacy PF uses a sinusoidal displacement interpretation. Verify this basis against nameplate or measured data.');
  if (settings.phase === 'single') warnings.push('Legacy single-phase voltage has no L–N versus L–L connection field. It is provisionally imported as L–N on L1; confirm the physical connection and phase assignment.');
  warnings.push('Legacy files contain no verified board/circuit assignments. Loads start on a new board, without invented cable routes or protective devices.');
  warnings.push('Europe/Berlin timezone, a new board and default supply limit are explicit new-project assumptions unless a positive legacy current limit is available. Verify them before assessment.');
  if (!ext) warnings.push('V1 has no supply-frequency field. The new project’s 50 Hz setting is an explicit assumption to verify.');
  warnings.push('The legacy carbon factor is retained in the original record; provide its geography, date and method before applying a new operational-emissions estimate.');
  if (ext && finite(ext.gridCurrentLimitA) && ext.gridCurrentLimitA > 0) { project.supply.limitA = ext.gridCurrentLimitA; project.boards[0].ratedA = ext.gridCurrentLimitA; }
  if (ext?.touEnabled === true && Array.isArray(ext.tariffBands) && !errors.length) project.tariff.bands = (ext.tariffBands as RecordValue[]).filter(band => band.startHour !== band.endHour).map(band => ({ id: `legacy-tariff-${String(band.id)}`, name: String(band.id), startHour: Number(band.startHour), endHour: Number(band.endHour), importRate: Number(band.rate) }));
  if (ext) warnings.push('Legacy inrush multipliers are retained; starting PF and duration are not inferred. Cable, generic 5% alert, 1.25× breaker candidate, PF-penalty and monthly-factor worksheets remain in the original record and are not upgraded to verified circuit data.');
  for (const [index, raw] of data.devices.entries()) {
    const prefix = `Device ${index + 1}`;
    if (!fields(raw, version === 2 ? [...deviceFields, 'inrushMultiplier', 'operatingWindow'] : deviceFields, prefix)) continue;
    if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 120) fail(`${prefix}: name must contain 1–120 characters.`);
    if (raw.powerUnit !== 'W') fail(`${prefix}: persisted legacy ratings must be canonical W, not an unsaved input unit.`);
    if (!['resistive', 'inductive', 'capacitive'].includes(String(raw.type))) fail(`${prefix}: invalid legacy load type.`);
    const watts = num(raw, 'watts', prefix, 0, 1e15), quantity = num(raw, 'quantity', prefix, 0, 1e6, true), hours = num(raw, 'hoursPerDay', prefix, 0, 24), duty = num(raw, 'dutyCycle', prefix, 0, 100), standby = num(raw, 'standbyW', prefix, 0, 1e12), season = num(raw, 'seasonalFactor', prefix, 0, 1000), pf = num(raw, 'pf', prefix, 0, 1);
    const startWindow = version === 2 ? window(raw.operatingWindow, `${prefix}.operatingWindow`) ?? globalWindow : globalWindow;
    const inrush = version === 2 ? num(raw, 'inrushMultiplier', prefix, 1, 10) : undefined;
    if (pf === 0 && watts * quantity * duty > 0) fail(`${prefix}: legacy positive active power requires positive PF.`);
    if (quantity * households > 1e6) fail(`${prefix}: household-expanded quantity exceeds the new project limit of 1,000,000.`);
    if (quantity === 0 || households === 0) { warnings.push(`${prefix}: zero quantity/households is retained in the original record and omitted from the active load list.`); continue; }
    if (pf === 0 && watts > 0) { fail(`${prefix}: positive nameplate power with PF 0 has no determined on-state current. Supply a valid PF before migration; a zero energy duty cannot resolve it.`); continue; }
    if (season !== 1) warnings.push(`${prefix}: seasonal factor ${season} is retained in the original record but not applied to nameplate power or duty; configure an explicit scenario/profile.`);
    const fullWindow = startWindow && (startWindow.startHour === startWindow.endHour || (startWindow.startHour === 0 && startWindow.endHour === 24));
    const windowHours = startWindow ? fullWindow ? 24 : (startWindow.endHour - startWindow.startHour + 24) % 24 : 0;
    if (startWindow && hours !== windowHours) warnings.push(`${prefix}: legacy preferred-window distribution is represented as a contiguous ${hours}-hour window at the shown start. Review the changed time profile; the original preferred window remains recoverable.`);
    const load = createLoad({ id: `legacy-v${version}-load-${index + 1}`, name: String(raw.name), category: `Legacy ${String(raw.type)}`, quantity: quantity * households, entryMode: watts === 0 && pf === 0 ? 'complex' : 'kw', rating: watts / 1000, reactiveKvar: watts === 0 && pf === 0 ? 0 : undefined, voltage, connection: settings.phase === 'three' ? 'three' : 'single', pf, pfKind: 'displacement', reactive: raw.type === 'capacitive' ? 'leading' : 'lagging', efficiency: 1, phase: 'L1', hoursPerDay: hours, startHour: !startWindow || fullWindow ? 0 : startWindow.startHour, duty: duty / 100, utilization: 1, standbyW: standby, boardId: project.boards[0].id, startingMultiplier: inrush, source: { kind: 'user', reference: `Imported AdigunTokenCalculator V${version} device ${index + 1}; original rating ${watts} W, quantity ${quantity}, households ${households}.` }, notes: `Imported electrical input, not shaft power. Historical seasonal factor: ${season}. Historical source record retained as inert project.legacyImport.originalJson.` });
    project.loads.push(load);
  }
  project.notes = 'Migrated to a new project. Review the import warnings and original profile before using new engineering results. Historical daily renewable/carbon/cable/protection values are not verified modern assessments.';
  project.legacyImport = { format: 'adigun-electrical-load', version, sourceRevision: LEGACY_SOURCE_REVISION, originalJson, semantics: [...warnings] };
  if (!errors.length) {
    const validated = validateProjectImport(project);
    if (validated.valid) output.project = validated.project as LegacyMigratedProject;
    else errors.push(...validated.errors.map(error => `Migrated project: ${error}`).slice(0, 100));
  }
  return output;
}
