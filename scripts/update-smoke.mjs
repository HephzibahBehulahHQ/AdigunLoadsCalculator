import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

// Exercise the production worker with distinct analytical release assets.
// The old tab imports its old-only module only after the new worker claims it.
const basePath = process.env.POWERLAB_BASE_PATH || "/";
const root = resolve("dist");
const originalWorker = await readFile(resolve(root, "sw.js"), "utf8");
const html = await readFile(resolve(root, "index.html"), "utf8");
const entry = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert(entry, "Production entry module must exist");
const target = new URL(basePath, "http://127.0.0.1:4179");
const entryPath = new URL(entry, target).pathname;
const stamp = Date.now();
const originalFiles = JSON.parse(
  originalWorker.match(/const FILES=(\[[^;]+\]);/)?.[1] || "null",
);
assert(Array.isArray(originalFiles), "Production precache list must exist");
const priorModule = `assets/analytical-prior-${stamp}.js`;
const nextModule = `assets/analytical-next-${stamp}.js`;
const priorModuleURL = new URL(priorModule, target).href;
let missingPriorRequests = 0;
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
  if (
    [priorModule, nextModule].some(
      (asset) => pathname === new URL(asset, target).pathname,
    )
  ) {
    const available = generation === "original" ? priorModule : nextModule;
    if (pathname !== new URL(available, target).pathname) {
      if (pathname === new URL(priorModule, target).pathname)
        missingPriorRequests++;
      response
        .writeHead(404)
        .end("This immutable module belongs to the previous release");
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/javascript",
      "Cache-Control": "no-store",
    });
    response.end(
      `export const release=${JSON.stringify(generation)};export const analyticalValue=42;`,
    );
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
      body = Buffer.from(
        changed.replace(
          /const FILES=\[[^;]+\];/,
          `const FILES=${JSON.stringify([...originalFiles, generation === "original" ? priorModule : nextModule])};`,
        ),
      );
    } else if (relative === "index.html") {
      body = Buffer.from(
        html.replace(
          "</head>",
          `<meta name="analytical-build" content="${generation}"></head>`,
        ),
      );
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
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  async function resumeSaved(targetPage) {
    await expect(targetPage.locator(".save-badge")).toContainText("Not saved");
    await targetPage
      .getByRole("button", { name: "Resume project", exact: true })
      .click();
    await targetPage
      .getByRole("dialog", { name: "Open project", exact: true })
      .locator(".project-list > div > button:first-child")
      .first()
      .click();
  }
  const olderTab = await context.newPage();
  olderTab.on("pageerror", (error) => errors.push(error.message));
  await olderTab.goto(target.href);
  await resumeSaved(olderTab);
  await expect(olderTab.locator(".save-badge")).toContainText("Saved locally");
  await olderTab.waitForFunction(() => !!navigator.serviceWorker.controller);
  await olderTab.evaluate(() => {
    window.__analyticalControllerChanges = 0;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.__analyticalControllerChanges++,
    );
  });
  await expect(
    olderTab.locator('meta[name="analytical-build"]'),
  ).toHaveAttribute("content", "original");
  const unrelatedCache = `unrelated-update-smoke-${stamp}`;
  await page.evaluate(async (name) => {
    await (
      await caches.open(name)
    ).put("/unrelated-sentinel.txt", new Response("preserve"));
  }, unrelatedCache);

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
  const interruptedCache = `powerlab:${target.href}:update-check-${stamp}-interrupted`;
  assert.equal(
    await page.evaluate(
      async (name) => (await (await caches.open(name)).keys()).length,
      interruptedCache,
    ),
    0,
    "Failed addAll must leave an empty install cache",
  );
  await context.setOffline(true);
  await page.reload();
  await resumeSaved(page);
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
  await resumeSaved(page);
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
    "Saved on this device",
  );
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Save and reload", exact: true }).click(),
  ]);
  await resumeSaved(page);
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
  const priorCache = `powerlab:${target.href}:update-check-${stamp}-original`;
  const currentCache = `powerlab:${target.href}:update-check-${stamp}-recovered`;
  assert.deepEqual(ownKeys.sort(), [priorCache, currentCache].sort());
  assert(
    cacheKeys.includes(unrelatedCache),
    "Other applications' caches must be preserved",
  );
  assert.equal(
    await page.evaluate(
      async ({ name, url }) => !!(await (await caches.open(name)).match(url)),
      { name: currentCache, url: priorModuleURL },
    ),
    false,
    "Prior-only module must be absent from the new precache",
  );
  assert.equal(
    (await context.request.get(priorModuleURL)).status(),
    404,
    "Prior-only module must also be absent from the new release server",
  );
  const priorRequestsBeforeImport = missingPriorRequests;
  await olderTab.waitForFunction(
    () => window.__analyticalControllerChanges > 0,
  );
  await expect(
    olderTab.locator('meta[name="analytical-build"]'),
  ).toHaveAttribute("content", "original");
  await context.setOffline(true);
  const priorExports = await olderTab.evaluate(async (url) => {
    const module = await import(url);
    return { release: module.release, analyticalValue: module.analyticalValue };
  }, priorModuleURL);
  assert.deepEqual(priorExports, { release: "original", analyticalValue: 42 });
  assert.equal(
    missingPriorRequests,
    priorRequestsBeforeImport,
    "Old tab must resolve its lazy module through the previous cache",
  );
  await olderTab.goto(new URL("index.html", target).href);
  await resumeSaved(olderTab);
  await expect(
    olderTab.locator('meta[name="analytical-build"]'),
  ).toHaveAttribute("content", "recovered");
  await expect(olderTab.locator(".save-badge")).toContainText("Saved locally");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      path: basePath,
      interruptedInstallPreservedOfflineProject: true,
      waitingUpdateSurvivedReload: true,
      unsavedBillBlockedActivation: true,
      savedBillSurvivedUpdate: true,
      interruptedCacheRemoved: true,
      previousValidCacheRetained: true,
      unrelatedCachePreserved: true,
      olderTabLazyModuleSurvivedOfflineActivation: true,
      previousModuleAbsentFromCurrentCacheAndServer: true,
      currentNavigationShellPreserved: true,
      pageErrors: errors.length,
      passed: true,
    }),
  );
} finally {
  if (browser) await browser.close();
  await new Promise((closed) => server.close(closed));
}
