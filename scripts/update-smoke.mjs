import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// Exercise the actual production service worker with successive cache versions.
// A deliberately unavailable entry module represents an interrupted release.
const basePath = process.env.POWERLAB_BASE_PATH || "/";
const root = resolve("dist");
const originalWorker = await readFile(resolve(root, "sw.js"), "utf8");
const html = await readFile(resolve(root, "index.html"), "utf8");
const entry = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert(entry, "Production entry module must exist");
const target = new URL(basePath, "http://127.0.0.1:4179");
const entryPath = new URL(entry, target).pathname;
const stamp = Date.now();
let generation = "original",
  failEntry = false,
  failedFetches = 0;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, target).pathname;
  if (!pathname.startsWith(basePath)) {
    response.writeHead(404).end();
    return;
  }
  if (failEntry && pathname === entryPath) {
    failedFetches++;
    response.writeHead(503).end("Interrupted analytical update fixture");
    return;
  }
  const relative =
    decodeURIComponent(pathname.slice(basePath.length)) || "index.html";
  const file = resolve(root, relative);
  if (!file.startsWith(root + "/")) {
    response.writeHead(403).end();
    return;
  }
  try {
    let body = await readFile(file);
    if (relative === "sw.js") {
      const changed = originalWorker.replace(
        /const CACHE=PREFIX\+[^;]+;/,
        `const CACHE=PREFIX+${JSON.stringify(`update-check-${stamp}-${generation}`)};`,
      );
      assert.notEqual(
        changed,
        originalWorker,
        "Service-worker cache fixture must change the version",
      );
      body = Buffer.from(changed);
    }
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((ready) => server.listen(4179, "127.0.0.1", ready));
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
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(target.href);
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByRole("button", { name: "Add load", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Add load", exact: true });
  await editor
    .getByLabel("Name", { exact: true })
    .fill("Analytical update recovery load");
  await editor.getByLabel(/^Rating/).fill("2.3");
  await editor.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");

  async function installNext() {
    return page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("Missing service worker registration");
      return new Promise((resolve, reject) => {
        let worker;
        const cleanup = () => {
          clearTimeout(timer);
          registration.removeEventListener("updatefound", found);
          worker?.removeEventListener("statechange", changed);
        };
        const changed = () => {
          if (worker?.state === "installed" || worker?.state === "redundant") {
            const state = worker.state;
            cleanup();
            resolve(state);
          }
        };
        const found = () => {
          worker = registration.installing;
          worker?.addEventListener("statechange", changed);
          changed();
        };
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Update did not settle"));
        }, 20000);
        registration.addEventListener("updatefound", found);
        registration.update().catch((error) => {
          cleanup();
          reject(error);
        });
      });
    });
  }

  generation = "interrupted";
  failEntry = true;
  assert.equal(await installNext(), "redundant");
  assert(failedFetches > 0, "Fixture must actually interrupt an asset fetch");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Edit Analytical update recovery load",
      exact: true,
    }),
  ).toBeVisible();
  assert(await page.evaluate(() => !!navigator.serviceWorker.controller));
  await context.setOffline(false);

  generation = "recovered";
  failEntry = false;
  assert.equal(await installNext(), "installed");
  await expect(page.locator(".update-banner")).toContainText(
    "Update available",
  );
  await page.reload();
  await expect(page.locator(".update-banner")).toContainText(
    "Update available",
  );
  await page
    .getByRole("button", { name: "Reports & Estimates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await page
    .getByLabel("Document number", { exact: true })
    .fill("ANALYTICAL-UPDATE-DRAFT");
  await page
    .getByRole("button", { name: "Save and reload", exact: true })
    .click();
  await expect(page.locator(".update-banner [role=alert]")).toContainText(
    "Customer bill",
  );
  await expect(page.getByLabel("Document number", { exact: true })).toHaveValue(
    "ANALYTICAL-UPDATE-DRAFT",
  );
  await page
    .getByRole("button", { name: "Save draft locally", exact: true })
    .click();
  await expect(page.locator(".billing-save-state")).toContainText(
    "Saved locally",
  );
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Save and reload", exact: true }).click(),
  ]);
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await expect(page.locator(".update-banner")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await expect(page.getByLabel("Document number", { exact: true })).toHaveValue(
    "ANALYTICAL-UPDATE-DRAFT",
  );
  const cacheKeys = await page.evaluate(() => caches.keys());
  const ownKeys = cacheKeys.filter((key) =>
    key.startsWith(`powerlab:${target.href}:`),
  );
  assert.deepEqual(ownKeys, [
    `powerlab:${target.href}:update-check-${stamp}-recovered`,
  ]);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      path: basePath,
      interruptedInstallPreservedOfflineProject: true,
      waitingUpdateSurvivedReload: true,
      unsavedBillBlockedActivation: true,
      savedBillSurvivedUpdate: true,
      obsoleteCachesRemoved: true,
      pageErrors: errors.length,
      passed: true,
    }),
  );
} finally {
  if (browser) await browser.close();
  await new Promise((closed) => server.close(closed));
}
