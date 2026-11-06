import { test, expect, saveProject, resumeProject } from "./fixtures";
import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await expect(page.locator(".save-badge")).toContainText("Not saved");
}

test("IndexedDB rejects conflicting same-revision writes even when timestamps match", async ({
  page,
}) => {
  await ready(page);
  const outcome = await page.evaluate(async () => {
    const storagePath = "/src/storage/projects.ts";
    const domainPath = "/src/domain/project.ts";
    const store = await import(storagePath);
    const domain = await import(domainPath);
    const baseline = domain.createProject(
      "Analytical conflict fixture",
      "2026-11-05T10:00:00.000Z",
    );
    await store.saveProject(baseline);
    const first = {
      ...structuredClone(baseline),
      name: "First writer",
      revision: 2,
      updatedAt: "2026-11-05T10:00:01.000Z",
    };
    const second = {
      ...structuredClone(baseline),
      name: "Second writer",
      revision: 2,
      updatedAt: "2026-11-05T10:00:01.000Z",
    };
    const writes = await Promise.allSettled([
      store.saveProject(first, 1),
      store.saveProject(second, 1),
    ]);
    const saved = (await store.listProjects(true)).find(
      (record: { id: string }) => record.id === baseline.id,
    );
    return {
      statuses: writes.map((write) => write.status),
      reason: writes
        .filter(
          (write): write is PromiseRejectedResult =>
            write.status === "rejected",
        )
        .map((write) => String(write.reason)),
      saved: saved.project,
    };
  });
  expect(
    outcome.statuses.filter((status) => status === "fulfilled"),
  ).toHaveLength(1);
  expect(
    outcome.statuses.filter((status) => status === "rejected"),
  ).toHaveLength(1);
  expect(outcome.reason.join(" ")).toMatch(
    /changed|another tab|revision|conflict/i,
  );
  expect(outcome.saved.revision).toBe(2);
  expect(["First writer", "Second writer"]).toContain(outcome.saved.name);
});

test("trash tombstone blocks stale saving until an explicit restore", async ({
  page,
}) => {
  await ready(page);
  const outcome = await page.evaluate(async () => {
    const storagePath = "/src/storage/projects.ts";
    const domainPath = "/src/domain/project.ts";
    const store = await import(storagePath);
    const domain = await import(domainPath);
    const baseline = domain.createProject("Analytical trash fixture");
    await store.saveProject(baseline);
    await store.setTrashed(baseline.id, true);
    const stale = {
      ...structuredClone(baseline),
      name: "Stale tab changes",
      revision: 2,
      updatedAt: "2026-11-05T10:00:01.000Z",
    };
    let error = "";
    try {
      await store.saveProject(stale, 1);
    } catch (cause) {
      error = String(cause);
    }
    const trashed = (await store.listProjects(true)).find(
      (record: { id: string }) => record.id === baseline.id,
    );
    const visible = (await store.listProjects()).some(
      (record: { id: string }) => record.id === baseline.id,
    );
    await store.setTrashed(baseline.id, false);
    await store.saveProject(stale, 1);
    const restored = (await store.listProjects()).find(
      (record: { id: string }) => record.id === baseline.id,
    );
    return { error, trashed, visible, restored };
  });
  expect(outcome.error).toMatch(/trash|changed/i);
  expect(outcome.trashed.deleted).toBe(true);
  expect(outcome.trashed.project.name).toBe("Analytical trash fixture");
  expect(outcome.visible).toBe(false);
  expect(outcome.restored.project.name).toBe("Stale tab changes");
  expect(outcome.restored.deleted).toBe(false);
});

test("invalid persisted records are skipped with a warning and retained intact for recovery", async ({
  page,
}) => {
  await ready(page);
  const outcome = await page.evaluate(async () => {
    const storagePath = "/src/storage/projects.ts";
    const store = await import(storagePath);
    const warnings: string[] = [];
    const listener = (event: Event) =>
      warnings.push(String((event as CustomEvent).detail));
    window.addEventListener("powerlab-storage-warning", listener);
    const corrupt = {
      id: "analytical-invalid-record",
      project: {
        id: "analytical-invalid-record",
        schemaVersion: 999,
        name: "Recovery fixture",
        loads: "invalid",
      },
      deleted: false,
      savedAt: "2026-11-05T10:00:00.000Z",
    };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("AdigunPowerLab", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("projects", "readwrite");
      tx.objectStore("projects").put(corrupt);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const listed = await store.listProjects(true);
    const preserved = await new Promise<unknown>((resolve, reject) => {
      const request = database
        .transaction("projects")
        .objectStore("projects")
        .get(corrupt.id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    window.removeEventListener("powerlab-storage-warning", listener);
    return {
      warnings,
      skipped: !listed.some(
        (record: { id: string }) => record.id === corrupt.id,
      ),
      preserved,
      corrupt,
    };
  });
  expect(outcome.skipped).toBe(true);
  expect(outcome.warnings.join(" ")).toContain("left intact for recovery");
  expect(outcome.preserved).toEqual(outcome.corrupt);
  await expect(page.locator(".app-alert")).toContainText(
    "left intact for recovery",
  );
});

test("UI exports conflicting edits and recovers a new copy without overwriting the saved winner", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Recovery heater");
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await saveProject(page);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = "/src/storage/projects.ts";
        const store = await import(path);
        return (await store.listProjects())[0]?.project.loads[0]?.rating;
      }),
    )
    .toBe(2.3);
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page.evaluate(async () => {
    const path = "/src/storage/projects.ts";
    const store = await import(path);
    const record = (await store.listProjects())[0];
    const id = record.id;
    const external = {
      ...structuredClone(record.project),
      name: "Winning saved revision",
      revision: record.project.revision + 1,
      updatedAt: new Date(Date.now() + 1000).toISOString(),
    };
    await store.saveProject(external, record.project.revision);
    const channel = new BroadcastChannel("AdigunPowerLab");
    channel.postMessage({
      id,
      revision: external.revision,
      updatedAt: external.updatedAt,
    });
    channel.close();
  });
  await expect(page.locator(".app-alert")).toContainText(
    /changed|another tab/i,
  );
  await page
    .getByRole("button", { name: "Edit Recovery heater", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Rating/)
    .fill("3");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Save failed");
  await expect(page.locator(".load-table")).toContainText("Recovery heater");
  const downloaded = page.waitForEvent("download");
  await page
    .locator(".app-alert")
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const artifact = await downloaded;
  const backup = JSON.parse(await readFile((await artifact.path())!, "utf8"));
  expect(backup.loads[0].rating).toBe(3);
  const winner = await page.evaluate(async () => {
    const path = "/src/storage/projects.ts";
    const store = await import(path);
    return (await store.listProjects())[0].project;
  });
  expect(winner.name).toBe("Winning saved revision");
  expect(winner.loads[0].rating).toBe(2.3);
  await page
    .locator(".app-alert")
    .getByRole("button", { name: "Save a copy", exact: true })
    .click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Redo", exact: true }),
  ).toBeDisabled();
  const recovered = await page.evaluate(async (winnerId) => {
    const path = "/src/storage/projects.ts";
    const store = await import(path);
    const records = await store.listProjects();
    return {
      current: records.find((row: { id: string }) => row.id !== winnerId)
        .project,
      original: records.find((row: { id: string }) => row.id === winnerId)
        .project,
    };
  }, winner.id);
  expect(recovered.current.id).not.toBe(winner.id);
  expect(recovered.current.loads[0].rating).toBe(3);
  expect(recovered.original).toEqual(winner);
  await page.reload();
  await resumeProject(page, recovered.current.name);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Load Schedule/ })
    .click();
  await expect(page.locator(".load-table")).toContainText("Recovery heater");
  await expect(page.locator(".load-table")).toContainText("24 kWh");
});

test("changing the calendar range terminates the old real worker and retains only new-range results", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const state = window as unknown as {
      __recoveryWorkers: { terminated: boolean }[];
    };
    state.__recoveryWorkers = [];
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      private record: { terminated: boolean };
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.record = { terminated: false };
        state.__recoveryWorkers.push(this.record);
      }
      terminate() {
        this.record.terminated = true;
        super.terminate();
      }
    };
  });
  await ready(page);
  await page.evaluate(async () => {
    const storagePath = "/src/storage/projects.ts";
    const domainPath = "/src/domain/project.ts";
    const store = await import(storagePath);
    const domain = await import(domainPath);
    const project = domain.createProject("Analytical worker race fixture");
    project.loads = Array.from({ length: 1000 }, (_, index) =>
      domain.createLoad({
        name: `Analytical 1 kW ${index}`,
        rating: 1,
        hoursPerDay: 24,
        startHour: 0,
        phase: ["L1", "L2", "L3"][index % 3],
      }),
    );
    await store.saveProject(project);
    store.writePreference("currentProject", project.id);
  });
  await page.reload();
  await resumeProject(page, "Analytical worker race fixture");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Schedules & Simulation/ })
    .click();
  await page.getByLabel("Start date", { exact: true }).fill("2026-01-01");
  await page.getByLabel("End date", { exact: true }).fill("2027-01-01");
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await page.getByLabel("End date", { exact: true }).fill("2026-01-02");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __recoveryWorkers: { terminated: boolean }[];
            }
          ).__recoveryWorkers[0]?.terminated,
      ),
    )
    .toBe(true);
  await expect(page.locator(".metric-strip")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(page.locator(".metric-strip")).toContainText("24,000 kWh");
  await expect(
    page.locator(".panel-head").filter({ hasText: "Calculated · 24 h" }),
  ).toBeVisible();
  const workers = await page.evaluate(
    () =>
      (window as unknown as { __recoveryWorkers: { terminated: boolean }[] })
        .__recoveryWorkers,
  );
  expect(workers).toHaveLength(2);
  expect(workers.every((worker) => worker.terminated)).toBe(true);
  await expect(page.locator(".metric-strip")).not.toContainText("8,760,000");
});
