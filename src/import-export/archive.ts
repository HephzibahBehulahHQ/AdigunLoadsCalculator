import { ENGINE_VERSION, type Project } from "../domain/types";
import { validateProjectImport } from "../domain/project";
import { parseBillJson, type BillDocument } from "./reports";
import {
  validateMeasurementPayload,
  type MeasurementPayload,
} from "../storage/measurements";

export const WORKSPACE_ARCHIVE_LIMIT = 64 * 1024 * 1024;
export interface RecoveryRecord {
  key: string;
  source: string;
  value: unknown;
  reason: string;
  capturedAt: string;
}
export interface ArchivedProject {
  project: Project;
  deleted: boolean;
  savedAt: string;
  history: Project[];
  workingDraft?: Project;
  bill: BillDocument | null;
  measurements: MeasurementPayload | null;
}
export interface WorkspaceArchive {
  format: "adigunpowerlab-workspace";
  version: 1;
  exportedAt: string;
  engineVersion: string;
  projects: ArchivedProject[];
  recoveryRecords: RecoveryRecord[];
  integrity: { algorithm: "SHA-256"; digest: string };
}
export interface ArchiveCounts {
  projects: number;
  deletedProjects: number;
  revisions: number;
  workingDrafts: number;
  bills: number;
  measurements: number;
  recoveryRecords: number;
}
export interface ArchivePreview {
  valid: boolean;
  archive: WorkspaceArchive | null;
  errors: string[];
  warnings: string[];
  counts: ArchiveCounts;
  collisions: string[];
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const date = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
const emptyCounts = (): ArchiveCounts => ({
  projects: 0,
  deletedProjects: 0,
  revisions: 0,
  workingDrafts: 0,
  bills: 0,
  measurements: 0,
  recoveryRecords: 0,
});

/** Sorted-key JSON permits whitespace/key-order changes without weakening content integrity. */
export function canonicalArchiveJson(value: unknown, depth = 0): string {
  if (depth > 64)
    throw new Error("Backup nesting exceeds the supported depth.");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value))
    return JSON.stringify(value);
  if (Array.isArray(value))
    return (
      "[" +
      value.map((item) => canonicalArchiveJson(item, depth + 1)).join(",") +
      "]"
    );
  if (object(value))
    return (
      "{" +
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map(
          (key) =>
            JSON.stringify(key) +
            ":" +
            canonicalArchiveJson(value[key], depth + 1),
        )
        .join(",") +
      "}"
    );
  throw new Error(
    "Backup contains a value that cannot be represented as JSON.",
  );
}
async function digest(value: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(canonicalArchiveJson(value));
  if (encoded.byteLength > WORKSPACE_ARCHIVE_LIMIT)
    throw new Error("Workspace backup exceeds the 64 MiB limit.");
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
export async function sealWorkspaceArchive(
  projects: ArchivedProject[],
  recoveryRecords: RecoveryRecord[] = [],
  exportedAt = new Date().toISOString(),
): Promise<WorkspaceArchive> {
  const content = structuredClone({
    format: "adigunpowerlab-workspace" as const,
    version: 1 as const,
    exportedAt,
    engineVersion: ENGINE_VERSION,
    projects,
    recoveryRecords,
  });
  return {
    ...content,
    integrity: { algorithm: "SHA-256", digest: await digest(content) },
  };
}
export function workspaceBackupBlob(archive: WorkspaceArchive): Blob {
  return new Blob([JSON.stringify(archive, null, 2)], {
    type: "application/json",
  });
}
export async function validateWorkspaceArchive(
  input: string | unknown,
): Promise<ArchivePreview> {
  const errors: string[] = [],
    warnings: string[] = [],
    counts = emptyCounts();
  try {
    if (
      typeof input === "string" &&
      new TextEncoder().encode(input).byteLength > WORKSPACE_ARCHIVE_LIMIT
    )
      throw new Error("Workspace backup exceeds the 64 MiB limit.");
    const data: unknown =
      typeof input === "string" ? JSON.parse(input) : structuredClone(input);
    if (
      !object(data) ||
      data.format !== "adigunpowerlab-workspace" ||
      data.version !== 1 ||
      !date(data.exportedAt) ||
      typeof data.engineVersion !== "string" ||
      !Array.isArray(data.projects) ||
      data.projects.length > 1000 ||
      !Array.isArray(data.recoveryRecords) ||
      data.recoveryRecords.length > 10000 ||
      !object(data.integrity) ||
      data.integrity.algorithm !== "SHA-256" ||
      typeof data.integrity.digest !== "string" ||
      !/^[0-9a-f]{64}$/.test(data.integrity.digest)
    )
      throw new Error(
        "Unsupported workspace backup format, metadata or integrity record.",
      );
    const { integrity, ...content } = data;
    if ((await digest(content)) !== (integrity as { digest: string }).digest)
      throw new Error(
        "Backup integrity check failed. The file is incomplete or has changed.",
      );
    const ids = new Set<string>();
    for (const [index, raw] of data.projects.entries()) {
      const label = `Project ${index + 1}`;
      if (
        !object(raw) ||
        typeof raw.deleted !== "boolean" ||
        !date(raw.savedAt) ||
        !Array.isArray(raw.history) ||
        raw.history.length > 1000
      ) {
        errors.push(`${label}: invalid project storage metadata.`);
        continue;
      }
      const checked = validateProjectImport(raw.project);
      if (!checked.valid || !checked.project) {
        errors.push(`${label}: ${checked.errors.slice(0, 4).join(" ")}`);
        continue;
      }
      const project = checked.project;
      if (ids.has(project.id)) errors.push(`${label}: duplicate project ID.`);
      ids.add(project.id);
      counts.projects++;
      if (raw.deleted) counts.deletedProjects++;
      const revisions = new Set<number>();
      for (const entry of raw.history) {
        const h = validateProjectImport(entry);
        if (
          !h.valid ||
          !h.project ||
          h.project.id !== project.id ||
          revisions.has(h.project.revision)
        )
          errors.push(`${label}: invalid or duplicated history revision.`);
        else revisions.add(h.project.revision);
      }
      counts.revisions += raw.history.length;
      if (raw.workingDraft !== undefined) {
        const draft = validateProjectImport(raw.workingDraft);
        if (!draft.valid || draft.project?.id !== project.id)
          errors.push(`${label}: invalid working draft.`);
        else counts.workingDrafts++;
      }
      try {
        if (raw.bill !== null) {
          parseBillJson(JSON.stringify(raw.bill));
          counts.bills++;
        }
      } catch (error) {
        errors.push(
          `${label}: invalid customer bill (${(error as Error).message}).`,
        );
      }
      try {
        if (raw.measurements !== null) {
          validateMeasurementPayload(raw.measurements);
          counts.measurements++;
        }
      } catch (error) {
        errors.push(`${label}: ${(error as Error).message}`);
      }
    }
    if (counts.revisions > 10000)
      errors.push("Backup exceeds the 10,000 history-revision limit.");
    for (const raw of data.projects) {
      const p = object(raw) && object(raw.project) ? raw.project : {};
      for (const key of ["scenarioOf", "baselineId"] as const)
        if (typeof p[key] === "string" && !ids.has(p[key]))
          warnings.push(
            `Scenario ${String(p.name ?? p.id)} refers to a project outside this backup: ${p[key]}.`,
          );
    }
    const recoveryIds = new Set<string>();
    for (const row of data.recoveryRecords) {
      if (
        !object(row) ||
        typeof row.key !== "string" ||
        !row.key ||
        row.key.length > 500 ||
        recoveryIds.has(row.key) ||
        typeof row.source !== "string" ||
        typeof row.reason !== "string" ||
        !date(row.capturedAt) ||
        !("value" in row)
      )
        errors.push("An inert recovery record has invalid metadata.");
      else recoveryIds.add(row.key);
    }
    counts.recoveryRecords = data.recoveryRecords.length;
    if (counts.recoveryRecords)
      warnings.push(
        "Unvalidated recovery records are retained as inert data; they will not become active projects or measurements.",
      );
    if (counts.workingDrafts)
      warnings.push(
        "The backup includes working project drafts that had not been persisted at export time.",
      );
    return {
      valid: errors.length === 0,
      archive: errors.length ? null : (data as unknown as WorkspaceArchive),
      errors,
      warnings: [...new Set(warnings)],
      counts,
      collisions: [],
    };
  } catch (error) {
    return {
      valid: false,
      archive: null,
      errors: [
        (error as Error).message || "Workspace backup is not valid JSON.",
      ],
      warnings,
      counts,
      collisions: [],
    };
  }
}
