import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  closePowerLabDatabase,
  openPowerLabDatabase,
  STORAGE_OPEN_TIMEOUT_MS,
} from "../src/storage/database";

type ReadRequest = {
  result: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
};
type Transaction = {
  error: DOMException | null;
  oncomplete: (() => void) | null;
  onabort: (() => void) | null;
  onerror: (() => void) | null;
  objectStore: () => {
    get: () => ReadRequest;
    getAll: () => ReadRequest;
    put: ReturnType<typeof vi.fn>;
  };
  abort: () => void;
};

function localDatabase() {
  const transactions: {
    tx: Transaction;
    read: ReadRequest;
    stores: string | string[];
  }[] = [];
  const database = {
    close: vi.fn(),
    objectStoreNames: { contains: () => true },
    createObjectStore: vi.fn(),
    onversionchange: null as (() => void) | null,
    transaction(stores: string | string[]) {
      const read: ReadRequest = {
        result: undefined,
        onsuccess: null,
        onerror: null,
      };
      const tx: Transaction = {
        error: null,
        oncomplete: null,
        onabort: null,
        onerror: null,
        objectStore: () => ({
          get: () => read,
          getAll: () => read,
          put: vi.fn(),
        }),
        abort: vi.fn(() => tx.onabort?.()),
      };
      transactions.push({ tx, read, stores });
      return tx;
    },
  };
  return {
    database,
    transactions,
    marker(value: unknown) {
      const { tx, read } = transactions[0];
      read.result = value;
      read.onsuccess?.();
      tx.oncomplete?.();
    },
  };
}

function nativeOpens() {
  const requests: {
    result?: ReturnType<typeof localDatabase>["database"];
    error: DOMException | null;
    transaction?: { abort: () => void };
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
    onblocked: (() => void) | null;
    onupgradeneeded: (() => void) | null;
  }[] = [];
  const open = vi.fn(() => {
    const request = {
      error: null,
      onsuccess: null,
      onerror: null,
      onblocked: null,
      onupgradeneeded: null,
    };
    requests.push(request);
    return request;
  });
  vi.stubGlobal("indexedDB", { open });
  return {
    open,
    requests,
    success(index: number, db: ReturnType<typeof localDatabase>) {
      requests[index].result = db.database;
      requests[index].onsuccess?.();
    },
  };
}

beforeEach(() => {
  closePowerLabDatabase();
  vi.useFakeTimers();
});
afterEach(() => {
  closePowerLabDatabase();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("bounded local-storage startup", () => {
  it("rejects unavailable storage immediately", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(openPowerLabDatabase()).rejects.toThrow("unavailable");
  });

  it("times out a silent native open, permits retry, and closes a late obsolete connection", async () => {
    const native = nativeOpens();
    const first = openPowerLabDatabase();
    const failed = expect(first).rejects.toThrow("did not respond");
    await vi.advanceTimersByTimeAsync(STORAGE_OPEN_TIMEOUT_MS);
    await failed;
    const retry = openPowerLabDatabase();
    expect(native.open).toHaveBeenCalledTimes(2);
    const stale = localDatabase();
    native.success(0, stale);
    expect(stale.database.close).toHaveBeenCalledOnce();
    expect(stale.transactions).toHaveLength(0);
    const current = localDatabase();
    native.success(1, current);
    current.marker({ completedAt: "previously completed" });
    await expect(retry).resolves.toBe(current.database);
    await expect(openPowerLabDatabase()).resolves.toBe(current.database);
    expect(native.open).toHaveBeenCalledTimes(2);
  });

  it("uses the same startup deadline for an unresponsive migration marker transaction", async () => {
    const native = nativeOpens();
    const pending = openPowerLabDatabase();
    const failed = expect(pending).rejects.toThrow("did not respond");
    const opened = localDatabase();
    native.success(0, opened);
    await vi.advanceTimersByTimeAsync(STORAGE_OPEN_TIMEOUT_MS);
    await failed;
    expect(opened.transactions[0].tx.abort).toHaveBeenCalledOnce();
    expect(opened.database.close).toHaveBeenCalled();
    // A late read/commit may not turn the failed attempt into a live connection.
    opened.marker(true);
    const retry = openPowerLabDatabase();
    const healthy = localDatabase();
    native.success(1, healthy);
    healthy.marker(true);
    await expect(retry).resolves.toBe(healthy.database);
  });

  it("rejects a marker read whose request succeeds but transaction aborts", async () => {
    const native = nativeOpens();
    const pending = openPowerLabDatabase();
    const failed = expect(pending).rejects.toThrow("could not be checked");
    const opened = localDatabase();
    native.success(0, opened);
    const { read, tx } = opened.transactions[0];
    read.result = true;
    read.onsuccess?.();
    tx.abort();
    await failed;
    expect(opened.database.close).toHaveBeenCalled();
  });

  it("bounds legacy database opens and closes any late results without migrating them", async () => {
    const native = nativeOpens();
    const pending = openPowerLabDatabase();
    const failed = expect(pending).rejects.toThrow("did not respond");
    const opened = localDatabase();
    native.success(0, opened);
    opened.marker(undefined);
    await Promise.resolve();
    expect(native.open).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(STORAGE_OPEN_TIMEOUT_MS);
    await failed;
    for (const index of [1, 2]) {
      const legacy = localDatabase();
      native.success(index, legacy);
      expect(legacy.database.close).toHaveBeenCalledOnce();
      expect(legacy.transactions).toHaveLength(0);
    }
    expect(opened.transactions).toHaveLength(1);
  });

  it("rejects a blocked upgrade promptly and does not queue duplicate attempts", async () => {
    const native = nativeOpens();
    const pending = openPowerLabDatabase();
    const failed = expect(pending).rejects.toThrow(
      "Close the older PowerLab tab",
    );
    native.requests[0].onblocked?.();
    await failed;
    await expect(openPowerLabDatabase()).rejects.toThrow(
      "Close the older PowerLab tab",
    );
    expect(native.open).toHaveBeenCalledOnce();
    native.requests[0].transaction = { abort: vi.fn() };
    native.requests[0].onupgradeneeded?.();
    expect(native.requests[0].transaction?.abort).toHaveBeenCalledOnce();
    native.requests[0].error = new DOMException(
      "Upgrade aborted",
      "AbortError",
    );
    native.requests[0].onerror?.();
    const retry = openPowerLabDatabase();
    const healthy = localDatabase();
    native.success(1, healthy);
    healthy.marker(true);
    await expect(retry).resolves.toBe(healthy.database);
  });

  it("does not let an old version-change callback invalidate the newer live connection", async () => {
    const native = nativeOpens();
    const first = openPowerLabDatabase();
    const old = localDatabase();
    native.success(0, old);
    old.marker(true);
    await first;
    closePowerLabDatabase();
    const second = openPowerLabDatabase();
    const current = localDatabase();
    native.success(1, current);
    current.marker(true);
    await second;
    old.database.onversionchange?.();
    await expect(openPowerLabDatabase()).resolves.toBe(current.database);
    expect(native.open).toHaveBeenCalledTimes(2);
  });
});
