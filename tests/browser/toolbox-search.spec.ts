import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { translate, type Locale } from "../../src/i18n";

async function openTools(page: Page) {
  await page.goto("/#/tools");
  await expect(page.locator(".tool-item")).toHaveCount(51);
}

async function exportResult(page: Page, locale: Locale) {
  const pending = page.waitForEvent("download");
  await page
    .locator(".tool-result")
    .getByRole("button", { name: translate("Export", locale), exact: true })
    .click();
  const file = await pending;
  expect(await file.failure()).toBeNull();
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}

test("toolbox search finds displayed translations and English in all four languages", async ({
  page,
}) => {
  await openTools(page);
  const catalog = page.locator(".tool-catalog");
  const search = catalog.getByRole("searchbox");
  for (const [locale, query, title] of [
    ["en", "Ohm's law", "Ohm’s law"],
    ["de", "OHMSCHES GESETZ", "Ohmsches Gesetz"],
    ["yo", "Ofin Ohm", "Òfin Ohm"],
    ["pcm", "Ohm law", "Ohm law"],
  ]) {
    await page.locator(".language-select").selectOption(locale);
    await search.fill(query);
    await expect(catalog.locator(".tool-item")).toHaveCount(1);
    await expect(catalog.locator(".tool-item")).toContainText(title);
    await expect(catalog.getByRole("status")).toContainText("1");
    await catalog.locator(".tool-item").click();
    await expect(
      page
        .locator(".tool-workspace")
        .getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await search.fill("DC load power & energy");
    await expect(catalog.locator(".tool-item")).toHaveCount(1);
    await expect(catalog.locator(".tool-item")).toContainText("T02");
  }
  await page.locator(".language-select").selectOption("de");
  await search.fill("Elektrotechnische Grundlagen");
  await expect(catalog.locator(".tool-item")).toHaveCount(9);
  await search.fill("passiven Gleichstromwiderstand");
  await expect(catalog.locator(".tool-item")).toHaveCount(1);
  await expect(catalog.locator(".tool-item")).toContainText("T01");
  await page.locator(".language-select").selectOption("yo");
  await search.fill("Òfin Ohm");
  await expect(catalog.locator(".tool-item")).toHaveCount(1);
  await expect(catalog.locator(".tool-item")).toContainText("T01");
});

test("search and no-match recovery preserve entered values and the calculated export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openTools(page);
  const catalog = page.locator(".tool-catalog");
  const search = catalog.getByRole("searchbox");
  await search.fill("T01");
  await catalog.locator(".tool-item").click();
  const worksheet = page.locator(".tool-workspace");
  const form = worksheet.locator("form");
  await form.getByLabel(/^Voltage/).fill("230");
  await form.getByLabel(/^Resistance/).fill("23");
  await form.getByRole("button", { name: "Calculate", exact: true }).click();
  const before = await exportResult(page, "en");
  expect(before.inputs).toEqual({ voltage: 230, resistance: 23 });
  expect(before.result.values).toContainEqual({
    label: "Current",
    value: 10,
    unit: "A",
  });

  await search.fill("no-such-tool-qzx");
  await expect(catalog.locator(".tool-item")).toHaveCount(0);
  await expect(
    catalog.getByRole("heading", { name: "No matching tools.", exact: true }),
  ).toBeVisible();
  await expect(catalog.getByRole("status")).toHaveText("0 matching tools");
  await expect(catalog.getByRole("status")).toHaveAttribute(
    "aria-live",
    "polite",
  );
  await expect(form.getByLabel(/^Voltage/)).toHaveValue("230");
  await expect(form.getByLabel(/^Resistance/)).toHaveValue("23");
  expect(await exportResult(page, "en")).toEqual(before);
  await catalog
    .getByRole("button", { name: "Clear search", exact: true })
    .click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(catalog.locator(".tool-item")).toHaveCount(51);

  await page.locator(".language-select").selectOption("de");
  await search.fill("Ohmsches Gesetz");
  await expect(catalog.locator(".tool-item")).toHaveCount(1);
  await expect(form.getByLabel(/^Spannung/)).toHaveValue("230");
  expect(await exportResult(page, "de")).toEqual(before);
  await search.fill("no-such-tool-qzx");
  await expect(
    catalog.getByRole("heading", {
      name: "Keine passenden Werkzeuge.",
      exact: true,
    }),
  ).toBeVisible();
  await catalog
    .getByRole("button", { name: "Suche löschen", exact: true })
    .click();
  await expect(search).toBeFocused();
  expect(await exportResult(page, "de")).toEqual(before);
  expect(errors).toEqual([]);
});
