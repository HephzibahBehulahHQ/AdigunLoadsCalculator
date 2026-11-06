import {
  SCHEMA_VERSION,
  type Board,
  type Circuit,
  type Load,
  type Project,
} from "./types";
import { explicitInstant, validCalendarDate, validateInstantWindows, validateSchedule } from "../engine/calendar";

export function newId(prefix = "id"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createLoad(overrides: Partial<Load> = {}): Load {
  return {
    id: newId("load"),
    name: "",
    category: "General",
    quantity: 1,
    entryMode: "kw",
    rating: 1,
    voltage: 230,
    connection: "single",
    pf: 1,
    pfKind: "displacement",
    reactive: "lagging",
    efficiency: 0.9,
    phase: "L1",
    hoursPerDay: 8,
    startHour: 8,
    duty: 1,
    utilization: 1,
    standbyW: 0,
    critical: false,
    locked: false,
    source: {
      kind: "user",
      reference: "User-entered input; verify against equipment data.",
    },
    notes: "",
    ...overrides,
  };
}

export function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: newId("board"),
    name: "Main board",
    ratedA: 63,
    ways: 12,
    ...overrides,
  };
}

export function createCircuit(
  boardId: string,
  overrides: Partial<Circuit> = {},
): Circuit {
  return {
    id: newId("circuit"),
    name: "New circuit",
    boardId,
    phase: "L1",
    locked: false,
    ...overrides,
  };
}

export function createProject(
  name = "Untitled project",
  timestamp = new Date().toISOString(),
): Project {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId("project"),
    name,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    context: "Residential",
    timezone: "Europe/Berlin",
    currency: "EUR",
    jurisdiction: "User-entered design criteria",
    supply: { voltageLN: 230, voltageLL: 400, frequency: 50, limitA: 63 },
    coincidence: 1,
    growthPercent: 0,
    loads: [],
    boards: [createBoard()],
    circuits: [],
    tariff: {
      importRate: 0.3,
      exportRate: 0,
      standingPerDay: 0,
      demandPerKW: 0,
      taxPercent: 0,
      bands: [],
      source: "Editable planning assumption; not a retrieved tariff.",
    },
    energy: {
      pvKW: 0,
      peakSunHours: 4,
      pvPerformanceRatio: 0.8,
      battery: {
        capacityKWh: 0,
        initialSoc: 0.5,
        minSoc: 0.2,
        maxSoc: 0.95,
        chargeKW: 0,
        dischargeKW: 0,
        chargeEfficiency: 0.95,
        dischargeEfficiency: 0.95,
        islandCapable: false,
      },
      source:
        "User-entered planning assumptions; no weather service connected.",
    },
    evSessions: [],
    billing: {
      seller: { name: "", address: "", email: "" },
      customer: { name: "", address: "", email: "" },
      reference: "",
      issueDate: timestamp.slice(0, 10),
      dueDate: "",
      taxPercent: 0,
      discountPercent: 0,
      lines: [],
      notes: "",
    },
    notes: "",
  };
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 100000;
const uniqueIds = (rows: unknown[], name: string, errors: string[]) => {
  const seen = new Set<string>();
  for (const row of rows) {
    if (
      !record(row) ||
      typeof row.id !== "string" ||
      !row.id ||
      row.id.length > 200
    ) {
      errors.push(`${name}: every record needs a valid ID.`);
      continue;
    }
    if (seen.has(row.id)) errors.push(`${name}: duplicate ID ${row.id}.`);
    seen.add(row.id);
  }
};

function validateCable(value: unknown, label: string, errors: string[]) {
  if (!record(value) || !finite(value.lengthM) || value.lengthM < 0) { errors.push(`${label}: invalid cable length.`); return; }
  for (const field of ["resistanceOhmPerKm", "reactanceOhmPerKm", "returnResistanceOhmPerKm", "returnReactanceOhmPerKm", "areaMm2", "baseAmpacityA", "voltageDropLimitPercent"])
    if (value[field] !== undefined && (!finite(value[field]) || value[field] < 0)) errors.push(`${label}: invalid ${field}.`);
  if (value.correctionFactors !== undefined && (!Array.isArray(value.correctionFactors) || value.correctionFactors.some((factor) => !finite(factor) || factor <= 0))) errors.push(`${label}: invalid correction factors.`);
  if (value.source !== undefined && !text(value.source)) errors.push(`${label}: invalid evidence source.`);
}

/** Reusable trust-boundary checks for optional planning data, without mutating the project. */
export function validateProjectExtensions(candidate: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (candidate.zones !== undefined) {
    if (!Array.isArray(candidate.zones) || candidate.zones.length > 10000) errors.push("Organization must contain at most 10,000 buildings/zones.");
    else {
      uniqueIds(candidate.zones, "Buildings/zones", errors);
      const zones = new Map(candidate.zones.filter(record).map((row) => [row.id, row]));
      for (const zone of zones.values()) {
        if (!text(zone.name) || !["building", "zone"].includes(String(zone.kind)) || (zone.parentId !== undefined && (!text(zone.parentId) || !zones.has(zone.parentId)))) errors.push("Invalid building/zone name, kind or parent reference.");
        const seen = new Set<unknown>([zone.id]);
        let parent = zone.parentId;
        while (parent !== undefined) {
          if (seen.has(parent) || seen.size > 100) { errors.push("Building/zone hierarchy contains a cycle or exceeds 100 levels."); break; }
          seen.add(parent); parent = zones.get(parent)?.parentId;
        }
      }
    }
  }
  if (candidate.reportDetails !== undefined) {
    if (!record(candidate.reportDetails)) errors.push("Invalid report details.");
    else for (const [key, limit] of [["reference", 120], ["preparedBy", 1000], ["customer", 1000], ["scopeNotes", 4000]] as const)
      if (typeof candidate.reportDetails[key] !== "string" || candidate.reportDetails[key].length > limit) errors.push(`Report ${key} must be text of at most ${limit} characters.`);
  }
  if (candidate.sources !== undefined) {
    if (!Array.isArray(candidate.sources) || candidate.sources.length > 1000) errors.push("Source equipment must be an array of at most 1,000 records.");
    else {
      uniqueIds(candidate.sources, "Source equipment", errors);
      for (const source of candidate.sources) {
        if (!record(source)) continue;
        if (!text(source.name) || !text(source.notes) || !["grid", "transformer", "generator", "inverter", "ups"].includes(String(source.type)) || !["single", "three", "dc"].includes(String(source.connection))) errors.push("Invalid source equipment description or connection.");
        if (source.connection === "single" && !["L1", "L2", "L3"].includes(String(source.phase))) errors.push("Single-phase sources require an explicit phase.");
        if (!finite(source.voltageV) || source.voltageV <= 0 || !finite(source.continuousKW) || source.continuousKW < 0 || !finite(source.continuousKVA) || source.continuousKVA <= 0 || source.continuousKW > source.continuousKVA || !finite(source.derating) || source.derating <= 0 || source.derating > 1 || !finite(source.restartSeconds) || source.restartSeconds < 0) errors.push("Source ratings, derating and restart time must be finite and physically consistent.");
        for (const key of ["islandCapable", "gridForming", "transferIsolationVerified", "blackStart"]) if (typeof source[key] !== "boolean") errors.push(`Source ${key} evidence must be explicit.`);
        if (!record(source.source) || !text(source.source.reference) || !["nameplate", "measured", "datasheet", "estimate", "user"].includes(String(source.source.kind))) errors.push("Source equipment requires entered provenance.");
        if (source.boardId !== undefined && (!text(source.boardId) || !Array.isArray(candidate.boards) || !candidate.boards.some((board) => record(board) && board.id === source.boardId))) errors.push("Source equipment references a missing board.");
        if (source.overload !== undefined) {
          const limit = source.overload;
          if (!record(limit) || !finite(limit.kw) || limit.kw < 0 || !finite(limit.kva) || limit.kva <= 0 || limit.kw > limit.kva || !finite(limit.durationSeconds) || limit.durationSeconds <= 0 || !text(limit.source)) errors.push("Overload limits require entered kW/kVA/time and provenance.");
        }
      }
    }
  }
  if (record(candidate.energy)) {
    const energy = candidate.energy;
    if (energy.windHourlyKW !== undefined && (!Array.isArray(energy.windHourlyKW) || energy.windHourlyKW.length !== 24 || energy.windHourlyKW.some((value) => !finite(value) || value < 0))) errors.push("Entered wind profile requires 24 nonnegative AC kW values.");
    if (energy.windSource !== undefined && !text(energy.windSource)) errors.push("Wind provenance must be text.");
    for (const key of ["inverterACLimitKW", "gridImportLimitKW", "gridExportLimitKW"]) if (energy[key] !== undefined && (!finite(energy[key]) || energy[key] < 0)) errors.push(`Energy ${key} must be finite and nonnegative.`);
    if (energy.dispatch !== undefined) {
      const dispatch = energy.dispatch;
      if (!record(dispatch) || !["self-consumption", "reserve", "time-of-use", "peak-shaving"].includes(String(dispatch.strategy)) || !finite(dispatch.reserveSoc) || dispatch.reserveSoc < 0 || dispatch.reserveSoc > 1 || typeof dispatch.allowGridCharge !== "boolean" || !Array.isArray(dispatch.gridChargeWindows) || dispatch.gridChargeWindows.length > 100) errors.push("Invalid battery dispatch strategy, reserve or charging permission.");
      else {
        if (dispatch.peakLimitKW !== undefined && (!finite(dispatch.peakLimitKW) || dispatch.peakLimitKW < 0)) errors.push("Peak-shaving target must be finite and nonnegative.");
        const chargingSpans: [number, number][] = [];
        for (const row of dispatch.gridChargeWindows) {
          if (!record(row) || !finite(row.startHour) || row.startHour < 0 || row.startHour >= 24 || !finite(row.endHour) || row.endHour < 0 || row.endHour > 24 || row.startHour === row.endHour || !finite(row.targetSoc) || row.targetSoc < 0 || row.targetSoc > 1) errors.push("Invalid grid-charge window or target SOC.");
          else {
            const spans: [number, number][] = row.startHour < row.endHour ? [[row.startHour, row.endHour]] : [[row.startHour, 24], [0, row.endHour]];
            for (const [start, end] of spans) {
              if (chargingSpans.some(([priorStart, priorEnd]) => Math.max(start, priorStart) < Math.min(end, priorEnd))) errors.push("Grid-charge windows overlap; enter one target for each interval.");
              chargingSpans.push([start, end]);
            }
          }
        }
      }
    }
    if (energy.backup !== undefined) {
      const backup = energy.backup;
      if (!record(backup) || typeof backup.criticalOnly !== "boolean" || typeof backup.requireBlackStart !== "boolean" || !finite(backup.restartDelayMinutes) || backup.restartDelayMinutes < 0 || backup.restartDelayMinutes > 1440 || !Array.isArray(backup.priorityLoadIds) || backup.priorityLoadIds.some((id) => typeof id !== "string" || !Array.isArray(candidate.loads) || !candidate.loads.some((load) => record(load) && load.id === id))) errors.push("Invalid backup priorities, restart timing or explicit critical/black-start flags.");
      else if (backup.sourceId !== undefined && (!text(backup.sourceId) || !Array.isArray(candidate.sources) || !candidate.sources.some((source) => record(source) && source.id === backup.sourceId))) errors.push("Backup references a missing entered supply.");
    }
  }
  if (candidate.baselineId !== undefined && (!text(candidate.baselineId) || !candidate.baselineId)) errors.push("Invalid baseline ID.");
  if (Array.isArray(candidate.loads)) for (const load of candidate.loads) if (record(load) && load.schedule !== undefined) errors.push(...validateSchedule(load.schedule).map((message) => `Load ${String(load.name)}: ${message}`));
  if (Array.isArray(candidate.boards)) for (const board of candidate.boards) if (record(board)) {
    if (board.feeder !== undefined) validateCable(board.feeder, `Board ${String(board.name)} feeder`, errors);
    if (board.notes !== undefined && !text(board.notes)) errors.push(`Board ${String(board.name)}: invalid notes.`);
    if (board.zoneId !== undefined && (!text(board.zoneId) || !Array.isArray(candidate.zones) || !candidate.zones.some((zone) => record(zone) && zone.id === board.zoneId))) errors.push(`Board ${String(board.name)}: missing building/zone reference.`);
  }
  if (Array.isArray(candidate.circuits)) for (const circuit of candidate.circuits) if (record(circuit) && circuit.cable !== undefined) validateCable(circuit.cable, `Circuit ${String(circuit.name)}`, errors);
  const loadIds = new Set(Array.isArray(candidate.loads) ? candidate.loads.filter(record).map((load) => load.id) : []);
  for (const key of ["startEvents", "flexibleLoads"]) if (candidate[key] !== undefined) {
    if (!Array.isArray(candidate[key]) || candidate[key].length > 10000) { errors.push(`${key} must be an array of at most 10,000 records.`); continue; }
    uniqueIds(candidate[key], key, errors);
    for (const item of candidate[key]) {
      if (!record(item)) continue;
      if (!loadIds.has(item.loadId)) errors.push(`${key}: missing referenced load.`);
      if (!text(item.source)) errors.push(`${key}: source evidence must be text.`);
      if (key === "startEvents") {
        if (!explicitInstant(item.start) || !finite(item.durationSeconds) || item.durationSeconds <= 0 || item.durationSeconds > 86400) errors.push("Start events require explicit-offset timestamps and durations greater than 0 through 86,400 seconds.");
        if (!finite(item.pf) || item.pf <= 0 || item.pf > 1) errors.push("Starting displacement PF must be explicitly supplied between 0 and 1.");
        if ((item.currentA === undefined) === (item.multiplier === undefined)) errors.push("Each start event requires exactly one of total current or multiplier.");
        for (const field of ["currentA", "multiplier"]) if (item[field] !== undefined && (!finite(item[field]) || item[field] <= 0)) errors.push(`Invalid starting ${field}.`);
        if (!["dol", "star-delta", "soft-starter", "vfd", "user"].includes(String(item.method))) errors.push("Invalid entered starting method.");
      } else {
        if (!text(item.name) || !finite(item.requiredKWh) || item.requiredKWh <= 0 || !finite(item.minimumRunMinutes) || !Number.isInteger(item.minimumRunMinutes) || item.minimumRunMinutes < 1 || item.minimumRunMinutes > 10080 || !finite(item.priority) || !Number.isInteger(item.priority) || item.priority < 0 || item.priority > 1000 || typeof item.interruptible !== "boolean" || typeof item.locked !== "boolean") errors.push("Flexible loads require valid name, required energy, minimum run time, priority and explicit lock/interruption flags.");
        errors.push(...validateInstantWindows(item.windows, "Flexible-load windows"));
        if (Array.isArray(item.windows) && !item.windows.length) errors.push("Flexible loads require at least one allowed operating window.");
      }
    }
  }
  if (Array.isArray(candidate.startEvents)) {
    const rows = candidate.startEvents.filter(record).filter((item) => explicitInstant(item.start) && finite(item.durationSeconds)).sort((a, b) => Date.parse(String(a.start)) - Date.parse(String(b.start)));
    const ends = new Map<unknown, number>();
    for (const row of rows) {
      const begin = Date.parse(String(row.start));
      if (begin < (ends.get(row.loadId) ?? -Infinity)) errors.push("Start events for the same load cannot overlap.");
      ends.set(row.loadId, begin + Number(row.durationSeconds) * 1000);
    }
  }
  if (Array.isArray(candidate.flexibleLoads)) {
    const assigned = candidate.flexibleLoads.filter(record).map((item) => item.loadId);
    if (new Set(assigned).size !== assigned.length) errors.push("A load can have only one flexible requirement in a plan.");
  }
  if (record(candidate.tariff)) {
    const tariff = candidate.tariff;
    for (const [field, options] of [["taxBasis", ["net", "imports-and-fixed"]], ["standingBasis", ["elapsed-24h", "local-calendar-days"]], ["coverage", ["base-rate", "complete-bands"]]] as const)
      if (tariff[field] !== undefined && !options.includes(tariff[field] as never)) errors.push(`Invalid tariff ${field}.`);
    if (Array.isArray(tariff.bands)) for (const band of tariff.bands) if (record(band)) {
      for (const key of ["effectiveFrom", "effectiveTo"]) if (band[key] !== undefined && !validCalendarDate(band[key])) errors.push("Tariff effective dates must be actual YYYY-MM-DD dates.");
      if (typeof band.effectiveFrom === "string" && typeof band.effectiveTo === "string" && band.effectiveFrom > band.effectiveTo) errors.push("Tariff effective-date range is reversed.");
      if (band.exportRate !== undefined && !finite(band.exportRate)) errors.push("Tariff export price must be finite.");
    }
    if (tariff.demandRule !== undefined) {
      const rule = tariff.demandRule;
      if (!record(rule) || !["aligned", "rolling"].includes(String(rule.method)) || !["range", "calendar-month"].includes(String(rule.period)) || !finite(rule.windowMinutes) || !Number.isInteger(rule.windowMinutes) || rule.windowMinutes < 1 || rule.windowMinutes > 1440 || !finite(rule.stepMinutes) || !Number.isInteger(rule.stepMinutes) || rule.stepMinutes < 1 || rule.stepMinutes > rule.windowMinutes) errors.push("Invalid aligned/rolling demand-window rule.");
      else {
        if (rule.alignmentOrigin !== undefined && !explicitInstant(rule.alignmentOrigin)) errors.push("Demand alignment requires an explicit-offset timestamp.");
        if ((rule.startHour === undefined) !== (rule.endHour === undefined) || (rule.startHour !== undefined && (!finite(rule.startHour) || rule.startHour < 0 || rule.startHour >= 24 || !finite(rule.endHour) || rule.endHour < 0 || rule.endHour > 24 || rule.startHour === rule.endHour))) errors.push("Invalid demand-charge operating window.");
        if (rule.weekdays !== undefined && (!Array.isArray(rule.weekdays) || !rule.weekdays.length || rule.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))) errors.push("Invalid demand-charge weekdays.");
      }
    }
  }
  if (Array.isArray(candidate.evSessions)) for (const session of candidate.evSessions) if (record(session)) {
    if (session.minimumKW !== undefined && (!finite(session.minimumKW) || session.minimumKW < 0)) errors.push("EV minimum power must be finite and nonnegative.");
    if (session.connection !== undefined && !["single", "three"].includes(String(session.connection))) errors.push("Invalid EV phase connection.");
    if (session.phase !== undefined && !["L1", "L2", "L3"].includes(String(session.phase))) errors.push("Invalid EV phase.");
    if (session.energyBasis !== undefined && !["required", "soc"].includes(String(session.energyBasis))) errors.push("Invalid EV required-energy basis.");
    if (session.energyBasis === "soc" && (!finite(session.usableCapacityKWh) || session.usableCapacityKWh <= 0 || !finite(session.initialSoc) || session.initialSoc < 0 || session.initialSoc > 1 || !finite(session.targetSoc) || session.targetSoc < 0 || session.targetSoc > 1 || session.targetSoc < session.initialSoc)) errors.push("SOC charging requires positive usable capacity and increasing SOC values from 0 to 1.");
  }
  if (candidate.diagram !== undefined) {
    const d = candidate.diagram;
    if (!record(d) || d.version !== 1 || !["a4", "a3"].includes(String(d.pageSize)) || !["landscape", "portrait"].includes(String(d.orientation)) || typeof d.showLabels !== "boolean" || typeof d.showRatings !== "boolean" || !record(d.positions) || Object.keys(d.positions).length > 10000 || !Array.isArray(d.notes) || d.notes.length > 1000) errors.push("Invalid diagram layout settings.");
    else {
      const validPoint = (p: unknown) => record(p) && finite(p.x) && finite(p.y) && Math.abs(p.x) <= 100000 && Math.abs(p.y) <= 100000;
      if (Object.entries(d.positions).some(([key, point]) => !/^(source|board|circuit|load):.{1,200}$/.test(key) || !validPoint(point))) errors.push("Invalid diagram position key or coordinates.");
      uniqueIds(d.notes, "Diagram notes", errors);
      for (const note of d.notes) if (!validPoint(note) || !record(note) || !text(note.text) || note.text.length > 2000) errors.push("Invalid diagram note text or coordinates.");
    }
  }
  return errors;
}

function validateLoadRecord(load: unknown, prefix: string): string[] {
  const errors: string[] = [];
  uniqueIds([load], prefix, errors);
  if (!record(load)) return [`${prefix}: expected a load object.`];
      if (!text(load.name) || !text(load.category) || !text(load.notes))
        errors.push(`${prefix}: invalid text fields.`);
      if (
        !["kw", "kva", "amps", "motor", "complex"].includes(
          String(load.entryMode),
        )
      )
        errors.push(`${prefix}: unsupported entry mode.`);
      if (
        !["single", "three", "line-line", "dc"].includes(
          String(load.connection),
        )
      )
        errors.push(`${prefix}: unsupported connection.`);
      if (!["L1", "L2", "L3"].includes(String(load.phase)))
        errors.push(`${prefix}: invalid phase.`);
      if (!["leading", "lagging"].includes(String(load.reactive)))
        errors.push(`${prefix}: invalid reactive direction.`);
      for (const field of [
        "quantity",
        "rating",
        "voltage",
        "pf",
        "efficiency",
        "hoursPerDay",
        "startHour",
        "duty",
        "utilization",
        "standbyW",
      ])
        if (!finite(load[field]))
          errors.push(`${prefix}: ${field} must be finite.`);
      if (
        finite(load.quantity) &&
        (!Number.isInteger(load.quantity) ||
          load.quantity < 1 ||
          load.quantity > 1000000)
      )
        errors.push(`${prefix}: quantity must be a positive integer.`);
      if (finite(load.rating) && load.rating < 0)
        errors.push(`${prefix}: negative appliance ratings are not supported.`);
      if (finite(load.voltage) && load.voltage <= 0)
        errors.push(`${prefix}: voltage must be positive.`);
      if (
        finite(load.pf) &&
        (load.pf <= 0 || load.pf > 1) &&
        load.entryMode !== "complex" &&
        load.connection !== "dc"
      )
        errors.push(`${prefix}: PF must be greater than 0 and at most 1.`);
      if (
        finite(load.efficiency) &&
        (load.efficiency <= 0 || load.efficiency > 1)
      )
        errors.push(
          `${prefix}: efficiency must be greater than 0 and at most 1.`,
        );
      for (const field of ["duty", "utilization"])
        if (finite(load[field]) && (load[field] < 0 || load[field] > 1))
          errors.push(`${prefix}: ${field} must be between 0 and 1.`);
      if (
        finite(load.hoursPerDay) &&
        (load.hoursPerDay < 0 || load.hoursPerDay > 24)
      )
        errors.push(`${prefix}: operating hours must be between 0 and 24.`);
      if (
        finite(load.startHour) &&
        (load.startHour < 0 || load.startHour >= 24)
      )
        errors.push(
          `${prefix}: start hour must be between 0 and less than 24.`,
        );
      if (finite(load.standbyW) && load.standbyW < 0)
        errors.push(`${prefix}: standby power must be nonnegative.`);
      if (
        typeof load.critical !== "boolean" ||
        typeof load.locked !== "boolean"
      )
        errors.push(`${prefix}: critical/locked flags must be boolean.`);
      if (
        !record(load.source) ||
        !text(load.source.reference) ||
        !["nameplate", "measured", "datasheet", "estimate", "user"].includes(
          String(load.source.kind),
        )
      )
        errors.push(`${prefix}: source provenance is required.`);
      if (load.entryMode === "complex" && !finite(load.reactiveKvar))
        errors.push(`${prefix}: complex entry requires signed kvar.`);
      if (
        load.connection === "line-line" &&
        (!Array.isArray(load.phasePair) ||
          load.phasePair.length !== 2 ||
          load.phasePair[0] === load.phasePair[1] ||
          load.phasePair.some((p) => !["L1", "L2", "L3"].includes(p)))
      )
        errors.push(`${prefix}: line-line entry requires two distinct phases.`);
      if (
        load.pfKind !== undefined &&
        !["displacement", "true"].includes(String(load.pfKind))
      )
        errors.push(`${prefix}: invalid PF interpretation.`);
      if (
        load.weekdays !== undefined &&
        (!Array.isArray(load.weekdays) ||
          !load.weekdays.length ||
          load.weekdays.some(
            (day) => !Number.isInteger(day) || day < 0 || day > 6,
          ))
      )
        errors.push(`${prefix}: invalid weekday schedule.`);
      for (const field of ["boardId", "circuitId"])
        if (load[field] !== undefined && (!text(load[field]) || !load[field]))
          errors.push(`${prefix}: invalid ${field}.`);
      for (const field of ["startingMultiplier", "startingSeconds"])
        if (
          load[field] !== undefined &&
          (!finite(load[field]) || load[field] < 0)
        )
          errors.push(`${prefix}: invalid ${field}.`);
      if (
        load.startingPF !== undefined &&
        (!finite(load.startingPF) ||
          load.startingPF <= 0 ||
          load.startingPF > 1)
      )
        errors.push(`${prefix}: invalid starting PF.`);

  if (load.schedule !== undefined) errors.push(...validateSchedule(load.schedule));
  if (load.libraryRef !== undefined && (!record(load.libraryRef) || !text(load.libraryRef.templateId) || !load.libraryRef.templateId || !finite(load.libraryRef.version) || !Number.isInteger(load.libraryRef.version) || load.libraryRef.version < 1)) errors.push(`${prefix}: invalid historical library reference.`);
  return errors;
}

/** Validate an entire candidate before the UI replaces any working state. No coercion. */
export function validateProjectImport(input: unknown): {
  valid: boolean;
  project?: Project;
  errors: string[];
} {
  const errors: string[] = [];
  let candidate: unknown = input;
  if (typeof input === "string") {
    if (input.length > 10_000_000)
      return {
        valid: false,
        errors: ["Project exceeds the 10 MB import limit."],
      };
    try {
      candidate = JSON.parse(input);
    } catch {
      return {
        valid: false,
        errors: ["Invalid JSON. The working project has not been changed."],
      };
    }
  }
  if (!record(candidate))
    return { valid: false, errors: ["Expected a project object."] };
  const inspect = (value: unknown, depth: number): void => {
    if (depth > 30) {
      errors.push("Project nesting exceeds the supported limit.");
      return;
    }
    if (typeof value === "number" && !Number.isFinite(value))
      errors.push("Non-finite numbers are not allowed in project data.");
    if (Array.isArray(value)) {
      if (value.length > 10000)
        errors.push("An imported array exceeds 10,000 items.");
      else value.forEach((item) => inspect(item, depth + 1));
    } else if (record(value))
      for (const [key, item] of Object.entries(value)) {
        if (["__proto__", "prototype", "constructor"].includes(key))
          errors.push("Unsafe object keys are not accepted.");
        else inspect(item, depth + 1);
      }
  };
  inspect(candidate, 0);
  if (candidate.schemaVersion !== SCHEMA_VERSION)
    errors.push("Unsupported project schema version.");
  for (const key of [
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "context",
    "timezone",
    "currency",
    "jurisdiction",
    "notes",
  ])
    if (!text(candidate[key])) errors.push(`Missing or invalid ${key}.`);
  if (typeof candidate.name === "string" && candidate.name.length > 240)
    errors.push("Project name is too long.");
  if (
    !finite(candidate.revision) ||
    !Number.isInteger(candidate.revision) ||
    candidate.revision < 1
  )
    errors.push("Invalid project revision.");
  for (const key of ["createdAt", "updatedAt"])
    if (
      typeof candidate[key] === "string" &&
      !Number.isFinite(Date.parse(candidate[key]))
    )
      errors.push(`Invalid ${key} timestamp.`);
  if (typeof candidate.timezone === "string") {
    try {
      new Intl.DateTimeFormat("en", { timeZone: candidate.timezone });
    } catch {
      errors.push("Invalid IANA timezone.");
    }
  }
  if (
    typeof candidate.currency === "string" &&
    !/^[A-Z]{3}$/.test(candidate.currency)
  )
    errors.push("Currency must be a three-letter code.");
  if (
    !finite(candidate.coincidence) ||
    candidate.coincidence < 0 ||
    candidate.coincidence > 1
  )
    errors.push("Coincidence must be between 0 and 1.");
  if (
    !finite(candidate.growthPercent) ||
    candidate.growthPercent < 0 ||
    candidate.growthPercent > 1000
  )
    errors.push("Growth allowance must be between 0 and 1000%.");
  if (
    candidate.scenarioOf !== undefined &&
    (!text(candidate.scenarioOf) || !candidate.scenarioOf)
  )
    errors.push("Invalid scenario baseline reference.");
  if (
    candidate.baselineRevision !== undefined &&
    (!finite(candidate.baselineRevision) ||
      !Number.isInteger(candidate.baselineRevision) ||
      candidate.baselineRevision < 1)
  )
    errors.push("Invalid scenario baseline revision.");
  if (!record(candidate.supply)) errors.push("Missing supply settings.");
  else
    for (const key of ["voltageLN", "voltageLL", "frequency", "limitA"])
      if (!finite(candidate.supply[key]) || candidate.supply[key] <= 0)
        errors.push(`Supply ${key} must be positive.`);
  for (const key of ["loads", "boards", "circuits", "evSessions"]) {
    if (!Array.isArray(candidate[key]) || candidate[key].length > 10000)
      errors.push(`${key} must be an array of at most 10,000 records.`);
    else uniqueIds(candidate[key], key, errors);
  }
  if (Array.isArray(candidate.loads)) candidate.loads.forEach((load, index) => errors.push(...validateLoadRecord(load, `Load ${index + 1}`)));
  if (Array.isArray(candidate.boards))
    candidate.boards.forEach((board, index) => {
      if (
        !record(board) ||
        !text(board.name) ||
        !finite(board.ratedA) ||
        board.ratedA <= 0 ||
        !finite(board.ways) ||
        !Number.isInteger(board.ways) ||
        board.ways < 1
      )
        errors.push(`Board ${index + 1}: invalid rating, ways or name.`);
      if (
        record(board) &&
        board.parentId !== undefined &&
        (!text(board.parentId) || !board.parentId)
      )
        errors.push(`Board ${index + 1}: invalid upstream reference.`);
    });
  if (Array.isArray(candidate.circuits))
    candidate.circuits.forEach((circuit, index) => {
      if (
        !record(circuit) ||
        !text(circuit.name) ||
        !text(circuit.boardId) ||
        !["L1", "L2", "L3"].includes(String(circuit.phase)) ||
        typeof circuit.locked !== "boolean"
      )
        errors.push(`Circuit ${index + 1}: invalid circuit fields.`);
      if (!record(circuit)) return;
      for (const field of [
        "protectiveA",
        "breakingCapacityKA",
        "prospectiveFaultKA",
      ])
        if (
          circuit[field] !== undefined &&
          (!finite(circuit[field]) || circuit[field] <= 0)
        )
          errors.push(`Circuit ${index + 1}: invalid ${field}.`);
      if (circuit.cable !== undefined) {
        if (!record(circuit.cable))
          errors.push(`Circuit ${index + 1}: invalid cable object.`);
        else {
          if (!finite(circuit.cable.lengthM) || circuit.cable.lengthM < 0)
            errors.push(`Circuit ${index + 1}: invalid route length.`);
          for (const field of [
            "resistanceOhmPerKm",
            "reactanceOhmPerKm",
            "areaMm2",
            "baseAmpacityA",
            "voltageDropLimitPercent",
          ])
            if (
              circuit.cable[field] !== undefined &&
              (!finite(circuit.cable[field]) || circuit.cable[field] < 0)
            )
              errors.push(`Circuit ${index + 1}: invalid cable ${field}.`);
          if (
            circuit.cable.correctionFactors !== undefined &&
            (!Array.isArray(circuit.cable.correctionFactors) ||
              circuit.cable.correctionFactors.some(
                (factor) => !finite(factor) || factor <= 0,
              ))
          )
            errors.push(`Circuit ${index + 1}: invalid correction factors.`);
          if (circuit.cable.source !== undefined && !text(circuit.cable.source))
            errors.push(`Circuit ${index + 1}: invalid cable source.`);
        }
      }
    });
  if (!record(candidate.tariff) || !Array.isArray(candidate.tariff.bands))
    errors.push("Missing tariff settings.");
  else {
    for (const field of [
      "importRate",
      "exportRate",
      "standingPerDay",
      "demandPerKW",
      "taxPercent",
    ])
      if (!finite(candidate.tariff[field]))
        errors.push(`Tariff ${field} must be finite.`);
    for (const field of ["standingPerDay", "demandPerKW", "taxPercent"])
      if (finite(candidate.tariff[field]) && candidate.tariff[field] < 0)
        errors.push(`Tariff ${field} must be nonnegative.`);
    if (!text(candidate.tariff.source))
      errors.push("Tariff provenance is required.");
    if (
      candidate.tariff.carbonKgPerKWh !== undefined &&
      (!finite(candidate.tariff.carbonKgPerKWh) ||
        candidate.tariff.carbonKgPerKWh < 0)
    )
      errors.push("Invalid carbon intensity.");
    uniqueIds(candidate.tariff.bands, "Tariff bands", errors);
    candidate.tariff.bands.forEach((band, index) => {
      if (
        !record(band) ||
        !text(band.name) ||
        !finite(band.startHour) ||
        !finite(band.endHour) ||
        !finite(band.importRate) ||
        band.startHour < 0 ||
        band.startHour >= 24 ||
        band.endHour < 0 ||
        band.endHour > 24 ||
        band.startHour === band.endHour
      )
        errors.push(`Tariff band ${index + 1}: invalid boundaries or price.`);
      if (
        record(band) &&
        band.weekdays !== undefined &&
        (!Array.isArray(band.weekdays) ||
          !band.weekdays.length ||
          band.weekdays.some(
            (day) => !Number.isInteger(day) || day < 0 || day > 6,
          ))
      )
        errors.push(`Tariff band ${index + 1}: invalid weekdays.`);
    });
  }
  if (!record(candidate.energy) || !record(candidate.energy.battery))
    errors.push("Missing energy settings.");
  else {
    if (
      !finite(candidate.energy.pvKW) ||
      candidate.energy.pvKW < 0 ||
      !finite(candidate.energy.peakSunHours) ||
      candidate.energy.peakSunHours < 0 ||
      candidate.energy.peakSunHours > 24 ||
      !finite(candidate.energy.pvPerformanceRatio) ||
      candidate.energy.pvPerformanceRatio < 0 ||
      candidate.energy.pvPerformanceRatio > 1 ||
      !text(candidate.energy.source)
    )
      errors.push("Invalid PV energy settings or source.");
    if (
      candidate.energy.pvHourlyProfile !== undefined &&
      (!Array.isArray(candidate.energy.pvHourlyProfile) ||
        candidate.energy.pvHourlyProfile.length !== 24 ||
        candidate.energy.pvHourlyProfile.some(
          (power) => !finite(power) || power < 0 || power > 1,
        ))
    )
      errors.push("PV normalized profile requires 24 values between 0 and 1.");
    const battery = candidate.energy.battery;
    for (const field of ["capacityKWh", "chargeKW", "dischargeKW"])
      if (!finite(battery[field]) || battery[field] < 0)
        errors.push(`Invalid battery ${field}.`);
    for (const field of ["initialSoc", "minSoc", "maxSoc"])
      if (!finite(battery[field]) || battery[field] < 0 || battery[field] > 1)
        errors.push(`Invalid battery ${field}.`);
    if (
      finite(battery.minSoc) &&
      finite(battery.maxSoc) &&
      finite(battery.initialSoc) &&
      (battery.minSoc > battery.maxSoc ||
        battery.initialSoc < battery.minSoc ||
        battery.initialSoc > battery.maxSoc)
    )
      errors.push("Battery SOC bounds are inconsistent.");
    for (const field of ["chargeEfficiency", "dischargeEfficiency"])
      if (!finite(battery[field]) || battery[field] <= 0 || battery[field] > 1)
        errors.push(`Invalid battery ${field}.`);
    if (typeof battery.islandCapable !== "boolean")
      errors.push("Battery island capability must be explicit.");
  }
  if (Array.isArray(candidate.evSessions))
    candidate.evSessions.forEach((session, index) => {
      if (!record(session)) return;
      if (!text(session.name)) errors.push(`EV ${index + 1}: invalid name.`);
      for (const field of [
        "requiredKWh",
        "chargerKW",
        "vehicleKW",
        "siteLimitKW",
      ])
        if (!finite(session[field]) || session[field] < 0)
          errors.push(`EV ${index + 1}: invalid ${field}.`);
      for (const field of ["arrivalHour", "departureHour"])
        if (
          !finite(session[field]) ||
          session[field] < 0 ||
          session[field] > 24
        )
          errors.push(`EV ${index + 1}: invalid ${field}.`);
      if (
        !finite(session.efficiency) ||
        session.efficiency <= 0 ||
        session.efficiency > 1
      )
        errors.push(`EV ${index + 1}: invalid efficiency.`);
    });
  if (
    !record(candidate.billing) ||
    !record(candidate.billing.seller) ||
    !record(candidate.billing.customer) ||
    !Array.isArray(candidate.billing.lines)
  )
    errors.push("Missing customer estimate settings.");
  else {
    for (const contact of [
      candidate.billing.seller,
      candidate.billing.customer,
    ])
      for (const field of ["name", "address", "email"])
        if (!text(contact[field]))
          errors.push(`Invalid billing contact ${field}.`);
    for (const field of ["reference", "issueDate", "dueDate", "notes"])
      if (!text(candidate.billing[field]))
        errors.push(`Invalid billing ${field}.`);
    for (const field of ["taxPercent", "discountPercent"])
      if (
        !finite(candidate.billing[field]) ||
        candidate.billing[field] < 0 ||
        candidate.billing[field] > 100
      )
        errors.push(`Invalid billing ${field}.`);
    uniqueIds(candidate.billing.lines, "Estimate lines", errors);
    candidate.billing.lines.forEach((line, index) => {
      if (
        !record(line) ||
        !text(line.description) ||
        !text(line.unit) ||
        !finite(line.quantity) ||
        line.quantity < 0 ||
        !finite(line.unitPrice) ||
        line.unitPrice < 0
      )
        errors.push(`Estimate line ${index + 1}: invalid item.`);
    });
  }
  errors.push(...validateProjectExtensions(candidate));
  if (candidate.scenarioBaseline !== undefined) {
    const baseline = candidate.scenarioBaseline;
    if (!record(baseline) || !explicitInstant(baseline.capturedAt) || !record(baseline.project) || baseline.project.scenarioBaseline !== undefined || baseline.project.id !== baseline.projectId || baseline.project.revision !== baseline.revision) errors.push("Invalid or recursively nested frozen scenario baseline.");
    else {
      const checked = validateProjectImport(baseline.project);
      if (!checked.valid) errors.push(...checked.errors.map((message) => `Scenario baseline: ${message}`));
    }
  }
  if (candidate.equipmentLibrary !== undefined) {
    if (!Array.isArray(candidate.equipmentLibrary) || candidate.equipmentLibrary.length > 10000) errors.push("Equipment library must be an array of at most 10,000 detached templates.");
    else {
      uniqueIds(candidate.equipmentLibrary, "Equipment library", errors);
      for (const row of candidate.equipmentLibrary) {
        if (record(row) && (row.boardId !== undefined || row.circuitId !== undefined)) errors.push("Equipment templates must be detached from boards and circuits.");
        errors.push(...validateLoadRecord(row, "Equipment template"));
      }
    }
  }
  if (candidate.equipmentFavorites !== undefined && (!Array.isArray(candidate.equipmentFavorites) || candidate.equipmentFavorites.length > 10000 || candidate.equipmentFavorites.some((id) => !text(id) || !id || id.length > 200) || new Set(candidate.equipmentFavorites).size !== candidate.equipmentFavorites.length)) errors.push("Equipment favorites must be unique nonempty template IDs.");
  if (candidate.equipmentVersions !== undefined) {
    if (!Array.isArray(candidate.equipmentVersions) || candidate.equipmentVersions.length > 10000) errors.push("Equipment history is limited to 10,000 saved versions.");
    else {
      const seen = new Set<string>();
      for (const version of candidate.equipmentVersions) {
        if (!record(version) || !text(version.templateId) || !version.templateId || version.templateId.length > 200 || !finite(version.version) || !Number.isInteger(version.version) || version.version < 1 || !explicitInstant(version.capturedAt) || !record(version.record) || version.record.id !== version.templateId) { errors.push("Invalid equipment template version metadata."); continue; }
        const key = `${version.templateId}:${version.version}`;
        if (seen.has(key)) errors.push("Duplicate equipment template version.");
        seen.add(key);
        if (version.record.boardId !== undefined || version.record.circuitId !== undefined) errors.push("Equipment version records must be detached templates.");
        errors.push(...validateLoadRecord(version.record, "Equipment version"));
      }
    }
  }
  if (errors.length) return { valid: false, errors: errors.slice(0, 100) };
  const typed = candidate as unknown as Project;
  const boardIds = new Set(typed.boards.map((board) => board.id));
  const circuitMap = new Map(
    typed.circuits.map((circuit) => [circuit.id, circuit]),
  );
  const globalIds = [
    ...typed.loads,
    ...typed.boards,
    ...typed.circuits,
    ...typed.evSessions,
  ].map((entity) => entity.id);
  if (new Set(globalIds).size !== globalIds.length)
    errors.push(
      "Entity IDs must be unique across loads, circuits, boards and EV sessions.",
    );
  for (const board of typed.boards) {
    const seen = new Set([board.id]);
    let upstream = board.parentId;
    while (upstream) {
      if (!boardIds.has(upstream)) {
        errors.push(`Board ${board.name}: missing upstream board.`);
        break;
      }
      if (seen.has(upstream)) {
        errors.push(`Board ${board.name}: hierarchy contains a cycle.`);
        break;
      }
      seen.add(upstream);
      upstream = typed.boards.find((item) => item.id === upstream)?.parentId;
    }
  }
  for (const circuit of typed.circuits)
    if (!boardIds.has(circuit.boardId))
      errors.push(`Circuit ${circuit.name}: missing board.`);
  for (const load of typed.loads) {
    if (load.boardId && !boardIds.has(load.boardId))
      errors.push(`Load ${load.name}: missing board.`);
    if (load.circuitId) {
      const circuit = circuitMap.get(load.circuitId);
      if (!circuit) errors.push(`Load ${load.name}: missing circuit.`);
      else if (load.boardId && load.boardId !== circuit.boardId)
        errors.push(
          `Load ${load.name}: board and circuit references conflict.`,
        );
    }
  }
  if (errors.length) return { valid: false, errors: errors.slice(0, 100) };
  // JSON round-trip detaches caller-owned data and removes prototypes without executing content.
  return {
    valid: true,
    project: JSON.parse(JSON.stringify(candidate)) as Project,
    errors: [],
  };
}

export function duplicateProject(
  project: Project,
  name = `${project.name} — copy`,
  timestamp = new Date().toISOString(),
): Project {
  return {
    ...structuredClone(project),
    id: newId("project"),
    name,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
