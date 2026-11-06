import { test, expect } from "./fixtures";
import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

function url(path = "/") {
  return new URL(path, test.info().project.use.baseURL).href;
}

async function blank(page: Page) {
  await page.route("**/src/main.tsx", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "",
    }),
  );
  await page.goto(url());
  await page.unroute("**/src/main.tsx");
}

test("real quota rejection preserves the saved project and exports the current working draft", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto(url());
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  const before = await page.evaluate(async () => {
    const store = await import(
      /* @vite-ignore */ "/src/storage/projects.ts" as string
    );
    const id = JSON.parse(localStorage.getItem("powerlab:ui:currentProject")!);
    return {
      row: (await store.listProjects()).find(
        (row: { id: string }) => row.id === id,
      ),
      history: await store.projectHistory(id),
    };
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Storage.overrideQuotaForOrigin", {
    origin: new URL(page.url()).origin,
    quotaSize: 1,
  });
  const capacity = await cdp.send("Storage.getUsageAndQuota", {
    origin: new URL(page.url()).origin,
  });
  expect(capacity.quota).toBe(1);
  await page.evaluate(async () => {
    const database = await import(
      /* @vite-ignore */ "/src/storage/database.ts" as string
    );
    const db: IDBDatabase = await database.openPowerLabDatabase();
    const errors: string[] = [];
    (window as unknown as { quotaAbortErrors: string[] }).quotaAbortErrors =
      errors;
    db.addEventListener("abort", (event) => {
      errors.push((event.target as IDBTransaction).error?.name ?? "AbortError");
    });
  });
  // Chromium's BucketContext caches its available-space allowance for 30 seconds.
  // Let that cache expire so this tests a native quota rejection, not a thrown stub.
  await page.waitForTimeout(31000);
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Name", { exact: true })
    .fill("Quota recovery heater");
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Save failed");
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { quotaAbortErrors: string[] }).quotaAbortErrors,
    ),
  ).toContain("QuotaExceededError");
  await expect(page.locator(".load-table")).toContainText(
    "Quota recovery heater",
  );
  const download = page.waitForEvent("download");
  await page
    .locator(".app-alert")
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const artifact = await download;
  const exported = JSON.parse(await readFile((await artifact.path())!, "utf8"));
  expect(exported.id).toBe(before.row.id);
  expect(exported.loads[0].name).toBe("Quota recovery heater");
  expect(exported.loads[0].rating).toBe(2.3);
  expect(
    await page.evaluate(async (project) => {
      const domain = await import(
        /* @vite-ignore */ "/src/domain/project.ts" as string
      );
      return domain.validateProjectImport(project).valid;
    }, exported),
  ).toBe(true);
  const after = await page.evaluate(async (id: string) => {
    const store = await import(
      /* @vite-ignore */ "/src/storage/projects.ts" as string
    );
    return {
      row: (await store.listProjects()).find(
        (row: { id: string }) => row.id === id,
      ),
      history: await store.projectHistory(id),
    };
  }, before.row.id);
  expect(after).toEqual(before);
  await cdp.send("Storage.overrideQuotaForOrigin", {
    origin: new URL(page.url()).origin,
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page.reload();
  await expect(page.locator(".load-table")).toContainText(
    "Quota recovery heater",
  );
});

test("a blocked open is cancelled without a late schema change and can be retried", async ({
  page,
}) => {
  await blank(page);
  const result = await page.evaluate(async () => {
    const domain = await import(
      /* @vite-ignore */ "/src/domain/project.ts" as string
    );
    const original = domain.createProject("Blocked upgrade original");
    const older = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("AdigunPowerLab", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("projects", { keyPath: "id" });
        request.result.createObjectStore("history", { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = older.transaction("projects", "readwrite");
      tx.objectStore("projects").put({
        id: original.id,
        project: original,
        deleted: false,
        savedAt: original.updatedAt,
      });
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    const database = await import(
      /* @vite-ignore */ "/src/storage/database.ts" as string
    );
    const nativeOpen = indexedDB.open.bind(indexedDB);
    let settled!: () => void;
    const lateRequest = new Promise<void>((resolve) => {
      settled = resolve;
    });
    indexedDB.open = (name: string, version?: number) => {
      const request = nativeOpen(name, version);
      if (name === "AdigunPowerLab" && version === 2) {
        request.addEventListener("success", settled);
        request.addEventListener("error", settled);
      }
      return request;
    };
    let failure = "";
    try {
      await database.openPowerLabDatabase();
    } catch (error) {
      failure = String(error);
    } finally {
      indexedDB.open = nativeOpen;
      older.close();
    }
    await lateRequest;
    const versionAfterRejectedOpen = (await indexedDB.databases()).find(
      (db) => db.name === "AdigunPowerLab",
    )?.version;
    const retry = await database.openPowerLabDatabase();
    const projects = await import(
      /* @vite-ignore */ "/src/storage/projects.ts" as string
    );
    const recovered = (await projects.listProjects()).find(
      (row: { id: string }) => row.id === original.id,
    )?.project;
    return {
      failure,
      versionAfterRejectedOpen,
      retryVersion: retry.version,
      original,
      recovered,
    };
  });
  expect(result.failure).toMatch(/Close the older PowerLab tab/);
  expect(result.versionAfterRejectedOpen).toBe(1);
  expect(result.retryVersion).toBe(2);
  expect(result.recovered).toEqual(result.original);
});

test("blocked storage shows the failure and exports a working draft while the original stays recoverable", async ({
  page,
}) => {
  await blank(page);
  const original = await page.evaluate(async () => {
    const domain = await import(
      /* @vite-ignore */ "/src/domain/project.ts" as string
    );
    const project = domain.createProject("Preserved blocked project");
    project.loads = [
      domain.createLoad({ name: "Preserved original heater", rating: 1.5 }),
    ];
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("AdigunPowerLab", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("projects", { keyPath: "id" });
        request.result.createObjectStore("history", { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      tx.objectStore("projects").put({
        id: project.id,
        project,
        deleted: false,
        savedAt: project.updatedAt,
      });
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    (window as unknown as { olderStorage: IDBDatabase }).olderStorage = db;
    localStorage.setItem(
      "powerlab:ui:currentProject",
      JSON.stringify(project.id),
    );
    return project;
  });
  const app = await page.context().newPage();
  await app.goto(url());
  await expect(app.locator(".app-alert")).toContainText(
    "Close the older PowerLab tab",
  );
  await expect(app.locator(".save-badge")).toContainText("Save failed");
  await app
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = app.getByRole("dialog");
  await dialog
    .getByLabel("Name", { exact: true })
    .fill("Blocked working heater");
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(app.locator(".save-badge")).toContainText("Save failed");
  const download = app.waitForEvent("download");
  await app
    .locator(".app-alert")
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const artifact = await download;
  const exported = JSON.parse(await readFile((await artifact.path())!, "utf8"));
  expect(exported.id).not.toBe(original.id);
  expect(exported.loads[0].name).toBe("Blocked working heater");
  expect(exported.loads[0].rating).toBe(2.3);
  expect(
    await app.evaluate(async (project) => {
      const domain = await import(
        /* @vite-ignore */ "/src/domain/project.ts" as string
      );
      return domain.validateProjectImport(project).valid;
    }, exported),
  ).toBe(true);
  const preserved = await page.evaluate(async (id: string) => {
    const db = (window as unknown as { olderStorage: IDBDatabase })
      .olderStorage;
    const project = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction("projects"),
        request = tx.objectStore("projects").get(id);
      tx.oncomplete = () => resolve(request.result.project);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return project;
  }, original.id);
  expect(preserved).toEqual(original);
  await app.reload();
  await expect(app.locator(".load-table")).toContainText(
    "Preserved original heater",
  );
  await expect(app.locator(".save-badge")).toContainText("Saved locally");
  await app.close();
});

test("invalid legacy measurements are quarantined and their originals remain exportable", async ({
  page,
}) => {
  await blank(page);
  const result = await page.evaluate(async () => {
    const base = {
      revision: 1,
      savedAt: "2026-11-06T00:00:00.000Z",
      filename: "reading.csv",
      rawCSV: "timestamp,power\n2026-11-06T00:00:00Z,2",
      options: {
        timestampColumn: "timestamp",
        powerColumn: "power",
        powerUnit: "kW",
        intervalMinutes: 15,
      },
    };
    const originals = [
      { ...base, projectId: "valid-legacy" },
      { ...base, projectId: "blank-filename", filename: "   " },
      { ...base, projectId: "long-filename", filename: "x".repeat(241) },
      {
        ...base,
        projectId: "invalid-csv",
        rawCSV: "timestamp,power\ninvalid,2",
      },
    ];
    const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("AdigunPowerLabMeasurements", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("datasets", { keyPath: "projectId" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = legacy.transaction("datasets", "readwrite");
      for (const row of originals) tx.objectStore("datasets").put(row);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    legacy.close();
    const database = await import(
      /* @vite-ignore */ "/src/storage/database.ts" as string
    );
    const measurements = await import(
      /* @vite-ignore */ "/src/storage/measurements.ts" as string
    );
    const archive = await import(
      /* @vite-ignore */ "/src/storage/archive.ts" as string
    );
    const format = await import(
      /* @vite-ignore */ "/src/import-export/archive.ts" as string
    );
    const db: IDBDatabase = await database.openPowerLabDatabase();
    const activeIds = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const tx = db.transaction("measurements");
      const request = tx.objectStore("measurements").getAllKeys();
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
    });
    const backup = await archive.collectWorkspaceBackup();
    const exported = JSON.parse(
      await format.workspaceBackupBlob(backup).text(),
    );
    const legacyAgain = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("AdigunPowerLabMeasurements", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const retained = await new Promise<unknown[]>((resolve, reject) => {
      const tx = legacyAgain.transaction("datasets");
      const request = tx.objectStore("datasets").getAll();
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
    });
    legacyAgain.close();
    return {
      originals,
      retained,
      activeIds,
      validEnergy: (await measurements.readMeasurements("valid-legacy")).parsed
        .importKWh,
      invalidAbsent:
        (await measurements.readMeasurements("blank-filename")) === null,
      migration: await database.readMigrationStatus(),
      quarantine: exported.recoveryRecords.filter(
        (row: { source: string }) =>
          row.source === "AdigunPowerLabMeasurements/datasets",
      ),
      exportValid: (await format.validateWorkspaceArchive(exported)).valid,
    };
  });
  expect(result.activeIds).toEqual(["valid-legacy"]);
  expect(result.invalidAbsent).toBe(true);
  expect(result.validEnergy).toBe(0.5);
  expect(result.migration.quarantined).toBe(3);
  expect(result.quarantine.map((row: { value: unknown }) => row.value)).toEqual(
    expect.arrayContaining(result.originals.slice(1)),
  );
  expect(result.retained).toHaveLength(result.originals.length);
  expect(result.retained).toEqual(expect.arrayContaining(result.originals));
  expect(result.exportValid).toBe(true);
});

test("interrupting restore after successful writes rolls back every store and allows a clean retry", async ({
  page,
}) => {
  await blank(page);
  const result = await page.evaluate(async () => {
    const domain = await import(
      /* @vite-ignore */ "/src/domain/project.ts" as string
    );
    const database = await import(
      /* @vite-ignore */ "/src/storage/database.ts" as string
    );
    const projects = await import(
      /* @vite-ignore */ "/src/storage/projects.ts" as string
    );
    const billing = await import(
      /* @vite-ignore */ "/src/storage/billing.ts" as string
    );
    const measurements = await import(
      /* @vite-ignore */ "/src/storage/measurements.ts" as string
    );
    const archive = await import(
      /* @vite-ignore */ "/src/storage/archive.ts" as string
    );
    const format = await import(
      /* @vite-ignore */ "/src/import-export/archive.ts" as string
    );
    const baseline = domain.createProject("Preserved original"),
      incoming = domain.createProject("Interrupted incoming");
    const bill = {
      schemaVersion: 1,
      projectName: baseline.name,
      currency: "EUR",
      locale: "en",
      kind: "estimate",
      number: "RECOVERY-ACCEPTANCE",
      date: "2026-11-06",
      dueDate: "",
      seller: "",
      sellerTaxId: "",
      customer: "",
      customerReference: "",
      notes: "Analytical failure fixture",
      paymentDetails: "",
      discountPercent: "0",
      taxPercent: "0",
      lines: [],
    };
    const measured = {
      filename: "original.csv",
      rawCSV: "timestamp,power\n2026-11-06T00:00:00Z,2",
      options: {
        timestampColumn: "timestamp",
        powerColumn: "power",
        powerUnit: "kW",
        intervalMinutes: 15,
      },
    };
    await projects.saveProject(baseline);
    await billing.saveBillingDocument(baseline.id, bill);
    await measurements.saveMeasurements(baseline.id, measured, null);
    const db: IDBDatabase = await database.openPowerLabDatabase();
    const snapshot = () =>
      new Promise<Record<string, unknown[]>>((resolve, reject) => {
        const names = Array.from(db.objectStoreNames),
          tx = db.transaction(names),
          rows: Record<string, unknown[]> = {};
        for (const name of names) {
          const request = tx.objectStore(name).getAll();
          request.onsuccess = () => {
            rows[name] = request.result;
          };
        }
        tx.oncomplete = () => resolve(rows);
        tx.onabort = () => reject(tx.error);
      });
    const backup = await format.sealWorkspaceArchive(
      [
        {
          project: incoming,
          deleted: false,
          savedAt: incoming.updatedAt,
          history: [],
          bill: { ...bill, projectName: incoming.name },
          measurements: measured,
        },
      ],
      [
        {
          key: "inert-source",
          source: "analytical-fixture",
          value: { incomplete: true },
          reason: "Preserved fixture",
          capturedAt: incoming.updatedAt,
        },
      ],
    );
    const before = await snapshot(),
      liveBefore = [...billing.liveDrafts.entries()];
    const originalAdd = IDBObjectStore.prototype.add;
    const successfulWrites: string[] = [];
    let restoreEvents = 0,
      billingEvents = 0;
    window.addEventListener(
      "powerlab-workspace-restored",
      () => restoreEvents++,
    );
    window.addEventListener("adigun-billing-restored", () => billingEvents++);
    IDBObjectStore.prototype.add = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      const request =
        key === undefined
          ? originalAdd.call(this, value)
          : originalAdd.call(this, value, key);
      const name = this.name,
        transaction = this.transaction;
      request.addEventListener("success", () => {
        successfulWrites.push(name);
        if (name === "measurements") transaction.abort();
      });
      return request;
    };
    let failure = "";
    try {
      await archive.restoreWorkspaceBackup(backup, {
        mode: "preserve-if-absent",
      });
    } catch (error) {
      failure = String(error);
    } finally {
      IDBObjectStore.prototype.add = originalAdd;
    }
    const after = await snapshot(),
      liveAfter = [...billing.liveDrafts.entries()];
    const failedEvents = { restoreEvents, billingEvents };
    const retry = await archive.restoreWorkspaceBackup(backup, {
      mode: "preserve-if-absent",
    });
    const recovered = await archive.collectWorkspaceBackup();
    return {
      before,
      after,
      liveBefore,
      liveAfter,
      successfulWrites,
      failure,
      failedEvents,
      retryIds: retry.restoredIds,
      incomingId: incoming.id,
      savedNames: recovered.projects.map(
        (row: { project: { name: string } }) => row.project.name,
      ),
      recoveredValid: (await format.validateWorkspaceArchive(recovered)).valid,
    };
  });
  expect(result.successfulWrites).toEqual(
    expect.arrayContaining(["projects", "history", "bills", "measurements"]),
  );
  expect(result.failure).toMatch(
    /rolled back.*Existing records remain unchanged/,
  );
  expect(result.after).toEqual(result.before);
  expect(result.liveAfter).toEqual(result.liveBefore);
  expect(result.failedEvents).toEqual({ restoreEvents: 0, billingEvents: 0 });
  expect(result.retryIds).toEqual([result.incomingId]);
  expect(result.savedNames).toEqual(
    expect.arrayContaining(["Preserved original", "Interrupted incoming"]),
  );
  expect(result.recoveredValid).toBe(true);
});
