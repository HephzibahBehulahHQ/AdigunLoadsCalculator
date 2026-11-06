export const SCHEMA_VERSION = 1 as const;
export const ENGINE_VERSION = "1.1.0";
export type Phase = "L1" | "L2" | "L3";
export type Connection = "single" | "three" | "line-line" | "dc";
export type EntryMode = "kw" | "kva" | "amps" | "motor" | "complex";
export type Assessment =
  | "passed"
  | "failed"
  | "warning"
  | "incomplete"
  | "not-applicable"
  | "unsupported";
export type Origin =
  "entered" | "measured" | "calculated" | "simulated" | "assumed";
export interface SourceEvidence {
  kind: "nameplate" | "measured" | "datasheet" | "estimate" | "user";
  reference: string;
  date?: string;
}
export interface ScheduleWindow {
  id: string;
  startHour: number;
  durationHours: number;
  weekdays?: number[];
  months?: number[];
  /** Inclusive local calendar dates; an overnight window belongs to its start date. */
  effectiveFrom?: string;
  effectiveTo?: string;
}
export interface ScheduleException {
  date: string;
  mode: "closed" | "replace";
  windows?: ScheduleWindow[];
}
export interface InstantWindow {
  start: string;
  end: string;
}
export interface LoadSchedule {
  /** Overlaps are unioned. An empty array means no recurring operation. */
  windows: ScheduleWindow[];
  /** A date exception overrides that whole local date, including overnight carry-in. */
  exceptions?: ScheduleException[];
  /** Explicit wall-clock cycle, anchored at local midnight plus offset. Replaces energy-average duty. */
  timedCycle?: { onMinutes: number; offMinutes: number; offsetMinutes: number };
  /** When present, replaces all recurring windows. Explicit-offset instants resolve DST ambiguity. */
  absoluteWindows?: InstantWindow[];
}
export interface StartEvent {
  id: string;
  loadId: string;
  start: string;
  durationSeconds: number;
  /** Total current for the load quantity; either currentA or multiplier is required. */
  currentA?: number;
  multiplier?: number;
  pf: number;
  method: "dol" | "star-delta" | "soft-starter" | "vfd" | "user";
  source: string;
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
  pfKind?: "displacement" | "true";
  reactive: "lagging" | "leading";
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
  schedule?: LoadSchedule;
  libraryRef?: { templateId: string; version: number };
  source: SourceEvidence;
  notes: string;
}
export interface Cable {
  lengthM: number;
  resistanceOhmPerKm?: number;
  reactanceOhmPerKm?: number;
  /** Omitted return impedance uses the entered outgoing impedance, explicitly labelled equal-conductor model. */
  returnResistanceOhmPerKm?: number;
  returnReactanceOhmPerKm?: number;
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
  /** Source/parent-to-board radial segment, using per-conductor impedance and one-way length. */
  feeder?: Cable;
  notes?: string;
  zoneId?: string;
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
  effectiveFrom?: string;
  effectiveTo?: string;
  exportRate?: number;
}
export interface DemandRule {
  method: "aligned" | "rolling";
  windowMinutes: number;
  /** Rolling windows advance by this many elapsed minutes. */
  stepMinutes: number;
  /** Aligned windows use elapsed minutes since this explicit-offset instant; default UTC epoch. */
  alignmentOrigin?: string;
  period: "range" | "calendar-month";
  startHour?: number;
  endHour?: number;
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
  demandRule?: DemandRule;
  taxBasis?: "net" | "imports-and-fixed";
  standingBasis?: "elapsed-24h" | "local-calendar-days";
  /** A base rate is an explicit fallback. Select complete-bands to reject uncovered local minutes. */
  coverage?: "base-rate" | "complete-bands";
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
  /** Entered AC wind output, one value per hour. No turbine/weather model is inferred. */
  windHourlyKW?: number[];
  windSource?: string;
  inverterACLimitKW?: number;
  gridImportLimitKW?: number;
  gridExportLimitKW?: number;
  dispatch?: {
    strategy: "self-consumption" | "reserve" | "time-of-use" | "peak-shaving";
    reserveSoc: number;
    peakLimitKW?: number;
    allowGridCharge: boolean;
    gridChargeWindows: {
      startHour: number;
      endHour: number;
      targetSoc: number;
    }[];
  };
  backup?: {
    sourceId?: string;
    criticalOnly: boolean;
    priorityLoadIds: string[];
    restartDelayMinutes: number;
    requireBlackStart: boolean;
  };
}
export interface SourceEquipment {
  id: string;
  name: string;
  type: "grid" | "transformer" | "generator" | "inverter" | "ups";
  boardId?: string;
  connection: "single" | "three" | "dc";
  phase?: Phase;
  voltageV: number;
  continuousKW: number;
  continuousKVA: number;
  derating: number;
  overload?: {
    kw: number;
    kva: number;
    durationSeconds: number;
    source: string;
  };
  islandCapable: boolean;
  gridForming: boolean;
  transferIsolationVerified: boolean;
  blackStart: boolean;
  restartSeconds: number;
  source: SourceEvidence;
  notes: string;
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
  minimumKW?: number;
  connection?: "single" | "three";
  energyBasis?: "required" | "soc";
  usableCapacityKWh?: number;
  initialSoc?: number;
  targetSoc?: number;
}
export interface FlexibleLoad {
  id: string;
  name: string;
  loadId: string;
  windows: InstantWindow[];
  requiredKWh: number;
  minimumRunMinutes: number;
  interruptible: boolean;
  locked: boolean;
  priority: number;
  source: string;
}
export interface DiagramSettings {
  version: 1;
  pageSize: "a4" | "a3";
  orientation: "landscape" | "portrait";
  showLabels: boolean;
  showRatings: boolean;
  positions: Record<string, { x: number; y: number }>;
  notes: { id: string; text: string; x: number; y: number }[];
}
export interface ContactDetails {
  name: string;
  address: string;
  email: string;
  phone?: string;
  taxId?: string;
}
export interface EstimateLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}
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
  supply: {
    voltageLN: number;
    voltageLL: number;
    frequency: number;
    limitA: number;
  };
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
  scenarioOf?: string;
  baselineRevision?: number;
  baselineId?: string;
  scenarioBaseline?: {
    capturedAt: string;
    projectId: string;
    revision: number;
    project: Omit<Project, "scenarioBaseline">;
  };
  equipmentLibrary?: Load[];
  equipmentFavorites?: string[];
  equipmentVersions?: {
    templateId: string;
    version: number;
    capturedAt: string;
    record: Load;
  }[];
  diagram?: DiagramSettings;
  startEvents?: StartEvent[];
  flexibleLoads?: FlexibleLoad[];
  reportDetails?: {
    reference: string;
    preparedBy: string;
    customer: string;
    scopeNotes: string;
  };
  sources?: SourceEquipment[];
  zones?: {
    id: string;
    name: string;
    kind: "building" | "zone";
    parentId?: string;
  }[];
}
export interface Issue {
  id: string;
  severity: "error" | "warning" | "info";
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
export interface Complex {
  re: number;
  im: number;
}
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
