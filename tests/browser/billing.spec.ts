import { readFile } from "node:fs/promises";
import { test, expect, saveProject, resumeProject } from "./fixtures";

test("customer bill computes exact money, persists, downloads, prints and works on mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Reports & Estimates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await expect(page.locator(".billing-workspace")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save draft locally", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Document number", { exact: true }).fill("QA-2026-002");
  await page
    .getByLabel("Supplier", { exact: true })
    .fill("Analytical test supplier\nVerification fixture only");
  await page
    .getByLabel("Customer", { exact: true })
    .fill("Analytical test customer\nÀdánwò Yorùbá — Hamburg");
  await page.getByRole("button", { name: "Add line", exact: false }).click();
  await page
    .getByLabel("Description 1", { exact: true })
    .fill("Entered analytical cable length — Àdánwò");
  await page.getByLabel("Qty 1", { exact: true }).fill("2.5");
  await page.getByLabel("Unit price 1", { exact: true }).fill("19.99");
  await page.getByLabel("Discount (%)", { exact: true }).fill("10");
  await page.getByLabel("Tax (%)", { exact: true }).fill("19");
  // Independent expected amount: 49.98 - 5.00 + 8.55 = 53.53 EUR.
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€53.53",
  );
  await page
    .getByRole("button", { name: "Save draft locally", exact: true })
    .click();
  await expect(
    page.getByText("Draft saved locally", { exact: true }),
  ).toBeVisible();

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const pdf = await readFile((await download.path())!);
  expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  expect(pdf.subarray(-64).toString("ascii")).toContain("%%EOF");
  expect(pdf.byteLength).toBeGreaterThan(10000);

  // Replace only the native dialog; exercise the actual visible print action.
  await page.evaluate(() => {
    const state = window as Window & { billingPrintCalls?: number };
    state.billingPrintCalls = 0;
    window.print = () => {
      state.billingPrintCalls = (state.billingPrintCalls ?? 0) + 1;
    };
  });
  await page
    .getByRole("button", { name: "Print / Save PDF", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { billingPrintCalls?: number }).billingPrintCalls,
    ),
  ).toBe(1);
  await expect(page.locator("body")).toHaveClass(/billing-print-mode/);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".billing-editor")).toBeHidden();
  await expect(page.locator("#billing-print-document")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator("body")).not.toHaveClass(/billing-print-mode/);
  await expect(page.locator(".billing-editor")).toBeVisible();

  await saveProject(page);
  await page.reload();
  await resumeProject(page);
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await expect(page.locator(".billing-save-state")).toHaveText(
    "Saved on this device",
  );
  await expect(page.getByLabel("Document number", { exact: true })).toHaveValue(
    "QA-2026-002",
  );
  await expect(page.getByLabel("Description 1", { exact: true })).toHaveValue(
    "Entered analytical cable length — Àdánwò",
  );
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€53.53",
  );
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("yo");
  await expect(
    page.getByRole("button", { name: "Gba PDF", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".app")).toHaveClass(/sidebar-collapsed/);
  const width = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€53.53",
  );
  expect(errors).toEqual([]);
});

test("German bill decimals preserve invalid drafts across reload without exporting stale totals", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Reports & Estimates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await page.getByLabel("Document number", { exact: true }).fill("QA-DE-DRAFT");
  await page
    .getByLabel("Supplier", { exact: true })
    .fill("Analytical supplier");
  await page
    .getByLabel("Customer", { exact: true })
    .fill("Analytical customer");
  await page.getByRole("button", { name: "Add line", exact: false }).click();
  await page
    .getByLabel("Description 1", { exact: true })
    .fill("Locale decimal fixture");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("de");
  await page.getByLabel("Menge 1", { exact: true }).fill("2,5");
  await page.getByLabel("Einzelpreis 1", { exact: true }).fill("19,99");
  await page.getByLabel("Rabatt (%)", { exact: true }).fill("10");
  await page.getByLabel("Steuer (%)", { exact: true }).fill("19");
  await expect(page.locator(".billing-grand-total strong")).toContainText(
    "53,53",
  );
  await page.getByLabel("Einzelpreis 1", { exact: true }).fill("1.234");
  await page.getByLabel("Einzelpreis 1", { exact: true }).blur();
  await expect(
    page.getByLabel("Einzelpreis 1", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByRole("button", { name: "PDF herunterladen", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Entwurf lokal speichern", exact: true })
    .click();
  await expect(
    page.getByText("Entwurf lokal gespeichert", { exact: true }),
  ).toBeVisible();
  await saveProject(page);
  await page.reload();
  await resumeProject(page);
  await page
    .getByRole("button", { name: "Kundenrechnung", exact: true })
    .click();
  await expect(page.getByLabel("Einzelpreis 1", { exact: true })).toHaveValue(
    "1.234",
  );
  await expect(
    page.getByRole("button", { name: "PDF herunterladen", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Sprache", exact: true })
    .selectOption("en");
  await expect(page.getByLabel("Unit price 1", { exact: true })).toHaveValue(
    "1.234",
  );
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Unit price 1", { exact: true }).fill("19.99");
  await page.getByLabel("Unit price 1", { exact: true }).blur();
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€53.53",
  );
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeEnabled();
});
