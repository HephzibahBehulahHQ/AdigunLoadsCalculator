import { test, expect } from "./fixtures";
import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

async function fixture(page: Page, kind: "calendar" | "feeder" | "dispatch") {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page.evaluate(async (kind) => {
    const domainPath = "/src/domain/project.ts",
      storagePath = "/src/storage/projects.ts";
    const domain = await import(domainPath),
      storage = await import(storagePath);
    const project = domain.createProject(`Browser ${kind} fixture`);
    project.timezone = "UTC";
    const cable = (r: number) => ({
      lengthM: 100,
      resistanceOhmPerKm: r,
      reactanceOhmPerKm: 0,
      baseAmpacityA: 63,
      correctionFactors: [1],
      voltageDropLimitPercent: 5,
      source: "Independent entered browser fixture",
    });
    if (kind === "calendar") {
      const load = domain.createLoad({
        name: "Calendar pump",
        rating: 2,
        hoursPerDay: 0,
        boardId: project.boards[0].id,
        schedule: {
          windows: [{ id: "morning", startHour: 0, durationHours: 1 }],
        },
      });
      project.loads = [load];
      project.tariff.bands = [
        {
          id: "cheap",
          name: "Entered cheap hour",
          startHour: 1,
          endHour: 2,
          importRate: 0.1,
        },
      ];
      project.flexibleLoads = [
        {
          id: "flex",
          name: "Pump requirement",
          loadId: load.id,
          windows: [
            { start: "2026-01-01T00:00:00Z", end: "2026-01-01T03:00:00Z" },
          ],
          requiredKWh: 2,
          minimumRunMinutes: 30,
          interruptible: true,
          locked: false,
          priority: 0,
          source: "Entered process authorization",
        },
      ];
    } else if (kind === "feeder") {
      project.boards[0].feeder = cable(1);
      const circuit = domain.createCircuit(project.boards[0].id, {
        name: "Final circuit",
        cable: cable(2),
      });
      project.circuits = [circuit];
      project.loads = [
        domain.createLoad({
          name: "Endpoint heater",
          rating: 2.3,
          boardId: project.boards[0].id,
          circuitId: circuit.id,
        }),
        domain.createLoad({
          name: "Shared feeder heater",
          rating: 2.3,
          boardId: project.boards[0].id,
        }),
      ];
    } else
      Object.assign(project.energy, {
        pvKW: 2,
        pvPerformanceRatio: 1,
        pvHourlyProfile: Array(24).fill(1),
        inverterACLimitKW: 1,
        windHourlyKW: Array(24).fill(1),
        windSource: "Entered hourly AC wind fixture",
      });
    await storage.saveProject(project);
    storage.writePreference("currentProject", project.id);
  }, kind);
  await page.reload();
  await expect(page.locator(".overview-banner")).toBeVisible();
}
async function route(page: Page, label: string) {
  await page
    .locator(".sidebar")
    .getByRole("button", {
      name: new RegExp("^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    })
    .click();
}
async function exportText(page: Page, name: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name, exact: true }).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return readFile((await download.path())!, "utf8");
}

test("calendar editor unions windows, runs the real worker, and applies an undoable constrained process", async ({
  page,
}) => {
  await fixture(page, "calendar");
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
  await panel
    .getByRole("button", { name: "Add operating window", exact: true })
    .click();
  await panel.getByLabel("Start hour").last().fill("0.5");
  await panel.getByLabel("Duration").last().fill("1");
  await panel
    .getByRole("button", { name: "Save calendar rules", exact: true })
    .click();
  await panel
    .getByLabel("Range start (explicit offset)")
    .fill("2026-01-01T00:00:00Z");
  await panel
    .getByLabel("Range end (explicit offset)")
    .fill("2026-01-01T03:00:00Z");
  await panel
    .getByRole("button", { name: "Run calendar and bill", exact: true })
    .click();
  await expect(
    panel.getByRole("heading", {
      name: "Completed calendar result",
      exact: true,
    }),
  ).toBeVisible();
  const csv = await exportText(page, "Export complete calendar");
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","));
  expect(rows.reduce((sum, row) => sum + Number(row[4]), 0)).toBeCloseTo(3, 8);
  await panel.getByRole("tab", { name: "Flexible loads", exact: true }).click();
  await panel.getByLabel("Scheduling objective").selectOption("cheapest");
  await panel
    .getByRole("button", { name: "Preview constrained schedule", exact: true })
    .click();
  await expect(
    panel.getByText("Feasible within entered constraints", { exact: false }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Apply reviewed schedule", exact: true })
    .click();
  const applied = JSON.parse(await exportText(page, "Export project"));
  expect(applied.loads[0].schedule.absoluteWindows).toEqual([
    { start: "2026-01-01T01:00:00.000Z", end: "2026-01-01T02:00:00.000Z" },
  ]);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const undone = JSON.parse(await exportText(page, "Export project"));
  expect(undone.loads[0].schedule.windows).toHaveLength(2);
  expect(undone.loads[0].schedule.absoluteWindows).toBeUndefined();
});

test("feeder route uses shared current, blocks invalid numeric drafts and updates entered segment impedance", async ({
  page,
}) => {
  await fixture(page, "feeder");
  await route(page, "Cables & Protection");
  const panel = page.getByRole("region", {
    name: "Cumulative feeder assessment",
    exact: true,
  });
  await panel
    .getByRole("button", { name: "Assess complete route", exact: true })
    .click();
  await expect(
    panel.locator(".kpi-card").filter({ hasText: "Signed cumulative drop" }),
  ).toContainText("8 V");
  const field = panel.getByLabel("Outgoing conductor resistance");
  await field.fill("not a number");
  await panel
    .getByRole("button", { name: "Save segment evidence", exact: true })
    .click();
  expect(
    await field.evaluate((input: HTMLInputElement) => input.checkValidity()),
  ).toBe(false);
  const unchanged = JSON.parse(await exportText(page, "Export project"));
  expect(unchanged.boards[0].feeder.resistanceOhmPerKm).toBe(1);
  await field.fill("2.5");
  await panel
    .getByRole("button", { name: "Save segment evidence", exact: true })
    .click();
  await panel
    .getByRole("button", { name: "Assess complete route", exact: true })
    .click();
  await expect(
    panel.locator(".kpi-card").filter({ hasText: "Signed cumulative drop" }),
  ).toContainText("14 V");
  const evidence = await exportText(page, "Export route evidence");
  expect(evidence).toContain("Independent entered browser fixture");
});

test("wind/PV dispatch retains completed results, reconciles curtailment and exports actual calendar instants", async ({
  page,
}) => {
  await fixture(page, "dispatch");
  await route(page, "Renewables & Storage");
  await page.getByLabel("Grid export limit").fill("0");
  await page
    .getByLabel("Use actual timestamped calendar range", { exact: true })
    .check();
  await page
    .getByLabel("Dispatch range start (explicit offset)")
    .fill("2026-01-01T00:00:00Z");
  await page
    .getByLabel("Dispatch range end (explicit offset)")
    .fill("2026-01-02T00:00:00Z");
  await page
    .getByRole("button", { name: "Save & Run simulation", exact: true })
    .click();
  await expect(
    page.locator(".kpi-card").filter({ hasText: "PV + wind generation" }),
  ).toContainText("72");
  await expect(
    page
      .locator(".metric-strip > div")
      .filter({ hasText: "Energy balance error" }),
  ).toContainText("0 kWh");
  const csv = await exportText(page, "Export series"),
    lines = csv.trim().split(/\r?\n/),
    headers = lines
      .shift()!
      .split(",")
      .map((cell) => cell.replace(/^"|"$/g, ""));
  const records = lines.map((line) => line.split(","));
  expect(records).toHaveLength(96);
  expect(
    records.reduce(
      (sum, row) => sum + Number(row[headers.indexOf("curtailed_kWh")]),
      0,
    ),
  ).toBeCloseTo(72, 8);
  expect(records[0][headers.indexOf("timestamp")]).toContain(
    "2026-01-01T00:00:00",
  );
  await page
    .getByLabel("Dispatch range end (explicit offset)")
    .fill("2026-01-03T00:00:00Z");
  await expect(
    page.getByRole("button", { name: "Export series", exact: true }),
  ).toHaveCount(0);
});
