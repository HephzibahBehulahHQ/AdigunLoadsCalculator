import type { EngineeringTool } from './types';
import { defineTool, fraction, list, n, numberInput as N, positive, result, row, selectInput as S, signedQ, sum, textInput as T } from './helpers';

const category = 'Electrical fundamentals';
export const fundamentals: EngineeringTool[] = [
  defineTool({ id: 'T01', title: "Ohm’s law", category, description: 'Solve a passive DC resistor from any two independent quantities. Extra supplied values are checked for consistency.',
    inputs: [N('voltage', 'Voltage', 'V', 0, undefined, false), N('current', 'Current', 'A', 0, undefined, false), N('resistance', 'Resistance', 'Ω', 0, undefined, false), N('power', 'Power', 'W', 0, undefined, false)],
    exampleInputs: { voltage: 230, resistance: 23 },
    calculate(v) {
      const has = (key: string) => v[key] !== undefined && String(v[key]).trim() !== '';
      if (['voltage', 'current', 'resistance', 'power'].filter(has).length < 2) throw new Error('Enter at least two independent quantities.');
      let voltage: number, current: number, resistance: number | string, power: number;
      if (has('resistance') && has('current')) { resistance = n(v, 'resistance', 0); current = n(v, 'current', 0); voltage = current * resistance; power = voltage * current; }
      else if (has('resistance') && has('voltage')) { resistance = positive(v, 'resistance'); voltage = n(v, 'voltage', 0); current = voltage / resistance; power = voltage * current; }
      else if (has('resistance') && has('power')) { resistance = positive(v, 'resistance'); power = n(v, 'power', 0); current = Math.sqrt(power / resistance); voltage = current * resistance; }
      else if (has('voltage') && has('current')) { voltage = n(v, 'voltage', 0); current = n(v, 'current', 0); if (!voltage && !current) throw new Error('Zero voltage and current do not determine resistance. Enter resistance.'); resistance = current ? voltage / current : 'Open circuit'; power = voltage * current; }
      else if (has('voltage') && has('power')) { voltage = positive(v, 'voltage'); power = n(v, 'power', 0); current = power / voltage; resistance = current ? voltage / current : 'Open circuit'; }
      else { current = positive(v, 'current'); power = n(v, 'power', 0); voltage = power / current; resistance = voltage / current; }
      const solved = { voltage, current, resistance, power };
      for (const key of ['voltage', 'current', 'resistance', 'power'] as const) {
        if (has(key)) {
          const expected = solved[key], supplied = n(v, key, 0);
          if (typeof expected !== 'number' || Math.abs(supplied - expected) > 1e-8 * Math.max(1, Math.abs(expected), Math.abs(supplied))) throw new Error(`Inconsistent ${key}: the supplied quantities do not describe the same resistor.`);
        }
      }
      return result([row('Voltage', voltage, 'V'), row('Current', current, 'A'), row('Resistance', resistance, 'Ω'), row('Power', power, 'W')], 'V = IR; P = VI = I²R = V²/R', ['Passive, non-negative steady DC quantities. Ideal open-circuit resistance has no finite numerical value.']);
    }
  }),
  defineTool({ id: 'T02', title: 'DC load power & energy', category, description: 'Terminal electrical input and elapsed-time energy for identical DC loads.',
    inputs: [N('voltage', 'Terminal voltage', 'V', 0), N('current', 'On-state current per load', 'A', 0), N('quantity', 'Quantity', '', 1), N('hours', 'Elapsed operating time', 'h', 0)],
    exampleInputs: { voltage: 24, current: 5, quantity: 2, hours: 3 },
    calculate(v) { const quantity = n(v, 'quantity', 1); if (!Number.isInteger(quantity)) throw new Error('Quantity must be a whole number.'); const p = n(v, 'voltage', 0) * n(v, 'current', 0) * quantity; return result([row('Total power', p, 'W'), row('Energy', p * n(v, 'hours', 0) / 1000, 'kWh')], 'P = VI × quantity; E = P × elapsed hours / 1000', ['Steady input power. Supply losses and time-varying voltage are excluded.']); }
  }),
  ...(['single', 'three'] as const).map((connection, index) => defineTool({ id: `T0${index + 3}`, title: connection === 'single' ? 'Single-phase AC current' : 'Three-phase AC current', category, description: connection === 'single' ? 'Sinusoidal electrical input at the entered terminal voltage.' : 'Balanced sinusoidal three-phase electrical input at the entered line-to-line voltage.',
    inputs: [N('power', 'Electrical input', 'kW', 0), N('voltage', connection === 'single' ? 'Terminal voltage' : 'Line-to-line voltage', 'V', 0), N('pf', 'Displacement power factor', '', 0, 1), S('reactive', 'Reactive behavior', [['lagging', 'Inductive / lagging'], ['leading', 'Capacitive / leading']])],
    exampleInputs: { power: connection === 'single' ? 2.3 : 12, voltage: connection === 'single' ? 230 : 400, pf: 1, reactive: 'lagging' },
    calculate(v) { const p = n(v, 'power', 0), pf = fraction(v, 'pf'), voltage = positive(v, 'voltage'); return result([row('On-state current', p * 1000 / ((connection === 'single' ? 1 : Math.sqrt(3)) * voltage * pf), 'A'), row('Apparent power', p / pf, 'kVA'), row('Signed reactive power', signedQ(p, pf, v.reactive === 'leading'), 'kvar')], connection === 'single' ? 'I = 1000P / (V × PF)' : 'I = 1000P / (√3 × VLL × PF)', ['Displacement PF under a sinusoidal model; true PF with unknown distortion cannot establish reactive power.', 'Electrical input is already input power: motor efficiency is not applied.']); }
  })),
  defineTool({ id: 'T05', title: 'Signed power triangle', category, description: 'Explicit signed P and Q preserve reactive cancellation and regenerative quadrants.',
    inputs: [N('real', 'Signed real power', 'kW'), N('reactive', 'Signed reactive power', 'kvar')], exampleInputs: { real: 4, reactive: -3 },
    calculate(v) { const p = n(v, 'real'), q = n(v, 'reactive'), s = Math.hypot(p, q); return result([row('Apparent power magnitude', s, 'kVA'), row('Power factor magnitude', s ? Math.abs(p) / s : 'Not applicable'), row('Complex-power angle', s ? Math.atan2(q, p) * 180 / Math.PI : 'Not applicable', '°'), row('Real-power direction', p < 0 ? 'Export / regeneration' : p > 0 ? 'Consumption' : 'No real power'), row('Reactive direction', q < 0 ? 'Capacitive supply' : q > 0 ? 'Inductive absorption' : 'Zero reactive power')], 'S = √(P² + Q²); |PF| = |P|/S; angle = atan2(Q,P)', ['Passive sign convention: consumption P > 0; inductive absorption Q > 0. Pure reactive power is supported without division by PF.']); }
  }),
  defineTool({ id: 'T06', title: 'Series & parallel resistance', category, description: 'One all-series or all-parallel bank of ideal resistors; no arbitrary network solver.',
    inputs: [S('topology', 'Topology', [['series', 'All series'], ['parallel', 'All parallel']]), T('resistors', 'Resistance values', 'Comma-separated resistances in ohms, including zero for an ideal short.')], exampleInputs: { topology: 'parallel', resistors: '10, 10, 20' },
    calculate(v) { const values = list(v, 'resistors', 0); const total = v.topology === 'series' ? sum(values) : values.includes(0) ? 0 : 1 / sum(values.map(value => 1 / value)); return result([row('Equivalent resistance', total, 'Ω'), row('Number of resistors', values.length)], v.topology === 'series' ? 'Req = ΣR' : '1/Req = Σ(1/R)', ['All resistances are ideal and temperature-independent for this worksheet.']); }
  }),
  defineTool({ id: 'T07', title: 'Series RLC impedance', category, description: 'Fundamental steady-state impedance of a single series R/L/C branch.',
    inputs: [N('resistance', 'Resistance', 'Ω', 0), N('inductance', 'Inductance', 'mH', 0), N('capacitance', 'Capacitance (0 = capacitor omitted)', 'µF', 0), N('frequency', 'Frequency', 'Hz', 0), N('voltage', 'Applied RMS voltage', 'V', 0)],
    exampleInputs: { resistance: 10, inductance: 100, capacitance: 0, frequency: 50, voltage: 230 },
    calculate(v) { const w = 2 * Math.PI * positive(v, 'frequency'), r = n(v, 'resistance', 0), l = n(v, 'inductance', 0) / 1000, c = n(v, 'capacitance', 0) / 1e6; const xl = w * l, xc = c ? 1 / (w * c) : 0, x = xl - xc, z = Math.hypot(r, x); const out = result([row('Inductive reactance', xl, 'Ω'), row('Capacitive reactance', xc, 'Ω'), row('Impedance magnitude', z, 'Ω'), row('Impedance angle', z ? Math.atan2(x, r) * 180 / Math.PI : 'Not applicable', '°'), row('RMS current', z ? n(v, 'voltage', 0) / z : 'No finite ideal solution', 'A')], 'XL = 2πfL; XC = 1/(2πfC); Z = R + j(XL − XC)', ['Zero capacitance means no series capacitor component, not a physical zero-farad capacitor.', 'Ignores ESR, saturation, transient response and component tolerances.']); if (!z) { out.status = 'unsupported'; out.warnings.push('Ideal zero impedance: real source impedance is required for a finite current.'); } return out; }
  }),
  defineTool({ id: 'T08', title: 'Engineering unit converter', category, description: 'Explicit unit pairs; Ah to energy always requires the nominal voltage.',
    inputs: [S('conversion', 'Conversion', [['W-kW', 'W → kW'], ['kW-W', 'kW → W'], ['VA-kVA', 'VA → kVA'], ['kVA-VA', 'kVA → VA'], ['Wh-kWh', 'Wh → kWh'], ['kWh-Wh', 'kWh → Wh'], ['Ah-Wh', 'Ah → Wh'], ['Wh-Ah', 'Wh → Ah'], ['ft-m', 'ft → m'], ['m-ft', 'm → ft'], ['in-mm', 'in → mm'], ['mm-in', 'mm → in'], ['C-F', '°C → °F'], ['F-C', '°F → °C']]), N('value', 'Value'), N('voltage', 'Nominal voltage (Ah conversions only)', 'V', 0, undefined, false)],
    exampleInputs: { conversion: 'Ah-Wh', value: 100, voltage: 48 },
    calculate(v) { const value = n(v, 'value'), conversion = String(v.conversion); let converted: number; if (conversion === 'C-F') converted = value * 9 / 5 + 32; else if (conversion === 'F-C') converted = (value - 32) * 5 / 9; else { if (value < 0) throw new Error('Use a non-negative value for this conversion.'); const multipliers: Record<string, number> = { 'W-kW': .001, 'kW-W': 1000, 'VA-kVA': .001, 'kVA-VA': 1000, 'Wh-kWh': .001, 'kWh-Wh': 1000, 'ft-m': .3048, 'm-ft': 1 / .3048, 'in-mm': 25.4, 'mm-in': 1 / 25.4 }; converted = conversion === 'Ah-Wh' ? value * positive(v, 'voltage') : conversion === 'Wh-Ah' ? value / positive(v, 'voltage') : value * multipliers[conversion]; } return result([row('Converted value', converted, conversion.split('-')[1])], conversion.includes('Ah') ? 'Wh ≈ nominal V × Ah' : conversion.includes('C') || conversion.includes('F') ? '°F = (9/5) × °C + 32' : 'Exact defined unit scale', ['Ah energy conversion assumes fixed nominal voltage; actual battery energy depends on the discharge voltage profile.', 'International foot = 0.3048 m; international inch = 25.4 mm.']); }
  }),
  defineTool({ id: 'T09', title: 'Useful output → electrical input', category, description: 'Keep mechanical efficiency separate from a heat pump’s coefficient of performance.',
    inputs: [S('mode', 'Conversion basis', [['mechanical', 'Mechanical output / efficiency'], ['thermal', 'Heating or cooling output / COP']]), N('output', 'Useful output', 'kW', 0), N('ratio', 'Efficiency (0–1) or COP', '', 0)],
    exampleInputs: { mode: 'mechanical', output: 7.5, ratio: .9 },
    calculate(v) { const output = n(v, 'output', 0), ratio = positive(v, 'ratio'); if (v.mode === 'mechanical' && ratio > 1) throw new Error('Mechanical efficiency cannot exceed 1.'); const input = output / ratio; return result([row('Electrical input', input, 'kW'), row(v.mode === 'mechanical' ? 'Conversion loss' : 'Transferred thermal energy above electrical input', v.mode === 'mechanical' ? input - output : output - input, 'kW')], v.mode === 'mechanical' ? 'Pin = Pshaft / η' : 'Pin = Pthermal / COP', ['The entered ratio applies only to the stated operating point.', 'Do not divide an already electrical input rating by efficiency again.']); }
  }),
];

