import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { translate, type Locale } from "../../src/i18n";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4176";
async function ready(page: Page) {
  await page.goto(baseURL + "/");
  await expect(page.locator(".overview-banner")).toBeVisible();
}
async function addLoad(page: Page) {
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const editor = page.getByRole("dialog", { name: "Add load", exact: true });
  await editor
    .getByLabel("Name", { exact: true })
    .fill("Mobile analytical heater");
  await editor.getByLabel(/^Rating/).fill("2.3");
  await editor.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator(".load-table")).toContainText("10 A");
}
async function projectJSON(page: Page) {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return JSON.parse(await readFile((await download.path())!, "utf8"));
}
async function noPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("#workspace")!;
    return {
      page: document.documentElement.scrollWidth - innerWidth,
      main: main.scrollWidth - main.clientWidth,
    };
  });
  expect(dimensions.page).toBeLessThanOrEqual(1);
  expect(dimensions.main).toBeLessThanOrEqual(1);
}

for (const width of [360, 768]) {
  test(`navigation drawer has bounded geometry and keyboard focus at ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    const opener = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await opener.click();
    const drawer = page.getByRole("dialog", {
      name: "Main navigation",
      exact: true,
    });
    await expect(drawer).toBeVisible();
    expect(
      await drawer.evaluate((element) => getComputedStyle(element).position),
    ).toBe("fixed");
    const bounds = (await drawer.boundingBox())!;
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBe(0);
    expect(bounds.width).toBeLessThanOrEqual(width - 24);
    expect(bounds.height).toBe(900);
    await expect(page.getByRole("main")).toHaveCount(0);
    const close = drawer.getByRole("button", {
      name: "Collapse navigation",
      exact: true,
    });
    await expect(close).toBeFocused();
    const last = drawer.locator(".sidebar-bottom button");
    await last.focus();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath(`navigation-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.getByRole("main")).toBeVisible();
    await addLoad(page);
    await page
      .getByRole("dialog", { name: "Selected object", exact: true })
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await noPageOverflow(page);
    const tableViewport = page.locator(".load-table").locator("..");
    expect(
      await tableViewport.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    if (width === 360) {
      for (const locale of ["en", "de", "yo", "pcm"] as Locale[]) {
        const t = (key: string) => translate(key, locale);
        await page.locator(".language-select").selectOption(locale);
        await page
          .getByRole("button", { name: t("Open navigation"), exact: true })
          .click();
        await expect(
          page.getByRole("dialog", { name: t("Main navigation"), exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: t("Open navigation"), exact: true }),
        ).toBeFocused();
      }
    }
    expect(errors).toEqual([]);
  });
}

test("inspector retains selection and editor drafts through desktop/tablet/phone changes", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await addLoad(page);
  const before = await projectJSON(page);
  const row = page
    .locator(".load-table tbody tr")
    .filter({ hasText: "Mobile analytical heater" });
  const select = row.locator(".load-name");
  await select.click();
  const inspector = page.locator(".inspector");
  expect(
    await inspector.evaluate((element) => getComputedStyle(element).position),
  ).toBe("relative");
  const resize = inspector.getByRole("separator", {
    name: "Inspector width",
    exact: true,
  });
  const initialWidth = (await inspector.boundingBox())!.width;
  await resize.focus();
  await page.keyboard.press("ArrowLeft");
  expect((await inspector.boundingBox())!.width).toBe(initialWidth + 10);
  await page.screenshot({ path: testInfo.outputPath("inspector-1440.png") });
  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    const sheet = page.getByRole("dialog", {
      name: "Selected object",
      exact: true,
    });
    await expect(sheet).toBeVisible();
    expect(
      await sheet.evaluate((element) => getComputedStyle(element).position),
    ).toBe("fixed");
    await expect(row).toHaveClass(/selected-row/);
    await expect(sheet).toContainText("Mobile analytical heater");
    const bounds = (await sheet.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    await expect(page.getByRole("main")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`inspector-${width}.png`),
    });
  }
  await page.keyboard.press("Escape");
  await expect(page.locator(".inspector")).toHaveCount(0);
  await expect(select).toBeFocused();
  await select.click();
  await page
    .getByRole("dialog", { name: "Selected object", exact: true })
    .getByRole("button", { name: "Edit load", exact: true })
    .click();
  const editor = page.getByRole("dialog", { name: "Edit load", exact: true });
  await editor
    .getByLabel("Name", { exact: true })
    .fill("Unsaved responsive draft");
  await editor.getByLabel(/^Rating/).fill("2,3.0");
  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(editor.getByLabel("Name", { exact: true })).toHaveValue(
      "Unsaved responsive draft",
    );
    await expect(editor.getByLabel(/^Rating/)).toHaveValue("2,3.0");
    await expect(editor.getByLabel(/^Rating/)).toBeFocused();
  }
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Selected object", exact: true }),
  ).toBeVisible();
  await expect(row).toHaveClass(/selected-row/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(select).toBeFocused();
  await noPageOverflow(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".sidebar")
      .evaluate((element) => getComputedStyle(element).position),
  ).toBe("relative");
  const navigationResize = page.getByRole("separator", {
    name: "Navigation width",
    exact: true,
  });
  const sidebarWidth = (await page.locator(".sidebar").boundingBox())!.width;
  await navigationResize.focus();
  await page.keyboard.press("ArrowRight");
  expect((await page.locator(".sidebar").boundingBox())!.width).toBe(
    sidebarWidth + 10,
  );
  expect(await projectJSON(page)).toEqual(before);
  expect(errors).toEqual([]);
});
