import { test, expect } from "./fixtures";
import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import type { Project } from "../../src/domain/types";
import { translate, type Locale } from "../../src/i18n";

const workspaceMode = (page: Page) =>
  page.locator(".page-heading .detail-mode-control select");
async function exported(page: Page): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const file = await pending;
  expect(await file.failure()).toBeNull();
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}
async function route(page: Page, name: string) {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
}
async function newLoad(page: Page, name = "Mode heater") {
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByLabel(/^Operating hours/).fill("8");
  return dialog;
}

test("detail switching preserves invalid drafts, advanced assumptions, exact model and saved preference", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  const dialog = await newLoad(page);
  await dialog.getByLabel("Quantity", { exact: true }).fill("2");
  await dialog.getByLabel(/^Energy duty/).fill("0.5");
  await dialog.getByLabel(/^Utilization/).fill("0.5");
  await dialog.getByLabel(/^Standby power/).fill("20");
  await dialog
    .getByLabel("Detail level", { exact: true })
    .selectOption("simple");
  await expect(dialog.getByLabel("Name", { exact: true })).toHaveValue(
    "Mode heater",
  );
  await expect(dialog.getByLabel(/^Utilization/)).toBeHidden();
  await expect(
    dialog.getByLabel("Source reference", { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator(".detail-calculation")).toContainText("10 A");
  await expect(dialog.locator(".detail-calculation")).toContainText("10 kWh");

  await dialog
    .getByLabel("Detail level", { exact: true })
    .selectOption("engineering");
  await dialog.getByLabel(/^Utilization/).fill("0,5.0");
  await dialog
    .getByLabel("Detail level", { exact: true })
    .selectOption("simple");
  await expect(dialog.getByLabel(/^Utilization/)).toHaveValue("0,5.0");
  await expect(dialog.getByLabel(/^Utilization/)).toBeVisible();
  await expect(dialog.getByLabel(/^Utilization/)).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(dialog.locator(".detail-calculation")).not.toContainText("10 A");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^Utilization/).fill("0.5");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  const row = page
    .locator(".load-table tbody tr")
    .filter({ hasText: "Mode heater" });
  await expect(row.locator("td")).toHaveCount(5);
  await expect(row).toContainText("10 A");
  await expect(row).toContainText("10 kWh");
  const before = await exported(page);
  expect(before.loads[0]).toMatchObject({
    rating: 2.3,
    quantity: 2,
    utilization: 0.5,
    standbyW: 20,
    duty: 0.5,
    hoursPerDay: 8,
  });
  await workspaceMode(page).selectOption("engineering");
  await expect(row.locator("td")).toHaveCount(9);
  await expect(row).toContainText("10 A");
  await expect(row).toContainText("10 kWh");
  await row
    .getByRole("button", { name: "Mode heater", exact: false })
    .first()
    .click();
  await expect(page.locator(".inspector .detail-equations")).toContainText(
    "E = 2.3 × 4 + 0.04 × (24 − 4) ≈ 10 kWh",
  );
  await workspaceMode(page).selectOption("simple");
  await expect(page.locator(".inspector .detail-equations")).toHaveCount(0);
  expect(await exported(page)).toEqual(before);
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page.reload();
  await expect(workspaceMode(page)).toHaveValue("simple");
  expect(await exported(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test("failed, incomplete and unsupported checks remain visible in both views", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  let dialog = await newLoad(page);
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await route(page, "Settings");
  const settings = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Project settings", exact: true }),
  });
  await settings.getByLabel(/^Supply limit/).fill("5");
  await settings.getByRole("button", { name: "Save", exact: true }).click();
  await route(page, "Overview");
  for (const mode of ["simple", "engineering"]) {
    await workspaceMode(page).selectOption(mode);
    await expect(
      page.locator(".overview-bottom .issue-row").filter({
        hasText: "L1 design current exceeds the entered 5 A supply limit.",
      }),
    ).toBeVisible();
    await expect(page.locator(".overview-bottom")).toContainText("failed");
    if (mode === "engineering")
      await expect(page.locator(".engineering-calculation")).toBeVisible();
    else await expect(page.locator(".engineering-calculation")).toHaveCount(0);
  }
  await route(page, "Load Schedule");
  await page
    .getByRole("button", { name: "Edit Mode heater", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Voltage/).fill("0");
  for (const mode of ["simple", "engineering"]) {
    await dialog.getByLabel("Detail level", { exact: true }).selectOption(mode);
    await expect(dialog.getByLabel(/^Voltage/)).toHaveValue("0");
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog.locator(".detail-calculation")).toContainText(
      "Enter valid values",
    );
  }
  await dialog.getByLabel(/^Voltage/).fill("230");
  await dialog
    .getByLabel("Power factor basis", { exact: true })
    .selectOption("true");
  for (const mode of ["simple", "engineering"]) {
    await dialog.getByLabel("Detail level", { exact: true }).selectOption(mode);
    await expect(dialog.locator(".detail-checks")).toContainText("unsupported");
    await expect(dialog.locator(".detail-checks")).toContainText(
      "True PF supports power/current magnitudes only.",
    );
  }
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  for (const mode of ["simple", "engineering"]) {
    await workspaceMode(page).selectOption(mode);
    await expect(page.locator(".load-check-status")).toContainText(
      "unsupported",
    );
  }
});

test("mode controls and essential explanations work in all four languages without changing project data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  const add = await newLoad(page);
  await add.getByRole("button", { name: "Add load", exact: true }).click();
  const before = await exported(page);
  for (const locale of ["en", "de", "yo", "pcm"] as Locale[]) {
    const t = (key: string) => translate(key, locale);
    await page.locator(".language-select").selectOption(locale);
    await workspaceMode(page).selectOption("simple");
    await expect(
      page.locator(".page-heading .detail-mode-control"),
    ).toContainText(t("Detail level"));
    await expect(page.locator(".detail-mode-intro")).toContainText(
      t("Essential inputs and explained results. Your project stays the same."),
    );
    await page
      .getByRole("button", { name: t("Edit") + " Mode heater", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(t("Name"), { exact: true })).toHaveValue(
      "Mode heater",
    );
    await expect(
      dialog.getByText(
        t("Rating is per item; quantity is the number of identical items."),
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      dialog.getByText(
        t(
          "Read current as the load while equipment is on. Read daily energy as the estimated use over 24 hours.",
        ),
        { exact: true },
      ),
    ).toBeVisible();
    await dialog
      .getByLabel(t("Detail level"), { exact: true })
      .selectOption("engineering");
    await expect(
      dialog.getByText(t("Current calculation"), { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: t("Cancel"), exact: true })
      .click();
  }
  await page.locator(".language-select").selectOption("en");
  expect(await exported(page)).toEqual(before);
});
