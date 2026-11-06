import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createLoad, createProject } from "../../src/domain/project";
import type { Project } from "../../src/domain/types";
import { translate, type Locale } from "../../src/i18n";

async function route(page: Page, name: string, locale: Locale = "en") {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp(
        "^" + translate(name, locale).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ),
    })
    .click();
}
async function importProject(page: Page, project: Project, mode = "new") {
  await page.locator('input[type="file"][accept=".json,.csv"]').setInputFiles({
    name: "planning.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Import destination").selectOption(mode);
  await dialog
    .getByRole("button", { name: "Apply import", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
}
async function seed(page: Page) {
  await page.goto("/");
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  const project = createProject("Planning draft A");
  project.loads = [
    createLoad({ name: "Heater A", rating: 2.3, pf: 1, hoursPerDay: 8 }),
    createLoad({ name: "Heater B", rating: 1, pf: 1, hoursPerDay: 4 }),
  ];
  await importProject(page, project);
  return project;
}
async function openPlanning(page: Page) {
  await route(page, "Schedules & Simulation");
  const panel = page.getByRole("region", {
    name: "Advanced planning",
    exact: true,
  });
  if (!(await panel.isVisible()))
    await page
      .getByText("Advanced schedules, starts and flexible loads", {
        exact: true,
      })
      .click();
  return panel;
}
async function exported(page: Page): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await pending;
  return JSON.parse(await readFile((await download.path())!, "utf8"));
}
async function blocksReload(page: Page) {
  return page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
}
async function switchProject(page: Page, name: string) {
  await page.locator(".project-switch").click();
  await page
    .getByRole("dialog")
    .locator(".project-list")
    .getByRole("button", { name: new RegExp("^" + name + " ") })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("raw per-load planning drafts survive routes, projects and all languages until explicit save or discard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const a = await seed(page);
  let panel = await openPlanning(page);
  await panel.getByLabel("Duration", { exact: false }).first().fill("1,2.3");
  await panel
    .getByLabel("Selected load", { exact: true })
    .selectOption(a.loads[1].id);
  await panel.getByLabel("Duration", { exact: false }).first().fill("6");
  await panel
    .getByLabel("Selected load", { exact: true })
    .selectOption(a.loads[0].id);
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("1,2.3");
  await route(page, "Overview");
  expect(await blocksReload(page)).toBe(true);
  const b = createProject("Planning draft B");
  b.loads = [createLoad({ name: "Other heater", rating: 1 })];
  await importProject(page, b);
  panel = await openPlanning(page);
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).not.toHaveValue("1,2.3");
  await switchProject(page, a.name);
  panel = await openPlanning(page);
  for (const locale of ["de", "yo", "pcm", "en"] as const) {
    await page
      .getByRole("combobox", {
        name: translate(
          "Language",
          locale === "de"
            ? "en"
            : locale === "yo"
              ? "de"
              : locale === "pcm"
                ? "yo"
                : "pcm",
        ),
        exact: true,
      })
      .selectOption(locale);
    const region = page.locator(".advanced-planning");
    await expect(
      region.locator('input[aria-invalid="true"]').first(),
    ).toHaveValue("1,2.3");
  }
  await panel.getByLabel("Duration", { exact: false }).first().fill("3");
  await panel
    .getByRole("button", { name: "Save calendar rules", exact: true })
    .click();
  const saved = await exported(page);
  expect(saved.loads[0].schedule?.windows[0].durationHours).toBe(3);
  expect(saved.loads[1].schedule).toBeUndefined();
  await panel
    .getByLabel("Selected load", { exact: true })
    .selectOption(a.loads[1].id);
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("6");
  await panel
    .getByRole("button", { name: "Discard planning drafts", exact: true })
    .click();
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("4");
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  expect(await blocksReload(page)).toBe(false);
  expect(errors).toEqual([]);
});

test("saving one planning section preserves the other drafts and raw invalid values", async ({
  page,
}) => {
  await seed(page);
  const panel = await openPlanning(page);
  await panel
    .getByRole("tab", { name: "Start sequences", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Add start event", exact: true })
    .click();
  await panel
    .getByLabel("Starting current", { exact: false })
    .last()
    .fill("20");
  await panel.getByLabel("Duration", { exact: false }).first().fill("2..5");
  await panel.getByRole("tab", { name: "Flexible loads", exact: true }).click();
  await panel
    .getByRole("button", { name: "Add flexible process", exact: true })
    .click();
  await panel.getByLabel("Required operating energy").fill("3");
  await panel.getByRole("tab", { name: "Calendar rules", exact: true }).click();
  await panel.getByLabel("Duration", { exact: false }).first().fill("2");
  await panel
    .getByRole("button", { name: "Save calendar rules", exact: true })
    .click();
  await panel
    .getByRole("tab", { name: "Start sequences", exact: true })
    .click();
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("2..5");
  await expect(
    panel.getByLabel("Starting current", { exact: false }).last(),
  ).toHaveValue("20");
  await panel
    .getByRole("button", { name: "Save start events", exact: true })
    .click();
  expect((await exported(page)).startEvents ?? []).toEqual([]);
  await panel.getByLabel("Duration", { exact: false }).first().fill("2.5");
  await panel
    .getByRole("button", { name: "Save start events", exact: true })
    .click();
  await panel.getByRole("tab", { name: "Flexible loads", exact: true }).click();
  await expect(panel.getByLabel("Required operating energy")).toHaveValue("3");
  await panel
    .getByRole("button", { name: "Save requirements", exact: true })
    .click();
  const saved = await exported(page);
  expect(saved.loads[0].schedule?.windows[0].durationHours).toBe(2);
  expect(saved.startEvents?.[0]).toMatchObject({
    currentA: 20,
    durationSeconds: 2.5,
  });
  expect(saved.flexibleLoads?.[0].requiredKWh).toBe(3);
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  expect(await blocksReload(page)).toBe(false);
});

test("planning save merges only edited fields and rejects conflicting changes without losing the draft", async ({
  page,
}) => {
  const original = await seed(page);
  let panel = await openPlanning(page);
  await panel.getByLabel("Duration", { exact: false }).first().fill("3");
  await route(page, "Overview");
  const changed = await exported(page);
  changed.loads[0].name = "Renamed heater";
  changed.loads[0].schedule = {
    windows: [
      { id: `basic-${original.loads[0].id}`, startHour: 10, durationHours: 8 },
    ],
  };
  await importProject(page, changed, "replace");
  panel = await openPlanning(page);
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("3");
  await panel
    .getByRole("button", { name: "Save calendar rules", exact: true })
    .click();
  let saved = await exported(page);
  expect(saved.loads[0]).toMatchObject({
    name: "Renamed heater",
    schedule: { windows: [{ startHour: 10, durationHours: 3 }] },
  });
  await panel.getByLabel("Duration", { exact: false }).first().fill("5");
  await route(page, "Overview");
  saved.loads[0].schedule!.windows[0].durationHours = 7;
  await importProject(page, saved, "replace");
  panel = await openPlanning(page);
  await panel
    .getByRole("button", { name: "Save calendar rules", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "Planning inputs changed elsewhere",
  );
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("5");
  saved = await exported(page);
  expect(saved.loads[0].schedule?.windows[0].durationHours).toBe(7);
  await panel
    .getByRole("button", { name: "Discard planning drafts", exact: true })
    .click();
  await expect(
    panel.getByLabel("Duration", { exact: false }).first(),
  ).toHaveValue("7");
});
