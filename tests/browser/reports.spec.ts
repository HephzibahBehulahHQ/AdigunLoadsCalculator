import { readFile } from "node:fs/promises";
import { test, expect, saveProject, resumeProject } from "./fixtures";

test("reviewed report sections and model BOM create real exports and a persistent priced estimate", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill("Analytical BOM heater");
  await page
    .getByRole("dialog")
    .getByLabel(/^Rating/)
    .fill("1");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add load", exact: true })
    .click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Reports & Estimates/ })
    .click();
  await page
    .getByLabel("Project reference", { exact: true })
    .fill("QA-FROZEN-REPORT");
  await page
    .getByLabel("Prepared by", { exact: true })
    .fill("Analytical export fixture — Überprüfung / Àyẹ̀wò");
  await page
    .getByRole("button", { name: "Save report details", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save report details", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "Model-derived bill of materials",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Freeze report preview", exact: true })
    .click();
  await expect(page.locator("#engineering-report-preview")).toContainText(
    "QA-FROZEN-REPORT",
  );
  await expect(page.locator("#engineering-report-preview")).toContainText(
    "Analytical BOM heater",
  );
  const jsonEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export frozen report data", exact: true })
    .click();
  const json = JSON.parse(
    await readFile((await (await jsonEvent).path())!, "utf8"),
  );
  expect(json.project.reportDetails.reference).toBe("QA-FROZEN-REPORT");
  expect(json.result.revision).toBe(json.project.revision);
  const pdfEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Generate selected PDF", exact: true })
    .click();
  const pdf = await readFile((await (await pdfEvent).path())!);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page
    .getByRole("button", { name: "Print reviewed report", exact: true })
    .click();
  await page.emulateMedia({ media: "print" });
  await expect(
    page.locator("#engineering-report-preview header"),
  ).toBeVisible();
  await expect(page.locator(".report-controls").first()).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("body")).not.toHaveClass(
    /engineering-report-print-mode/,
  );
  await page
    .getByLabel("Unit price — Analytical BOM heater", { exact: true })
    .fill("19.99");
  await page
    .getByLabel("Labour quantity — Analytical BOM heater", { exact: true })
    .fill("2");
  await page
    .getByLabel("Labour unit price — Analytical BOM heater", { exact: true })
    .fill("10");
  await page.getByLabel("Contingency (%)", { exact: true }).fill("10");
  await page
    .getByRole("button", { name: "Preview priced estimate", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Reviewed estimate changes",
      exact: true,
    }),
  ).toContainText("4.00");
  await page
    .getByRole("button", {
      name: "Apply reviewed quantities to bill",
      exact: true,
    })
    .click();
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€43.99",
  );
  await saveProject(page);
  await page.reload();
  await resumeProject(page);
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€43.99",
  );
});

test("German numeric input commits comma decimals and invalid required text cannot submit", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("de");
  await page
    .getByRole("button", { name: "Last hinzufügen", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Name", { exact: true })
    .fill("Analytische Dezimalprüfung");
  const rating = dialog.getByLabel(/^Nennwert/);
  await rating.fill("2,5");
  const quantity = dialog.getByLabel("Anzahl", { exact: true });
  await quantity.fill("1.234");
  await quantity.press("Tab");
  await expect(quantity).toHaveAttribute("aria-invalid", "true");
  expect(
    await quantity.evaluate((input: HTMLInputElement) => input.checkValidity()),
  ).toBe(false);
  await dialog
    .getByRole("button", { name: "Last hinzufügen", exact: true })
    .click();
  await expect(dialog).toBeVisible();
  await quantity.fill("1");
  await quantity.press("Tab");
  expect(
    await quantity.evaluate((input: HTMLInputElement) => input.checkValidity()),
  ).toBe(true);
  await dialog
    .getByRole("button", { name: "Last hinzufügen", exact: true })
    .click();
  await expect(page.locator(".load-table")).toContainText(
    "Analytische Dezimalprüfung",
  );
  await page
    .getByRole("combobox", { name: "Sprache", exact: true })
    .selectOption("en");
  await expect(page.locator(".load-table")).toContainText(
    "Analytische Dezimalprüfung",
  );
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const exported = JSON.parse(
    await readFile((await (await downloadEvent).path())!, "utf8"),
  );
  expect(exported.loads[0].rating).toBe(2.5);
});
