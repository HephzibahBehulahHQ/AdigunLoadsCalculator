import type { Project } from "../domain/types";
import { validateProjectImport } from "../domain/project";
import { openPowerLabDatabase as db } from "./database";
import { readCommitted } from "./transactions";
const reported = new Set<string>();
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
      if (!reported.has(id)) {
        reported.add(id);
        window.dispatchEvent(
          new CustomEvent("powerlab-storage-warning", {
            detail:
              "A saved project record could not be validated and was left intact for recovery: " +
              id,
          }),
        );
      }
      return [];
    }
    return [row];
  });
}

export interface ProjectRecord {
  id: string;
  project: Project;
  deleted: boolean;
  savedAt: string;
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
): Promise<void> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(["projects", "history"], "readwrite");
    const store = tx.objectStore("projects");
    const get = store.get(project.id);
    let conflict = false;
    get.onsuccess = () => {
      const old = get.result as ProjectRecord | undefined;
      if (old?.deleted) {
        conflict = true;
        tx.abort();
        return;
      }
      if (
        old &&
        expectedRevision !== undefined &&
        old.project.revision !== expectedRevision &&
        (old.project.revision !== project.revision ||
          old.project.updatedAt !== project.updatedAt ||
          JSON.stringify(old.project) !== JSON.stringify(project))
      ) {
        conflict = true;
        tx.abort();
        return;
      }
      store.put({
        id: project.id,
        project: structuredClone(project),
        deleted: false,
        savedAt: new Date().toISOString(),
      });
      tx.objectStore("history").put({
        key: project.id + ":" + project.revision,
        id: project.id,
        revision: project.revision,
        project: structuredClone(project),
      });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Local save failed"));
    tx.onabort = () =>
      reject(
        new Error(
          conflict
            ? "This project was changed or moved to trash in another tab. Export your changes or save a copy before reopening it."
            : "Local save failed. Export your project to keep a backup.",
        ),
      );
  });
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
