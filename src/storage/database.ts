import { parseBillJson } from "../import-export/reports";
import { parseMeasurementCSV } from "../import-export/measurements";

export const DATABASE_NAME = "AdigunPowerLab";
export const DATABASE_VERSION = 2;
export const ARCHIVE_STORES = [
  "projects",
  "history",
  "bills",
  "measurements",
  "recoveryRecords",
] as const;
let connection: Promise<IDBDatabase> | undefined;
let opened: IDBDatabase | undefined;

function legacyRows(name: string, store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    let absent = false;
    request.onupgradeneeded = () => {
      absent = true;
      request.transaction?.abort();
    };
    request.onerror = () => (absent ? resolve([]) : reject(request.error));
    request.onblocked = () =>
      reject(
        new Error("Close the older PowerLab tab to migrate local storage."),
      );
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(store)) {
        db.close();
        resolve([]);
        return;
      }
      const tx = db.transaction(store),
        read = tx.objectStore(store).getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      tx.oncomplete = tx.onabort = () => db.close();
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

async function migrateLegacyStores(db: IDBDatabase): Promise<void> {
  const key = "legacy-billing-measurements-v1";
  const done = await new Promise<boolean>((resolve, reject) => {
    const read = db.transaction("metadata").objectStore("metadata").get(key);
    read.onsuccess = () => resolve(Boolean(read.result));
    read.onerror = () => reject(read.error);
  });
  if (done) return;
  const [bills, measurements] = await Promise.all([
    legacyRows("AdigunPowerLab-billing", "drafts"),
    legacyRows("AdigunPowerLabMeasurements", "datasets"),
  ]);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      ["metadata", "bills", "measurements", "recoveryRecords"],
      "readwrite",
    );
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
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(
        tx.error ??
          new Error(
            "Storage migration was interrupted. Original records remain recoverable.",
          ),
      );
  });
}

export function openPowerLabDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;
  connection = new Promise<IDBDatabase>((resolve, reject) => {
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
    request.onupgradeneeded = () => {
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
      rejected = true;
      reject(
        new Error(
          "Close the older PowerLab tab to update local storage. Existing records remain unchanged.",
        ),
      );
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Local storage could not be opened."));
    request.onsuccess = () => {
      const db = request.result;
      if (rejected) {
        db.close();
        return;
      }
      opened = db;
      db.onversionchange = () => {
        db.close();
        opened = undefined;
        connection = undefined;
      };
      resolve(db);
    };
  })
    .then(async (db) => {
      await migrateLegacyStores(db);
      return db;
    })
    .catch((error) => {
      opened?.close();
      opened = undefined;
      connection = undefined;
      throw error;
    });
  return connection;
}

export function closePowerLabDatabase(): void {
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
