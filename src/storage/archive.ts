import type { Project } from "../domain/types";
import { newId, validateProjectImport } from "../domain/project";
import { ARCHIVE_STORES, openPowerLabDatabase } from "./database";
import { acceptRestoredBilling, liveDrafts, type StoredDraft } from "./billing";
import {
  validateMeasurementPayload,
  type SavedMeasurements,
} from "./measurements";
import { parseBillJson } from "../import-export/reports";
import {
  sealWorkspaceArchive,
  validateWorkspaceArchive,
  WORKSPACE_ARCHIVE_LIMIT,
  type ArchivePreview,
  type ArchivedProject,
  type RecoveryRecord,
  type WorkspaceArchive,
} from "../import-export/archive";
import type { ProjectRecord } from "./projects";
import {
  validateProjectSession,
  remapProjectSession,
  projectSessionFingerprint,
  type ProjectSession,
} from "./projectSession";

type RawWorkspace = Record<(typeof ARCHIVE_STORES)[number], unknown[]>;
async function readWorkspace(): Promise<RawWorkspace> {
  const db = await openPowerLabDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([...ARCHIVE_STORES]),
      result = {} as RawWorkspace;
    for (const name of ARCHIVE_STORES) {
      const request = tx.objectStore(name).getAll();
      request.onsuccess = () => {
        result[name] = request.result;
      };
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = tx.onabort = () =>
      reject(tx.error ?? new Error("Workspace backup read was interrupted."));
  });
}
function relatedIds(project: Project): string[] {
  const p = project as Project & { baselineId?: string };
  return [p.scenarioOf, p.baselineId].filter((id): id is string => Boolean(id));
}

export async function collectWorkspaceBackup(
  options: {
    activeProject?: Project;
    activeSession?: ProjectSession;
    projectIds?: string[];
    includeHistory?: boolean;
  } = {},
): Promise<WorkspaceArchive> {
  const raw = await readWorkspace(),
    capturedAt = new Date().toISOString();
  const recovery = structuredClone(raw.recoveryRecords) as RecoveryRecord[];
  const quarantine = (source: string, value: unknown, reason: string) =>
    recovery.push({
      key: newId("recovery"),
      source,
      value,
      reason,
      capturedAt,
    });
  const records = new Map<string, ProjectRecord>();
  for (const unknownRow of raw.projects) {
    const row = unknownRow as ProjectRecord;
    if (
      !row ||
      !validateProjectImport(row.project).valid ||
      row.id !== row.project.id ||
      typeof row.deleted !== "boolean" ||
      typeof row.savedAt !== "string" ||
      !Number.isFinite(Date.parse(row.savedAt))
    )
      quarantine(
        "projects",
        unknownRow,
        "Saved project failed validation and was retained for recovery.",
      );
    else records.set(row.id, row);
  }
  if (
    options.activeProject &&
    !validateProjectImport(options.activeProject).valid
  )
    throw new Error(
      "The active project could not be validated. Export its native JSON before changing the workspace.",
    );
  if (options.activeProject && !records.has(options.activeProject.id))
    records.set(options.activeProject.id, {
      id: options.activeProject.id,
      project: structuredClone(options.activeProject),
      deleted: false,
      savedAt: capturedAt,
    });
  const selected = new Set(options.projectIds ?? [...records.keys()]);
  for (const id of selected) {
    const record = records.get(id);
    if (!record)
      throw new Error(
        "A selected project is no longer available for backup: " + id,
      );
    for (const related of relatedIds(record.project))
      if (records.has(related)) selected.add(related);
  }
  const projects: ArchivedProject[] = [];
  for (const id of selected) {
    const row = records.get(id)!;
    const history: Project[] = [],
      seen = new Set<number>();
    if (options.includeHistory !== false)
      for (const value of raw.history) {
        const h = value as { id?: string; project?: Project };
        if (h.id !== id) continue;
        if (
          !h.project ||
          !validateProjectImport(h.project).valid ||
          h.project.id !== id ||
          seen.has(h.project.revision)
        )
          quarantine(
            "history",
            value,
            "Invalid or duplicate revision retained as inert recovery data.",
          );
        else {
          history.push(h.project);
          seen.add(h.project.revision);
        }
      }
    const live = liveDrafts.get(id);
    const storedBill = raw.bills.find(
      (value) => (value as StoredDraft)?.key === id,
    ) as StoredDraft | undefined;
    let bill: ArchivedProject["bill"] = null;
    if (live || storedBill) {
      try {
        bill = parseBillJson(JSON.stringify(live?.bill ?? storedBill?.bill));
      } catch {
        quarantine(
          "bills",
          live ?? storedBill,
          "Invalid billing document retained for recovery.",
        );
      }
    }
    const storedMeasurement = raw.measurements.find(
      (value) => (value as SavedMeasurements)?.projectId === id,
    );
    let measurements: ArchivedProject["measurements"] = null;
    if (storedMeasurement) {
      try {
        measurements = validateMeasurementPayload(storedMeasurement).payload;
      } catch {
        quarantine(
          "measurements",
          storedMeasurement,
          "Invalid measured dataset retained for recovery.",
        );
      }
    }
    const entry: ArchivedProject = {
      project: row.project,
      deleted: row.deleted,
      savedAt: row.savedAt,
      history,
      bill,
      measurements,
    };
    if (row.session !== undefined) {
      try {
        entry.session = validateProjectSession(row.session);
      } catch {
        quarantine(
          "project-session",
          { projectId: id, session: row.session },
          "Invalid interview or BOT session retained as inert recovery data; engineering inputs remain available.",
        );
      }
    }
    if (options.activeProject?.id === id && options.activeSession) {
      const activeSession = validateProjectSession(options.activeSession);
      if (
        !entry.session ||
        projectSessionFingerprint(activeSession) !==
          projectSessionFingerprint(entry.session)
      )
        entry.workingSession = activeSession;
      else entry.session = activeSession;
    }
    if (
      options.activeProject?.id === id &&
      JSON.stringify(options.activeProject) !== JSON.stringify(row.project)
    )
      entry.workingDraft = structuredClone(options.activeProject);
    projects.push(entry);
  }
  if (!options.projectIds) {
    for (const record of raw.bills)
      if (!records.has((record as StoredDraft)?.key))
        quarantine(
          "orphan-bill",
          record,
          "Bill owner is unavailable; retained without inventing a project.",
        );
    for (const record of raw.measurements)
      if (!records.has((record as SavedMeasurements)?.projectId))
        quarantine(
          "orphan-measurements",
          record,
          "Dataset owner is unavailable; retained without inventing a project.",
        );
  }
  const archive = await sealWorkspaceArchive(projects, recovery, capturedAt);
  const validation = await validateWorkspaceArchive(archive);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  return archive;
}

export async function previewWorkspaceBackup(
  input: File | string | WorkspaceArchive,
): Promise<ArchivePreview> {
  if (
    typeof File !== "undefined" &&
    input instanceof File &&
    input.size > WORKSPACE_ARCHIVE_LIMIT
  )
    return validateWorkspaceArchive(" ".repeat(WORKSPACE_ARCHIVE_LIMIT + 1));
  const preview = await validateWorkspaceArchive(
    typeof File !== "undefined" && input instanceof File
      ? await input.text()
      : input,
  );
  if (preview.valid && preview.archive) {
    const current = await readWorkspace(),
      ids = new Set(current.projects.map((row) => (row as ProjectRecord)?.id));
    preview.collisions = preview.archive.projects
      .filter((row) => ids.has(row.project.id))
      .map((row) => row.project.id);
    if (preview.collisions.length)
      preview.warnings.push(
        "Existing project IDs will never be overwritten. Restore copies or choose a workspace without those IDs.",
      );
  }
  return preview;
}

function remapProject(source: Project, ids: Record<string, string>): Project {
  const project = structuredClone(source) as Project & {
    baselineId?: string;
    scenarioBaseline?: { projectId: string; project: Project };
  };
  const originalId = project.id;
  project.id = ids[project.id] ?? project.id;
  if (
    project.diagram?.positions[`source:${originalId}`] &&
    project.id !== originalId
  ) {
    project.diagram.positions[`source:${project.id}`] =
      project.diagram.positions[`source:${originalId}`];
    delete project.diagram.positions[`source:${originalId}`];
  }
  if (project.scenarioOf)
    project.scenarioOf = ids[project.scenarioOf] ?? project.scenarioOf;
  if (project.baselineId)
    project.baselineId = ids[project.baselineId] ?? project.baselineId;
  if (project.scenarioBaseline) {
    project.scenarioBaseline.projectId =
      ids[project.scenarioBaseline.projectId] ??
      project.scenarioBaseline.projectId;
    project.scenarioBaseline.project = remapProject(
      project.scenarioBaseline.project,
      ids,
    );
  }
  return project;
}

function remapBill(
  source: ArchivedProject["bill"],
  ids: Record<string, string>,
): ArchivedProject["bill"] {
  if (!source) return null;
  const bill = structuredClone(source);
  for (const line of bill.lines) {
    if (line.source?.projectId && ids[line.source.projectId])
      line.source.projectId = ids[line.source.projectId];
    for (const [oldId, newId] of Object.entries(ids))
      for (const prefix of ["bom:", "bom-labour:", "bom-contingency:"]) {
        if (
          line.id === prefix + oldId ||
          line.id.startsWith(prefix + oldId + ":")
        )
          line.id = prefix + newId + line.id.slice((prefix + oldId).length);
      }
  }
  return parseBillJson(JSON.stringify(bill));
}

export async function restoreWorkspaceBackup(
  input: ArchivePreview | WorkspaceArchive,
  options: {
    mode: "copies" | "preserve-if-absent";
    useWorkingDrafts?: boolean;
  } = { mode: "copies" },
): Promise<{
  idMap: Record<string, string>;
  restoredIds: string[];
  activeIds: string[];
}> {
  const supplied = "archive" in input ? input.archive : input;
  const preview = await validateWorkspaceArchive(supplied);
  if (!preview.valid || !preview.archive)
    throw new Error("Backup was not restored: " + preview.errors.join(" "));
  const archive = preview.archive,
    ids: Record<string, string> = Object.create(null);
  for (const entry of archive.projects)
    ids[entry.project.id] =
      options.mode === "copies" ? newId("project") : entry.project.id;
  const timestamp = new Date().toISOString();
  const entries = archive.projects.map((entry) => {
    const base =
      options.useWorkingDrafts !== false && entry.workingDraft
        ? entry.workingDraft
        : entry.project;
    const project = remapProject(base, ids);
    if (entry.workingDraft && base === entry.workingDraft)
      project.revision =
        Math.max(
          project.revision,
          entry.project.revision,
          ...entry.history.map((p) => p.revision),
        ) + 1;
    const history = entry.history.map((p) => remapProject(p, ids));
    const selectedSession =
      options.useWorkingDrafts !== false && entry.workingSession
        ? entry.workingSession
        : entry.session;
    if (!history.some((p) => p.revision === entry.project.revision))
      history.push(remapProject(entry.project, ids));
    if (!history.some((p) => p.revision === project.revision))
      history.push(project);
    return {
      ...entry,
      project,
      history,
      session: selectedSession
        ? remapProjectSession(selectedSession, ids)
        : undefined,
      checkpointId: crypto.randomUUID(),
      bill: remapBill(entry.bill, ids),
      billRevision: crypto.randomUUID(),
    };
  });
  const db = await openPowerLabDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([...ARCHIVE_STORES, "metadata"], "readwrite");
    try {
      for (const entry of entries) {
        const id = entry.project.id;
        tx.objectStore("projects").add({
          id,
          project: entry.project,
          deleted: entry.deleted,
          savedAt: timestamp,
          checkpointId: entry.checkpointId,
          ...(entry.session ? { session: entry.session } : {}),
        } satisfies ProjectRecord);
        for (const project of entry.history)
          tx.objectStore("history").add({
            key: `${id}:${project.revision}`,
            id,
            revision: project.revision,
            project,
          });
        if (entry.bill)
          tx.objectStore("bills").add({
            key: id,
            revision: entry.billRevision,
            bill: entry.bill,
          } satisfies StoredDraft);
        if (entry.measurements)
          tx.objectStore("measurements").add({
            ...entry.measurements,
            projectId: id,
            revision: 1,
            savedAt: timestamp,
          } satisfies SavedMeasurements);
      }
      for (const row of archive.recoveryRecords)
        tx.objectStore("recoveryRecords").add({
          ...row,
          key: newId("recovery"),
        });
      tx.objectStore("metadata").put({
        key: newId("restore"),
        sourceDigest: archive.integrity.digest,
        restoredAt: timestamp,
        mode: options.mode,
        idMap: ids,
      });
    } catch (error) {
      tx.abort();
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(
        new Error(
          "Workspace restore failed and was rolled back. Existing records remain unchanged. " +
            (tx.error?.message ??
              "A conflicting ID or interrupted write was detected."),
        ),
      );
  });
  for (const entry of entries)
    if (entry.bill)
      acceptRestoredBilling(entry.project.id, entry.bill, entry.billRevision);
  const restoredIds = entries.map((entry) => entry.project.id),
    activeIds = entries
      .filter((entry) => !entry.deleted)
      .map((entry) => entry.project.id);
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("powerlab-workspace-restored", {
        detail: { restoredIds, activeIds },
      }),
    );
  return { idMap: ids, restoredIds, activeIds };
}
