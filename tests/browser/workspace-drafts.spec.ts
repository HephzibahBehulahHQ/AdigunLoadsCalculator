import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { translate, type Locale } from "../../src/i18n";

const appURL = () => new URL("/", test.info().project.use.baseURL).href;
async function route(page: Page, name: string, locale: Locale = "en") {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp(
        "^" + translate(name, locale).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ),
    })
    .click();
}
async function switchProject(page: Page, name: string) {
  await page.locator(".project-switch").click();
  await page
    .getByRole("dialog")
    .locator(".project-list")
    .getByRole("button", { name: new RegExp("^" + name + " ") })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function seed(page: Page) {
  await page.goto(appURL());
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  const projects = await page.evaluate(async () => {
    const domain = await import(
      /* @vite-ignore */ "/src/domain/project.ts" as string
    );
    const storage = await import(
      /* @vite-ignore */ "/src/storage/projects.ts" as string
    );
    const a = domain.createProject("Draft project A"),
      b = domain.createProject("Draft project B");
    a.loads = [domain.createLoad({ name: "Draft heater A", rating: 1 })];
    b.loads = [domain.createLoad({ name: "Draft heater B", rating: 2 })];
    await storage.saveProject(a);
    await storage.saveProject(b);
    storage.writePreference("currentProject", a.id);
    return [a, b];
  });
  await page.reload();
  await expect(page.locator(".project-switch")).toContainText(
    "Draft project A",
  );
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  return projects;
}
async function blockers(page: Page) {
  return page.evaluate(async () => {
    const updates = await import(
      /* @vite-ignore */ "/src/pwa/updates.ts" as string
    );
    return updates.updateBlockers();
  });
}

async function failProjectWrites(page: Page) {
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    (
      window as unknown as { restoreProjectWrites: () => void }
    ).restoreProjectWrites = () => {
      IDBObjectStore.prototype.put = originalPut;
    };
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      const request =
        key === undefined
          ? originalPut.call(this, value)
          : originalPut.call(this, value, key);
      if (this.name === "projects") {
        const transaction = this.transaction;
        request.addEventListener("success", () => transaction.abort());
      }
      return request;
    };
  });
}

test("report drafts survive route, billing tab, locale and project switches without mutating the model", async ({
  page,
}) => {
  test.setTimeout(90000);
  const original = await seed(page);
  await route(page, "Reports & Estimates");
  await page
    .getByLabel("Project reference", { exact: true })
    .fill("Unsaved reference A");
  await page
    .getByRole("checkbox", {
      name: "Model-derived bill of materials",
      exact: true,
    })
    .check();
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("de");
  await page
    .getByLabel(`${translate("Unit price", "de")} — Draft heater A`, {
      exact: true,
    })
    .fill("19,99");
  await page
    .getByLabel(`${translate("Labour unit price", "de")} — Draft heater A`, {
      exact: true,
    })
    .fill("12,3.4");
  await page
    .getByRole("button", {
      name: translate("Customer bill", "de"),
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: translate("Engineering report", "de"),
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel(translate("Project reference", "de"), { exact: true }),
  ).toHaveValue("Unsaved reference A");
  await expect(
    page.getByLabel(`${translate("Unit price", "de")} — Draft heater A`, {
      exact: true,
    }),
  ).toHaveValue("19,99");
  await switchProject(page, "Draft project B");
  await route(page, "Reports & Estimates", "de");
  await expect(
    page.getByLabel(translate("Project reference", "de"), { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByLabel(`${translate("Unit price", "de")} — Draft heater B`, {
      exact: true,
    }),
  ).toHaveValue("");
  await page
    .getByLabel(translate("Project reference", "de"), { exact: true })
    .fill("Unsaved reference B");
  await switchProject(page, "Draft project A");
  await route(page, "Reports & Estimates", "de");
  await expect(
    page.getByLabel(
      `${translate("Labour unit price", "de")} — Draft heater A`,
      { exact: true },
    ),
  ).toHaveValue("12,3.4");
  await route(page, "Overview", "de");
  expect(await blockers(page)).toContain(
    translate("Report details and sections", "de"),
  );
  const pendingDialog = page.waitForEvent("dialog");
  const navigation = page.evaluate(() => location.reload());
  const dialog = await pendingDialog;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await navigation.catch(() => {});
  await page
    .getByRole("combobox", { name: translate("Language", "de"), exact: true })
    .selectOption("en");
  await route(page, "Reports & Estimates");
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Unsaved reference A");
  await expect(
    page.getByLabel("Unit price — Draft heater A", { exact: true }),
  ).toHaveValue("19.99");
  await expect(
    page.getByLabel("Labour unit price — Draft heater A", { exact: true }),
  ).toHaveValue("12,3.4");
  await expect(
    page.getByRole("checkbox", {
      name: "Model-derived bill of materials",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Preview priced estimate", exact: true })
    .click();
  await expect(
    page.locator(".report-workspace").getByRole("alert"),
  ).toContainText("Use a comma for decimals");
  const unchanged = await page.evaluate(
    async (ids: string[]) => {
      const storage = await import(
        /* @vite-ignore */ "/src/storage/projects.ts" as string
      );
      const records = await storage.listProjects();
      return ids.map(
        (id) => records.find((row: { id: string }) => row.id === id).project,
      );
    },
    original.map((project: { id: string }) => project.id),
  );
  expect(unchanged).toEqual(original);
  await page
    .getByRole("button", { name: "Save report details", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save report details", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Labour quantity — Draft heater A", { exact: true })
    .fill("2");
  await page
    .getByLabel("Labour unit price — Draft heater A", { exact: true })
    .fill("10");
  await page.getByLabel("Contingency (%)", { exact: true }).fill("10");
  await page
    .getByRole("button", { name: "Freeze report preview", exact: true })
    .click();
  await expect(page.locator("#engineering-report-preview")).toContainText(
    "Unsaved reference A",
  );
  await route(page, "Overview");
  await route(page, "Reports & Estimates");
  await expect(page.locator("#engineering-report-preview")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Export frozen report data",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Preview priced estimate", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Apply reviewed quantities to bill",
      exact: true,
    })
    .click();
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€43.99",
  );
  expect(await blockers(page)).toContain("Report details and sections");
  await switchProject(page, "Draft project B");
  await route(page, "Reports & Estimates");
  await page
    .getByRole("button", { name: "Engineering report", exact: true })
    .click();
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Unsaved reference B");
  await page
    .getByRole("button", { name: "Discard unsaved draft", exact: true })
    .click();
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("");
  expect(await blockers(page)).not.toContain("Report details and sections");
  await switchProject(page, "Draft project A");
  await route(page, "Reports & Estimates");
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Unsaved reference A");
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page.reload();
  await expect(page.locator(".project-switch")).toContainText(
    "Draft project A",
  );
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Unsaved reference A");
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€43.99",
  );
});

test("failed report persistence retains a dirty guarded draft even after the in-memory model accepts the details", async ({
  page,
}) => {
  test.setTimeout(90000);
  const [original] = await seed(page);
  await route(page, "Reports & Estimates");
  await page
    .getByLabel("Project reference", { exact: true })
    .fill("Report save must retry");
  await failProjectWrites(page);
  await page
    .getByRole("button", { name: "Save report details", exact: true })
    .click();
  await expect(page.locator(".save-badge")).toContainText("Save failed");
  await expect(
    page.locator(".report-workspace").getByRole("alert"),
  ).toContainText("Local save failed");
  await route(page, "Overview");
  expect(await blockers(page)).toContain("Report details and sections");
  await route(page, "Reports & Estimates");
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Report save must retry");
  await expect(
    page.getByRole("button", { name: "Save report details", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Freeze report preview", exact: true }),
  ).toBeDisabled();
  const persisted = await page.evaluate(async (id: string) => {
    const storage = await import(
      /* @vite-ignore */ "/src/storage/projects.ts" as string
    );
    return (await storage.listProjects()).find(
      (row: { id: string }) => row.id === id,
    ).project;
  }, original.id);
  expect(persisted).toEqual(original);
  await page.evaluate(() =>
    (
      window as unknown as { restoreProjectWrites: () => void }
    ).restoreProjectWrites(),
  );
  await page
    .getByRole("button", { name: "Save report details", exact: true })
    .click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await route(page, "Overview");
  expect(await blockers(page)).not.toContain("Report details and sections");
  await page.reload();
  await route(page, "Reports & Estimates");
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Report save must retry");
  await failProjectWrites(page);
  await page
    .getByLabel("Project reference", { exact: true })
    .fill("Discard rejected details");
  await page
    .getByRole("button", { name: "Save report details", exact: true })
    .click();
  await expect(page.locator(".save-badge")).toContainText("Save failed");
  await page.evaluate(() =>
    (
      window as unknown as { restoreProjectWrites: () => void }
    ).restoreProjectWrites(),
  );
  await page
    .getByRole("button", { name: "Discard unsaved draft", exact: true })
    .click();
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Report save must retry");
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  expect(await blockers(page)).not.toContain("Report details and sections");
  await page.reload();
  await expect(
    page.getByLabel("Project reference", { exact: true }),
  ).toHaveValue("Report save must retry");
});

test("measurement drafts retain their CSV, mapping and raw interval across routes and projects until save or discard", async ({
  page,
}) => {
  test.setTimeout(90000);
  const original = await seed(page);
  await route(page, "Schedules & Simulation");
  const panel = page.locator(".measurements-panel");
  await expect(panel.locator("input[type=file]")).toBeEnabled();
  const savedCSV =
    "at,reading\n2026-11-06T00:00:00Z,1200\n2026-11-06T01:00:00Z,600";
  await panel.locator("input[type=file]").setInputFiles({
    name: "saved-a.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(savedCSV),
  });
  await panel.getByLabel("Power unit", { exact: true }).selectOption("W");
  await panel.getByLabel(/^Declared elapsed interval/).fill("60");
  await panel
    .getByRole("button", { name: "Preview measured data", exact: true })
    .click();
  await expect(panel.locator(".measurement-metrics")).toContainText("1.8 kWh");
  await panel
    .getByRole("button", { name: "Save measured data", exact: true })
    .click();
  await expect(panel).toContainText(
    "Measured data saved locally, separately from the engineering project.",
  );
  const draftCSV =
    "at,reading\n2026-11-06T00:00:00Z,2400\n2026-11-06T01:00:00Z,1200";
  await panel.locator("input[type=file]").setInputFiles({
    name: "draft-a.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(draftCSV),
  });
  await panel.getByLabel("Power unit", { exact: true }).selectOption("W");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("de");
  await panel
    .getByLabel(new RegExp("^" + translate("Declared elapsed interval", "de")))
    .fill("30,0x");
  await route(page, "Overview", "de");
  expect(await blockers(page)).toContain(translate("Measurements", "de"));
  await switchProject(page, "Draft project B");
  await route(page, "Schedules & Simulation", "de");
  await expect(panel).not.toContainText("draft-a.csv");
  await expect(panel.locator("input[type=file]")).toBeEnabled();
  await panel.locator("input[type=file]").setInputFiles({
    name: "draft-b.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("timestamp,power\n2026-11-06T00:00:00Z,5"),
  });
  await route(page, "Overview", "de");
  await page
    .getByRole("combobox", { name: translate("Language", "de"), exact: true })
    .selectOption("en");
  await switchProject(page, "Draft project A");
  await route(page, "Schedules & Simulation");
  await expect(panel).toContainText("draft-a.csv");
  await expect(
    panel.getByLabel("Timestamp column", { exact: true }),
  ).toHaveValue("at");
  await expect(
    panel.getByLabel("Interval-average power column", { exact: true }),
  ).toHaveValue("reading");
  await expect(panel.getByLabel("Power unit", { exact: true })).toHaveValue(
    "W",
  );
  await expect(panel.getByLabel(/^Declared elapsed interval/)).toHaveValue(
    "30,0x",
  );
  await expect(panel.getByLabel(/^Declared elapsed interval/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    panel.getByRole("button", { name: "Save measured data", exact: true }),
  ).toBeDisabled();
  await expect(panel).toContainText(
    "Previous validated measurements remain visible. The new draft has not replaced them.",
  );
  await expect(panel.locator(".measurement-metrics")).toContainText("1.8 kWh");
  const unchanged = await page.evaluate(
    async (ids: string[]) => {
      const projects = await import(
        /* @vite-ignore */ "/src/storage/projects.ts" as string
      );
      const measurements = await import(
        /* @vite-ignore */ "/src/storage/measurements.ts" as string
      );
      const rows = await projects.listProjects();
      return {
        projects: ids.map(
          (id) => rows.find((row: { id: string }) => row.id === id).project,
        ),
        saved: (await measurements.readMeasurements(ids[0])).saved,
        other: await measurements.readMeasurements(ids[1]),
      };
    },
    original.map((project: { id: string }) => project.id),
  );
  expect(unchanged.projects).toEqual(original);
  expect(unchanged.saved.rawCSV).toBe(savedCSV);
  expect(unchanged.saved.options.intervalMinutes).toBe(60);
  expect(unchanged.other).toBeNull();
  await panel.getByLabel(/^Declared elapsed interval/).fill("30.5");
  await panel
    .getByRole("button", { name: "Preview measured data", exact: true })
    .click();
  await expect(panel.locator(".measurement-metrics")).toContainText("1.83 kWh");
  await panel
    .getByRole("button", { name: "Save measured data", exact: true })
    .click();
  await expect(panel).toContainText(
    "Measured data saved locally, separately from the engineering project.",
  );
  await route(page, "Overview");
  expect(await blockers(page)).toContain("Measurements");
  await switchProject(page, "Draft project B");
  await route(page, "Schedules & Simulation");
  await expect(panel).toContainText("draft-b.csv");
  await panel
    .getByRole("button", { name: "Discard unsaved draft", exact: true })
    .click();
  await expect(panel).toContainText("No measured dataset is open.");
  await expect(panel.locator("input[type=file]")).toBeEnabled();
  expect(await blockers(page)).not.toContain("Measurements");
  await switchProject(page, "Draft project A");
  await route(page, "Schedules & Simulation");
  await expect(panel).toContainText(
    "Saved measurements reopened and validated.",
  );
  await expect(panel.getByLabel(/^Declared elapsed interval/)).toHaveValue(
    "30.5",
  );
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page.reload();
  await expect(panel).toContainText("draft-a.csv");
  await expect(panel.locator(".measurement-metrics")).toContainText("1.83 kWh");
  const after = await page.evaluate(
    async (ids: string[]) => {
      const storage = await import(
        /* @vite-ignore */ "/src/storage/projects.ts" as string
      );
      const rows = await storage.listProjects();
      return ids.map(
        (id) => rows.find((row: { id: string }) => row.id === id).project,
      );
    },
    original.map((project: { id: string }) => project.id),
  );
  expect(after).toEqual(original);
});
