import { parseBillJson, type BillDocument } from "../import-export/reports";
import { openPowerLabDatabase } from "./database";
import { readCommitted } from "./transactions";

export type StoredDraft = { key: string; revision: string; bill: BillDocument };
export const liveDrafts = new Map<
  string,
  { bill: BillDocument; revision: string | null; dirty: boolean }
>();

export async function loadDraft(key: string): Promise<StoredDraft | undefined> {
  const db = await openPowerLabDatabase();
  const value = (await readCommitted(db, "bills", (store) =>
    store.get(key),
  )) as StoredDraft | undefined;
  if (value && (value.key !== key || typeof value.revision !== "string"))
    throw new Error("Invalid billing storage metadata.");
  return value
    ? { ...value, bill: parseBillJson(JSON.stringify(value.bill)) }
    : undefined;
}
export async function saveDraft(
  key: string,
  document: BillDocument,
  expected: string | null,
): Promise<string> {
  if (!key || key.length > 240)
    throw new Error("A valid project is required for billing saving.");
  const bill = parseBillJson(JSON.stringify(document)),
    db = await openPowerLabDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["bills", "projects"], "readwrite"),
      store = tx.objectStore("bills");
    const read = store.get(key),
      owner = tx.objectStore("projects").get(key);
    let revision = "",
      conflict = false;
    owner.onsuccess = () => {
      if (owner.result?.deleted) {
        conflict = true;
        tx.abort();
      }
    };
    read.onsuccess = () => {
      if ((read.result?.revision ?? null) !== expected) {
        conflict = true;
        tx.abort();
        return;
      }
      revision = crypto.randomUUID();
      store.put({ key, revision, bill } satisfies StoredDraft);
    };
    tx.oncomplete = () => resolve(revision);
    tx.onerror = tx.onabort = () =>
      reject(new Error(conflict ? "conflict" : "storage"));
  });
}

/** Includes a live unsaved billing draft, when the current session has one. */
export async function loadBillingDocument(
  projectId: string,
): Promise<BillDocument | null> {
  const live = liveDrafts.get(projectId);
  if (live) return structuredClone(live.bill);
  const stored = await loadDraft(projectId);
  return stored ? structuredClone(stored.bill) : null;
}

export async function saveBillingDocument(
  projectId: string,
  document: BillDocument,
): Promise<void> {
  const stored = await loadDraft(projectId);
  const live = liveDrafts.get(projectId);
  const revision = await saveDraft(
    projectId,
    document,
    live ? live.revision : (stored?.revision ?? null),
  );
  acceptRestoredBilling(projectId, document, revision);
}

export function acceptRestoredBilling(
  projectId: string,
  bill: BillDocument,
  revision: string,
): void {
  liveDrafts.set(projectId, {
    bill: structuredClone(bill),
    revision,
    dirty: false,
  });
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("adigun-billing-restored", { detail: { projectId } }),
    );
}
