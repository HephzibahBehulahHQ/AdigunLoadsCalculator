import type { EngineeringTool } from './types';
import { defineTool, evidence, expand, integer, list, n, numberInput as N, positive, result, row, selectInput as S, sourceInput, sum, textInput as T } from './helpers';

const category = 'EV, energy & economics';
const MICRO = 1_000_000n;
/** Decimal inputs are explicitly bounded to six fractional digits for auditable money calculations. */
function scaled(value: number | string, label: string): bigint {
  let text = String(value).trim();
  text = text.replace(/^([+-]?)\./, (_match: string, sign: string) => sign + '0.').replace(/\.$/, '');
  if (/e/i.test(text)) { const x = Number(text); if (!Number.isFinite(x)) throw new Error(`${label} must be finite.`); text = x.toFixed(6); if (Number(text) !== x) throw new Error(`${label} supports at most six decimal places.`); }
  if (!/^[+-]?\d+(?:\.\d{1,6})?$/.test(text)) throw new Error(`${label} supports an ordinary decimal with at most six decimal places.`);
  const negative = text.startsWith('-'); text = text.replace(/^[+-]/, '');
  const [whole, fraction = ''] = text.split('.');
  const valueScaled = BigInt(whole) * MICRO + BigInt(fraction.padEnd(6, '0'));
  return negative ? -valueScaled : valueScaled;
}
function roundRatio(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error('Rounding denominator must be positive.');
  const sign = numerator < 0n ? -1n : 1n, absolute = numerator < 0n ? -numerator : numerator;
  return sign * ((absolute * 2n + denominator) / (2n * denominator));
}
const money = (minor: bigint) => {
  if (minor > BigInt(Number.MAX_SAFE_INTEGER) || minor < -BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('The monetary total exceeds the supported exact minor-unit range.');
  return Number(minor) / 100;
};
const bigSum = (values: bigint[]) => values.reduce((total, value) => total + value, 0n);
function rawDecimals(raw: number | string, count?: number): string[] {
  const values = String(raw).trim().split(/[\s,;]+/);
  if (count && values.length === 1) return Array(count).fill(values[0]);
  if (count && values.length !== count) throw new Error(`Expected ${count} decimal entries.`);
  return values;
}

export const economics: EngineeringTool[] = [
  defineTool({ id: 'T47', title: 'Interval tariff & demand bill', category, description: 'Separate imported/exported energy, aligned interval peak demand, standing charges and tax with explicit decimal rounding.',
    inputs: [T('imports', 'Metered import energy by interval', 'Comma-separated kWh; at most six decimals.'), T('exports', 'Metered export energy by interval', 'One value or one per import interval; kWh.'), T('importRates', 'Import tariff by interval', 'One price/kWh or one per interval. Negative prices are supported.'), T('exportRates', 'Export tariff by interval', 'One price/kWh or one per interval.'), N('minutes', 'Aligned demand interval duration', 'min', 0), N('demandRate', 'Charge per peak aligned kW for this period', 'currency/kW', 0), N('standing', 'Standing charge per billable day', 'currency/day', 0), N('days', 'Billable day count', 'days', 0, 36600), N('tax', 'Tax rate', '%', 0, 100), S('taxBasis', 'Tax basis', [['gross', 'Import + demand + standing, before export credit'], ['net', 'Net charges after export credit']]), S('currency', 'Currency denomination', [['EUR', 'EUR'], ['NGN', 'NGN'], ['USD', 'USD'], ['GBP', 'GBP']])],
    exampleInputs: { imports: '18.4', exports: '0', importRates: '.30', exportRates: '0', minutes: 480, demandRate: 0, standing: 0, days: 1, tax: 0, taxBasis: 'gross', currency: 'EUR' },
    calculate(v) {
      const imported = list(v, 'imports', 0), exported = expand(list(v, 'exports', 0), imported.length, 'Export energy'), rates = expand(list(v, 'importRates'), imported.length, 'Import prices'), exportRates = expand(list(v, 'exportRates'), imported.length, 'Export prices');
      const eIn = rawDecimals(v.imports).map(x => scaled(x, 'Import energy')), eOut = rawDecimals(v.exports, imported.length).map(x => scaled(x, 'Export energy')), rIn = rawDecimals(v.importRates, imported.length).map(x => scaled(x, 'Import price')), rOut = rawDecimals(v.exportRates, imported.length).map(x => scaled(x, 'Export price'));
      const energyMinor = roundRatio(bigSum(eIn.map((x, i) => x * rIn[i])) * 100n, MICRO * MICRO), creditMinor = roundRatio(bigSum(eOut.map((x, i) => x * rOut[i])) * 100n, MICRO * MICRO);
      const minutes = positive(v, 'minutes'), minutesScaled = scaled(v.minutes, 'Interval duration'), maximumInterval = eIn.reduce((maximum, value) => value > maximum ? value : maximum, 0n);
      const demandMinor = roundRatio(maximumInterval * 60n * scaled(v.demandRate, 'Demand price') * 100n, minutesScaled * MICRO);
      const fixedMinor = roundRatio(scaled(v.standing, 'Standing charge') * BigInt(integer(v, 'days', 0, 36600)) * 100n, MICRO);
      const subtotalMinor = energyMinor + demandMinor + fixedMinor - creditMinor, taxBasisMinor = v.taxBasis === 'gross' ? energyMinor + demandMinor + fixedMinor : subtotalMinor;
      const taxMinor = roundRatio(taxBasisMinor * scaled(v.tax, 'Tax rate'), 100n * MICRO), unit = String(v.currency);
      return result([row('Physical import', sum(imported), 'kWh'), row('Physical export', sum(exported), 'kWh'), row('Peak aligned interval import demand', Math.max(...imported) * 60 / minutes, 'kW'), row('Import energy charge', money(energyMinor), unit), row('Demand charge', money(demandMinor), unit), row('Standing charge', money(fixedMinor), unit), row('Export credit (subtracted)', money(creditMinor), unit), row('Subtotal', money(subtotalMinor), unit), row('Tax', money(taxMinor), unit), row('Total bill estimate', money(subtotalMinor + taxMinor), unit)], 'Energy charge = Σ(import kWh × price); demand = max(interval import kWh / elapsed h) × price; total = charges − export credits + selected tax', ['Prices are supplied for every interval; assign the intended time-of-use/calendar band before using this worksheet.', 'All selected currencies use two minor-unit decimals here. Each aggregate charge and tax line is rounded half away from zero using integer decimal arithmetic. Inputs support six decimal places.', 'Demand uses aligned intervals. Rolling-window demand and provider-specific tariff rules are not inferred.', 'Currency selection is denomination only; it does not perform foreign-exchange conversion.', `Tax basis: ${v.taxBasis === 'gross' ? 'import + demand + standing, excluding export credit' : 'net charges after export credit'}. Negative taxable amounts produce a negative tax estimate; verify applicability.`]);
    }
  }),
  defineTool({ id: 'T48', title: 'Standby & replacement savings', category, description: 'Compare entered old/new active and standby input power over the same explicit period.',
    inputs: [N('oldPower', 'Existing active electrical input', 'W', 0), N('newPower', 'Replacement active electrical input', 'W', 0), N('oldStandby', 'Existing standby electrical input', 'W', 0), N('newStandby', 'Replacement standby electrical input', 'W', 0), N('hours', 'Active hours per assumed 24-hour day', 'h/day', 0, 24), N('days', 'Number of assumed days', 'days', 0), N('price', 'Energy price', 'currency/kWh')],
    exampleInputs: { oldPower: 100, newPower: 20, oldStandby: 5, newStandby: 1, hours: 8, days: 30, price: .3 },
    calculate(v) { const h = n(v, 'hours', 0, 24), days = n(v, 'days', 0), old = (n(v, 'oldPower', 0) * h + n(v, 'oldStandby', 0) * (24 - h)) * days / 1000, replacement = (n(v, 'newPower', 0) * h + n(v, 'newStandby', 0) * (24 - h)) * days / 1000; return result([row('Existing energy', old, 'kWh'), row('Replacement energy', replacement, 'kWh'), row('Energy reduction', old - replacement, 'kWh'), row('Energy-charge reduction', (old - replacement) * n(v, 'price'), 'currency')], 'E = [Pactive × active hours + Pstandby × (24 − active hours)] × days/1000', ['Assumed 24-hour daily estimate; not a calendar/DST simulation.', 'Equipment must provide comparable service. Fixed/demand charges and capital costs are separate.']); }
  }),
  defineTool({ id: 'T49', title: 'Operational electricity carbon', category, description: 'Apply a geographically and temporally identified user-supplied operational emissions factor to imported electricity.',
    inputs: [N('energy', 'Physical imported electricity', 'kWh', 0), N('factor', 'Operational emissions factor', 'kg CO₂e/kWh', 0), sourceInput('source', 'Factor publisher, URL and method'), sourceInput('geography', 'Factor geographical scope'), sourceInput('period', 'Factor year / applicable period')],
    exampleInputs: { energy: 1000, factor: .4 },
    calculate(v) { const kg = n(v, 'energy', 0) * n(v, 'factor', 0); return evidence(result([row('Estimated operational emissions', kg, 'kg CO₂e'), row('Estimated operational emissions', kg / 1000, 't CO₂e')], 'Operational CO₂e = imported kWh × applicable kg CO₂e/kWh', ['No automatic emissions credit for exports. Embodied impacts, offsets and supplier marketing claims are excluded.', 'The example factor is an analytical assumption, not a current national emissions value.']), v, ['source', 'geography', 'period']); }
  }),
  defineTool({ id: 'T50', title: 'Simple payback & break-even', category, description: 'Undiscounted constant annual savings compared with entered investment and recurring costs.',
    inputs: [N('investment', 'Initial investment', 'currency', 0), N('saving', 'Annual gross cost saving', 'currency/year'), N('maintenance', 'Additional annual maintenance cost', 'currency/year', 0), N('horizon', 'Assessment horizon', 'years', 0)],
    exampleInputs: { investment: 5000, saving: 1200, maintenance: 200, horizon: 10 },
    calculate(v) { const investment = n(v, 'investment', 0), net = n(v, 'saving') - n(v, 'maintenance', 0), years = n(v, 'horizon', 0), payback = net > 0 ? investment / net : null; return result([row('Net annual saving', net, 'currency/year'), row('Simple payback', payback ?? 'No positive annual saving: no payback', 'years'), row('Undiscounted net benefit at horizon', net * years - investment, 'currency'), row('Break-even within horizon', payback !== null && payback <= years ? 'Yes under constant assumptions' : 'No under entered assumptions')], 'Net saving = gross saving − added maintenance; payback = investment/net annual saving', ['No financing, discounting, tax, replacement, degradation or future price prediction is included. Use the discounted cash-flow worksheet for an explicit discount model.']); }
  }),
  defineTool({ id: 'T51', title: 'NPV & discount-rate sensitivity', category, description: 'Explicit annual cash flows, saving escalation, fixed annual maintenance and end-of-horizon residual value.',
    inputs: [N('investment', 'Initial investment', 'currency', 0), N('saving', 'First-year gross annual saving', 'currency'), N('maintenance', 'Fixed annual added maintenance', 'currency', 0), N('escalation', 'Annual gross-saving escalation', '%', -99.99), N('discount', 'Annual discount rate', '%', -99.99), N('horizon', 'Number of years', 'years', 1, 100), N('residual', 'End-of-horizon residual value', 'currency'), N('sensitivity', 'Discount-rate sensitivity half-width', 'percentage points', 0)],
    exampleInputs: { investment: 1000, saving: 600, maintenance: 0, escalation: 0, discount: 10, horizon: 2, residual: 0, sensitivity: 2 },
    calculate(v) { const investment = n(v, 'investment', 0), saving = n(v, 'saving'), maintenance = n(v, 'maintenance', 0), growth = n(v, 'escalation', -99.99) / 100, rate = n(v, 'discount', -99.99) / 100, horizon = integer(v, 'horizon', 1, 100), residual = n(v, 'residual'), width = n(v, 'sensitivity', 0) / 100; if (rate - width <= -1) throw new Error('Every sensitivity discount rate must be greater than −100%.'); let cumulative = -investment, breakEven: number | string = investment === 0 ? 0 : 'None within horizon'; const series: Array<Record<string, number | string>> = []; for (let year = 1; year <= horizon; year++) { const gross = saving * (1 + growth) ** (year - 1), cash = gross - maintenance + (year === horizon ? residual : 0), discounted = cash / (1 + rate) ** year; cumulative += discounted; if (typeof breakEven === 'string' && cumulative >= 0) breakEven = year; series.push({ year, grossSaving: gross, cashFlow: cash, discountedCashFlow: discounted, cumulativeDiscountedCashFlow: cumulative }); } const npvAt = (r: number) => -investment + sum(series.map(entry => Number(entry.cashFlow) / (1 + r) ** Number(entry.year))); const out = result([row('Net present value', cumulative, 'currency'), row('First cumulative discounted break-even year', breakEven, 'year'), row(`NPV at ${(rate - width) * 100}% discount`, npvAt(rate - width), 'currency'), row(`NPV at ${(rate + width) * 100}% discount`, npvAt(rate + width), 'currency')], 'NPV = −investment + Σyear[(saving₁(1+escalation)^(year−1) − maintenance + final residual)/(1+discount)^year]', ['Cash flows occur at each year end. Gross saving escalates; maintenance is held constant in this stated model.', 'A first break-even year is not a guarantee that later cumulative cash flow remains positive.', 'Entered scenarios are assumptions, not forecasts or investment advice.']); out.series = series; return out; }
  }),
];
