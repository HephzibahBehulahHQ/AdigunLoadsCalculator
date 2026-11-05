import { SCHEMA_VERSION, type Board, type Circuit, type Load, type Project } from './types';

export function newId(prefix = 'id'): string { return `${prefix}-${crypto.randomUUID()}`; }

export function createLoad(overrides: Partial<Load> = {}): Load {
  return {
    id: newId('load'), name: '', category: 'General', quantity: 1,
    entryMode: 'kw', rating: 1, voltage: 230, connection: 'single', pf: 1,
    pfKind: 'displacement', reactive: 'lagging', efficiency: 0.9, phase: 'L1',
    hoursPerDay: 8, startHour: 8, duty: 1, utilization: 1, standbyW: 0,
    critical: false, locked: false, source: { kind: 'user', reference: 'User-entered input; verify against equipment data.' },
    notes: '', ...overrides,
  };
}

export function createBoard(overrides: Partial<Board> = {}): Board {
  return { id: newId('board'), name: 'Main board', ratedA: 63, ways: 12, ...overrides };
}

export function createCircuit(boardId: string, overrides: Partial<Circuit> = {}): Circuit {
  return { id: newId('circuit'), name: 'New circuit', boardId, phase: 'L1', locked: false, ...overrides };
}

export function createProject(name = 'Untitled project', timestamp = new Date().toISOString()): Project {
  return {
    schemaVersion: SCHEMA_VERSION, id: newId('project'), name, revision: 1,
    createdAt: timestamp, updatedAt: timestamp, context: 'Residential',
    timezone: 'Europe/Berlin', currency: 'EUR', jurisdiction: 'User-entered design criteria',
    supply: { voltageLN: 230, voltageLL: 400, frequency: 50, limitA: 63 },
    coincidence: 1, growthPercent: 0, loads: [], boards: [createBoard()], circuits: [],
    tariff: { importRate: 0.3, exportRate: 0, standingPerDay: 0, demandPerKW: 0, taxPercent: 0, bands: [], source: 'Editable planning assumption; not a retrieved tariff.' },
    energy: {
      pvKW: 0, peakSunHours: 4, pvPerformanceRatio: 0.8,
      battery: { capacityKWh: 0, initialSoc: 0.5, minSoc: 0.2, maxSoc: 0.95, chargeKW: 0, dischargeKW: 0, chargeEfficiency: 0.95, dischargeEfficiency: 0.95, islandCapable: false },
      source: 'User-entered planning assumptions; no weather service connected.',
    },
    evSessions: [],
    billing: {
      seller: { name: '', address: '', email: '' }, customer: { name: '', address: '', email: '' },
      reference: '', issueDate: timestamp.slice(0, 10), dueDate: '', taxPercent: 0,
      discountPercent: 0, lines: [], notes: '',
    },
    notes: '',
  };
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 100000;
const uniqueIds = (rows: unknown[], name: string, errors: string[]) => {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!record(row) || typeof row.id !== 'string' || !row.id || row.id.length > 200) { errors.push(`${name}: every record needs a valid ID.`); continue; }
    if (seen.has(row.id)) errors.push(`${name}: duplicate ID ${row.id}.`);
    seen.add(row.id);
  }
};

/** Validate an entire candidate before the UI replaces any working state. No coercion. */
export function validateProjectImport(input: unknown): { valid: boolean; project?: Project; errors: string[] } {
  const errors: string[] = [];
  let candidate: unknown = input;
  if (typeof input === 'string') {
    if (input.length > 10_000_000) return { valid: false, errors: ['Project exceeds the 10 MB import limit.'] };
    try { candidate = JSON.parse(input); } catch { return { valid: false, errors: ['Invalid JSON. The working project has not been changed.'] }; }
  }
  if (!record(candidate)) return { valid: false, errors: ['Expected a project object.'] };
  const inspect = (value: unknown, depth: number): void => {
    if (depth > 30) { errors.push('Project nesting exceeds the supported limit.'); return; }
    if (typeof value === 'number' && !Number.isFinite(value)) errors.push('Non-finite numbers are not allowed in project data.');
    if (Array.isArray(value)) { if (value.length > 10000) errors.push('An imported array exceeds 10,000 items.'); else value.forEach((item) => inspect(item, depth + 1)); }
    else if (record(value)) for (const [key, item] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) errors.push('Unsafe object keys are not accepted.');
      else inspect(item, depth + 1);
    }
  };
  inspect(candidate, 0);
  if (candidate.schemaVersion !== SCHEMA_VERSION) errors.push('Unsupported project schema version.');
  for (const key of ['id', 'name', 'createdAt', 'updatedAt', 'context', 'timezone', 'currency', 'jurisdiction', 'notes']) if (!text(candidate[key])) errors.push(`Missing or invalid ${key}.`);
  if (typeof candidate.name === 'string' && candidate.name.length > 240) errors.push('Project name is too long.');
  if (!finite(candidate.revision) || !Number.isInteger(candidate.revision) || candidate.revision < 1) errors.push('Invalid project revision.');
  for (const key of ['createdAt', 'updatedAt']) if (typeof candidate[key] === 'string' && !Number.isFinite(Date.parse(candidate[key]))) errors.push(`Invalid ${key} timestamp.`);
  if (typeof candidate.timezone === 'string') { try { new Intl.DateTimeFormat('en', { timeZone: candidate.timezone }); } catch { errors.push('Invalid IANA timezone.'); } }
  if (typeof candidate.currency === 'string' && !/^[A-Z]{3}$/.test(candidate.currency)) errors.push('Currency must be a three-letter code.');
  if (!finite(candidate.coincidence) || candidate.coincidence < 0 || candidate.coincidence > 1) errors.push('Coincidence must be between 0 and 1.');
  if (!finite(candidate.growthPercent) || candidate.growthPercent < 0 || candidate.growthPercent > 1000) errors.push('Growth allowance must be between 0 and 1000%.');
  if (candidate.scenarioOf !== undefined && (!text(candidate.scenarioOf) || !candidate.scenarioOf)) errors.push('Invalid scenario baseline reference.');
  if (candidate.baselineRevision !== undefined && (!finite(candidate.baselineRevision) || !Number.isInteger(candidate.baselineRevision) || candidate.baselineRevision < 1)) errors.push('Invalid scenario baseline revision.');
  if (!record(candidate.supply)) errors.push('Missing supply settings.');
  else for (const key of ['voltageLN', 'voltageLL', 'frequency', 'limitA']) if (!finite(candidate.supply[key]) || candidate.supply[key] <= 0) errors.push(`Supply ${key} must be positive.`);
  for (const key of ['loads', 'boards', 'circuits', 'evSessions']) {
    if (!Array.isArray(candidate[key]) || candidate[key].length > 10000) errors.push(`${key} must be an array of at most 10,000 records.`);
    else uniqueIds(candidate[key], key, errors);
  }
  if (Array.isArray(candidate.loads)) candidate.loads.forEach((load, index) => {
    if (!record(load)) return;
    const prefix = `Load ${index + 1}`;
    if (!text(load.name) || !text(load.category) || !text(load.notes)) errors.push(`${prefix}: invalid text fields.`);
    if (!['kw', 'kva', 'amps', 'motor', 'complex'].includes(String(load.entryMode))) errors.push(`${prefix}: unsupported entry mode.`);
    if (!['single', 'three', 'line-line', 'dc'].includes(String(load.connection))) errors.push(`${prefix}: unsupported connection.`);
    if (!['L1', 'L2', 'L3'].includes(String(load.phase))) errors.push(`${prefix}: invalid phase.`);
    if (!['leading', 'lagging'].includes(String(load.reactive))) errors.push(`${prefix}: invalid reactive direction.`);
    for (const field of ['quantity', 'rating', 'voltage', 'pf', 'efficiency', 'hoursPerDay', 'startHour', 'duty', 'utilization', 'standbyW']) if (!finite(load[field])) errors.push(`${prefix}: ${field} must be finite.`);
    if (finite(load.quantity) && (!Number.isInteger(load.quantity) || load.quantity < 1 || load.quantity > 1000000)) errors.push(`${prefix}: quantity must be a positive integer.`);
    if (finite(load.rating) && load.rating < 0) errors.push(`${prefix}: negative appliance ratings are not supported.`);
    if (finite(load.voltage) && load.voltage <= 0) errors.push(`${prefix}: voltage must be positive.`);
    if (finite(load.pf) && (load.pf <= 0 || load.pf > 1) && load.entryMode !== 'complex') errors.push(`${prefix}: PF must be greater than 0 and at most 1.`);
    if (finite(load.efficiency) && (load.efficiency <= 0 || load.efficiency > 1)) errors.push(`${prefix}: efficiency must be greater than 0 and at most 1.`);
    for (const field of ['duty', 'utilization']) if (finite(load[field]) && (load[field] < 0 || load[field] > 1)) errors.push(`${prefix}: ${field} must be between 0 and 1.`);
    if (finite(load.hoursPerDay) && (load.hoursPerDay < 0 || load.hoursPerDay > 24)) errors.push(`${prefix}: operating hours must be between 0 and 24.`);
    if (finite(load.startHour) && (load.startHour < 0 || load.startHour >= 24)) errors.push(`${prefix}: start hour must be between 0 and less than 24.`);
    if (finite(load.standbyW) && load.standbyW < 0) errors.push(`${prefix}: standby power must be nonnegative.`);
    if (typeof load.critical !== 'boolean' || typeof load.locked !== 'boolean') errors.push(`${prefix}: critical/locked flags must be boolean.`);
    if (!record(load.source) || !text(load.source.reference) || !['nameplate', 'measured', 'datasheet', 'estimate', 'user'].includes(String(load.source.kind))) errors.push(`${prefix}: source provenance is required.`);
    if (load.entryMode === 'complex' && !finite(load.reactiveKvar)) errors.push(`${prefix}: complex entry requires signed kvar.`);
    if (load.connection === 'line-line' && (!Array.isArray(load.phasePair) || load.phasePair.length !== 2 || load.phasePair[0] === load.phasePair[1] || load.phasePair.some((p) => !['L1', 'L2', 'L3'].includes(p)))) errors.push(`${prefix}: line-line entry requires two distinct phases.`);
    if (load.pfKind !== undefined && !['displacement', 'true'].includes(String(load.pfKind))) errors.push(`${prefix}: invalid PF interpretation.`);
    if (load.weekdays !== undefined && (!Array.isArray(load.weekdays) || !load.weekdays.length || load.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))) errors.push(`${prefix}: invalid weekday schedule.`);
    for (const field of ['boardId', 'circuitId']) if (load[field] !== undefined && (!text(load[field]) || !load[field])) errors.push(`${prefix}: invalid ${field}.`);
    for (const field of ['startingMultiplier', 'startingSeconds']) if (load[field] !== undefined && (!finite(load[field]) || load[field] < 0)) errors.push(`${prefix}: invalid ${field}.`);
    if (load.startingPF !== undefined && (!finite(load.startingPF) || load.startingPF <= 0 || load.startingPF > 1)) errors.push(`${prefix}: invalid starting PF.`);
  });
  if (Array.isArray(candidate.boards)) candidate.boards.forEach((board, index) => {
    if (!record(board) || !text(board.name) || !finite(board.ratedA) || board.ratedA <= 0 || !finite(board.ways) || !Number.isInteger(board.ways) || board.ways < 1) errors.push(`Board ${index + 1}: invalid rating, ways or name.`);
  });
  if (Array.isArray(candidate.circuits)) candidate.circuits.forEach((circuit, index) => {
    if (!record(circuit) || !text(circuit.name) || !text(circuit.boardId) || !['L1', 'L2', 'L3'].includes(String(circuit.phase)) || typeof circuit.locked !== 'boolean') errors.push(`Circuit ${index + 1}: invalid circuit fields.`);
    if (!record(circuit)) return;
    for (const field of ['protectiveA', 'breakingCapacityKA', 'prospectiveFaultKA']) if (circuit[field] !== undefined && (!finite(circuit[field]) || circuit[field] <= 0)) errors.push(`Circuit ${index + 1}: invalid ${field}.`);
    if (circuit.cable !== undefined) {
      if (!record(circuit.cable)) errors.push(`Circuit ${index + 1}: invalid cable object.`);
      else {
        if (!finite(circuit.cable.lengthM) || circuit.cable.lengthM < 0) errors.push(`Circuit ${index + 1}: invalid route length.`);
        for (const field of ['resistanceOhmPerKm', 'reactanceOhmPerKm', 'areaMm2', 'baseAmpacityA', 'voltageDropLimitPercent']) if (circuit.cable[field] !== undefined && (!finite(circuit.cable[field]) || circuit.cable[field] < 0)) errors.push(`Circuit ${index + 1}: invalid cable ${field}.`);
        if (circuit.cable.correctionFactors !== undefined && (!Array.isArray(circuit.cable.correctionFactors) || circuit.cable.correctionFactors.some((factor) => !finite(factor) || factor <= 0))) errors.push(`Circuit ${index + 1}: invalid correction factors.`);
        if (circuit.cable.source !== undefined && !text(circuit.cable.source)) errors.push(`Circuit ${index + 1}: invalid cable source.`);
      }
    }
  });
  if (!record(candidate.tariff) || !Array.isArray(candidate.tariff.bands)) errors.push('Missing tariff settings.');
  else {
    for (const field of ['importRate', 'exportRate', 'standingPerDay', 'demandPerKW', 'taxPercent']) if (!finite(candidate.tariff[field])) errors.push(`Tariff ${field} must be finite.`);
    for (const field of ['standingPerDay', 'demandPerKW', 'taxPercent']) if (finite(candidate.tariff[field]) && candidate.tariff[field] < 0) errors.push(`Tariff ${field} must be nonnegative.`);
    if (!text(candidate.tariff.source)) errors.push('Tariff provenance is required.');
    if (candidate.tariff.carbonKgPerKWh !== undefined && (!finite(candidate.tariff.carbonKgPerKWh) || candidate.tariff.carbonKgPerKWh < 0)) errors.push('Invalid carbon intensity.');
    uniqueIds(candidate.tariff.bands, 'Tariff bands', errors);
    candidate.tariff.bands.forEach((band, index) => {
      if (!record(band) || !text(band.name) || !finite(band.startHour) || !finite(band.endHour) || !finite(band.importRate) || band.startHour < 0 || band.startHour >= 24 || band.endHour < 0 || band.endHour > 24 || band.startHour === band.endHour) errors.push(`Tariff band ${index + 1}: invalid boundaries or price.`);
      if (record(band) && band.weekdays !== undefined && (!Array.isArray(band.weekdays) || !band.weekdays.length || band.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))) errors.push(`Tariff band ${index + 1}: invalid weekdays.`);
    });
  }
  if (!record(candidate.energy) || !record(candidate.energy.battery)) errors.push('Missing energy settings.');
  else {
    if (!finite(candidate.energy.pvKW) || candidate.energy.pvKW < 0 || !finite(candidate.energy.peakSunHours) || candidate.energy.peakSunHours < 0 || candidate.energy.peakSunHours > 24 || !finite(candidate.energy.pvPerformanceRatio) || candidate.energy.pvPerformanceRatio < 0 || candidate.energy.pvPerformanceRatio > 1 || !text(candidate.energy.source)) errors.push('Invalid PV energy settings or source.');
    if (candidate.energy.pvHourlyProfile !== undefined && (!Array.isArray(candidate.energy.pvHourlyProfile) || candidate.energy.pvHourlyProfile.length !== 24 || candidate.energy.pvHourlyProfile.some((power) => !finite(power) || power < 0 || power > 1))) errors.push('PV normalized profile requires 24 values between 0 and 1.');
    const battery = candidate.energy.battery;
    for (const field of ['capacityKWh', 'chargeKW', 'dischargeKW']) if (!finite(battery[field]) || battery[field] < 0) errors.push(`Invalid battery ${field}.`);
    for (const field of ['initialSoc', 'minSoc', 'maxSoc']) if (!finite(battery[field]) || battery[field] < 0 || battery[field] > 1) errors.push(`Invalid battery ${field}.`);
    if (finite(battery.minSoc) && finite(battery.maxSoc) && finite(battery.initialSoc) && (battery.minSoc > battery.maxSoc || battery.initialSoc < battery.minSoc || battery.initialSoc > battery.maxSoc)) errors.push('Battery SOC bounds are inconsistent.');
    for (const field of ['chargeEfficiency', 'dischargeEfficiency']) if (!finite(battery[field]) || battery[field] <= 0 || battery[field] > 1) errors.push(`Invalid battery ${field}.`);
    if (typeof battery.islandCapable !== 'boolean') errors.push('Battery island capability must be explicit.');
  }
  if (Array.isArray(candidate.evSessions)) candidate.evSessions.forEach((session, index) => {
    if (!record(session)) return;
    if (!text(session.name)) errors.push(`EV ${index + 1}: invalid name.`);
    for (const field of ['requiredKWh', 'chargerKW', 'vehicleKW', 'siteLimitKW']) if (!finite(session[field]) || session[field] < 0) errors.push(`EV ${index + 1}: invalid ${field}.`);
    for (const field of ['arrivalHour', 'departureHour']) if (!finite(session[field]) || session[field] < 0 || session[field] > 24) errors.push(`EV ${index + 1}: invalid ${field}.`);
    if (!finite(session.efficiency) || session.efficiency <= 0 || session.efficiency > 1) errors.push(`EV ${index + 1}: invalid efficiency.`);
  });
  if (!record(candidate.billing) || !record(candidate.billing.seller) || !record(candidate.billing.customer) || !Array.isArray(candidate.billing.lines)) errors.push('Missing customer estimate settings.');
  else {
    for (const contact of [candidate.billing.seller, candidate.billing.customer]) for (const field of ['name', 'address', 'email']) if (!text(contact[field])) errors.push(`Invalid billing contact ${field}.`);
    for (const field of ['reference', 'issueDate', 'dueDate', 'notes']) if (!text(candidate.billing[field])) errors.push(`Invalid billing ${field}.`);
    for (const field of ['taxPercent', 'discountPercent']) if (!finite(candidate.billing[field]) || candidate.billing[field] < 0 || candidate.billing[field] > 100) errors.push(`Invalid billing ${field}.`);
    uniqueIds(candidate.billing.lines, 'Estimate lines', errors);
    candidate.billing.lines.forEach((line, index) => {
      if (!record(line) || !text(line.description) || !text(line.unit) || !finite(line.quantity) || line.quantity < 0 || !finite(line.unitPrice) || line.unitPrice < 0) errors.push(`Estimate line ${index + 1}: invalid item.`);
    });
  }
  if (errors.length) return { valid: false, errors: errors.slice(0, 100) };
  // JSON round-trip detaches caller-owned data and removes prototypes without executing content.
  return { valid: true, project: JSON.parse(JSON.stringify(candidate)) as Project, errors: [] };
}

export function duplicateProject(project: Project, name = `${project.name} — copy`, timestamp = new Date().toISOString()): Project {
  return { ...structuredClone(project), id: newId('project'), name, revision: 1, createdAt: timestamp, updatedAt: timestamp };
}
