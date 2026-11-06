import { openPowerLabDatabase as db } from "./database";
import {
  parseMeasurementCSV,
  type MeasurementImport,
  type MeasurementOptions,
} from "../import-export/measurements";

export interface MeasurementPayload {
  filename: string;
  rawCSV: string;
  options: MeasurementOptions;
}
export interface SavedMeasurements extends MeasurementPayload {
  projectId: string;
  revision: number;
  savedAt: string;
}
export interface MeasurementBackup extends MeasurementPayload {
  format: "adigunpowerlab-measurements";
  version: 1;
  sourceProjectId: string;
  exportedAt: string;
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function validateMeasurementPayload(input: unknown): {
  payload: MeasurementPayload;
  parsed: MeasurementImport;
} {
  if (
    !object(input) ||
    typeof input.filename !== "string" ||
    !input.filename.trim() ||
    input.filename.length > 240 ||
    typeof input.rawCSV !== "string" ||
    !object(input.options)
  )
    throw new Error(
      "The measurement record is missing its original CSV, filename or options.",
    );
  const options = input.options;
  if (
    typeof options.timestampColumn !== "string" ||
    typeof options.powerColumn !== "string" ||
    typeof options.intervalMinutes !== "number" ||
    !["W", "kW"].includes(String(options.powerUnit))
  )
    throw new Error("The saved measurement mapping or unit is invalid.");
  const payload: MeasurementPayload = {
    filename: input.filename,
    rawCSV: input.rawCSV,
    options: {
      timestampColumn: options.timestampColumn,
      powerColumn: options.powerColumn,
      intervalMinutes: options.intervalMinutes,
      powerUnit: options.powerUnit as "W" | "kW",
    },
  };
  const parsed = parseMeasurementCSV(payload.rawCSV, payload.options);
  if (parsed.errors.length)
    throw new Error(
      "Measurement validation failed: " + parsed.errors.slice(0, 5).join(" "),
    );
  return { payload, parsed };
}
export async function readMeasurements(
  projectId: string,
): Promise<{ saved: SavedMeasurements; parsed: MeasurementImport } | null> {
  const database = await db();
  const raw = await new Promise<unknown>((resolve, reject) => {
    const request = database
      .transaction("measurements")
      .objectStore("measurements")
      .get(projectId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (raw === undefined) return null;
  if (
    !object(raw) ||
    raw.projectId !== projectId ||
    !Number.isSafeInteger(raw.revision) ||
    Number(raw.revision) < 1 ||
    typeof raw.savedAt !== "string" ||
    !Number.isFinite(Date.parse(raw.savedAt))
  )
    throw new Error(
      "The saved measurement metadata is invalid. Existing stored data has not been changed.",
    );
  const { payload, parsed } = validateMeasurementPayload(raw);
  return {
    saved: {
      ...payload,
      projectId,
      revision: Number(raw.revision),
      savedAt: raw.savedAt,
    },
    parsed,
  };
}
export async function saveMeasurements(
  projectId: string,
  input: MeasurementPayload,
  expectedRevision: number | null,
): Promise<SavedMeasurements> {
  if (!projectId || projectId.length > 240)
    throw new Error("A valid project is required for measurement saving.");
  const { payload } = validateMeasurementPayload(input),
    database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("measurements", "readwrite"),
      store = tx.objectStore("measurements"),
      get = store.get(projectId);
    let saved: SavedMeasurements | undefined,
      conflict = false;
    get.onsuccess = () => {
      const current = get.result as SavedMeasurements | undefined;
      if ((current?.revision ?? null) !== expectedRevision) {
        conflict = true;
        tx.abort();
        return;
      }
      saved = {
        ...payload,
        projectId,
        revision: (current?.revision ?? 0) + 1,
        savedAt: new Date().toISOString(),
      };
      store.put(saved);
    };
    tx.oncomplete = () =>
      saved
        ? resolve(saved)
        : reject(new Error("Measurement save did not produce a record."));
    tx.onerror = () =>
      reject(
        tx.error ??
          new Error(
            "Measurement save failed. Export a backup to retain your draft.",
          ),
      );
    tx.onabort = () =>
      reject(
        new Error(
          conflict
            ? "Another tab saved a different measurement revision. Export your draft, then reopen the saved data before replacing it."
            : "Measurement save was interrupted. The previous saved dataset remains unchanged.",
        ),
      );
  });
}
export function exportMeasurementBackup(
  projectId: string,
  input: MeasurementPayload,
): string {
  const { payload } = validateMeasurementPayload(input);
  const backup: MeasurementBackup = {
    format: "adigunpowerlab-measurements",
    version: 1,
    sourceProjectId: projectId,
    exportedAt: new Date().toISOString(),
    ...payload,
  };
  return JSON.stringify(backup, null, 2);
}
export function parseMeasurementBackup(text: string): {
  backup: MeasurementBackup;
  parsed: MeasurementImport;
} {
  if (text.length > 32_000_000)
    throw new Error("Measurement backup exceeds the 32 MB limit.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Measurement backup is not valid JSON.");
  }
  if (
    !object(data) ||
    data.format !== "adigunpowerlab-measurements" ||
    data.version !== 1 ||
    typeof data.sourceProjectId !== "string" ||
    typeof data.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(data.exportedAt))
  )
    throw new Error("Unsupported measurement backup format or metadata.");
  const { payload, parsed } = validateMeasurementPayload(data);
  return {
    backup: {
      format: "adigunpowerlab-measurements",
      version: 1,
      sourceProjectId: data.sourceProjectId,
      exportedAt: data.exportedAt,
      ...payload,
    },
    parsed,
  };
}
