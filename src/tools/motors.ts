import type { EngineeringTool } from './types';
import { connectionInput, defineTool, evidence, factor, fraction, GUIDE, integer, n, numberInput as N, positive, result, row, selectInput as S, signedQ, sourceInput, SQRT3 } from './helpers';

const category = 'Motors & starting';
export const motors: EngineeringTool[] = [
  defineTool({ id: 'T10', title: 'Motor input & full-load current', category, description: 'Shaft-output motor rating with an explicitly entered operating-point efficiency and displacement PF.',
    inputs: [N('shaft', 'Shaft output', 'kW', 0), N('efficiency', 'Motor efficiency', '', 0, 1), N('pf', 'Displacement power factor', '', 0, 1), N('voltage', 'Terminal voltage (line-to-line for three phase)', 'V', 0), connectionInput()],
    exampleInputs: { shaft: 7.5, efficiency: .9, pf: .85, voltage: 400, connection: 'three' },
    calculate(v) { const out = n(v, 'shaft', 0), pin = out / fraction(v, 'efficiency'), kva = pin / fraction(v, 'pf'); return result([row('Electrical input', pin, 'kW'), row('Electrical losses', pin - out, 'kW'), row('Apparent input', kva, 'kVA'), row('On-state line current', kva * 1000 / (factor(v) * positive(v, 'voltage')), 'A')], 'Pin = Pshaft/η; I = Pin × 1000/(phase factor × V × PF)', ['Balanced sinusoidal input for the three-phase case. Starting current requires separate manufacturer/entered data.'], [], [GUIDE + 'Induction_motors']); }
  }),
  defineTool({ id: 'T11', title: 'Torque, speed & shaft power', category, description: 'Mechanical conversion at a non-negative rotational speed; no motor efficiency applied.',
    inputs: [S('solve', 'Calculate', [['power', 'Shaft power from torque'], ['torque', 'Torque from shaft power']]), N('value', 'Known torque (N·m) or shaft power (kW)', '', 0), N('speed', 'Rotational speed', 'rpm', 0)],
    exampleInputs: { solve: 'power', value: 100, speed: 1500 },
    calculate(v) { const value = n(v, 'value', 0), speed = n(v, 'speed', 0), omega = 2 * Math.PI * speed / 60; if (v.solve === 'torque' && !omega) throw new Error('Torque cannot be inferred from shaft power at zero speed.'); return result([row('Angular speed', omega, 'rad/s'), row(v.solve === 'power' ? 'Shaft power' : 'Torque', v.solve === 'power' ? value * omega / 1000 : value * 1000 / omega, v.solve === 'power' ? 'kW' : 'N·m')], 'P = Tω; ω = 2πn/60', ['Steady rotational mechanical power; stall torque needs a separate motor model.']); }
  }),
  defineTool({ id: 'T12', title: 'Synchronous speed & slip', category, description: 'Induction-machine speed relative to the rotating supply field.',
    inputs: [N('frequency', 'Supply frequency', 'Hz', 0), N('poles', 'Number of poles', '', 2), N('speed', 'Rotor speed', 'rpm', 0)], exampleInputs: { frequency: 50, poles: 4, speed: 1440 },
    calculate(v) { const poles = integer(v, 'poles', 2, 1000); if (poles % 2) throw new Error('The number of poles must be even.'); const ns = 120 * positive(v, 'frequency') / poles, slip = (ns - n(v, 'speed', 0)) / ns; return result([row('Synchronous speed', ns, 'rpm'), row('Slip', slip * 100, '%'), row('Rotor electrical frequency magnitude', Math.abs(slip) * n(v, 'frequency'), 'Hz')], 'ns = 120f/p; s = (ns − n)/ns', ['A negative slip indicates super-synchronous operation; it is not a normal loaded motor point.'], slip < 0 ? ['Rotor speed exceeds synchronous speed. Check whether generator operation is intended.'] : []); }
  }),
  defineTool({ id: 'T13', title: 'Star / delta winding relations', category, description: 'Balanced identical winding impedances at a fixed operating point; nameplate connection compatibility is recorded separately.',
    inputs: [N('voltage', 'Line-to-line supply voltage', 'V', 0), N('impedance', 'Magnitude of each winding impedance', 'Ω', 0), N('windingRating', 'Rated winding voltage', 'V', 0), S('connection', 'Winding connection', [['star', 'Star'], ['delta', 'Delta']]), sourceInput('source', 'Motor nameplate / winding compatibility evidence')],
    exampleInputs: { voltage: 400, impedance: 20, windingRating: 400, connection: 'delta', source: 'Analytical reference: 400 V winding, fixed |Z| = 20 Ω; no manufacturer motor claim.' },
    calculate(v) { const voltage = positive(v, 'voltage'), z = positive(v, 'impedance'), star = v.connection === 'star', vw = star ? voltage / SQRT3 : voltage, iw = vw / z, rating = positive(v, 'windingRating'); return evidence(result([row('Winding voltage', vw, 'V'), row('Winding current', iw, 'A'), row('Line current', star ? iw : SQRT3 * iw, 'A'), row('Winding voltage / rating', 100 * vw / rating, '%')], 'Star: Vw = VLL/√3, IL = Iw. Delta: Vw = VLL, IL = √3Iw.', ['Fixed equal winding impedance model. It does not predict acceleration, torque, transition current or acceptable starting duty.', 'At the same line voltage and fixed winding impedance, star line current is one-third of delta line current.'], vw > rating * (1 + 1e-9) ? ['Calculated winding voltage exceeds the entered rating.'] : [], [GUIDE + 'Induction_motors']), v); }
  }),
  defineTool({ id: 'T14', title: 'Motor start sequence', category, description: 'Compare simultaneous or sequential starts from entered start/run currents and separate PFs.',
    inputs: [connectionInput(), N('voltage', 'Terminal / line-to-line voltage', 'V', 0), N('background', 'Already-running background real power', 'kW', 0), N('backgroundPf', 'Background displacement PF', '', 0, 1), N('motors', 'Identical motors to start', '', 1, 1000), N('runCurrent', 'Motor running current', 'A', 0), N('runPf', 'Motor running displacement PF', '', 0, 1), N('startCurrent', 'Motor starting current', 'A', 0), N('startPf', 'Motor starting displacement PF', '', 0, 1), N('duration', 'Start duration per motor', 's', 0), S('sequence', 'Sequence', [['simultaneous', 'Start together'], ['staggered', 'One start at a time']])],
    exampleInputs: { connection: 'three', voltage: 400, background: 5, backgroundPf: .9, motors: 2, runCurrent: 14.15, runPf: .85, startCurrent: 80, startPf: .35, duration: 3, sequence: 'staggered' },
    calculate(v) {
      const scale = factor(v) * positive(v, 'voltage') / 1000, count = integer(v, 'motors', 1, 1000), p0 = n(v, 'background', 0), q0 = signedQ(p0, fraction(v, 'backgroundPf'));
      const sr = scale * n(v, 'runCurrent', 0), pr = sr * fraction(v, 'runPf'), qr = Math.sqrt(Math.max(0, sr * sr - pr * pr));
      const ss = scale * n(v, 'startCurrent', 0), ps = ss * fraction(v, 'startPf'), qs = Math.sqrt(Math.max(0, ss * ss - ps * ps));
      const stages: Array<Record<string, number | string>> = [];
      for (let step = 0; step < (v.sequence === 'staggered' ? count : 1); step++) {
        const running = v.sequence === 'staggered' ? step : 0, starting = v.sequence === 'staggered' ? 1 : count;
        const p = p0 + running * pr + starting * ps, q = q0 + running * qr + starting * qs;
        stages.push({ step: step + 1, starting, running, realKW: p, reactiveKvar: q, apparentKVA: Math.hypot(p, q), lineA: Math.hypot(p, q) / scale });
      }
      const finalS = Math.hypot(p0 + count * pr, q0 + count * qr), peak = Math.max(finalS, ...stages.map(s => Number(s.apparentKVA))), duration = positive(v, 'duration');
      const out = result([row('Maximum sequence / final apparent demand', peak, 'kVA'), row('Maximum sequence / final line current', peak / scale, 'A'), row('All-motors-running apparent demand', finalS, 'kVA'), row('Total start period', duration * (v.sequence === 'staggered' ? count : 1), 's'), row('Motor start-only energy', ps * count * duration / 3600, 'kWh')], 'P and Q are summed at each start stage; S = √[(ΣP)² + (ΣQ)²]', ['All entered PFs are assumed lagging and sinusoidal. Staggered starts begin after the preceding motor finishes starting.', 'No generic starting multiplier, voltage dip or frequency-dip prediction is used.', 'Start-only energy excludes background and already-running motors.']); out.series = stages; return out;
    }
  }),
];
