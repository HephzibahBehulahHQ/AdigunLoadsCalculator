import type { Load, Project } from "./types";
import {
  createLoad,
  duplicateProject,
  newId,
  validateProjectImport,
} from "./project";
import { calculateProject, validateLoad } from "../engine/electrical";

export interface ProjectDifference {
  key: string;
  collection: "loads" | "boards" | "circuits" | "project";
  objectId: string;
  label: string;
  field: string;
  before: unknown;
  after: unknown;
}

const settings = [
  "name",
  "context",
  "timezone",
  "currency",
  "jurisdiction",
  "supply",
  "coincidence",
  "growthPercent",
  "tariff",
  "energy",
  "evSessions",
  "startEvents",
  "flexibleLoads",
  "notes",
  "diagram",
  "equipmentLibrary",
  "equipmentVersions",
  "equipmentFavorites",
  "sources",
  "zones",
  "reportDetails",
] as const;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function compareProjectInputs(
  before: Project,
  after: Project,
): ProjectDifference[] {
  const changes: ProjectDifference[] = [];
  for (const field of settings)
    if (!same(before[field], after[field]))
      changes.push({
        key: `project:${field}`,
        collection: "project",
        objectId: before.id,
        label: "Project",
        field,
        before: structuredClone(before[field]),
        after: structuredClone(after[field]),
      });
  for (const collection of ["loads", "boards", "circuits"] as const) {
    const a = new Map(
      before[collection].map((item) => [item.id, item] as const),
    );
    const b = new Map(
      after[collection].map((item) => [item.id, item] as const),
    );
    for (const id of new Set([...a.keys(), ...b.keys()])) {
      const left = a.get(id),
        right = b.get(id);
      if (!left || !right) {
        changes.push({
          key: `${collection}:${id}:$record`,
          collection,
          objectId: id,
          label: (right || left)!.name,
          field: "$record",
          before: structuredClone(left),
          after: structuredClone(right),
        });
        continue;
      }
      for (const field of new Set([
        ...Object.keys(left),
        ...Object.keys(right),
      ])) {
        if (field === "id") continue;
        const l = (left as unknown as Record<string, unknown>)[field],
          r = (right as unknown as Record<string, unknown>)[field];
        if (!same(l, r))
          changes.push({
            key: `${collection}:${id}:${field}`,
            collection,
            objectId: id,
            label: right.name,
            field,
            before: structuredClone(l),
            after: structuredClone(r),
          });
      }
    }
  }
  return changes;
}

export function freezeBaseline(
  project: Project,
  capturedAt = new Date().toISOString(),
): NonNullable<Project["scenarioBaseline"]> {
  const snapshot = structuredClone(project);
  delete snapshot.scenarioBaseline;
  return {
    projectId: project.id,
    revision: project.revision,
    capturedAt,
    project: snapshot,
  };
}

export function createScenario(project: Project, name: string): Project {
  if (!name.trim()) throw new Error("Enter a scenario name.");
  const copy = duplicateProject(project, name.trim());
  copy.scenarioOf = project.scenarioOf || project.id;
  copy.baselineId = project.id;
  copy.baselineRevision = project.revision;
  copy.scenarioBaseline = freezeBaseline(project);
  return copy;
}

export function applyInputDifferences(
  current: Project,
  expectedRevision: number,
  differences: ProjectDifference[],
  selectedKeys: string[],
): Project {
  if (current.revision !== expectedRevision)
    throw new Error(
      "Project changed. Refresh the comparison before applying changes.",
    );
  const chosen = new Set(selectedKeys);
  const next = structuredClone(current);
  for (const difference of differences.filter((item) => chosen.has(item.key))) {
    const { collection, objectId, field, after, before } = difference;
    if (collection === "project") {
      if (
        !(settings as readonly string[]).includes(field) ||
        !same((next as unknown as Record<string, unknown>)[field], before)
      )
        throw new Error("The comparison no longer matches this project.");
      (next as unknown as Record<string, unknown>)[field] =
        structuredClone(after);
    } else {
      const rows = next[collection] as unknown as Record<string, unknown>[];
      const index = rows.findIndex((item) => item.id === objectId);
      if (field === "$record") {
        if (!same(rows[index], before))
          throw new Error("The compared object has changed.");
        if (after === undefined) {
          if (index < 0) throw new Error("The compared object is missing.");
          rows.splice(index, 1);
        } else if (index < 0)
          rows.push(structuredClone(after) as Record<string, unknown>);
        else rows[index] = structuredClone(after) as Record<string, unknown>;
      } else {
        if (
          index < 0 ||
          ["id", "__proto__", "constructor", "prototype"].includes(field) ||
          !same(rows[index][field], before)
        )
          throw new Error("The compared field has changed.");
        if (after === undefined) delete rows[index][field];
        else rows[index][field] = structuredClone(after);
      }
    }
  }
  const validated = validateProjectImport(next);
  if (!validated.project || validated.errors.length)
    throw new Error(
      validated.errors.join(" ") || "Selected changes are invalid.",
    );
  return validated.project;
}

export function equipmentTemplate(load: Load, name = load.name): Load {
  const template = structuredClone(load);
  template.id = newId("equipment");
  template.name = name.trim();
  delete template.boardId;
  delete template.circuitId;
  template.locked = false;
  template.libraryRef = { templateId: template.id, version: 1 };
  const errors = validateLoad(template).filter(
    (issue) => issue.severity === "error",
  );
  if (errors.length)
    throw new Error(errors.map((issue) => issue.message).join(" "));
  return template;
}

export function instantiateEquipment(template: Load): Load {
  const load = createLoad({ ...structuredClone(template), id: newId("load") });
  delete load.boardId;
  delete load.circuitId;
  load.libraryRef = {
    templateId: template.id,
    version: template.libraryRef?.version ?? 1,
  };
  return load;
}

export type SensitivityParameter =
  "growthPercent" | "coincidence" | "importRate" | "duty";
export function runSensitivity(
  project: Project,
  parameter: SensitivityParameter,
  values: number[],
  loadId?: string,
) {
  if (
    !values.length ||
    values.length > 50 ||
    values.some((value) => !Number.isFinite(value))
  )
    throw new Error("Enter between 1 and 50 finite sensitivity values.");
  return values.map((value) => {
    const copy = structuredClone(project);
    if (parameter === "duty" || parameter === "coincidence") {
      if (value < 0 || value > 1)
        throw new Error("Fractions must be between 0 and 1.");
    } else if (
      value < (parameter === "importRate" ? -100000 : 0) ||
      value > 100000
    )
      throw new Error(
        "Sensitivity values must be non-negative and within the supported range.",
      );
    if (parameter === "duty") {
      const load = copy.loads.find((item) => item.id === loadId);
      if (!load) throw new Error("Select a load for the duty sweep.");
      load.duty = value;
    } else if (parameter === "importRate") copy.tariff.importRate = value;
    else copy[parameter] = value;
    const result = calculateProject(copy);
    return {
      value,
      installedKW: result.installedKW,
      designKW: result.designKW,
      dailyKWh: result.dailyKWh,
      dailyCost: result.dailyCost,
      revision: project.revision,
      issues: result.issues.length,
    };
  });
}
