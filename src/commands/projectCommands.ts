import {
  createLoad,
  createProject,
  newId,
  validateProjectImport,
} from "../domain/project";
import type {
  Board,
  Circuit,
  DiagramSettings,
  EnergySettings,
  EVSession,
  Load,
  Phase,
  Project,
} from "../domain/types";
import { validateLoad, validateTopology } from "../engine/electrical";

export type ProjectChange = (
  mutator: (draft: Project) => void,
) => boolean | void;
export type LoadPatch = Partial<
  Omit<Load, "id" | "boardId" | "circuitId" | "phase">
>;
export type ProjectCommand =
  | { kind: "loads.patch"; ids: string[]; patch: LoadPatch }
  | {
      kind: "loads.assign";
      ids: string[];
      circuitId?: string;
      boardId?: string;
    }
  | { kind: "loads.phase"; ids: string[]; phase: Phase }
  | { kind: "loads.insert"; loads: Load[] }
  | { kind: "loads.delete"; ids: string[] }
  | { kind: "board.add"; board: Board }
  | {
      kind: "board.patch";
      id: string;
      patch: Partial<Omit<Board, "id" | "parentId">>;
    }
  | { kind: "board.parent"; id: string; parentId?: string }
  | {
      kind: "board.remove";
      id: string;
      strategy: "detach" | "move";
      targetBoardId?: string;
    }
  | { kind: "circuit.add"; circuit: Circuit }
  | {
      kind: "circuit.patch";
      id: string;
      patch: Partial<Omit<Circuit, "id" | "boardId">>;
    }
  | { kind: "circuit.move"; id: string; boardId: string }
  | { kind: "circuit.remove"; id: string; targetCircuitId?: string }
  | { kind: "supply.patch"; patch: Partial<Project["supply"]> }
  | { kind: "energy.patch"; patch: Partial<EnergySettings> }
  | { kind: "ev.patch"; id: string; patch: Partial<Omit<EVSession, "id">> }
  | {
      kind: "tariff.patch";
      patch: Partial<Pick<Project["tariff"], "carbonKgPerKWh" | "source">>;
    }
  | {
      kind: "project.patch";
      patch: Partial<Pick<Project, "notes" | "coincidence" | "growthPercent">>;
    }
  | { kind: "diagram.set"; diagram: DiagramSettings }
  | { kind: "batch"; commands: ProjectCommand[] };

export interface CommandChange {
  objectId: string;
  name: string;
  field: string;
  before: string;
  after: string;
}
export interface CommandPreview {
  projectId: string;
  revision: number;
  command: ProjectCommand;
  summary: string;
  changes: CommandChange[];
  errors: string[];
  warnings: string[];
}

const loadFields = [
  "name",
  "category",
  "quantity",
  "entryMode",
  "rating",
  "voltage",
  "connection",
  "pf",
  "pfKind",
  "reactive",
  "reactiveKvar",
  "efficiency",
  "phasePair",
  "hoursPerDay",
  "startHour",
  "duty",
  "utilization",
  "standbyW",
  "weekdays",
  "critical",
  "locked",
  "startingMultiplier",
  "startingPF",
  "startingSeconds",
  "source",
  "notes",
  "schedule",
];
function permitted(patch: object, keys: string[]) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch))
    throw new Error("A field patch must be an object.");
  for (const key of Object.keys(patch))
    if (!keys.includes(key))
      throw new Error(`Field ${key} cannot be changed by this command.`);
}
function entity<T extends { id: string }>(
  items: T[],
  id: string,
  name: string,
): T {
  const found = items.find((item) => item.id === id);
  if (!found)
    throw new Error(`${name} no longer exists. Refresh the selection.`);
  return found;
}
function selectedLoads(project: Project, ids: string[]): Load[] {
  if (!Array.isArray(ids) || !ids.length)
    throw new Error("Select at least one load.");
  if (new Set(ids).size !== ids.length)
    throw new Error("The load selection contains duplicate IDs.");
  return ids.map((id) => entity(project.loads, id, "Load"));
}
function assign(
  project: Project,
  ids: string[],
  circuitId?: string,
  boardId?: string,
) {
  const loads = selectedLoads(project, ids);
  const circuit = circuitId
    ? entity(project.circuits, circuitId, "Circuit")
    : undefined;
  if (boardId && circuit && boardId !== circuit.boardId)
    throw new Error("Selected circuit and board do not match.");
  const target = circuit?.boardId ?? boardId;
  if (target) entity(project.boards, target, "Board");
  for (const load of loads) {
    if (circuit && load.connection === "dc")
      throw new Error(
        `${load.name}: this radial AC circuit cannot represent a DC connection. Keep the DC load unassigned until a compatible source model is provided.`,
      );
    if (
      circuit &&
      load.connection === "single" &&
      load.locked &&
      load.phase !== circuit.phase
    )
      throw new Error(
        `${load.name}: unlock its phase before assigning it to ${circuit.phase}.`,
      );
    if (circuit && load.connection === "single") load.phase = circuit.phase;
    if (target) load.boardId = target;
    else delete load.boardId;
    if (circuit) load.circuitId = circuit.id;
    else delete load.circuitId;
  }
}
function phaseLoads(project: Project, ids: string[], phase: Phase) {
  if (!["L1", "L2", "L3"].includes(phase))
    throw new Error("Choose L1, L2 or L3.");
  const selected = selectedLoads(project, ids);
  if (selected.some((load) => load.connection !== "single"))
    throw new Error(
      "Single-phase reassignment requires only single-phase loads. Three-phase and line-line connections retain their declared phase connections.",
    );
  const circuitIds = new Set(
    selected.flatMap((load) => (load.circuitId ? [load.circuitId] : [])),
  );
  const affected = project.loads.filter(
    (load) =>
      selected.includes(load) ||
      (load.connection === "single" &&
        load.circuitId &&
        circuitIds.has(load.circuitId)),
  );
  for (const load of affected)
    if (load.locked && load.phase !== phase)
      throw new Error(`${load.name}: phase is locked.`);
  for (const id of circuitIds) {
    const circuit = entity(project.circuits, id, "Circuit");
    if (circuit.locked && circuit.phase !== phase)
      throw new Error(`${circuit.name}: phase is locked.`);
    circuit.phase = phase;
  }
  for (const load of affected) load.phase = phase;
}

function mutate(project: Project, command: ProjectCommand, depth = 0): void {
  if (depth > 8) throw new Error("Command nesting is too deep.");
  switch (command.kind) {
    case "batch":
      if (!command.commands.length || command.commands.length > 1000)
        throw new Error("A batch must contain 1–1,000 commands.");
      command.commands.forEach((item) => mutate(project, item, depth + 1));
      break;
    case "loads.patch":
      permitted(command.patch, loadFields);
      selectedLoads(project, command.ids).forEach((load) => {
        if (
          load.locked &&
          ((command.patch.connection !== undefined &&
            command.patch.connection !== load.connection) ||
            (command.patch.phasePair !== undefined &&
              JSON.stringify(command.patch.phasePair) !==
                JSON.stringify(load.phasePair)))
        )
          throw new Error(
            `${load.name}: unlock the phase before changing its electrical connection.`,
          );
        Object.assign(load, structuredClone(command.patch));
      });
      break;
    case "loads.assign":
      assign(project, command.ids, command.circuitId, command.boardId);
      break;
    case "loads.phase":
      phaseLoads(project, command.ids, command.phase);
      break;
    case "loads.insert":
      if (
        !command.loads.length ||
        command.loads.length > 1000 ||
        project.loads.length + command.loads.length > 10000
      )
        throw new Error(
          "Paste 1–1,000 loads; a project supports at most 10,000 loads.",
        );
      project.loads.push(...structuredClone(command.loads));
      break;
    case "loads.delete": {
      selectedLoads(project, command.ids);
      const ids = new Set(command.ids);
      project.loads = project.loads.filter((load) => !ids.has(load.id));
      if (project.startEvents)
        project.startEvents = project.startEvents.filter(
          (event) => !ids.has(event.loadId),
        );
      if (project.flexibleLoads)
        project.flexibleLoads = project.flexibleLoads.filter(
          (item) => !ids.has(item.loadId),
        );
      break;
    }
    case "board.add":
      project.boards.push(structuredClone(command.board));
      break;
    case "board.patch":
      permitted(command.patch, ["name", "ratedA", "ways", "feeder", "notes"]);
      Object.assign(
        entity(project.boards, command.id, "Board"),
        structuredClone(command.patch),
      );
      break;
    case "board.parent": {
      const board = entity(project.boards, command.id, "Board");
      if (command.parentId) {
        entity(project.boards, command.parentId, "Upstream board");
        board.parentId = command.parentId;
      } else delete board.parentId;
      break;
    }
    case "board.remove": {
      const board = entity(project.boards, command.id, "Board");
      const descendants = new Set([board.id]);
      for (let changed = true; changed;) {
        changed = false;
        for (const child of project.boards)
          if (
            child.parentId &&
            descendants.has(child.parentId) &&
            !descendants.has(child.id)
          ) {
            descendants.add(child.id);
            changed = true;
          }
      }
      if (command.strategy === "move") {
        const target = entity(
          project.boards,
          command.targetBoardId || "",
          "Destination board",
        );
        if (descendants.has(target.id))
          throw new Error("A board cannot be moved into its own descendant.");
        project.boards
          .filter((child) => child.parentId === board.id)
          .forEach((child) => {
            child.parentId = target.id;
          });
        project.circuits
          .filter((circuit) => circuit.boardId === board.id)
          .forEach((circuit) => {
            circuit.boardId = target.id;
          });
        project.loads
          .filter(
            (load) =>
              load.boardId === board.id ||
              project.circuits.some(
                (c) => c.boardId === target.id && c.id === load.circuitId,
              ),
          )
          .forEach((load) => {
            load.boardId = target.id;
          });
        project.boards = project.boards.filter((item) => item.id !== board.id);
        project.sources
          ?.filter((source) => source.boardId === board.id)
          .forEach((source) => {
            source.boardId = target.id;
          });
      } else if (command.strategy === "detach") {
        const circuitIds = new Set(
          project.circuits
            .filter((circuit) => descendants.has(circuit.boardId))
            .map((c) => c.id),
        );
        project.loads
          .filter(
            (load) =>
              descendants.has(load.boardId || "") ||
              circuitIds.has(load.circuitId || ""),
          )
          .forEach((load) => {
            delete load.boardId;
            delete load.circuitId;
          });
        project.circuits = project.circuits.filter(
          (circuit) => !circuitIds.has(circuit.id),
        );
        project.boards = project.boards.filter(
          (item) => !descendants.has(item.id),
        );
        project.sources
          ?.filter((source) => descendants.has(source.boardId ?? ""))
          .forEach((source) => {
            delete source.boardId;
          });
      } else throw new Error("Choose how connected objects will be handled.");
      break;
    }
    case "circuit.add":
      project.circuits.push(structuredClone(command.circuit));
      break;
    case "circuit.patch": {
      permitted(command.patch, [
        "name",
        "phase",
        "locked",
        "protectiveA",
        "breakingCapacityKA",
        "prospectiveFaultKA",
        "cable",
        "notes",
      ]);
      const circuit = entity(project.circuits, command.id, "Circuit");
      if (command.patch.phase && command.patch.phase !== circuit.phase) {
        if (circuit.locked)
          throw new Error(`${circuit.name}: unlock the phase first.`);
        const ids = project.loads
          .filter(
            (load) =>
              load.circuitId === circuit.id && load.connection === "single",
          )
          .map((load) => load.id);
        if (ids.length) phaseLoads(project, ids, command.patch.phase);
      }
      Object.assign(circuit, structuredClone(command.patch));
      break;
    }
    case "circuit.move": {
      const circuit = entity(project.circuits, command.id, "Circuit");
      entity(project.boards, command.boardId, "Destination board");
      circuit.boardId = command.boardId;
      project.loads
        .filter((load) => load.circuitId === circuit.id)
        .forEach((load) => {
          load.boardId = command.boardId;
        });
      break;
    }
    case "circuit.remove": {
      entity(project.circuits, command.id, "Circuit");
      if (command.targetCircuitId === command.id)
        throw new Error("Select a different destination circuit.");
      const ids = project.loads
        .filter((load) => load.circuitId === command.id)
        .map((load) => load.id);
      if (command.targetCircuitId) {
        entity(
          project.circuits,
          command.targetCircuitId,
          "Destination circuit",
        );
        if (ids.length) assign(project, ids, command.targetCircuitId);
      } else if (ids.length) assign(project, ids);
      project.circuits = project.circuits.filter(
        (item) => item.id !== command.id,
      );
      break;
    }
    case "supply.patch":
      permitted(command.patch, [
        "voltageLN",
        "voltageLL",
        "frequency",
        "limitA",
      ]);
      Object.assign(project.supply, structuredClone(command.patch));
      break;
    case "energy.patch":
      permitted(command.patch, [
        "pvKW",
        "peakSunHours",
        "pvPerformanceRatio",
        "pvHourlyProfile",
        "battery",
        "source",
      ]);
      Object.assign(project.energy, structuredClone(command.patch));
      break;
    case "ev.patch":
      permitted(command.patch, [
        "name",
        "arrivalHour",
        "departureHour",
        "requiredKWh",
        "chargerKW",
        "vehicleKW",
        "efficiency",
        "siteLimitKW",
        "phase",
        "minimumKW",
      ]);
      Object.assign(
        entity(project.evSessions, command.id, "EV session"),
        structuredClone(command.patch),
      );
      break;
    case "tariff.patch":
      permitted(command.patch, ["carbonKgPerKWh", "source"]);
      Object.assign(project.tariff, structuredClone(command.patch));
      break;
    case "project.patch":
      permitted(command.patch, ["notes", "coincidence", "growthPercent"]);
      Object.assign(project, structuredClone(command.patch));
      break;
    case "diagram.set":
      project.diagram = structuredClone(command.diagram);
      break;
    default:
      throw new Error("Unknown project command.");
  }
}

function display(value: unknown): string {
  return value === undefined
    ? "—"
    : typeof value === "string"
      ? value
      : JSON.stringify(value);
}
function changesBetween(before: Project, after: Project): CommandChange[] {
  const changes: CommandChange[] = [];
  for (const collection of [
    "loads",
    "boards",
    "circuits",
    "startEvents",
    "flexibleLoads",
    "evSessions",
    "sources",
  ] as const) {
    const previous = new Map(
      (before[collection] ?? []).map((item) => [item.id, item]),
    );
    const next = new Map(
      (after[collection] ?? []).map((item) => [item.id, item]),
    );
    for (const id of new Set([...previous.keys(), ...next.keys()])) {
      const a = previous.get(id),
        b = next.get(id);
      const name = (
        b && "name" in b ? b.name : a && "name" in a ? a.name : id
      ) as string;
      if (!a || !b) {
        changes.push({
          objectId: id,
          name,
          field: collection,
          before: a ? display(a) : "—",
          after: b ? display(b) : "Removed",
        });
      } else
        for (const field of new Set([...Object.keys(a), ...Object.keys(b)])) {
          const av = (a as unknown as Record<string, unknown>)[field],
            bv = (b as unknown as Record<string, unknown>)[field];
          if (display(av) !== display(bv))
            changes.push({
              objectId: id,
              name,
              field,
              before: display(av),
              after: display(bv),
            });
        }
    }
  }
  for (const field of [
    "supply",
    "energy",
    "tariff",
    "notes",
    "coincidence",
    "growthPercent",
    "diagram",
  ] as const) {
    if (display(before[field]) !== display(after[field]))
      changes.push({
        objectId: before.id,
        name: before.name,
        field,
        before: display(before[field]),
        after: display(after[field]),
      });
  }
  return changes;
}

/** Pure, all-or-nothing preview. Revision increments and undo remain owned by the host command boundary. */
export function previewProjectCommand(
  project: Project,
  command: ProjectCommand,
): CommandPreview {
  const preview: CommandPreview = {
    projectId: project.id,
    revision: project.revision,
    command,
    summary: "No changes",
    changes: [],
    errors: [],
    warnings: [],
  };
  try {
    preview.command = structuredClone(command);
    const next = structuredClone(project);
    mutate(next, preview.command);
    for (const item of [...next.loads, ...next.boards, ...next.circuits])
      if (typeof item.name !== "string" || !item.name.trim())
        preview.errors.push(
          "Every load, board and circuit needs a nonempty name.",
        );
    const validation = validateProjectImport(next);
    if (!validation.valid) preview.errors.push(...validation.errors);
    for (const load of next.loads)
      preview.errors.push(
        ...validateLoad(load)
          .filter((issue) => issue.severity === "error")
          .map((issue) => `${load.name}: ${issue.message}`),
      );
    for (const load of next.loads)
      if (load.connection === "dc" && (load.circuitId || load.boardId)) {
        const previous = project.loads.find((item) => item.id === load.id);
        if (
          !previous ||
          previous.connection !== "dc" ||
          previous.circuitId !== load.circuitId ||
          previous.boardId !== load.boardId
        )
          preview.errors.push(
            `${load.name}: DC loads cannot be attached to the supported radial AC board/circuit model.`,
          );
      }
    const prior = new Set(
      validateTopology(project).map(
        (issue) => `${issue.entityId}:${issue.message}`,
      ),
    );
    for (const issue of validateTopology(next)) {
      if (
        issue.severity === "error" &&
        !prior.has(`${issue.entityId}:${issue.message}`)
      )
        preview.errors.push(issue.message);
      else preview.warnings.push(issue.message);
    }
    preview.changes = changesBetween(project, next);
    const count = new Set(preview.changes.map((item) => item.objectId)).size;
    preview.summary = `${count} object${count === 1 ? "" : "s"}, ${preview.changes.length} changed field${preview.changes.length === 1 ? "" : "s"}`;
    if (command.kind === "loads.phase")
      preview.warnings.unshift(
        "Phase changes include all single-phase loads on each selected circuit. Locked phases are preserved.",
      );
    if (command.kind === "board.remove" && command.strategy === "detach")
      preview.warnings.unshift(
        "The selected board, its descendant boards and their circuits are removed. Connected loads are kept, explicitly unassigned.",
      );
    if (command.kind === "loads.delete")
      preview.warnings.unshift(
        "Dependent start events and flexible-load plans are removed with the loads. Undo restores the complete previous project.",
      );
  } catch (error) {
    preview.errors.push((error as Error).message);
  }
  preview.errors = [...new Set(preview.errors)].slice(0, 100);
  preview.warnings = [...new Set(preview.warnings)].slice(0, 100);
  return preview;
}

export function applyProjectCommand(
  project: Project,
  preview: CommandPreview,
): Project {
  if (project.id !== preview.projectId || project.revision !== preview.revision)
    throw new Error(
      "This preview is stale. Review the changes against the current project revision.",
    );
  const checked = previewProjectCommand(project, preview.command);
  if (checked.errors.length) throw new Error(checked.errors.join(" "));
  if (!checked.changes.length)
    throw new Error("The command does not change any fields.");
  const next = structuredClone(project);
  mutate(next, checked.command);
  return next;
}

export function duplicateLoadsCommand(
  project: Project,
  ids: string[],
): ProjectCommand {
  return {
    kind: "loads.insert",
    loads: selectedLoads(project, ids).map((load) => ({
      ...structuredClone(load),
      id: newId("load"),
      name: `${load.name} — copy`,
    })),
  };
}

export function copyLoadRows(project: Project, ids: string[]): string {
  return JSON.stringify(
    {
      format: "AdigunPowerLab/load-rows",
      version: 1,
      rows: selectedLoads(project, ids),
    },
    null,
    2,
  );
}

function delimitedRows(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        closed = true;
      } else value += c;
    } else if (c === separator || c === "\n" || c === "\r") {
      row.push(value);
      value = "";
      closed = false;
      if (c !== separator) {
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
        if (c === "\r" && text[i + 1] === "\n") i++;
      }
    } else if (c === '"' && !value && !closed) quoted = true;
    else if (closed || c === '"')
      throw new Error("Malformed quoted clipboard cell.");
    else value += c;
  }
  if (quoted) throw new Error("Unclosed quoted clipboard cell.");
  row.push(value);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

export const LOAD_ROW_HEADERS = [
  "name",
  "rating",
  "entryMode",
  "voltage",
  "connection",
  "pf",
  "quantity",
  "hoursPerDay",
  "startHour",
  "phase",
  "source",
] as const;
export function parseLoadRows(text: string): {
  loads: Load[];
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [],
    warnings: string[] = [
      "Pasted rows receive new IDs and start unassigned. Existing project rows are preserved.",
    ];
  let loads: Load[] = [];
  try {
    if (!text.trim())
      throw new Error("Paste copied rows or a CSV/TSV table with headers.");
    if (text.length > 2_000_000)
      throw new Error("Clipboard data exceeds the 2 MB limit.");
    if (/^[\s]*[\[{]/.test(text)) {
      const data: unknown = JSON.parse(text);
      const object = data as {
        format?: string;
        version?: number;
        rows?: unknown[];
      };
      const rows = Array.isArray(data)
        ? data
        : object?.format === "AdigunPowerLab/load-rows" && object.version === 1
          ? object.rows
          : undefined;
      if (!Array.isArray(rows))
        throw new Error(
          "Expected copied load rows or an array of complete load objects.",
        );
      loads = rows.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row))
          throw new Error("Every pasted row must be a load object.");
        const load = { ...row, id: newId("load") } as Load;
        delete load.boardId;
        delete load.circuitId;
        return load;
      });
    } else {
      const rows = delimitedRows(
        text.replace(/^\uFEFF/, ""),
        text.split(/\r?\n/, 1)[0].includes("\t") ? "\t" : ",",
      );
      const headers = rows.shift()?.map((item) => item.trim()) ?? [];
      if (new Set(headers).size !== headers.length)
        throw new Error("Clipboard column names must be unique.");
      const missing = LOAD_ROW_HEADERS.filter((key) => !headers.includes(key));
      if (missing.length)
        throw new Error(
          `Required columns: ${missing.join(", ")}. Download the headers template.`,
        );
      const allowed = [
        ...LOAD_ROW_HEADERS,
        "category",
        "duty",
        "utilization",
        "efficiency",
        "standbyW",
        "notes",
        "critical",
        "locked",
        "reactive",
        "reactiveKvar",
      ];
      if (
        headers.some(
          (key) => !allowed.includes(key as (typeof allowed)[number]),
        )
      )
        throw new Error(
          "Unknown clipboard column. Use the supplied headers template or copied JSON rows.",
        );
      loads = rows.map((row, index) => {
        if (row.length !== headers.length)
          throw new Error(
            `Row ${index + 2}: column count does not match the header.`,
          );
        const values = Object.fromEntries(
          headers.map((key, i) => [key, row[i].trim()]),
        );
        for (const required of LOAD_ROW_HEADERS)
          if (!values[required])
            throw new Error(`Row ${index + 2}: ${required} is required.`);
        const numbers: Record<string, number> = {};
        for (const key of [
          "rating",
          "voltage",
          "pf",
          "quantity",
          "hoursPerDay",
          "startHour",
          "duty",
          "utilization",
          "efficiency",
          "standbyW",
          "reactiveKvar",
        ])
          if (values[key] !== undefined && values[key] !== "") {
            if (
              !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(values[key]) ||
              !Number.isFinite(Number(values[key]))
            )
              throw new Error(
                `Row ${index + 2}: ${key} must be a finite number.`,
              );
            numbers[key] = Number(values[key]);
          }
        for (const key of ["critical", "locked"])
          if (values[key] && !["true", "false"].includes(values[key]))
            throw new Error(`Row ${index + 2}: ${key} must be true or false.`);
        return createLoad({
          ...numbers,
          name: values.name,
          entryMode: values.entryMode as Load["entryMode"],
          voltage: numbers.voltage,
          connection: values.connection as Load["connection"],
          phase: values.phase as Phase,
          category: values.category || "General",
          reactive: (values.reactive || "lagging") as Load["reactive"],
          critical: values.critical === "true",
          locked: values.locked === "true",
          source: { kind: "user", reference: values.source },
          notes: values.notes || "",
        });
      });
      warnings.push(
        "Optional omitted fields use duty/utilization/efficiency 1, standby 0 W, lagging reactive behavior, no critical/phase lock. Review the full row data before applying.",
      );
    }
    if (!loads.length || loads.length > 1000)
      throw new Error("Paste between 1 and 1,000 rows.");
    const checked = validateProjectImport({
      ...createProject("Clipboard validation"),
      loads,
    });
    if (!checked.valid) errors.push(...checked.errors);
    for (const load of loads)
      errors.push(
        ...validateLoad(load)
          .filter((issue) => issue.severity === "error")
          .map((issue) => `${load.name}: ${issue.message}`),
      );
  } catch (error) {
    errors.push((error as Error).message);
  }
  return {
    loads: errors.length ? [] : loads,
    errors: [...new Set(errors)].slice(0, 100),
    warnings,
  };
}
