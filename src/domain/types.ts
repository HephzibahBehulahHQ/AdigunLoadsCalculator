export const SCHEMA_VERSION = 1 as const;
export const ENGINE_VERSION = '1.0.0';
export type Phase = 'L1' | 'L2' | 'L3';
export type Connection = 'single' | 'three' | 'line-line' | 'dc';
export type EntryMode = 'kw' | 'kva' | 'amps' | 'motor' | 'complex';
export type Assessment = 'passed' | 'failed' | 'warning' | 'incomplete' | 'not-applicable' | 'unsupported';
export type Origin = 'entered' | 'measured' | 'calculated' | 'simulated' | 'assumed';
export interface SourceEvidence {
  kind: 'nameplate' | 'measured' | 'datasheet' | 'estimate' | 'user';
  reference: string;
  date?: string;
}
export interface Load {
  id: string;
  name: string;
  category: string;
  quantity: number;
  entryMode: EntryMode;
  /** kW, kVA, A, shaft kW or real kW, as selected by entryMode. */
  rating: number;
  /** Line-neutral for single, line-line for three/line-line, terminal voltage for DC. */
  voltage: number;
  connection: Connection;
  pf: number;
  pfKind?: 'displacement' | 'true';
  reactive: 'lagging' | 'leading';
  /** Per-unit signed kvar for explicit complex entry. */
  reactiveKvar?: number;
  efficiency: number;
  phase: Phase;
  phasePair?: [Phase, Phase];
  hoursPerDay: number;
  startHour: number;
  /** Energy-average duty within the operating window; never reduces on-state current. */
  duty: number;
  /** Explicit on-state operating fraction; independent from energy duty. */
  utilization: number;
  standbyW: number;
  weekdays?: number[];
  critical: boolean;
  locked: boolean;
  boardId?: string;
  circuitId?: string;
  startingMultiplier?: number;
  startingPF?: number;
  startingSeconds?: number;
  source: SourceEvidence;
  notes: string;
}
export interface Cable {
  lengthM: number;
  resistanceOhmPerKm?: number;
  reactanceOhmPerKm?: number;
  areaMm2?: number;
  baseAmpacityA?: number;
  correctionFactors?: number[];
  voltageDropLimitPercent?: number;
  source?: string;
}
export interface Board {
  id: string;
  name: string;
  parentId?: string;
  ratedA: number;
  ways: number;
}
export interface Circuit {
  id: string;
  name: string;
  boardId: string;
  phase: Phase;
  locked: boolean;
  protectiveA?: number;
  breakingCapacityKA?: number;
  prospectiveFaultKA?: number;
  cable?: Cable;
  notes?: string;
}
export interface TariffBand {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  importRate: number;
  weekdays?: number[];
}
export interface Tariff {
  importRate: number;
  exportRate: number;
  standingPerDay: number;
  demandPerKW: number;
  taxPercent: number;
  bands: TariffBand[];
  source: string;
  carbonKgPerKWh?: number;
}
export interface BatterySettings {
  capacityKWh: number;
  initialSoc: number;
  minSoc: number;
  maxSoc: number;
  chargeKW: number;
  dischargeKW: number;
  chargeEfficiency: number;
  dischargeEfficiency: number;
  islandCapable: boolean;
}
export interface EnergySettings {
  /** Entered/analytical profile only; no weather retrieval is implied. */
  pvKW: number;
  peakSunHours: number;
  pvPerformanceRatio: number;
  battery: BatterySettings;
  /** Explicit normalized hourly profile. Missing profile uses no chronological PV generation. */
  pvHourlyProfile?: number[];
  source: string;
}
export interface EVSession {
  id: string;
  name: string;
  arrivalHour: number;
  departureHour: number;
  requiredKWh: number;
  chargerKW: number;
  vehicleKW: number;
  efficiency: number;
  siteLimitKW: number;
  phase?: Phase;
}
export interface ContactDetails { name: string; address: string; email: string; phone?: string; taxId?: string }
export interface EstimateLine { id: string; description: string; quantity: number; unit: string; unitPrice: number }
export interface BillingSettings {
  seller: ContactDetails;
  customer: ContactDetails;
  reference: string;
  issueDate: string;
  dueDate: string;
  taxPercent: number;
  discountPercent: number;
  lines: EstimateLine[];
  notes: string;
}
export interface Project {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  context: string;
  timezone: string;
  currency: string;
  jurisdiction: string;
  supply: { voltageLN: number; voltageLL: number; frequency: number; limitA: number };
  coincidence: number;
  growthPercent: number;
  loads: Load[];
  boards: Board[];
  circuits: Circuit[];
  tariff: Tariff;
  energy: EnergySettings;
  evSessions: EVSession[];
  billing: BillingSettings;
  notes: string;
  referenceCase?: string;
}
export interface Issue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  assessment: Assessment;
  message: string;
  entityId?: string;
  field?: string;
}
export interface Trace {
  method: string;
  formula: string;
  assumptions: string[];
  sources: string[];
  revision: number;
  engineVersion: string;
  origin: Origin;
  assessment: Assessment;
  /** Supplied project timestamp; the pure engine does not read a clock. */
  inputTimestamp: string;
}
export interface Complex { re: number; im: number }
export interface NormalizedLoad {
  id: string;
  installedKW: number;
  operatingKW: number;
  reactiveKvar: number | null;
  apparentKVA: number;
  currentA: number;
  energyKWh: number;
  phaseCurrents: Record<Phase, Complex>;
  issues: Issue[];
  valid: boolean;
}
export interface ProfilePoint {
  hour: number;
  kw: number;
  kWh: number;
  phaseKW: Record<Phase, number>;
}
export interface CalculationResult {
  revision: number;
  engineVersion: string;
  installedKW: number;
  operatingKW: number;
  designKW: number;
  reactiveKvar: number | null;
  apparentKVA: number;
  powerFactor: number | null;
  phaseCurrents: Record<Phase, number>;
  phaseOnStateCurrents: Record<Phase, number>;
  neutralA: number | null;
  imbalancePercent: number;
  dailyKWh: number;
  monthlyKWh: number;
  dailyCost: number;
  monthlyCost: number;
  peakKW: number;
  loads: NormalizedLoad[];
  profile: ProfilePoint[];
  issues: Issue[];
  trace: Trace;
  complete: boolean;
}
