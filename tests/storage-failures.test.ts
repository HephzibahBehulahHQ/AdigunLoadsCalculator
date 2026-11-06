import { afterEach, describe, expect, it, vi } from "vitest";
import {
  listProjects,
  projectHistory,
  setTrashed,
} from "../src/storage/projects";
import { loadDraft } from "../src/storage/billing";
import { readMeasurements } from "../src/storage/measurements";
import { openPowerLabDatabase } from "../src/storage/database";

vi.mock("../src/storage/database", () => ({ openPowerLabDatabase: vi.fn() }));

/** Control browser events independently: request success can precede an abort. */
function interruptedDatabase(result: unknown) {
  const request = { result, error: null, onsuccess: null, onerror: null };
  const transaction = {
    error: null as DOMException | null,
    oncomplete: null,
    onabort: null,
    onerror: null,
    objectStore: () => ({
      get: () => request,
      getAll: () => request,
      put: vi.fn(),
    }),
    abort: vi.fn(),
  };
  vi.mocked(openPowerLabDatabase).mockResolvedValue({
    transaction: () => transaction,
  } as unknown as IDBDatabase);
  return {
    requestSucceeded() {
      (request.onsuccess as unknown as () => void)();
    },
    committed() {
      (transaction.oncomplete as unknown as () => void)();
    },
    aborted() {
      (transaction.onabort as unknown as () => void)();
    },
  };
}

const reads = [
  { name: "project list", run: () => listProjects(), stored: [], expected: [] },
  {
    name: "project history",
    run: () => projectHistory("project"),
    stored: [],
    expected: [],
  },
  {
    name: "billing draft",
    run: () => loadDraft("bill"),
    stored: undefined,
    expected: undefined,
  },
  {
    name: "measurement data",
    run: () => readMeasurements("project"),
    stored: undefined,
    expected: null,
  },
];

afterEach(() => vi.resetAllMocks());

describe("interrupted local persistence", () => {
  for (const read of reads) {
    it(`${read.name} remains pending until the transaction commits`, async () => {
      const events = interruptedDatabase(read.stored);
      const settled = vi.fn();
      const result = read.run();
      void result.then(settled, settled);
      await Promise.resolve();
      events.requestSucceeded();
      await Promise.resolve();
      await Promise.resolve();
      expect(settled).not.toHaveBeenCalled();
      events.committed();
      await expect(result).resolves.toEqual(read.expected);
    });

    it(`${read.name} rejects an abort even after its request succeeded`, async () => {
      const events = interruptedDatabase(read.stored);
      const result = read.run();
      const rejected = expect(result).rejects.toThrow(
        "saved data has not been changed",
      );
      await Promise.resolve();
      events.requestSucceeded();
      events.aborted();
      await rejected;
    });

    it(`${read.name} rejects an abort before its request returns`, async () => {
      const events = interruptedDatabase(read.stored);
      const result = read.run();
      const rejected = expect(result).rejects.toThrow(
        "saved data has not been changed",
      );
      await Promise.resolve();
      events.aborted();
      await rejected;
    });
  }

  it("interrupted trash changes reject so the caller can release its busy state", async () => {
    const events = interruptedDatabase(undefined);
    const result = setTrashed("project", true);
    const rejected = expect(result).rejects.toThrow(
      "trash change was interrupted",
    );
    await Promise.resolve();
    events.aborted();
    await rejected;
  });
});
