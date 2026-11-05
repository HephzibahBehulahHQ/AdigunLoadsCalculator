import { ENGINE_VERSION, type CalculationResult, type Complex, type Issue, type Load, type NormalizedLoad, type Phase, type ProfilePoint, type Project } from '../domain/types';

export const PHASES: Phase[] = ['L1', 'L2', 'L3'];
const angles: Record<Phase, number> = { L1: 0, L2: -2 * Math.PI / 3, L3: 2 * Math.PI / 3 };
export const magnitude = (z: Complex): number => Math.hypot(z.re, z.im);
export const addComplex = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const zeroPhases = (): Record<Phase, Complex> => ({ L1: { re: 0, im: 0 }, L2: { re: 0, im: 0 }, L3: { re: 0, im: 0 } });
const polar = (size: number, angle: number): Complex => ({ re: size * Math.cos(angle), im: size * Math.sin(angle) });

function issue(load: Load, field: string, message: string, assessment: Issue['assessment'] = 'incomplete'): Issue {
  return { id: `${load.id}-${field}`, severity: assessment === 'unsupported' ? 'warning' : 'error', assessment, entityId: load.id, field, message };
}

export function validateLoad(load: Load): Issue[] {
  const issues: Issue[] = [];
  const check = (field: keyof Load, predicate: (n: number) => boolean, message: string) => {
    const value = load[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || !predicate(value)) issues.push(issue(load, field, message));
  };
  check('rating', (n) => n >= 0, 'Enter a nonnegative finite equipment rating.');
  check('quantity', (n) => Number.isInteger(n) && n > 0 && n <= 1000000, 'Quantity must be a positive integer.');
  check('voltage', (n) => n > 0, 'Enter a positive voltage with the correct connection basis.');
  check('efficiency', (n) => n > 0 && n <= 1, 'Efficiency must be greater than 0 and at most 1.');
  check('hoursPerDay', (n) => n >= 0 && n <= 24, 'Operating duration must be between 0 and 24 hours.');
  check('startHour', (n) => n >= 0 && n < 24, 'Start hour must be between 0 and less than 24.');
  check('duty', (n) => n >= 0 && n <= 1, 'Energy duty must be between 0 and 1.');
  check('utilization', (n) => n >= 0 && n <= 1, 'On-state utilization must be between 0 and 1.');
  check('standbyW', (n) => n >= 0, 'Standby power must be nonnegative.');
  if (load.entryMode !== 'complex' && load.connection !== 'dc') check('pf', (n) => n > 0 && n <= 1, 'PF must be greater than 0 and at most 1; use complex entry for reactive-only loads.');
  if (load.entryMode === 'complex') check('reactiveKvar', () => true, 'Complex-power entry requires a finite signed reactive power.');
  if (!['kw', 'kva', 'amps', 'motor', 'complex'].includes(load.entryMode)) issues.push(issue(load, 'entryMode', 'Unsupported rating entry mode.'));
  if (!['single', 'three', 'line-line', 'dc'].includes(load.connection)) issues.push(issue(load, 'connection', 'Unsupported connection.'));
  if (!PHASES.includes(load.phase)) issues.push(issue(load, 'phase', 'Select a valid phase.'));
  if (load.connection === 'line-line' && (!load.phasePair || load.phasePair.length !== 2 || load.phasePair[0] === load.phasePair[1] || load.phasePair.some((p) => !PHASES.includes(p)))) issues.push(issue(load, 'phasePair', 'Select two distinct line phases.'));
  if (load.weekdays && (load.weekdays.length === 0 || load.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))) issues.push(issue(load, 'weekdays', 'Operating weekdays must use 0 (Sunday) through 6 (Saturday).'));
  if (load.connection === 'dc' && load.entryMode === 'complex' && load.reactiveKvar !== 0) issues.push(issue(load, 'reactiveKvar', 'DC reactive power is not supported.', 'unsupported'));
  if (load.pfKind === 'true' && load.connection !== 'dc' && load.entryMode !== 'complex') issues.push(issue(load, 'pfKind', 'True PF supports power/current magnitudes only. Fundamental reactive power, angle and net phasor current require displacement PF or measured P/Q.', 'unsupported'));
  return issues;
}

/** Sinusoidal stiff-voltage model; current magnitude includes quantity and explicit utilization. */
export function normalizeLoad(load: Load): NormalizedLoad {
  const issues = validateLoad(load);
  if (issues.some((item) => item.severity === 'error' || (item.field === 'reactiveKvar' && item.assessment === 'unsupported'))) {
    return { id: load.id, installedKW: NaN, operatingKW: NaN, reactiveKvar: null, apparentKVA: NaN, currentA: NaN, energyKWh: NaN, phaseCurrents: zeroPhases(), issues, valid: false };
  }
  const pf = load.connection === 'dc' ? 1 : load.pf;
  const voltageFactor = load.connection === 'three' ? Math.sqrt(3) : 1;
  let unitKW: number;
  switch (load.entryMode) {
    case 'amps': unitKW = voltageFactor * load.voltage * load.rating * pf / 1000; break;
    case 'kva': unitKW = load.rating * pf; break;
    case 'motor': unitKW = load.rating / load.efficiency; break;
    default: unitKW = load.rating;
  }
  const installedKW = unitKW * load.quantity;
  const operatingKW = installedKW * load.utilization;
  const unknownAngle = load.pfKind === 'true' && load.connection !== 'dc' && load.entryMode !== 'complex';
  const reactiveKvar = unknownAngle ? null : load.connection === 'dc' ? 0 : load.entryMode === 'complex'
    ? (load.reactiveKvar ?? 0) * load.quantity * load.utilization
    : (load.reactive === 'leading' ? -1 : 1) * operatingKW * Math.tan(Math.acos(pf));
  const apparentKVA = reactiveKvar === null ? operatingKW / pf : Math.hypot(operatingKW, reactiveKvar);
  const currentA = apparentKVA * 1000 / (voltageFactor * load.voltage);
  const angle = reactiveKvar === null ? NaN : Math.atan2(reactiveKvar, operatingKW);
  const phaseCurrents = zeroPhases();
  if (load.connection === 'three') {
    for (const phase of PHASES) phaseCurrents[phase] = polar(currentA, angles[phase] - angle);
  } else if (load.connection === 'line-line') {
    const [a, b] = load.phasePair!;
    const va = polar(1, angles[a]); const vb = polar(1, angles[b]);
    const abAngle = Math.atan2(va.im - vb.im, va.re - vb.re);
    const branch = polar(currentA, abAngle - angle);
    phaseCurrents[a] = branch;
    phaseCurrents[b] = { re: -branch.re, im: -branch.im };
  } else if (load.connection !== 'dc') phaseCurrents[load.phase] = polar(currentA, angles[load.phase] - angle);
  const standbyKW = load.standbyW * load.quantity / 1000;
  const energyKWh = operatingKW * load.hoursPerDay * load.duty + standbyKW * (24 - load.hoursPerDay * load.duty);
  if (![installedKW, operatingKW, apparentKVA, currentA, energyKWh].every(Number.isFinite)) {
    issues.push(issue(load, 'rating', 'The entered magnitudes overflow the supported numerical range.'));
    return { id: load.id, installedKW: NaN, operatingKW: NaN, reactiveKvar: null, apparentKVA: NaN, currentA: NaN, energyKWh: NaN, phaseCurrents: zeroPhases(), issues, valid: false };
  }
  return { id: load.id, installedKW, operatingKW, reactiveKvar, apparentKVA, currentA, energyKWh, phaseCurrents, issues, valid: true };
}

/** Fraction of an interval covered by a repeating daily operating window; overnight wraps. */
export function activeHours(start: number, duration: number, intervalStart: number, intervalEnd: number): number {
  if (duration === 24) return intervalEnd - intervalStart;
  let overlap = 0;
  for (const offset of [-24, 0, 24]) overlap += Math.max(0, Math.min(start + duration + offset, intervalEnd) - Math.max(start + offset, intervalStart));
  return overlap;
}

export function dailyProfile(loads: Load[], intervalMinutes = 60, weekday?: number): ProfilePoint[] {
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || 1440 % intervalMinutes !== 0) throw new Error('Interval must be a positive whole divisor of 1440 minutes.');
  const step = intervalMinutes / 60; const count = 1440 / intervalMinutes;
  // Difference arrays make full operating windows O(1), with exact fractional boundary bins.
  const channels = Array.from({ length: 4 }, () => ({ base: 0, edges: new Float64Array(count), difference: new Float64Array(count + 1) }));
  const range = (channel: typeof channels[number], start: number, end: number, kw: number) => {
    if (end <= start || kw === 0) return;
    const first = Math.floor(start / step); const last = Math.min(count - 1, Math.ceil(end / step) - 1);
    if (first === last) { channel.edges[first] += kw * (end - start) / step; return; }
    channel.edges[first] += kw * ((first + 1) * step - start) / step;
    channel.edges[last] += kw * (end - last * step) / step;
    if (last > first + 1) { channel.difference[first + 1] += kw; channel.difference[last] -= kw; }
  };
  for (const load of loads) {
    const normalized = normalizeLoad(load); if (!normalized.valid) continue;
    const weights = [0, 0, 0];
    if (load.connection === 'three') weights.fill(1 / 3);
    else if (load.connection === 'line-line') for (const phase of load.phasePair!) weights[PHASES.indexOf(phase)] = 0.5;
    else if (load.connection !== 'dc') weights[PHASES.indexOf(load.phase)] = 1;
    const standbyKW = load.standbyW * load.quantity / 1000;
    const standby = [standbyKW, ...weights.map((weight) => weight * standbyKW)];
    const phaseOperating = weights.map((weight) => weight * normalized.operatingKW);
    if (load.connection === 'line-line' && normalized.reactiveKvar !== null) {
      // Derive phase real power from actual line current phasors, including signed Q transfer.
      for (let index = 0; index < PHASES.length; index++) {
        const phase = PHASES[index]; const voltage = polar(load.voltage / Math.sqrt(3), angles[phase]);
        const current = normalized.phaseCurrents[phase];
        phaseOperating[index] = (voltage.re * current.re + voltage.im * current.im) / 1000;
      }
    }
    const operating = [normalized.operatingKW, ...phaseOperating];
    for (let c = 0; c < channels.length; c++) channels[c].base += standby[c];
    for (const offset of [-24, 0, 24]) {
      if (weekday !== undefined && load.weekdays && !load.weekdays.includes((weekday + offset / 24 + 7) % 7)) continue;
      const start = Math.max(0, load.startHour + offset); const end = Math.min(24, load.startHour + load.hoursPerDay + offset);
      for (let c = 0; c < channels.length; c++) range(channels[c], start, end, (operating[c] - standby[c]) * load.duty);
    }
  }
  const running = [0, 0, 0, 0];
  return Array.from({ length: count }, (_, index) => {
    const values = channels.map((channel, c) => { running[c] += channel.difference[index]; return channel.base + running[c] + channel.edges[index]; });
    // Clamp round-off at zero without hiding meaningful signed per-phase power.
    const kw = Math.abs(values[0]) < 1e-12 ? 0 : values[0];
    return { hour: index * step, kw, kWh: kw * step, phaseKW: { L1: values[1], L2: values[2], L3: values[3] } };
  });
}

export function validateTopology(project: Project): Issue[] {
  const issues: Issue[] = [];
  const boards = new Map(project.boards.map((board) => [board.id, board]));
  const circuits = new Map(project.circuits.map((circuit) => [circuit.id, circuit]));
  const add = (id: string, message: string) => issues.push({ id: `${id}-topology`, entityId: id, severity: 'error', assessment: 'incomplete', message } as Issue);
  for (const board of project.boards) {
    const seen = new Set<string>([board.id]);
    let parent = board.parentId;
    while (parent) {
      if (seen.has(parent)) { add(board.id, 'Board hierarchy contains a cycle.'); break; }
      seen.add(parent);
      const upstream = boards.get(parent);
      if (!upstream) { add(board.id, 'Upstream board is missing.'); break; }
      parent = upstream.parentId;
    }
    if (project.circuits.filter((c) => c.boardId === board.id).length > board.ways) add(board.id, 'The circuit count exceeds the entered number of board ways.');
  }
  for (const circuit of project.circuits) if (!boards.has(circuit.boardId)) add(circuit.id, 'The circuit references a missing board.');
  for (const load of project.loads) {
    if (load.boardId && !boards.has(load.boardId)) add(load.id, 'The load references a missing board.');
    if (load.circuitId) {
      const circuit = circuits.get(load.circuitId);
      if (!circuit) add(load.id, 'The load references a missing circuit.');
      else {
        if (load.boardId && load.boardId !== circuit.boardId) add(load.id, 'The load and its circuit reference different boards.');
        if (load.connection === 'single' && load.phase !== circuit.phase) add(load.id, 'Load phase does not match its circuit phase.');
      }
    }
    const nominal = load.connection === 'single' ? project.supply.voltageLN : project.supply.voltageLL;
    if (load.connection !== 'dc' && Math.abs(load.voltage - nominal) / nominal > 0.05) add(load.id, 'Load voltage differs from the stated supply by more than 5%; model a compatible source or correct the input.');
  }
  return issues;
}

export function calculateProject(project: Project): CalculationResult {
  const loads = project.loads.map(normalizeLoad);
  const valid = loads.filter((load) => load.valid);
  const issues = [...loads.flatMap((load) => load.issues), ...validateTopology(project)];
  let factor = project.coincidence * (1 + project.growthPercent / 100);
  if (!Number.isFinite(project.coincidence) || project.coincidence < 0 || project.coincidence > 1 || !Number.isFinite(project.growthPercent) || project.growthPercent < 0) {
    issues.push({ id: 'design-factors', severity: 'error', assessment: 'incomplete', message: 'Coincidence must be 0–1 and growth must be nonnegative.' }); factor = NaN;
  }
  const installedKW = valid.reduce((sum, load) => sum + load.installedKW, 0);
  const operatingKW = valid.reduce((sum, load) => sum + load.operatingKW, 0);
  const unknownQ = valid.some((load) => load.reactiveKvar === null);
  const reactiveKvar = unknownQ ? null : valid.reduce((sum, load) => sum + (load.reactiveKvar ?? 0), 0) * factor;
  const designKW = operatingKW * factor;
  const apparentKVA = reactiveKvar === null ? valid.reduce((sum, load) => sum + load.apparentKVA, 0) * factor : Math.hypot(designKW, reactiveKvar);
  const complex = zeroPhases();
  for (const load of valid) for (const phase of PHASES) complex[phase] = addComplex(complex[phase], load.phaseCurrents[phase]);
  const phaseOnStateCurrents: Record<Phase, number> = { L1: magnitude(complex.L1), L2: magnitude(complex.L2), L3: magnitude(complex.L3) };
  const phaseCurrents: Record<Phase, number> = { L1: phaseOnStateCurrents.L1 * factor, L2: phaseOnStateCurrents.L2 * factor, L3: phaseOnStateCurrents.L3 * factor };
  const neutral = addComplex(addComplex(complex.L1, complex.L2), complex.L3);
  const neutralA = unknownQ ? null : magnitude(neutral) * factor;
  const mean = PHASES.reduce((sum, phase) => sum + phaseCurrents[phase], 0) / 3;
  const imbalancePercent = mean === 0 ? 0 : Math.max(...PHASES.map((phase) => Math.abs(phaseCurrents[phase] - mean))) / mean * 100;
  const profile = dailyProfile(project.loads, 60);
  const dailyKWh = profile.reduce((sum, point) => sum + point.kWh, 0);
  const peakKW = Math.max(0, ...dailyProfile(project.loads, 15).map((point) => point.kw));
  const tax = 1 + project.tariff.taxPercent / 100;
  const dailyCost = (dailyKWh * project.tariff.importRate + project.tariff.standingPerDay) * tax;
  const monthlyCost = (dailyKWh * 30 * project.tariff.importRate + project.tariff.standingPerDay * 30 + peakKW * project.tariff.demandPerKW) * tax;
  for (const phase of PHASES) if (phaseCurrents[phase] > project.supply.limitA) issues.push({ id: `supply-${phase}`, severity: 'warning', assessment: 'failed', message: `${phase} design current exceeds the entered ${project.supply.limitA} A supply limit.`, field: 'limitA' });
  if (project.loads.some((load) => load.connection === 'dc') && project.loads.some((load) => load.connection !== 'dc')) issues.push({ id: 'mixed-ac-dc', severity: 'warning', assessment: 'unsupported', message: 'DC loads are included in energy totals but excluded from AC phase currents. A converter/source model is required to combine electrical boundaries.' });
  if (project.tariff.bands.length) issues.push({ id: 'quick-flat-tariff', severity: 'info', assessment: 'warning', message: 'Overview costs are flat-rate 30-day estimates. Use chronological billing for time-of-use rates.' });
  const complete = issues.every((item) => item.assessment !== 'incomplete' && item.assessment !== 'unsupported');
  return {
    revision: project.revision, engineVersion: ENGINE_VERSION, installedKW, operatingKW, designKW, reactiveKvar,
    apparentKVA, powerFactor: apparentKVA === 0 || unknownQ ? null : designKW / apparentKVA,
    phaseCurrents, phaseOnStateCurrents, neutralA, imbalancePercent, dailyKWh, monthlyKWh: dailyKWh * 30,
    dailyCost, monthlyCost, peakKW, loads, profile, issues, complete,
    trace: {
      method: 'Stiff-neutral sinusoidal AC and separate DC branch model',
      formula: 'P = VI·PF (1φ); P = √3·VLL·I·PF (3φ); Q = ±P tan(acos PF); S = √((ΣP)² + (ΣQ)²); E = ΣP·Δt',
      assumptions: ['Balanced supply voltages; fixed neutral; fundamental-frequency currents only.', 'Duty affects energy, never on-state current. Utilization is an explicit operating assumption.', 'Coincidence and growth affect design demand; they do not alter modeled energy.', 'Quick estimates use one repeated 24-hour day and 30 days per month; weekday calendars and DST require calendar simulation.', 'Flat-rate cost inputs are user assumptions. No normative cable/protection approval is implied.', 'L–L branches contribute equal/opposite line currents; neutral excludes DC branches.'],
      sources: ['Project entered/nameplate evidence', 'https://www.electrical-installation.org/enwiki/Estimation_of_actual_maximum_kVA_demand'],
      revision: project.revision, engineVersion: ENGINE_VERSION, origin: 'calculated', assessment: complete ? 'passed' : 'incomplete', inputTimestamp: project.updatedAt,
    },
  };
}
