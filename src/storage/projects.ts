import type { Project } from "../domain/types";
import { validateProjectImport } from "../domain/project";
import { openPowerLabDatabase as db } from "./database";
import { readCommitted } from "./transactions";
import { validateProjectSession, type ProjectSession } from "./projectSession";
import { acceptRestoredBilling, liveDrafts } from "./billing";
import { parseBillJson, type BillDocument } from "../import-export/reports";
import {
  validateMeasurementPayload,
  type MeasurementPayload,
  type SavedMeasurements,
} from "./measurements";
const reported = new Set<string>();
function warnOnce(key: string, detail: string) {
  if (reported.has(key)) return;
  reported.add(key);
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("powerlab-storage-warning", { detail }),
    );
}
function safeRecords(items: unknown[]): ProjectRecord[] {
  return items.flatMap((item) => {
    const row = item as ProjectRecord;
    const validation = validateProjectImport(row?.project);
    if (
      !row?.id ||
      !validation.valid ||
      row.id !== row.project.id ||
      typeof row.deleted !== "boolean" ||
      typeof row.savedAt !== "string"
    ) {
      const id = String(row?.id || "unknown");
      warnOnce(
        id,
        "A saved project record could not be validated and was left intact for recovery: " +
          id,
      );
      return [];
    }
    const clean = { ...row };
    if (row.session !== undefined) {
      try {
        clean.session = validateProjectSession(row.session);
      } catch {
        // Session metadata must never hide or erase an otherwise valid project.
        delete clean.session;
        warnOnce(
          `${row.id}:session`,
          "The saved project is available, but its interview or BOT session could not be opened. The original record remains intact for recovery: " +
            row.id,
        );
      }
    }
    if (typeof clean.checkpointId !== "string") delete clean.checkpointId;
    return [clean];
  });
}

export interface ProjectRecord {
  id: string;
  project: Project;
  deleted: boolean;
  savedAt: string;
  session?: ProjectSession;
  /** A separate lease detects concurrent saves of BOT/interview-only changes. */
  checkpointId?: string;
}

export interface BillingCheckpoint {
  bill: BillDocument;
  expectedRevision: string | null;
}

export interface ProjectSaveOptions {
  session?: ProjectSession;
  expectedCheckpointId?: string | null;
  includeBilling?: boolean;
  billing?: BillingCheckpoint;
  measurements?: {
    payload: MeasurementPayload;
    expectedRevision: number | null;
  };
}

/** Capture at the click, before a queued save or a database open can yield. */
export function captureBillingCheckpoint(
  projectId: string,
): BillingCheckpoint | undefined {
  const current = liveDrafts.get(projectId);
  return current
    ? {
        bill: structuredClone(current.bill),
        expectedRevision: current.revision,
      }
    : undefined;
}

export function projectCheckpointId(record: ProjectRecord): string {
  return record.checkpointId ?? record.savedAt;
}
export async function listProjects(
  includeDeleted = false,
): Promise<ProjectRecord[]> {
  const d = await db();
  const records = await readCommitted(d, "projects", (store) => store.getAll());
  return safeRecords(records)
    .filter((p) => includeDeleted || !p.deleted)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
export async function saveProject(
  project: Project,
  expectedRevision?: number,
  options: ProjectSaveOptions = {},
): Promise<ProjectRecord> {
  const validation = validateProjectImport(project);
  if (!validation.valid)
    throw new Error(
      "Project could not be saved: " + validation.errors.join(" "),
    );
  const snapshot = structuredClone(project);
  const session =
    options.session === undefined
      ? undefined
      : validateProjectSession(options.session);
  const inputBilling =
    options.billing ??
    (options.includeBilling ? captureBillingCheckpoint(project.id) : undefined);
  const billing = inputBilling ? structuredClone(inputBilling) : undefined;
  const savedBill = billing
    ? parseBillJson(JSON.stringify(billing.bill))
    : undefined;
  const measurements = options.measurements
    ? {
        payload: validateMeasurementPayload(options.measurements.payload)
          .payload,
        expectedRevision: options.measurements.expectedRevision,
      }
    : undefined;
  const expectedCheckpointId = options.expectedCheckpointId;
  const record: ProjectRecord = {
    id: snapshot.id,
    project: snapshot,
    deleted: false,
    savedAt: new Date().toISOString(),
    checkpointId: crypto.randomUUID(),
    ...(session ? { session } : {}),
  };
  const d = await db();
  const saved = await new Promise<ProjectRecord>((resolve, reject) => {
    const stores = ["projects", "history"];
    if (billing) stores.push("bills");
    if (measurements) stores.push("measurements");
    const tx = d.transaction(stores, "readwrite");
    const store = tx.objectStore("projects");
    const get = store.get(snapshot.id);
    let conflict = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      conflict =
        "Saving timed out and could not be confirmed. Keep this page open, retry Save project or export a backup.";
      try {
        tx.abort();
      } catch {
        /* It may already have completed. */
      }
      finish(new Error(conflict));
    }, 8000);
    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(record);
    }
    function abort(message: string) {
      conflict = message;
      tx.abort();
    }
    const projectConflict =
      "This project was changed or moved to trash in another tab. Export your changes or save a copy before reopening it.";
    get.onsuccess = () => {
      const old = get.result as ProjectRecord | undefined;
      if (old?.deleted) {
        abort(projectConflict);
        return;
      }
      if (
        expectedCheckpointId !== undefined &&
        (old ? projectCheckpointId(old) : null) !== expectedCheckpointId
      ) {
        abort(projectConflict);
        return;
      }
      if (
        old &&
        expectedRevision !== undefined &&
        old.project.revision !== expectedRevision &&
        (old.project.revision !== snapshot.revision ||
          old.project.updatedAt !== snapshot.updatedAt ||
          JSON.stringify(old.project) !== JSON.stringify(snapshot))
      ) {
        abort(projectConflict);
        return;
      }
      if (session === undefined && old?.session !== undefined)
        record.session = structuredClone(old.session);
      store.put(record);
      tx.objectStore("history").put({
        key: snapshot.id + ":" + snapshot.revision,
        id: snapshot.id,
        revision: snapshot.revision,
        project: snapshot,
      });
    };
    if (billing && savedBill) {
      const bills = tx.objectStore("bills"),
        read = bills.get(snapshot.id);
      read.onsuccess = () => {
        if ((read.result?.revision ?? null) !== billing.expectedRevision) {
          abort(
            "The customer bill changed in another tab. No part of this project save was committed. Reopen the saved bill or export your current bill before retrying.",
          );
          return;
        }
        bills.put({
          key: snapshot.id,
          revision: record.checkpointId!,
          bill: savedBill,
        });
      };
    }
    if (measurements) {
      const datasets = tx.objectStore("measurements"),
        read = datasets.get(snapshot.id);
      read.onsuccess = () => {
        if ((read.result?.revision ?? null) !== measurements.expectedRevision) {
          abort(
            "The measured data changed in another tab. No part of this project save was committed. Reopen the saved measurements before retrying.",
          );
          return;
        }
        datasets.put({
          ...measurements.payload,
          projectId: snapshot.id,
          revision: (measurements.expectedRevision ?? 0) + 1,
          savedAt: record.savedAt,
        } satisfies SavedMeasurements);
      };
    }
    tx.oncomplete = () => finish();
    tx.onerror = tx.onabort = () =>
      finish(
        new Error(
          conflict ||
            "Local save failed. Export your project to keep a backup.",
        ),
      );
  });
  if (billing && savedBill) {
    const live = liveDrafts.get(snapshot.id);
    if (live && live.revision === billing.expectedRevision) {
      if (JSON.stringify(live.bill) === JSON.stringify(savedBill))
        acceptRestoredBilling(snapshot.id, savedBill, record.checkpointId!);
      else {
        liveDrafts.set(snapshot.id, {
          ...live,
          revision: record.checkpointId!,
          dirty: true,
        });
        if (typeof window !== "undefined")
          window.dispatchEvent(
            new CustomEvent("powerlab-billing-checkpoint", {
              detail: { projectId: snapshot.id, revision: record.checkpointId },
            }),
          );
      }
    }
  }
  return saved;
}
export async function setTrashed(id: string, deleted: boolean): Promise<void> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction("projects", "readwrite");
    const store = tx.objectStore("projects");
    const get = store.get(id);
    get.onsuccess = () => {
      if (get.result)
        store.put({
          ...get.result,
          deleted,
          savedAt: new Date().toISOString(),
        });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error || new Error("The trash change could not be saved."));
    tx.onabort = () =>
      reject(
        tx.error ||
          new Error(
            "The trash change was interrupted. Your saved project has not been changed.",
          ),
      );
  });
}
export async function projectHistory(id: string): Promise<Project[]> {
  const d = await db();
  const records = await readCommitted(d, "history", (store) => store.getAll());
  return records
    .filter(
      (record: { id: string; project: Project }) =>
        record.id === id && validateProjectImport(record.project).valid,
    )
    .map((record: { project: Project }) => record.project)
    .sort((a: Project, b: Project) => b.revision - a.revision)
    .slice(0, 50);
}
export function readPreference<T>(key: string, fallback: T): T {
  try {
    return (
      JSON.parse(localStorage.getItem("powerlab:ui:" + key) || "null") ??
      fallback
    );
  } catch {
    return fallback;
  }
}
export function writePreference(key: string, value: unknown) {
  try {
    localStorage.setItem("powerlab:ui:" + key, JSON.stringify(value));
  } catch {
    /* Harmless preferences may be unavailable; project storage errors are surfaced separately. */
  }
}
