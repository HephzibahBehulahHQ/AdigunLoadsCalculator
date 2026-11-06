import { test, expect, saveProject, resumeProject } from "./fixtures";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Project } from "../../src/domain/types";
import {
  createProject,
  createLoad,
  createBoard,
  createCircuit,
} from "../../src/domain/project";
async function route(page: Page, name: string) {
  if (!(await page.locator(".sidebar").isVisible()))
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
}
async function seed(page: Page) {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  const p = createProject("Library and spatial validation"),
    board = createBoard({ name: "Validation board" }),
    circuit = createCircuit(board.id, { name: "Validation circuit" });
  p.boards = [board];
  p.circuits = [circuit];
  p.loads = [
    createLoad({
      name: "Analytical heater",
      rating: 2.3,
      boardId: board.id,
      circuitId: circuit.id,
      hoursPerDay: 8,
      startHour: 8,
    }),
  ];
  await page.locator('input[type=file][accept=".json,.csv"]').setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(p)),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply import", exact: true })
    .click();
  await expect(page.locator(".load-table")).toBeVisible();
}
async function exported(page: Page): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const file = await pending;
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}
test("library favorites, linked replacement review, version history and undo", async ({
  page,
}) => {
  await seed(page);
  const initial = await exported(page);
  await route(page, "Equipment Library");
  const library = page.locator(".equipment-workspace");
  await library
    .getByLabel("Save an existing load as a template", { exact: true })
    .selectOption(initial.loads[0].id);
  await library
    .getByRole("button", { name: "Save selected equipment", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Favorite Analytical heater", exact: true })
    .click();
  await library.getByLabel("Favorites only", { exact: true }).check();
  await expect(library.locator("tbody tr").first()).toContainText(
    "Analytical heater",
  );
  await library.getByRole("button", { name: "Add load", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Library heater");
  await dialog.locator(".modal-footer .primary").click();
  await expect(page.locator(".load-table")).toContainText("Library heater");
  await route(page, "Equipment Library");
  await library
    .getByRole("button", { name: "Edit Analytical heater", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Rating/).fill("4.6");
  await dialog.locator(".modal-footer .primary").click();
  dialog = page.getByRole("dialog", {
    name: "Review equipment replacement",
    exact: true,
  });
  await expect(dialog).toContainText("2.3");
  await expect(dialog).toContainText("4.6");
  await dialog.getByLabel(/Library heater/).check();
  await dialog
    .getByRole("button", { name: /Apply reviewed replacement/ })
    .click();
  await expect(dialog).toHaveCount(0);
  let p = await exported(page);
  expect(p.loads.find((load) => load.name === "Library heater")?.rating).toBe(
    4.6,
  );
  expect(
    p.loads.find((load) => load.name === "Analytical heater")?.rating,
  ).toBe(2.3);
  expect(p.equipmentLibrary?.[0].libraryRef?.version).toBe(2);
  expect(p.equipmentVersions?.[0].record.rating).toBe(2.3);
  expect(p.equipmentFavorites).toEqual([p.equipmentLibrary?.[0].id]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  p = await exported(page);
  expect(p.loads.find((load) => load.name === "Library heater")?.rating).toBe(
    2.3,
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await saveProject(page);
  await page.reload();
  await resumeProject(page);
  await expect(page.locator(".equipment-workspace")).toBeVisible();
  p = await exported(page);
  expect(p.equipmentVersions).toHaveLength(1);
  expect(
    p.loads.find((load) => load.name === "Library heater")?.libraryRef?.version,
  ).toBe(2);
});
test("spatial graph follows real objects and hourly flow with keyboard orbit and vector export", async ({
  page,
}) => {
  await seed(page);
  await route(page, "Single-Line Studio");
  await page
    .getByRole("button", { name: "Analytical spatial view", exact: true })
    .click();
  const spatial = page.locator(".spatial-workspace");
  const scene = spatial.getByRole("img", {
    name: "Perspective project graph",
    exact: true,
  });
  const heaterPower = scene
    .getByRole("button", { name: /: Analytical heater$/ })
    .locator("text")
    .last();
  await expect(spatial).toBeVisible();
  await spatial.getByLabel("Representative hour", { exact: true }).fill("12");
  await expect(heaterPower).toHaveText("2.3 kW");
  await spatial.getByLabel("Representative hour", { exact: true }).fill("2");
  await expect(heaterPower).toHaveText("0 kW");
  await spatial.getByLabel("Orbit angle", { exact: false }).focus();
  await spatial.getByLabel("Orbit angle", { exact: false }).press("ArrowRight");
  await expect(spatial.getByLabel("Orbit angle", { exact: false })).toHaveValue(
    "-24",
  );
  await spatial
    .getByLabel("Isolate board", { exact: true })
    .selectOption({ label: "Validation board" });
  await expect(scene).toContainText("Validation circuit");
  await expect(scene).not.toContainText("Grid / supply");
  await spatial
    .getByLabel("Inspect spatial object", { exact: true })
    .selectOption({ label: "Analytical heater" });
  await expect(page.locator(".inspector")).toContainText("Analytical heater");
  const pending = page.waitForEvent("download");
  await spatial
    .getByRole("button", { name: "Export spatial SVG", exact: true })
    .click();
  const file = await pending;
  const text = await readFile((await file.path())!, "utf8");
  expect(text).toContain("<svg");
  expect(text).toContain("Analytical heater");
  expect(text).not.toContain("NaN");
  await page.screenshot({
    path: "docs/screenshots/spatial-workspace.png",
    fullPage: true,
  });
});
test("responsive layouts, persisted split widths, reduced motion and keyboard context menu", async ({
  page,
}) => {
  await seed(page);
  const loadName = page
    .getByRole("button", { name: /Analytical heater/ })
    .filter({ has: page.locator("strong") });
  await loadName.focus();
  await loadName.press("Shift+F10");
  await expect(
    page.getByRole("menu", { name: "Load actions", exact: true }),
  ).toBeVisible();
  await page.getByRole("menuitem", { name: "Edit load", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await route(page, "Settings");
  await page.getByRole("slider", { name: /Navigation width/ }).fill("300");
  await page.getByRole("slider", { name: /Inspector width/ }).fill("340");
  await page.getByLabel("Motion", { exact: true }).selectOption("paused");
  const detailLevel = page
    .locator(".page-heading")
    .getByLabel("Detail level", { exact: true });
  await detailLevel.selectOption("simple");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await saveProject(page);
  await page.reload();
  await resumeProject(page);
  await expect(detailLevel).toHaveValue("simple");
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar")
        .trim(),
    ),
  ).toBe("300px");
  for (const width of [360, 768, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".main-content")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 360, height: 900 });
  await page.screenshot({
    path: "docs/screenshots/mobile-settings-complete.png",
    fullPage: true,
  });
});
