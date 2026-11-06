import { test, expect, saveProject } from "./fixtures";
import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import type { Project } from "../../src/domain/types";

async function route(page: Page, name: string) {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
}

async function reference(page: Page, name: string) {
  await page.locator(".project-switch").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Open reference case", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .locator(".reference-card")
    .filter({ hasText: name })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".project-switch")).toContainText(name);
}

async function downloadText(page: Page, button: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  const file = await pending;
  expect(await file.failure()).toBeNull();
  return await readFile((await file.path())!, "utf8");
}

async function exported(page: Page): Promise<Project> {
  return JSON.parse(await downloadText(page, "Export project"));
}

test("home circuits, locked phase balancing, and independent scenario copy", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await reference(page, "Home · three-phase household");
  const initial = await exported(page);
  expect(initial.loads).toHaveLength(3);
  expect(
    initial.loads.every((load) =>
      initial.circuits.some(
        (c) => c.id === load.circuitId && c.boardId === load.boardId,
      ),
    ),
  ).toBe(true);

  await route(page, "Boards & Circuits");
  for (const circuit of initial.circuits)
    await page
      .getByLabel(circuit.name + " Phase", { exact: true })
      .selectOption("L1");
  const unchanged = await exported(page);
  await page
    .getByLabel(initial.circuits[0].name + " Phase", { exact: true })
    .selectOption("L1");
  expect((await exported(page)).revision).toBe(unchanged.revision);
  await expect(
    page.getByText("The command does not change any fields.", { exact: true }),
  ).toHaveCount(0);
  const lockedCircuit = initial.circuits[0];
  const lockedRow = page
    .locator("tbody tr")
    .filter({ hasText: lockedCircuit.name });
  await lockedRow.getByLabel("Lock phase", { exact: true }).check();
  await expect(
    page.getByLabel(lockedCircuit.name + " Phase", { exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Preview balance", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Apply changes", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply changes", exact: true })
    .click();
  await expect(
    page.getByLabel(lockedCircuit.name + " Phase", { exact: true }),
  ).toHaveValue("L1");
  await page
    .getByLabel("Add board", { exact: true })
    .fill("Planning sub-board");
  await page.getByRole("button", { name: "Add board", exact: true }).click();
  await page
    .getByLabel("Add circuit", { exact: true })
    .fill("Future workshop circuit");
  await page
    .getByLabel("Board", { exact: true })
    .selectOption({ label: "Planning sub-board" });
  await page.getByRole("button", { name: "Add circuit", exact: true }).click();
  const baseline = await exported(page);
  expect(
    baseline.circuits.find((c) => c.name === "Future workshop circuit")
      ?.boardId,
  ).toBe(baseline.boards.find((b) => b.name === "Planning sub-board")?.id);
  expect(
    baseline.circuits.find((c) => c.id === lockedCircuit.id),
  ).toMatchObject({ locked: true, phase: "L1" });
  expect(baseline.loads.some((load) => load.phase !== "L1")).toBe(true);

  await saveProject(page);
  await route(page, "Scenarios & Optimization");
  await page
    .getByLabel("Create scenario", { exact: true })
    .fill("Isolated planning scenario");
  await page
    .getByRole("button", { name: "Create scenario", exact: true })
    .click();
  await expect(page.locator(".project-switch")).toContainText(
    "Isolated planning scenario",
  );
  await route(page, "Load Schedule");
  await page
    .getByRole("button", { name: "Edit Lighting (analytical)", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(/^Rating/)
    .fill("0.24");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  const scenario = await exported(page);
  expect(scenario.id).not.toBe(baseline.id);
  expect(scenario.scenarioOf).toBe(baseline.id);
  expect(
    scenario.loads.find((load) => load.name === "Lighting (analytical)")
      ?.rating,
  ).toBe(0.24);
  await saveProject(page);
  await route(page, "Scenarios & Optimization");
  await page
    .locator(".scenario-grid section")
    .filter({
      has: page.getByRole("heading", { name: baseline.name, exact: true }),
    })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.locator(".project-switch")).toContainText(baseline.name);
  const reopened = await exported(page);
  expect(
    reopened.loads.find((load) => load.name === "Lighting (analytical)")
      ?.rating,
  ).toBe(0.12);
  expect(reopened.id).toBe(baseline.id);
});

test("workshop SVG download, PV energy reconciliation, and feasible overnight EV plan", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await reference(page, "Workshop · motor and lighting");
  await route(page, "Single-Line Studio");
  const svg = await downloadText(page, "Export SVG");
  expect(svg).toContain("<svg");
  expect(svg).toContain("http://www.w3.org/2000/svg");
  expect(svg).toContain("7.5 kW shaft motor");
  expect(svg).toContain("Workshop lighting");

  await reference(page, "Solar · storage and backup");
  await route(page, "Renewables & Storage");
  await page
    .getByRole("button", { name: "Save & Run simulation", exact: true })
    .click();
  await expect(
    page.locator(".kpi-card").filter({ hasText: "PV generation" }),
  ).toContainText("16.64");
  await expect(
    page
      .locator(".metric-strip > div")
      .filter({ hasText: "Energy balance error" }),
  ).toContainText("0 kWh");
  const series = await downloadText(page, "Export series");
  const rows = series.trim().split(/\r?\n/);
  const headers = rows
    .shift()!
    .split(",")
    .map((cell) => cell.replace(/^"|"$/g, ""));
  expect(rows).toHaveLength(96);
  const errorIndex = headers.indexOf("balance_error_kWh");
  const generationIndex = headers.indexOf("generation_kW");
  expect(errorIndex).toBeGreaterThan(-1);
  let pvKWh = 0;
  for (const row of rows) {
    const values = row.split(",").map(Number);
    expect(Math.abs(values[errorIndex])).toBeLessThan(1e-8);
    pvKWh += values[generationIndex] / 4;
  }
  expect(pvKWh).toBeCloseTo(16.64, 6);

  await reference(page, "EV · deadline-aware charging");
  await route(page, "EV & Flexible Loads");
  const session = page.locator("section.panel").filter({
    has: page.getByRole("heading", {
      name: "Analytical overnight charge",
      exact: true,
    }),
  });
  await expect(session.getByText("Feasible", { exact: true })).toBeVisible();
  await expect(
    session
      .locator(".metric-strip > div")
      .filter({ hasText: "Delivered energy" }),
  ).toContainText("12 kWh");
  await expect(
    session.locator(".metric-strip > div").filter({ hasText: "Unmet energy" }),
  ).toContainText("0 kWh");
  await expect(
    session.getByRole("button", { name: "Apply changes", exact: true }),
  ).toBeEnabled();
});
