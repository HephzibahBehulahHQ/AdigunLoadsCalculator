import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  createProject,
  createLoad,
  createBoard,
  createCircuit,
} from "../../src/domain/project";
import type { Project } from "../../src/domain/types";
async function route(page: Page, name: string) {
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
  const p = createProject("Workflow validation"),
    board = createBoard({name:"Main distribution"}),
    circuit = createCircuit(board.id, {name:"Lighting branch"});
  p.boards = [board];
  p.circuits = [circuit];
  p.loads = [
    createLoad({
      name: "Analytical heater",
      rating: 2.3,
      hoursPerDay: 24,
      boardId: board.id,
      circuitId: circuit.id,
    }),
  ];
  await page
    .locator('input[type=file][accept=".json,.csv"]')
    .setInputFiles({
      name: "fixture.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(p)),
    });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply import", exact: true })
    .click();
  await expect(page.locator(".load-table")).toContainText("Analytical heater");
}
async function exported(page: Page): Promise<Project> {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const download = await pending;
  return JSON.parse(await readFile((await download.path())!, "utf8"));
}
test("source records, building organization, keyboard modal editing and graph inspector", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seed(page);
  await route(page, "Boards & Circuits");
  await page
    .getByLabel("Group name", { exact: true })
    .fill("Workshop building");
  await page.getByRole("button", { name: "Add group", exact: true }).click();
  await page
    .getByLabel("Main distribution", { exact: true })
    .selectOption({ label: "Workshop building" });
  let p = await exported(page);
  expect(p.zones?.[0].name).toBe("Workshop building");
  expect(p.boards[0].zoneId).toBe(p.zones?.[0].id);
  await route(page, "Motors & Supply");
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Source equipment",
    exact: true,
  });
  await dialog
    .getByLabel("Name", { exact: true })
    .pressSequentially("Entered grid source");
  await expect(dialog.getByLabel("Name", { exact: true })).toBeFocused();
  await dialog.getByLabel(/^Continuous real-power rating/).fill("50");
  await dialog.getByLabel(/^Continuous apparent-power rating/).fill("63");
  await dialog
    .getByLabel("Evidence reference", { exact: true })
    .fill("Analytical fixture: entered rating envelope");
  await dialog
    .getByRole("button", { name: "Save source", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("table").last()).toContainText(
    "Continuous real-power loading",
  );
  await expect(page.getByRole("table").last()).toContainText("passed");
  p = await exported(page);
  expect(p.sources?.[0].continuousKW).toBe(50);
  expect(p.sources?.[0].continuousKVA).toBe(63);
  await route(page, "Single-Line Studio");
  await expect(page.locator(".topology-canvas")).toContainText(
    "Entered grid source",
  );
  await page
    .getByRole("button", { name: "Planning source: Entered grid source" })
    .click();
  await expect(page.locator(".inspector")).toContainText("Entered grid source");
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});
test("CSV mapping with units, explicit merge and replacement, and undo preserve projects", async ({
  page,
}) => {
  await seed(page);
  const original = await exported(page);
  await page
    .locator('input[type=file][accept=".json,.csv"]')
    .setInputFiles({
      name: "custom.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Appliance,Power,Supply\nMapped lamp,230,230"),
    });
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("name", { exact: true }).selectOption("0");
  await dialog.getByLabel("rating", { exact: true }).selectOption("1");
  await dialog.getByLabel("voltage", { exact: true }).selectOption("2");
  await dialog
    .getByLabel("Imported rating unit", { exact: true })
    .selectOption("W");
  await dialog
    .getByRole("button", { name: "Refresh import preview", exact: true })
    .click();
  await dialog
    .getByLabel("Import destination", { exact: true })
    .selectOption("merge");
  await dialog
    .getByRole("button", { name: "Apply import", exact: true })
    .click();
  await expect(page.locator(".load-table")).toContainText("Mapped lamp");
  let p = await exported(page);
  expect(p.loads).toHaveLength(2);
  expect(p.loads[1].rating).toBe(0.23);
  expect(p.id).toBe(original.id);
  const replacement = createProject("Replacement data");
  replacement.loads = [createLoad({ name: "Replacement load", rating: 1 })];
  await page
    .locator('input[type=file][accept=".json,.csv"]')
    .setInputFiles({
      name: "replacement.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(replacement)),
    });
  await page
    .getByRole("dialog")
    .getByLabel("Import destination", { exact: true })
    .selectOption("replace");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply import", exact: true })
    .click();
  p = await exported(page);
  expect(p.id).toBe(original.id);
  expect(p.loads).toHaveLength(1);
  expect(p.loads[0].name).toBe("Replacement load");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  p = await exported(page);
  expect(p.loads).toHaveLength(2);
  expect(p.loads[0].name).toBe("Analytical heater");
});
test("full calendar timeline supports keyboard stepping, retained completion and report evidence", async ({
  page,
}) => {
  await seed(page);
  await route(page, "Schedules & Simulation");
  await page.getByLabel("Start date", { exact: true }).fill("2026-10-25");
  await page.getByLabel("End date", { exact: true }).fill("2026-10-26");
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    page.getByText("Calculated · 25 h", { exact: true }),
  ).toBeVisible();
  const cursor = page.getByRole("slider", {
    name: "Timeline hour",
    exact: true,
  });
  await expect(cursor).toHaveAttribute("max", "99");
  await page.getByRole("button", { name: "Step forward", exact: true }).click();
  await expect(cursor).toHaveValue("1");
  await cursor.focus();
  await cursor.press("ArrowRight");
  await expect(cursor).toHaveValue("2");
  await page.getByLabel("End date", { exact: true }).fill("2026-10-27");
  await expect(page.getByText(/Previous completed range/)).toBeVisible();
  await route(page, "Reports & Estimates");
  await expect(
    page.getByRole("button", { name: "Freeze report preview" }).first(),
  ).toBeVisible();
});
