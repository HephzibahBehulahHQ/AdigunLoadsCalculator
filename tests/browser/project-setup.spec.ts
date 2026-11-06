import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { createLoad, createProject } from "../../src/domain/project";
import type { Project } from "../../src/domain/types";
import { translate, type Locale } from "../../src/i18n";
import { setupText } from "../../src/features/projectSetupMessages";

async function ready(page: Page) {
  const baseURL = test.info().project.use.baseURL ?? "http://127.0.0.1:4176";
  await page.goto(baseURL);
  expect(new URL(page.url()).origin).toBe(new URL(baseURL).origin);
  await expect(page.locator(".overview-banner")).toBeVisible();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
}

async function exported(page: Page, locale: Locale = "en"): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: translate("Export project", locale),
      exact: true,
    })
    .click();
  const file = await pending;
  expect(await file.failure()).toBeNull();
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}

test("first-visit setup has four languages and saves independent project settings", async ({
  page,
}) => {
  await ready(page);
  const setup = page.locator(".project-setup");
  await expect(setup).toBeVisible();
  const before = await exported(page);
  expect(before.loads).toEqual([]);
  expect(before.currency).toBe("EUR");
  await expect(
    page.getByRole("button", { name: "Open reference case", exact: true }),
  ).toBeVisible();
  await setup
    .getByLabel("Project name", { exact: true })
    .fill("Setup workshop");
  await setup
    .getByLabel("Application context", { exact: true })
    .selectOption("Workshop");
  await setup.getByLabel("Timezone", { exact: true }).fill("Africa/Lagos");
  await setup.getByLabel("Currency", { exact: true }).selectOption("NGN");
  await setup
    .getByLabel("Jurisdiction (optional)", { exact: true })
    .fill("Entered workshop criteria");
  let previous: Locale = "en";
  for (const locale of ["de", "yo", "pcm", "en"] as const) {
    await setup
      .getByLabel(setupText("Interface language", previous), { exact: true })
      .selectOption(locale);
    await expect(setup.getByRole("heading")).toHaveText(
      setupText("Project setup", locale),
    );
    await expect(
      setup.getByLabel(setupText("Currency", locale), { exact: true }),
    ).toHaveValue("NGN");
    await expect(
      setup.getByLabel(setupText("Jurisdiction (optional)", locale), {
        exact: true,
      }),
    ).toHaveValue("Entered workshop criteria");
    await expect(
      setup.getByLabel(setupText("Project name", locale), { exact: true }),
    ).toHaveValue("Setup workshop");
    if (locale === "de")
      await setup
        .getByLabel(setupText("Frequency (Hz)", locale), { exact: true })
        .fill("60,5");
    previous = locale;
  }
  await expect(setup.getByLabel("Frequency (Hz)", { exact: true })).toHaveValue(
    "60,5",
  );
  await setup
    .getByRole("button", { name: "Save project setup", exact: true })
    .click();
  await expect(setup).not.toBeVisible();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  const saved = await exported(page);
  expect(saved).toMatchObject({
    name: "Setup workshop",
    context: "Workshop",
    timezone: "Africa/Lagos",
    currency: "NGN",
    jurisdiction: "Entered workshop criteria",
    supply: { voltageLN: 230, voltageLL: 400, frequency: 60.5, limitA: 63 },
    loads: [],
  });
  await page.reload();
  await expect(page.locator(".overview-banner h2")).toHaveText(
    "Setup workshop",
  );
  await expect(setup).not.toBeVisible();
  expect(await exported(page)).toEqual(saved);
});

test("unfinished setup survives detail, navigation and layout changes while the first load is entered immediately", async ({
  page,
}) => {
  await ready(page);
  const setup = page.locator(".project-setup");
  await setup
    .getByLabel("Project name", { exact: true })
    .fill("Unfinished setup");
  await setup.getByLabel("Timezone", { exact: true }).fill("Africa/Lagos");
  await setup
    .getByLabel("Line-to-neutral voltage (V)", { exact: true })
    .fill("240,");
  const mode = page.locator(".page-heading .detail-mode-control select");
  await mode.selectOption("simple");
  await page
    .getByRole("button", { name: "Collapse navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await mode.selectOption("engineering");
  await expect(
    setup.getByLabel("Line-to-neutral voltage (V)", { exact: true }),
  ).toHaveValue("240,");
  await setup
    .getByRole("button", { name: "Add first load", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Setup test heater");
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByLabel(/^Operating hours/).fill("8");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(page.locator(".load-table")).toContainText("Setup test heater");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Overview/ })
    .click();
  await expect(setup).toBeVisible();
  await expect(setup.getByLabel("Project name", { exact: true })).toHaveValue(
    "Unfinished setup",
  );
  await expect(setup.getByLabel("Timezone", { exact: true })).toHaveValue(
    "Africa/Lagos",
  );
  await expect(
    setup.getByLabel("Line-to-neutral voltage (V)", { exact: true }),
  ).toHaveValue("240,");
  const beforeSetupSave = await exported(page);
  expect(beforeSetupSave.name).toBe("Untitled project");
  expect(beforeSetupSave.loads).toHaveLength(1);
  await setup
    .getByLabel("Line-to-neutral voltage (V)", { exact: true })
    .fill("230");
  await setup
    .getByRole("button", { name: "Save project setup", exact: true })
    .click();
  const afterSetupSave = await exported(page);
  expect(afterSetupSave.name).toBe("Unfinished setup");
  expect(afterSetupSave.timezone).toBe("Africa/Lagos");
  expect(afterSetupSave.loads).toEqual(beforeSetupSave.loads);
});

test("invalid setup values never enter the project and the draft survives reload", async ({
  page,
}) => {
  await ready(page);
  const before = await exported(page);
  const setup = page.locator(".project-setup");
  await setup.getByLabel("Project name", { exact: true }).fill("");
  await setup.getByLabel("Timezone", { exact: true }).fill("Unknown/Timezone");
  await setup
    .getByLabel("Line-to-neutral voltage (V)", { exact: true })
    .fill("0");
  await setup.getByLabel("Frequency (Hz)", { exact: true }).fill("Infinity");
  await setup.getByLabel("Supply limit (A)", { exact: true }).fill("1,000");
  await setup
    .getByRole("button", { name: "Save project setup", exact: true })
    .click();
  await expect(setup.getByRole("alert")).toHaveCount(5);
  expect(await exported(page)).toEqual(before);
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(setup).toBeVisible();
  await expect(setup.getByLabel("Project name", { exact: true })).toHaveValue(
    "",
  );
  await expect(setup.getByLabel("Timezone", { exact: true })).toHaveValue(
    "Unknown/Timezone",
  );
  await expect(
    setup.getByLabel("Supply limit (A)", { exact: true }),
  ).toHaveValue("1,000");
  await setup
    .getByRole("button", { name: "Save project setup", exact: true })
    .click();
  await expect(setup.getByRole("alert")).toHaveCount(5);
  expect(await exported(page)).toEqual(before);
  await setup
    .getByLabel("Project name", { exact: true })
    .fill("Validated setup");
  await setup.getByLabel("Timezone", { exact: true }).fill("UTC");
  await setup
    .getByLabel("Line-to-neutral voltage (V)", { exact: true })
    .fill("120");
  await setup.getByLabel("Frequency (Hz)", { exact: true }).fill("60");
  await setup.getByLabel("Supply limit (A)", { exact: true }).fill("100");
  await setup.getByLabel("Jurisdiction (optional)", { exact: true }).fill("");
  await setup
    .getByRole("button", { name: "Save project setup", exact: true })
    .click();
  await expect(setup).not.toBeVisible();
  expect(await exported(page)).toMatchObject({
    name: "Validated setup",
    timezone: "UTC",
    jurisdiction: "",
    supply: { voltageLN: 120, frequency: 60, limitA: 100 },
  });
});

test("opening a saved populated project does not change its metadata or show first-visit setup", async ({
  page,
}) => {
  await ready(page);
  const existing = createProject("Analytical saved project");
  existing.revision = 7;
  existing.context = "Commercial";
  existing.currency = "GBP";
  existing.timezone = "UTC";
  existing.jurisdiction = "Entered project criteria";
  existing.supply = {
    voltageLN: 120,
    voltageLL: 208,
    frequency: 60,
    limitA: 100,
  };
  existing.loads = [
    createLoad({ name: "Existing test load", voltage: 120, rating: 0.6 }),
  ];
  await page.evaluate(async (project) => {
    const path = "/src/storage/projects.ts";
    const storage = await import(path);
    await storage.saveProject(project);
  }, existing);
  await page.locator(".project-actions > summary").click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Open project",
    exact: true,
  });
  await dialog
    .locator(".project-list > div > button:first-child")
    .filter({ hasText: "Analytical saved project" })
    .click();
  await expect(page.locator(".overview-banner h2")).toHaveText(existing.name);
  await expect(page.locator(".project-setup")).not.toBeVisible();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("powerlab:ui:currentProject") ?? "null",
        ),
      ),
    )
    .toBe(existing.id);
  expect(await exported(page)).toEqual(existing);
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith("adigunpowerlab.project-setup.v1:"))
        sessionStorage.removeItem(key);
  });
  await page.reload();
  await expect(page.locator(".overview-banner h2")).toHaveText(existing.name);
  await expect(page.locator(".project-setup")).not.toBeVisible();
  expect(await exported(page)).toEqual(existing);
});
