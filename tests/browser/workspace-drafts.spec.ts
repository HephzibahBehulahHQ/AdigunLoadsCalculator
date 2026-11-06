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

test("report drafts survive route, billing tab, locale and project switches without mutating the model", async ({
  page,
}) => {
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
  await page.reload();
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
