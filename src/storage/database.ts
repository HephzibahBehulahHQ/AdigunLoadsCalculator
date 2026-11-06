import { parseBillJson } from "../import-export/reports";
import { parseMeasurementCSV } from "../import-export/measurements";

export const DATABASE_NAME = "AdigunPowerLab";
export const DATABASE_VERSION = 2;
export const STORAGE_OPEN_TIMEOUT_MS = 8000;
export const ARCHIVE_STORES = [
  "projects",
  "history",
  "bills",
  "measurements",
  "recoveryRecords",
] as const;
let connection: Promise<IDBDatabase> | undefined;
let opened: IDBDatabase | undefined;
let blockedOpenError: Error | undefined;
let generation = 0;

const timeoutError = () =>
  new Error(
    "Local storage did not respond. Your saved records have not been deleted. Close older PowerLab tabs and retry, or export your current work.",
  );

function legacyRows(
  name: string,
  store: string,
  signal: AbortSignal,
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(timeoutError());
      return;
    }
    const request = indexedDB.open(name, 1);
    let absent = false;
    let finished = false;
    let database: IDBDatabase | undefined;
    let transaction: IDBTransaction | undefined;
    const finish = (rows: unknown[], error?: unknown) => {
      if (finished) return;
      finished = true;
      signal.removeEventListener("abort", interrupted);
      database?.close();
      if (error) reject(error);
      else resolve(rows);
    };
    const interrupted = () => {
      try {
        transaction?.abort();
      } catch {
        /* Already finished. */
      }
      finish([], timeoutError());
    };
    signal.addEventListener("abort", interrupted, { once: true });
    request.onupgradeneeded = () => {
      absent = true;
      request.transaction?.abort();
    };
    request.onerror = () => finish([], absent ? undefined : request.error);
    request.onblocked = () =>
      finish(
        [],
        new Error("Close the older PowerLab tab to migrate local storage."),
      );
    request.onsuccess = () => {
      const db = request.result;
      if (finished || signal.aborted) {
        db.close();
        return;
      }
      database = db;
      if (!db.objectStoreNames.contains(store)) {
        finish([]);
        return;
      }
      const tx = (transaction = db.transaction(store)),
        read = tx.objectStore(store).getAll();
      let rows: unknown[] = [];
      read.onsuccess = () => {
        rows = read.result;
      };
      tx.oncomplete = () => finish(rows);
      tx.onerror = tx.onabort = () =>
        finish(
          [],
          tx.error ?? new Error("Legacy storage read was interrupted."),
        );
    };
  });
}

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
function validLegacyBill(value: unknown): boolean {
  if (
    !object(value) ||
    typeof value.key !== "string" ||
    !value.key ||
    typeof value.revision !== "string"
  )
    return false;
  try {
    parseBillJson(JSON.stringify(value.bill));
    return true;
  } catch {
    return false;
  }
}
function validLegacyMeasurements(value: unknown): boolean {
  if (
    !object(value) ||
    typeof value.projectId !== "string" ||
    !value.projectId ||
    typeof value.rawCSV !== "string" ||
    typeof value.filename !== "string" ||
    !value.filename.trim() ||
    value.filename.length > 240 ||
    !object(value.options) ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 1 ||
    typeof value.savedAt !== "string" ||
    !Number.isFinite(Date.parse(value.savedAt))
  )
    return false;
  const o = value.options;
  if (
    typeof o.timestampColumn !== "string" ||
    typeof o.powerColumn !== "string" ||
    typeof o.intervalMinutes !== "number" ||
    (o.powerUnit !== "W" && o.powerUnit !== "kW")
  )
    return false;
  return (
    parseMeasurementCSV(value.rawCSV, {
      timestampColumn: o.timestampColumn,
      powerColumn: o.powerColumn,
      intervalMinutes: o.intervalMinutes,
      powerUnit: o.powerUnit,
    }).errors.length === 0
  );
}

async function migrateLegacyStores(
  db: IDBDatabase,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) throw timeoutError();
  const key = "legacy-billing-measurements-v1";
  const done = await new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction("metadata"),
      read = tx.objectStore("metadata").get(key);
    let value = false;
    const interrupted = () => {
      try {
        tx.abort();
      } catch {
        /* Already finished. */
      }
      reject(timeoutError());
    };
    signal.addEventListener("abort", interrupted, { once: true });
    read.onsuccess = () => {
      value = Boolean(read.result);
    };
    tx.oncomplete = () => {
      signal.removeEventListener("abort", interrupted);
      resolve(value);
    };
    tx.onerror = tx.onabort = () => {
      signal.removeEventListener("abort", interrupted);
      reject(tx.error ?? new Error("Storage migration could not be checked."));
    };
  });
  if (signal.aborted) throw timeoutError();
  if (done) return;
  const [bills, measurements] = await Promise.all([
    legacyRows("AdigunPowerLab-billing", "drafts", signal),
    legacyRows("AdigunPowerLabMeasurements", "datasets", signal),
  ]);
  if (signal.aborted) throw timeoutError();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      ["metadata", "bills", "measurements", "recoveryRecords"],
      "readwrite",
    );
    const interrupted = () => {
      try {
        tx.abort();
      } catch {
        /* Already finished. */
      }
      reject(timeoutError());
    };
    signal.addEventListener("abort", interrupted, { once: true });
    const marker = tx.objectStore("metadata").get(key);
    marker.onsuccess = () => {
      if (marker.result) return;
      let quarantined = 0;
      const copy = (
        rows: unknown[],
        storeName: "bills" | "measurements",
        source: string,
        valid: (v: unknown) => boolean,
      ) => {
        for (const [index, row] of rows.entries()) {
          if (!valid(row)) {
            quarantined++;
            tx.objectStore("recoveryRecords").put({
              key: `legacy:${source}:${index}`,
              source,
              value: row,
              reason:
                "Legacy record failed validation; retained as inert recovery data.",
              capturedAt: new Date().toISOString(),
            });
            continue;
          }
          const record = row as Record<string, unknown>;
          const store = tx.objectStore(storeName),
            get = store.get(
              String(record[storeName === "bills" ? "key" : "projectId"]),
            );
          get.onsuccess = () => {
            if (get.result === undefined) store.put(record);
          };
        }
      };
      copy(bills, "bills", "AdigunPowerLab-billing/drafts", validLegacyBill);
      copy(
        measurements,
        "measurements",
        "AdigunPowerLabMeasurements/datasets",
        validLegacyMeasurements,
      );
      tx.objectStore("metadata").put({
        key,
        completedAt: new Date().toISOString(),
        bills: bills.length,
        measurements: measurements.length,
        quarantined,
        originalDatabasesRetained: true,
      });
    };
    tx.oncomplete = () => {
      signal.removeEventListener("abort", interrupted);
      resolve();
    };
    tx.onerror = tx.onabort = () => {
      signal.removeEventListener("abort", interrupted);
      reject(
        tx.error ??
          new Error(
            "Storage migration was interrupted. Original records remain recoverable.",
          ),
      );
    };
  });
}

export function openPowerLabDatabase(): Promise<IDBDatabase> {
  // A blocked native open cannot be cancelled until the older connection closes.
  // Reject retries promptly instead of queuing them behind that pending request.
  if (blockedOpenError) return Promise.reject(blockedOpenError);
  if (connection) return connection;
  const attempt = ++generation;
  const aborter = new AbortController();
  let attemptDatabase: IDBDatabase | undefined;
  let timeout: ReturnType<typeof setTimeout>;
  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    timeout = setTimeout(() => {
      aborter.abort();
      attemptDatabase?.close();
      reject(timeoutError());
    }, STORAGE_OPEN_TIMEOUT_MS);
    if (!globalThis.indexedDB) {
      reject(
        new Error(
          "Local storage is unavailable. Export your work before closing this page.",
        ),
      );
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    let rejected = false;
    let blockedFailure: Error | undefined;
    const releaseBlockedOpen = () => {
      if (blockedOpenError === blockedFailure) blockedOpenError = undefined;
    };
    request.onupgradeneeded = () => {
      if (rejected || aborter.signal.aborted || attempt !== generation) {
        request.transaction?.abort();
        return;
      }
      const db = request.result;
      for (const [name, keyPath] of [
        ["projects", "id"],
        ["history", "key"],
        ["bills", "key"],
        ["measurements", "projectId"],
        ["metadata", "key"],
        ["recoveryRecords", "key"],
      ]) {
        if (!db.objectStoreNames.contains(name))
          db.createObjectStore(name, { keyPath });
      }
    };
    request.onblocked = () => {
      if (aborter.signal.aborted || attempt !== generation) return;
      rejected = true;
      blockedFailure = new Error(
        "Close the older PowerLab tab to update local storage. Existing records remain unchanged.",
      );
      blockedOpenError = blockedFailure;
      reject(blockedFailure);
    };
    request.onerror = () => {
      releaseBlockedOpen();
      reject(request.error ?? new Error("Local storage could not be opened."));
    };
    request.onsuccess = () => {
      releaseBlockedOpen();
      const db = request.result;
      if (rejected || aborter.signal.aborted || attempt !== generation) {
        db.close();
        return;
      }
      attemptDatabase = db;
      opened = db;
      db.onversionchange = () => {
        db.close();
        if (opened === db) opened = undefined;
        if (attempt === generation) connection = undefined;
      };
      // Keep the same deadline for metadata and legacy migration, too.
      migrateLegacyStores(db, aborter.signal).then(() => {
        if (!aborter.signal.aborted && attempt === generation) resolve(db);
        else {
          db.close();
          reject(timeoutError());
        }
      }, reject);
    };
  })
    .catch((error) => {
      aborter.abort();
      attemptDatabase?.close();
      if (opened === attemptDatabase) opened = undefined;
      if (attempt === generation) connection = undefined;
      throw error;
    })
    .finally(() => clearTimeout(timeout));
  connection = pending;
  return connection;
}

export function closePowerLabDatabase(): void {
  generation++;
  opened?.close();
  opened = undefined;
  connection = undefined;
}

export async function readMigrationStatus(): Promise<unknown> {
  const db = await openPowerLabDatabase();
  return new Promise((resolve, reject) => {
    const read = db
      .transaction("metadata")
      .objectStore("metadata")
      .get("legacy-billing-measurements-v1");
    read.onsuccess = () => resolve(read.result ?? null);
    read.onerror = () => reject(read.error);
  });
}
