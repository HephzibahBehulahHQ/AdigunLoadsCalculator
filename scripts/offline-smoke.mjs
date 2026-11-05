import { preview } from "vite";
import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const server = await preview({
  preview: { host: "127.0.0.1", port: 4178, strictPort: true },
});
let browser;
try {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  browser = await chromium.launch(
    executablePath
      ? {
          executablePath,
          args: ["--no-sandbox", "--no-zygote", "--single-process"],
        }
      : { headless: true },
  );
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  const networkFailures = [];
  page.on("requestfailed", (r) =>
    networkFailures.push({ url: r.url(), failure: r.failure() }),
  );
  page.on("console", (m) => {
    if (m.type() === "error") console.log("browser-error", m.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4178/");
  await page.locator(".overview-banner").waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Name", { exact: true })
    .fill("Offline analytical heater");
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector(".save-badge")
      ?.textContent?.includes("Saved locally"),
  );
  console.log(
    "before-offline",
    await page.evaluate(() => ({
      hash: location.hash,
      save: document.querySelector(".save-badge")?.textContent,
      caches: !!navigator.serviceWorker.controller,
    })),
  );
  await context.setOffline(true);
  await page.reload();
  try {
    await page.locator(".load-table").waitFor({ timeout: 12000 });
  } catch (error) {
    await page.screenshot({
      path: "docs/screenshots/offline-failure.png",
      fullPage: true,
    });
    console.log(
      "offline-state",
      JSON.stringify({
        url: page.url(),
        body: (await page.locator("body").innerText()).slice(0, 1400),
        html: (await page.content()).slice(0, 1600),
        networkFailures,
        cacheState: await page.evaluate(async () => ({
          keys: await caches.keys(),
          urls: (await caches.open((await caches.keys())[0]))
            .keys()
            .then((rs) => rs.map((r) => r.url)),
          controlled: !!navigator.serviceWorker.controller,
        })),
        errors,
      }),
    );
    throw error;
  }
  if (
    !(await page.locator(".load-table").textContent()).includes(
      "Offline analytical heater",
    )
  )
    throw new Error("Offline saved project was not recovered.");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Engineering Toolbox/ })
    .click();
  await page.locator(".tool-item").first().click();
  await page
    .getByRole("button", { name: "Load worked example", exact: true })
    .click();
  await page
    .locator(".tool-workspace")
    .getByRole("button", { name: "Calculate", exact: true })
    .click();
  await page.locator(".tool-result").waitFor();
  const evidence = {
    offlineReload: true,
    savedProjectRecovered: true,
    toolCalculationOffline: true,
    serviceWorkerControlled: await page.evaluate(
      () => !!navigator.serviceWorker.controller,
    ),
    font: await page
      .locator("h3")
      .first()
      .evaluate((e) => getComputedStyle(e).fontFamily),
    errors,
  };
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/offline-tool.png",
    fullPage: true,
  });
  await writeFile(
    "docs/offline-verification.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify(evidence));
  if (errors.length) throw new Error("Page errors: " + errors.join("; "));
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
