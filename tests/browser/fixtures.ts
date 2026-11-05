import { test as base, chromium } from "@playwright/test";
export const test = base.extend({
  page: async ({}, use) => {
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
      baseURL: "http://127.0.0.1:4176",
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
