import { test, expect } from "./fixtures";

test("edits made during worker activation survive and a saved retry reloads safely", async ({
  page,
}) => {
  // This adapter deliberately pauses activation. Real worker/cache behavior is
  // exercised separately by scripts/update-smoke.mjs against the production build.
  await page.addInitScript(() => {
    const worker = Object.assign(new EventTarget(), {
      state: "installed",
      postMessage: () => {
        document.documentElement.dataset.activationRequested = "true";
      },
    });
    const registration = Object.assign(new EventTarget(), {
      waiting: worker as typeof worker | null,
      installing: null,
    });
    const container = Object.assign(new EventTarget(), {
      ready: Promise.resolve(registration),
      register: () => Promise.resolve(registration),
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: container,
    });
    window.addEventListener("analytical-activation-complete", () => {
      registration.waiting = null;
      worker.state = "activated";
      container.dispatchEvent(new Event("controllerchange"));
    });
  });
  await page.goto("/");
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page
    .getByRole("button", { name: "Save and reload", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-activation-requested",
    "true",
  );
  await page.getByRole("button", { name: "Add load", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add load", exact: true });
  await dialog
    .getByLabel("Name", { exact: true })
    .fill("Load entered during activation");
  await dialog.getByLabel(/^Rating/).fill("2.3");
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  let reloads = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) reloads++;
  });
  await page.evaluate(() =>
    window.dispatchEvent(new Event("analytical-activation-complete")),
  );
  await expect(page.locator(".update-banner [role=alert]")).toContainText(
    "project changed while saving",
  );
  expect(reloads).toBe(0);
  await expect(
    page.getByRole("button", {
      name: "Edit Load entered during activation",
      exact: true,
    }),
  ).toBeVisible();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Save and reload", exact: true }).click(),
  ]);
  await expect(
    page.getByRole("button", {
      name: "Edit Load entered during activation",
      exact: true,
    }),
  ).toBeVisible();
  expect(reloads).toBe(1);
});
