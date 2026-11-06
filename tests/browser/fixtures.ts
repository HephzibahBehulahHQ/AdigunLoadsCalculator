import { test as base, chromium, expect, type Page } from "@playwright/test";
import { translate, type Locale } from "../../src/i18n";

/** Exercise an explicit user checkpoint; waiting for an autosave is not saving. */
export async function saveProject(page: Page) {
  const locale = (await page
    .locator(".language-select")
    .inputValue()) as Locale;
  await page
    .locator(".workspace-toolbar")
    .getByRole("button", {
      name: translate("Save project", locale),
      exact: true,
    })
    .click();
  await expect(page.locator(".save-badge")).toContainText(
    translate("Saved locally", locale),
  );
}

/** A new page is always fresh. Previously saved work is opened deliberately. */
export async function resumeProject(page: Page, name?: string) {
  const locale = (await page
    .locator(".language-select")
    .inputValue()) as Locale;
  await page
    .locator(".workspace-toolbar")
    .getByRole("button", {
      name: translate("Resume project", locale),
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: translate("Open project", locale),
    exact: true,
  });
  const rows = dialog.locator(".project-list > div > button:first-child");
  await (name ? rows.filter({ hasText: name }) : rows).first().click();
  await expect(dialog).not.toBeVisible();
}

export const test = base.extend({
  page: async ({ baseURL }, use) => {
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    const browser = await chromium.launch(
      executablePath
        ? {
            executablePath,
            args: ["--no-sandbox", "--no-zygote", "--single-process"],
          }
        : { headless: true },
    );
    const context = await browser.newContext({
      baseURL: baseURL ?? "http://127.0.0.1:4176",
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      await browser.close();
    }
  },
});
export { expect } from "@playwright/test";
