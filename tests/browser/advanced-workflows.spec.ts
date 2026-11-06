import { test, expect } from "./fixtures";
import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import type { Project } from "../../src/domain/types";
import { translate } from "../../src/i18n";

async function route(page: Page, name: string) {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
}
async function home(page: Page) {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page.locator(".project-switch").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Open reference case", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .locator(".reference-card")
    .filter({ hasText: "Home · three-phase household" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function downloaded(page: Page, button: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  const file = await pending;
  expect(await file.failure()).toBeNull();
  return readFile((await file.path())!);
}
async function exported(page: Page): Promise<Project> {
  return JSON.parse(
    (await downloaded(page, "Export project")).toString("utf8"),
  );
}
async function apply(page: Page) {
  await page
    .getByRole("dialog", { name: "Review project changes", exact: true })
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("bulk preview and undo, clipboard validation, and explicit German decimals", async ({
  page,
}) => {
  await home(page);
  await route(page, "Load Schedule");
  const bulk = page.locator(".load-operations");
  await bulk.locator("summary").click();
  await bulk
    .getByLabel("Select load Lighting (analytical)", { exact: true })
    .check();
  await bulk
    .getByLabel("Select load Refrigeration (analytical)", { exact: true })
    .check();
  await bulk
    .getByRole("button", { name: "Preview selected changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "2 objects, 2 changed fields",
  );
  await apply(page);
  expect(
    (await exported(page)).loads.filter((load) => load.critical),
  ).toHaveLength(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await exported(page)).loads.every((load) => !load.critical)).toBe(
    true,
  );

  await bulk
    .getByRole("button", { name: "Copy selected rows", exact: true })
    .click();
  const copied = await page
    .getByRole("dialog")
    .getByLabel("Load row data", { exact: true })
    .inputValue();
  expect(JSON.parse(copied).rows).toHaveLength(2);
  await page
    .getByRole("dialog")
    .locator(".modal-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await bulk
    .getByRole("button", { name: "Paste validated rows", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Load row data", { exact: true })
    .fill('{"rows":[');
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Validate pasted rows", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByLabel("Load row data", { exact: true })
    .fill(copied);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Validate pasted rows", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Pasted rows receive new IDs",
  );
  await apply(page);
  const pasted = await exported(page);
  expect(pasted.loads).toHaveLength(5);
  expect(
    pasted.loads.slice(3).every((load) => !load.boardId && !load.circuitId),
  ).toBe(true);

  await bulk
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await bulk
    .getByLabel("Select load Kitchen appliance (analytical)", { exact: true })
    .check();
  await bulk.getByLabel("Bulk action", { exact: true }).selectOption("field");
  await bulk
    .getByLabel("Field to change", { exact: true })
    .selectOption("rating");
  await page.locator(".topbar").getByRole("combobox").selectOption("de");
  const de = (key: string) => translate(key, "de");
  await bulk.getByLabel(de("Replacement value"), { exact: true }).fill("1.234");
  await bulk
    .getByRole("button", { name: de("Preview selected changes"), exact: true })
    .click();
  await expect(bulk.getByRole("alert")).toContainText(/comma|Komma/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await bulk.getByLabel(de("Replacement value"), { exact: true }).fill("2,5");
  await bulk
    .getByRole("button", { name: de("Preview selected changes"), exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: de("Apply reviewed changes"), exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".topbar").getByRole("combobox").selectOption("en");
  expect(
    (await exported(page)).loads.find(
      (load) => load.name === "Kitchen appliance (analytical)",
    )?.rating,
  ).toBe(2.5);
});

test("editable graph creates a board/circuit, rejects cycles, connects/disconnects, saves layout, and exports real SVG/PDF", async ({
  page,
}) => {
  test.setTimeout(90000);
  await home(page);
  const initial = await exported(page),
    lighting = initial.loads.find(
      (load) => load.name === "Lighting (analytical)",
    )!;
  await route(page, "Single-Line Studio");
  await page.getByRole("button", { name: "Add board", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("New object name", { exact: true })
    .fill("Field sub-board");
  await page
    .getByRole("dialog")
    .getByLabel("Upstream board", { exact: true })
    .selectOption(initial.boards[0].id);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Preview addition", exact: true })
    .click();
  await apply(page);
  const withBoard = await exported(page),
    subBoard = withBoard.boards.find(
      (board) => board.name === "Field sub-board",
    )!;
  await page
    .getByLabel("Select diagram object", { exact: true })
    .selectOption(`board:${initial.boards[0].id}`);
  const inspector = page.getByRole("complementary", {
    name: "Topology object inspector",
  });
  await inspector
    .getByLabel("Upstream board", { exact: true })
    .selectOption(subBoard.id);
  await inspector
    .getByRole("button", { name: "Preview object changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(/cycle/i);
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Apply reviewed changes", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();

  await page.getByRole("button", { name: "Add circuit", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("New object name", { exact: true })
    .fill("Field branch");
  await page
    .getByRole("dialog")
    .getByLabel("Circuit board", { exact: true })
    .selectOption(subBoard.id);
  await page
    .getByRole("dialog")
    .getByLabel("Circuit phase", { exact: true })
    .selectOption("L3");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Preview addition", exact: true })
    .click();
  await apply(page);
  const withCircuit = await exported(page),
    circuit = withCircuit.circuits.find(
      (item) => item.name === "Field branch",
    )!;
  await page
    .getByLabel("Select diagram object", { exact: true })
    .selectOption(`load:${lighting.id}`);
  await inspector
    .getByLabel("Connect load to circuit", { exact: true })
    .selectOption(circuit.id);
  await inspector.getByRole("button", { name: "Connect", exact: true }).click();
  await apply(page);
  expect(
    (await exported(page)).loads.find((load) => load.id === lighting.id),
  ).toMatchObject({ boardId: subBoard.id, circuitId: circuit.id, phase: "L3" });
  await inspector.getByText("Manual position", { exact: true }).click();
  await inspector.getByLabel("Diagram X", { exact: true }).fill("700");
  await inspector.getByLabel("Diagram Y", { exact: true }).fill("210");
  await inspector
    .getByRole("button", { name: "Save position", exact: true })
    .click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await page.reload();
  await expect(
    page.getByRole("group", {
      name: "Editable single-line diagram",
      exact: true,
    }),
  ).toBeVisible();
  const reopened = await exported(page);
  expect(reopened.diagram!.positions[`load:${lighting.id}`]).toEqual({
    x: 700,
    y: 210,
  });
  await page
    .getByLabel("Select diagram object", { exact: true })
    .selectOption(`load:${lighting.id}`);
  await inspector
    .getByRole("button", { name: "Disconnect", exact: true })
    .click();
  await apply(page);
  const disconnected = (await exported(page)).loads.find(
    (load) => load.id === lighting.id,
  )!;
  expect(disconnected.boardId).toBeUndefined();
  expect(disconnected.circuitId).toBeUndefined();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(
    (await exported(page)).loads.find((load) => load.id === lighting.id)
      ?.circuitId,
  ).toBe(circuit.id);
  const svg = (await downloaded(page, "Export SVG")).toString("utf8");
  expect(svg).toContain("Field sub-board");
  expect(svg).toContain("Field branch");
  expect(svg).toContain("Lighting (analytical)");
  expect(svg).toContain("<path");
  const pdf = await downloaded(page, "Export diagram PDF");
  expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(5000);
});

test("tool result applies explicit fields with undo and preserves incomplete evidence as a note", async ({
  page,
}) => {
  await home(page);
  const initial = await exported(page),
    lighting = initial.loads.find(
      (load) => load.name === "Lighting (analytical)",
    )!;
  await route(page, "Engineering Toolbox");
  await page.locator(".tool-item").filter({ hasText: "T03" }).click();
  await page
    .getByRole("button", { name: "Load worked example", exact: true })
    .click();
  await page
    .locator(".tool-workspace")
    .getByRole("button", { name: "Calculate", exact: true })
    .click();
  await page
    .getByLabel("Application target", { exact: true })
    .selectOption(`load:${lighting.id}`);
  await page
    .getByRole("button", { name: "Preview application", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("rating");
  await apply(page);
  let current = await exported(page);
  expect(current.loads.find((load) => load.id === lighting.id)?.rating).toBe(
    2.3,
  );
  expect(
    current.loads.find((load) => load.id === lighting.id)?.notes,
  ).toContain("T03 calculation");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(
    (await exported(page)).loads.find((load) => load.id === lighting.id)
      ?.rating,
  ).toBe(0.12);

  await page.locator(".tool-item").filter({ hasText: "T20" }).click();
  await page
    .getByRole("button", { name: "Load worked example", exact: true })
    .click();
  await page
    .locator(".tool-workspace")
    .getByRole("button", { name: "Calculate", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Preview application", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Application method", { exact: true })
    .selectOption("note");
  await page
    .getByLabel("Application target", { exact: true })
    .selectOption(`project:${initial.id}`);
  await page
    .getByRole("button", { name: "Preview application", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("incomplete");
  await apply(page);
  current = await exported(page);
  expect(current.notes).toContain("T20 calculation · incomplete");
  expect(current.circuits).toEqual(initial.circuits);
});
