import { describe, expect, it } from 'vitest';
import { getTool, tools } from '../src/tools';
import type { ToolValues } from '../src/tools';

const calculate = (id: string, changes: ToolValues = {}) => {
  const tool = getTool(id);
  return tool.calculate({ ...tool.exampleInputs, ...changes });
};
const value = (id: string, label: string, changes: ToolValues = {}) => {
  const item = calculate(id, changes).values.find(entry => entry.label === label);
  expect(item, `${id}: ${label}`).toBeDefined();
  return item!.value;
};

// Independent hand arithmetic: expected numbers are literal reference results,
// never calculated by production helpers. See docs/TOOL_METHODS.md for scope.
const fixtures: Array<[string, string, number, number?]> = [
  ['T01', 'Current', 10],
  ['T02', 'Energy', .72],
  ['T03', 'On-state current', 10],
  ['T04', 'On-state current', 17.32050807568877],
  ['T05', 'Apparent power magnitude', 5],
  ['T06', 'Equivalent resistance', 4],
  ['T07', 'Inductive reactance', 31.41592653589793],
  ['T08', 'Converted value', 4800],
  ['T09', 'Electrical input', 8.333333333333334],
  ['T10', 'On-state line current', 14.150741891946166],
  ['T11', 'Shaft power', 15.707963267948967],
  ['T12', 'Slip', 4],
  ['T13', 'Line current', 34.64101615137754],
  ['T14', 'Total start period', 6],
  ['T15', 'Resistance at operating temperature', .83755],
  ['T16', 'Voltage drop', 8],
  ['T17', 'Signed voltage drop', 8],
  ['T18', 'Maximum one-way route length', 38.333333333333336],
  ['T19', 'Window loss energy', .32],
  ['T20', 'Corrected current-carrying capacity', 21.6],
  ['T22', 'Minimum-factor RMS estimate', .475],
  ['T23', 'Maximum impedance for entered Ia', 1.365625],
  ['T24', 'Conductor thermal withstand', 82656.25],
  ['T25', 'Controlling entered requirement', 2.5],
  ['T26', 'Target capacity including added allowance', 10.56],
  ['T27', 'Maximum deviation from mean / mean', 50],
  ['T28', 'Fundamental neutral RMS magnitude', 0],
  ['T29', 'Entered-model loss', 840],
  ['T30', 'Real-power headroom', 6],
  ['T31', 'Continuous real-power headroom', 2],
  ['T32', 'Energy-only runtime', 1.8],
  ['T33', 'Capacitive compensation magnitude', 4.213158948211367],
  ['T34', 'Capacitance per element', 66.31455962162306],
  ['T35', 'THD relative to fundamental', 50],
  ['T36', 'Available AC energy above reserve', 5.4],
  ['T37', 'Feasible constant-load runtime', 5.4],
  ['T38', 'Final stored energy', 4.3],
  ['T39', 'Daily AC energy before clipping', 17.28],
  ['T40', 'Cold string Voc', 549],
  ['T41', 'Delivered wind energy', 3.6],
  ['T42', 'Unmet battery energy', 10.8],
  ['T43', 'Unmet battery energy by deadline', 12],
  ['T44', 'Whole-window mean power', .25],
  ['T45', 'Load factor', .625],
  ['T46', 'Coincidence factor', .75],
  ['T47', 'Total bill estimate', 5.52],
  ['T48', 'Energy reduction', 21.12],
  ['T49', 'Estimated operational emissions', 400],
  ['T50', 'Simple payback', 5],
  ['T51', 'Net present value', 41.32231404958668],
];

describe('Toolbox catalogue and independent arithmetic', () => {
  it('contains exactly T01 through T51 with unique working forms', () => {
    expect(tools.map(tool => tool.id)).toEqual(Array.from({ length: 51 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`));
    for (const tool of tools) {
      expect(tool.inputs.length).toBeGreaterThan(0);
      const output = tool.calculate(tool.exampleInputs);
      expect(output.formula.length).toBeGreaterThan(0);
      expect(output.values.length).toBeGreaterThan(0);
      expect(output.notes.length).toBeGreaterThan(0);
      expect(output.values.every(item => typeof item.value !== 'number' || Number.isFinite(item.value))).toBe(true);
    }
  });
  it.each(fixtures)('%s independently verifies %s', (id, label, expected) => {
    expect(value(id, label)).toBeCloseTo(expected, 8);
  });
  it('T21 separately assesses each rule without a blanket approval', () => {
    const output = calculate('T21');
    expect(output.status).toBe('incomplete');
    expect(output.values).toHaveLength(4);
    expect(output.values.every(item => String(item.value).startsWith('Meets'))).toBe(true);
    expect(value('T21', 'Fault ≤ breaking capacity', { fault: 8 })).toContain('fails');
  });
  it.each(tools.filter(tool => tool.inputs.some(input => input.type === 'number')).map(tool => [tool.id]))('%s rejects non-finite numeric inputs', id => {
    const tool = getTool(id), first = tool.inputs.find(input => input.type === 'number')!;
    expect(() => tool.calculate({ ...tool.exampleInputs, [first.key]: NaN })).toThrow(/finite/);
    expect(() => tool.calculate({ ...tool.exampleInputs, [first.key]: Infinity })).toThrow(/finite/);
  });
});

describe('Physical boundaries and model honesty', () => {
  it('rejects inconsistent Ohm inputs and handles an ideal open circuit', () => {
    expect(() => calculate('T01', { voltage: 230, current: 10, resistance: 24 })).toThrow(/Inconsistent/);
    const output = getTool('T01').calculate({ voltage: 230, current: 0 });
    expect(output.values.find(item => item.label === 'Resistance')!.value).toBe('Open circuit');
    expect(() => getTool('T01').calculate({ voltage: 0, current: 0 })).toThrow(/do not determine/);
  });
  it('treats efficiency once and rejects PF zero for a real-power input', () => {
    expect(value('T10', 'Electrical input')).toBeCloseTo(8.333333333333334, 10);
    expect(() => calculate('T03', { pf: 0 })).toThrow(/greater than zero/);
    expect(() => calculate('T09', { ratio: 1.2 })).toThrow(/cannot exceed/);
    expect(value('T09', 'Electrical input', { mode: 'thermal', output: 12, ratio: 4 })).toBe(3);
  });
  it('supports explicit reactive-only and regeneration quadrants', () => {
    expect(value('T05', 'Apparent power magnitude', { real: 0, reactive: -3 })).toBe(3);
    expect(value('T05', 'Power factor magnitude', { real: 0, reactive: 0 })).toBe('Not applicable');
    expect(value('T05', 'Real-power direction', { real: -4, reactive: 3 })).toBe('Export / regeneration');
    expect(value('T05', 'Reactive direction', { real: -4, reactive: 3 })).toBe('Inductive absorption');
  });
  it('validates resistance profiles and ideal zero-impedance RLC', () => {
    expect(value('T06', 'Equivalent resistance', { topology: 'parallel', resistors: '10,0,20' })).toBe(0);
    expect(() => calculate('T06', { resistors: '10,NaN' })).toThrow(/finite/);
    expect(calculate('T07', { resistance: 0, inductance: 0, capacitance: 0 }).status).toBe('unsupported');
  });
  it('converts exact temperature and length definitions', () => {
    expect(value('T08', 'Converted value', { conversion: 'C-F', value: -40 })).toBe(-40);
    expect(value('T08', 'Converted value', { conversion: 'ft-m', value: 1 })).toBe(.3048);
    expect(() => calculate('T08', { voltage: 0 })).toThrow(/greater than zero/);
  });
  it('keeps motor start PF separate and rejects invalid pole counts', () => {
    expect(value('T14', 'Motor start-only energy')).toBeCloseTo(.03233161507461904, 10);
    expect(value('T14', 'Total start period', { sequence: 'simultaneous' })).toBe(3);
    expect(() => calculate('T12', { poles: 3 })).toThrow(/even/);
    expect(value('T12', 'Slip', { speed: 1530 })).toBe(-2);
  });
  it('supports leading voltage rise and retains on-state losses when duty changes', () => {
    expect(Number(value('T17', 'Signed voltage drop', { resistance: 0, reactance: 10, pf: .8, reactive: 'leading' }))).toBeLessThan(0);
    expect(value('T19', 'On-state conductor loss', { duty: .2 })).toBe(80);
    expect(value('T19', 'Window loss energy', { duty: .2 })).toBeCloseTo(.128, 10);
  });
  it('removing source evidence invalidates a completed worksheet state', () => {
    const complete = { source: 'Entered table reference and applicable factors', installation: 'Entered installation and conductor conditions' };
    expect(calculate('T20', complete).status).toBe('calculated');
    expect(calculate('T20', { ...complete, source: '' }).status).toBe('incomplete');
  });
  it('does not apply the TN loop model to TT and rejects thermal-model overreach', () => {
    expect(calculate('T23', { earthing: 'TT' }).status).toBe('unsupported');
    const thermal = calculate('T24', { duration: 6 });
    expect(thermal.status).toBe('unsupported');
    expect(thermal.values.some(item => item.label === 'Entered energy condition')).toBe(false);
    expect(() => calculate('T25', { duration: 6 })).toThrow(/five seconds/);
    expect(value('T25', 'Controlling entered requirement', { method: 'bonding', minimum: 6 })).toBe(6);
  });
  it('handles zero-load current imbalance and single-phase neutral', () => {
    expect(value('T27', 'Maximum deviation from mean / mean', { l1: 0, l2: 0, l3: 0 })).toContain('Not applicable');
    expect(value('T28', 'Fundamental neutral RMS magnitude', { l2: 0, l3: 0 })).toBe(10);
  });
  it('does not approve output-power infeasible UPS/inverter operation', () => {
    expect(calculate('T32', { loadKW: 4 }).warnings.join(' ')).toContain('Power limit exceeded');
    expect(calculate('T31', { phases: 'unknown', source: 'User-entered model evidence' }).status).toBe('incomplete');
    expect(() => calculate('T31', { peakKVA: 5, peakKW: 6 })).toThrow(/cannot be smaller/);
  });
  it('handles zero fundamental THD and capacitor star/delta element voltage', () => {
    expect(value('T35', 'THD relative to fundamental', { fundamental: 0 })).toContain('Undefined');
    expect(value('T34', 'Capacitance per element', { connection: 'star' })).toBeCloseTo(198.94367886486918, 8);
    expect(() => calculate('T33', { targetPF: .7 })).toThrow(/at least/);
  });
});

describe('Energy conservation, feasibility and billing', () => {
  it('does not net noon export against evening import without storage', () => {
    const zeroBattery = { loads: '0,1', generation: '1,0', capacity: 0, initial: 0, reserve: 0, chargeLimit: 0, dischargeLimit: 0 };
    expect(value('T38', 'Physical grid import', zeroBattery)).toBe(1);
    expect(value('T38', 'Physical grid export', zeroBattery)).toBe(1);
  });
  it('applies each battery conversion efficiency exactly once', () => {
    const output = calculate('T38');
    expect(output.series![0].storedKWh).toBeCloseTo(6.8, 10);
    expect(output.series![1].storedKWh).toBeCloseTo(4.3, 10);
    expect(value('T38', 'Conversion losses')).toBeCloseTo(.7, 10);
  });
  it('preserves per-step storage bounds and energy balance over clipping/reserve limits', () => {
    const output = calculate('T38', { loads: '0,1,6,7,1,0', generation: '10,4,0,0,0,12', capacity: 5, initial: 2, reserve: 1, chargeLimit: 2, dischargeLimit: 3, hours: .25 });
    for (const interval of output.series!) {
      expect(Number(interval.storedKWh)).toBeGreaterThanOrEqual(1 - 1e-10);
      expect(Number(interval.storedKWh)).toBeLessThanOrEqual(5 + 1e-10);
      expect(Math.abs(Number(interval.balanceResidualKWh))).toBeLessThan(1e-10);
      expect(Number(interval.chargeKW) * Number(interval.dischargeKW)).toBe(0);
    }
  });
  it('outage supplies nothing without an island-capable arrangement and no precharge appears', () => {
    expect(value('T38', 'Unserved load', { loads: '1,1', generation: '10,10', grid: 'outage', island: 'no' })).toBe(2);
    expect(value('T38', 'Final stored energy', { grid: 'outage', island: 'no' })).toBe(5);
    expect(value('T38', 'Unserved load', { loads: '1,1', generation: '0', grid: 'outage', island: 'yes', initial: 0, reserve: 0 })).toBe(2);
  });
  it('clips a supplied PV profile per interval, not by daily energy totals', () => {
    const inputs = { mode: 'profile', capacity: 5, loss: 0, efficiency: 1, profile: '0,1,2', interval: 1, inverterLimit: 4 };
    expect(value('T39', 'Delivered AC energy', inputs)).toBe(8);
    expect(value('T39', 'AC-equivalent clipped energy', inputs)).toBe(7);
  });
  it('checks both PV voltage endpoints and reports current violations', () => {
    expect(value('T40', 'Hot string Vmp')).toBeCloseTo(353.85, 8);
    expect(value('T40', 'Short-circuit current condition', { maximumShortCircuit: 10 })).toContain('fails');
    expect(() => calculate('T40', { hotTemperature: -20 })).toThrow(/Minimum design temperature/);
  });
  it('interpolates only within supplied wind curve bounds', () => {
    expect(value('T41', 'Delivered wind energy', { mode: 'curve', profile: '5', curve: '0:0,10:2', loss: 0 })).toBe(1);
    expect(() => calculate('T41', { mode: 'curve', profile: '11', curve: '0:0,10:2' })).toThrow(/no extrapolation/);
  });
  it('reports infeasible EV deadlines and respects phase and site constraints', () => {
    expect(value('T42', 'Deadline')).toContain('Infeasible');
    expect(value('T43', 'Total allocated charging power')).toBe(10);
    expect(value('T43', 'L1 resulting current')).toBeCloseTo(32, 10);
    expect(value('T43', 'Total allocated charging power', { siteHeadroom: 0 })).toBe(0);
    expect(value('T43', 'Unmet battery energy by deadline', { siteHeadroom: 0 })).toBe(30);
  });
  it('integrates real elapsed 23-hour and 25-hour days and keeps signed physical flows', () => {
    expect(value('T44', 'Signed net energy', { powers: '1', minutes: '1380' })).toBe(23);
    expect(value('T44', 'Signed net energy', { powers: '1', minutes: '1500' })).toBe(25);
    expect(value('T44', 'Signed net energy', { powers: '1', minutes: '41760' })).toBe(696); // 29 × 24 leap-February hours.
    expect(value('T44', 'Physical import energy', { powers: '-1,1', minutes: '60' })).toBe(1);
    expect(value('T44', 'Physical export energy', { powers: '-1,1', minutes: '60' })).toBe(1);
  });
  it('produces an actual sorted load-duration curve and rejects contradictory coincidence', () => {
    expect(calculate('T45').series!.map(item => item.loadKW)).toEqual([4, 3, 2, 1]);
    expect(() => calculate('T46', { coincidentMaximum: 17 })).toThrow(/cannot exceed/);
  });
  it('uses decimal-safe line rounding, negative prices and aligned demand', () => {
    expect(value('T47', 'Total bill estimate', { imports: '.1,.2', exports: '0', importRates: '.1', minutes: 15 })).toBe(.03);
    expect(value('T47', 'Total bill estimate', { imports: '1', importRates: '-.1' })).toBe(-.1);
    expect(value('T47', 'Total bill estimate', { imports: '.25', importRates: '.1', minutes: 15, demandRate: 10 })).toBe(10.03);
    expect(value('T47', 'Total bill estimate', { imports: '1', importRates: '.005' })).toBe(.01);
    expect(value('T47', 'Total bill estimate', { imports: '1', importRates: '-.005' })).toBe(-.01);
    expect(value('T47', 'Total bill estimate', { imports: '1', importRates: '1', tax: 19 })).toBe(1.19);
    expect(() => calculate('T47', { importRates: '.1234567' })).toThrow(/six decimal/);
  });
  it('requires source scope for carbon and handles zero / negative investment savings', () => {
    expect(calculate('T49').status).toBe('incomplete');
    expect(calculate('T49', { source: 'User factor report', geography: 'User geography', period: 'User reporting period' }).status).toBe('calculated');
    expect(value('T50', 'Simple payback', { saving: 100, maintenance: 200 })).toContain('No positive');
    expect(value('T51', 'Net present value', { discount: 0, sensitivity: 0 })).toBe(200);
    expect(() => calculate('T51', { discount: -99, sensitivity: 2 })).toThrow(/greater than/);
  });
});
