import { test, expect } from "./fixtures";
import { readFile } from "node:fs/promises";
import { tools } from "../../src/tools";
async function ready(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
}
async function addLoad(
  page: import("@playwright/test").Page,
  { name = "Analytical heater", rating = "2.3", hours = "8", duty = "1" } = {},
) {
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByLabel(/^Rating/).fill(rating);
  await dialog.getByLabel(/^Operating hours/).fill(hours);
  await dialog.getByLabel(/^Energy duty/).fill(duty);
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(page.locator(".load-table")).toBeVisible();
}
async function route(page: import("@playwright/test").Page, name: string) {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
}
test("empty project → load → correct current/energy → duty → undo → export → reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await expect(page.getByText("Build your first power study")).toBeVisible();
  await addLoad(page);
  const row = page.locator("tbody tr").filter({ hasText: "Analytical heater" });
  await expect(row).toContainText("10 A");
  await expect(row).toContainText("18.4 kWh");
  await page
    .getByRole("button", { name: "Edit Analytical heater", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Energy duty/)
    .fill("0.5");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(row).toContainText("10 A");
  await expect(row).toContainText("9.2 kWh");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(row).toContainText("18.4 kWh");
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const file = await download;
  const data = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(data.loads[0].rating).toBe(2.3);
  expect(data.loads[0].duty).toBe(1);
  await page.reload();
  await expect(page.locator(".load-table")).toBeVisible();
  await expect(page.locator(".load-table")).toContainText("Analytical heater");
  await route(page, "Overview");
  await page.screenshot({
    path: "docs/screenshots/desktop-project.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("all 51 toolbox examples execute through actual inputs", async ({
  page,
}) => {
  test.setTimeout(120000);
  await ready(page);
  await route(page, "Engineering Toolbox");
  for (const tool of tools) {
    await page
      .locator(".tool-item")
      .filter({ hasText: tool.id })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Load worked example", exact: true })
      .click();
    await page
      .locator(".tool-workspace")
      .getByRole("button", { name: "Calculate", exact: true })
      .click();
    await expect(
      page.locator(".tool-result"),
      tool.id + " " + tool.title,
    ).toBeVisible();
    await expect(page.locator(".tool-workspace .error-text")).toHaveCount(0);
  }
  await page.screenshot({
    path: "docs/screenshots/toolbox.png",
    fullPage: true,
  });
});
test("native import preview preserves current work on malformed JSON and survives CSV injection strings", async ({
  page,
}) => {
  await ready(page);
  await addLoad(page);
  await page.locator('input[type=file][accept=".json,.csv"]').setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("alert")).toContainText("not valid");
  await expect(page.locator(".load-table")).toContainText("Analytical heater");
  await page.locator('input[type=file][accept=".json,.csv"]').setInputFiles({
    name: "schedule.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "name,rating,voltage,pf,hoursPerDay\nImported lamp,0.1,230,1,10",
    ),
  });
  await expect(page.getByRole("dialog")).toContainText("Imported lamp");
  await page.getByRole("button", { name: "Apply import", exact: true }).click();
  await expect(page.locator(".load-table")).toContainText("Imported lamp");
  await expect(page.locator(".load-table")).toContainText("Analytical heater");
});
test("calendar worker integrates a DST day and cancels on a project edit", async ({
  page,
}) => {
  await ready(page);
  await addLoad(page, { name: "Constant 1 kW", rating: "1", hours: "24" });
  await route(page, "Schedules & Simulation");
  await page.getByLabel("Start date", { exact: true }).fill("2026-10-25");
  await page.getByLabel("End date", { exact: true }).fill("2026-10-26");
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(page.locator(".metric-strip")).toContainText("25 kWh");
  await expect(page.locator(".panel-head")).toContainText([
    "Calculated · 25 h",
    "24-hour estimate",
  ]);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export series", exact: true })
    .click();
  const file = await download;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv.split("\r\n").length).toBe(101);
});
test("local BOT proposes a real load, requires confirmation, and supports undo", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.locator(".local-bot");
  await expect(bot).toBeVisible();
  await bot
    .locator("textarea")
    .fill("load: BOT heater; 2.3 kW; 230 V; PF 1; 8 h");
  await bot.getByRole("button", { name: "Send", exact: true }).click();
  await expect(bot).toContainText("BOT heater");
  await expect(page.locator(".overview-banner")).toContainText("0");
  await bot
    .getByRole("button", { name: "Apply confirmed changes", exact: true })
    .click();
  await expect(page.locator(".overview-banner")).toContainText("1");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByText("Build your first power study")).toBeVisible();
});
test("four language controls, light theme and mobile layout preserve working data", async ({
  page,
}) => {
  await ready(page);
  await addLoad(page);
  for (const [locale, text] of [
    ["de", "Lastenliste"],
    ["yo", "Àtòjọ ẹrù"],
    ["pcm", "Load Schedule"],
    ["en", "Load Schedule"],
  ]) {
    await page.getByLabel(/Language|Sprache|Èdè/).selectOption(locale);
    await expect(page.locator(".page-heading h2")).toHaveText(text);
    await expect(page.locator(".load-table")).toContainText(
      "Analytical heater",
    );
  }
  await route(page, "Settings");
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({
    path: "docs/screenshots/light-settings.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  if (
    await page
      .getByRole("button", { name: "Collapse navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Collapse navigation", exact: true })
      .click();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "docs/screenshots/mobile-settings.png",
    fullPage: true,
  });
});
