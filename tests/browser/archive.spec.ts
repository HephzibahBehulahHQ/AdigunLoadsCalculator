import { test, expect } from "./fixtures";

test("v2 migration retains project, bill, measured data and invalid legacy recovery records", async ({
  page,
}) => {
  await page.route("**/archive-seed.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Archive migration fixture</title>",
    }),
  );
  await page.goto("/archive-seed.html");
  const seeded = await page.evaluate(async () => {
    const domain = await import(
      /* @vite-ignore */ "/src/domain/project.ts" as string
    );
    const p = domain.createProject("Analytical legacy workspace");
    const bill = {
      schemaVersion: 1,
      projectName: p.name,
      currency: "EUR",
      locale: "en",
      kind: "estimate",
      number: "QA-MIGRATION",
      date: "2026-11-06",
      dueDate: "",
      seller: "",
      sellerTaxId: "",
      customer: "",
      customerReference: "",
      notes: "Unsold analytical draft",
      paymentDetails: "",
      discountPercent: "0",
      taxPercent: "0",
      lines: [],
    };
    const measurements = {
      projectId: p.id,
      revision: 1,
      savedAt: p.updatedAt,
      filename: "fixture.csv",
      rawCSV: "timestamp,power\n2026-11-06T00:00:00Z,1",
      options: {
        timestampColumn: "timestamp",
        powerColumn: "power",
        powerUnit: "kW",
        intervalMinutes: 15,
      },
    };
    const seed = (name: string, stores: [string, string, unknown[]][]) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
          for (const [store, keyPath] of stores)
            request.result.createObjectStore(store, { keyPath });
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction(
              stores.map((s) => s[0]),
              "readwrite",
            );
          for (const [store, , rows] of stores)
            for (const row of rows) tx.objectStore(store).put(row);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    await seed("AdigunPowerLab", [
      [
        "projects",
        "id",
        [{ id: p.id, project: p, deleted: false, savedAt: p.updatedAt }],
      ],
      ["history", "key", []],
    ]);
    await seed("AdigunPowerLab-billing", [
      [
        "drafts",
        "key",
        [
          { key: p.id, revision: "legacy-revision", bill },
          { key: "broken-bill", revision: "bad", bill: { schemaVersion: 999 } },
        ],
      ],
    ]);
    await seed("AdigunPowerLabMeasurements", [
      ["datasets", "projectId", [measurements]],
    ]);
    return { id: p.id };
  });
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  const result = await page.evaluate(async (id) => {
    const archive = await import(
        /* @vite-ignore */ "/src/storage/archive.ts" as string
      ),
      db = await import(
        /* @vite-ignore */ "/src/storage/database.ts" as string
      );
    const backup = await archive.collectWorkspaceBackup();
    return {
      entry: backup.projects.find(
        (row: { project: { id: string } }) => row.project.id === id,
      ),
      recovery: backup.recoveryRecords,
      version: (await db.openPowerLabDatabase()).version,
      legacyPresent: (await indexedDB.databases()).filter((d) =>
        /billing|Measurements/.test(d.name ?? ""),
      ).length,
    };
  }, seeded.id);
  expect(result.version).toBe(2);
  expect(result.entry.bill.number).toBe("QA-MIGRATION");
  expect(result.entry.measurements.rawCSV).toContain("2026-11-06T00:00:00Z");
  expect(result.recovery).toHaveLength(1);
  expect(result.legacyPresent).toBe(2);
});

test("workspace restore preserves linked IDs as copies and rolls back every store on a collision", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  const result = await page.evaluate(async () => {
    const domain = await import(
        /* @vite-ignore */ "/src/domain/project.ts" as string
      ),
      projects = await import(
        /* @vite-ignore */ "/src/storage/projects.ts" as string
      ),
      archive = await import(
        /* @vite-ignore */ "/src/storage/archive.ts" as string
      ),
      format = await import(
        /* @vite-ignore */ "/src/import-export/archive.ts" as string
      ),
      bills = await import(
        /* @vite-ignore */ "/src/storage/billing.ts" as string
      ),
      measurements = await import(
        /* @vite-ignore */ "/src/storage/measurements.ts" as string
      );
    const baseline = domain.createProject("Baseline"),
      scenario = domain.createProject("Scenario");
    scenario.scenarioOf = baseline.id;
    scenario.baselineRevision = baseline.revision;
    await projects.saveProject(baseline);
    await projects.saveProject(scenario);
    await measurements.saveMeasurements(
      scenario.id,
      {
        filename: "observed.csv",
        rawCSV: "timestamp,power\n2026-11-06T00:00:00Z,2",
        options: {
          timestampColumn: "timestamp",
          powerColumn: "power",
          powerUnit: "kW",
          intervalMinutes: 15,
        },
      },
      null,
    );
    const backup = await archive.collectWorkspaceBackup({
      projectIds: [scenario.id],
    });
    const copies = await archive.restoreWorkspaceBackup(
      await archive.previewWorkspaceBackup(backup),
      { mode: "copies" },
    );
    const copied = (await projects.listProjects(true)).find(
      (row: { id: string }) => row.id === copies.idMap[scenario.id],
    );
    const copiedMeasurements = await measurements.readMeasurements(copied.id);
    const fresh = domain.createProject("Must roll back"),
      row = {
        project: fresh,
        deleted: false,
        savedAt: fresh.updatedAt,
        history: [],
        bill: null,
        measurements: null,
      };
    const collision = await format.sealWorkspaceArchive([
      row,
      backup.projects.find(
        (p: { project: { id: string } }) => p.project.id === baseline.id,
      ),
    ]);
    let failure = "";
    try {
      await archive.restoreWorkspaceBackup(collision, {
        mode: "preserve-if-absent",
      });
    } catch (error) {
      failure = String(error);
    }
    const after = await projects.listProjects(true);
    return {
      copies: copies.restoredIds.length,
      linked: copied.project.scenarioOf === copies.idMap[baseline.id],
      measured: copiedMeasurements.parsed.importKWh,
      failure,
      partialPresent: after.some((p: { id: string }) => p.id === fresh.id),
      originalPresent: after.some((p: { id: string }) => p.id === baseline.id),
      billAbsent: (await bills.loadBillingDocument(fresh.id)) === null,
    };
  });
  expect(result.copies).toBe(2);
  expect(result.linked).toBe(true);
  expect(result.measured).toBe(0.5);
  expect(result.failure).toMatch(/rolled back/);
  expect(result.partialPresent).toBe(false);
  expect(result.originalPresent).toBe(true);
  expect(result.billAbsent).toBe(true);
});
