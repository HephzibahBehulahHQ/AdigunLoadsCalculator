import { test, expect, saveProject, resumeProject } from "./fixtures";
import { readFile } from "node:fs/promises";

test("measured CSV review, durable save, backup/clean exports and failed replacement preserve readings", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Schedules & Simulation/ })
    .click();
  const panel = page.locator(".measurements-panel");
  await expect(
    panel.getByText(
      "No measured dataset is open. Choose your CSV or a measurement backup.",
    ),
  ).toBeVisible();
  const source =
    "at,reading\n2026-10-25T02:00:00+02:00,1000\n2026-10-25T02:00:00+01:00,-500\n2026-10-25T04:00:00+01:00,2000";
  await panel.locator("input[type=file]").setInputFiles({
    name: "meter-real-input.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(source),
  });
  await panel
    .getByLabel("Timestamp column", { exact: true })
    .selectOption("at");
  await panel
    .getByLabel("Interval-average power column", { exact: true })
    .selectOption("reading");
  await panel.getByLabel("Power unit", { exact: true }).selectOption("W");
  await panel.getByLabel(/^Declared elapsed interval/).fill("60");
  await panel
    .getByRole("button", { name: "Preview measured data", exact: true })
    .click();
  await expect(panel.locator(".measurement-metrics")).toContainText("3 kWh");
  await expect(panel.locator(".measurement-metrics")).toContainText("0.5 kWh");
  await expect(panel.locator(".measurement-metrics")).toContainText("2.5 kWh");
  await expect(panel.locator(".measurement-warnings")).toContainText(
    "60 minutes of missing coverage",
  );
  await expect(panel.locator(".measurement-table tbody tr")).toHaveCount(3);
  await panel
    .getByRole("button", { name: "Save measured data", exact: true })
    .click();
  await expect(
    panel.getByText(
      "Measured data saved locally, separately from the engineering project.",
    ),
  ).toBeVisible();
  const backupEvent = page.waitForEvent("download");
  await panel
    .getByRole("button", { name: "Export measurement backup", exact: true })
    .click();
  const backupDownload = await backupEvent,
    backupText = await readFile((await backupDownload.path())!, "utf8"),
    backup = JSON.parse(backupText);
  expect(backup.format).toBe("adigunpowerlab-measurements");
  expect(backup.rawCSV).toBe(source);
  expect(backup.options.powerUnit).toBe("W");
  expect(backup).not.toHaveProperty("points");
  const csvEvent = page.waitForEvent("download");
  await panel
    .getByRole("button", { name: "Export cleaned CSV", exact: true })
    .click();
  const cleaned = await csvEvent,
    csv = await readFile((await cleaned.path())!, "utf8");
  expect(csv).toContain("average_power_kW");
  expect(csv).toContain("2026-10-25T02:00:00+01:00");
  expect(csv).toContain(",-0.5,-0.5");
  await saveProject(page);
  await page.reload();
  await resumeProject(page);
  await expect(
    panel.getByText("Saved measurements reopened and validated."),
  ).toBeVisible();
  await expect(panel.locator(".measurement-metrics")).toContainText("2.5 kWh");
  await panel.locator("input[type=file]").setInputFiles({
    name: "bad-reading.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("timestamp,power\n2026-11-05T09:00:00Z,"),
  });
  await panel
    .getByRole("button", { name: "Preview measured data", exact: true })
    .click();
  await expect(panel).toContainText("power is missing");
  await expect(
    panel.getByText(
      "Previous validated measurements remain visible. The new draft has not replaced them.",
    ),
  ).toBeVisible();
  await expect(panel.locator(".measurement-metrics")).toContainText("2.5 kWh");
  await expect(
    panel.getByRole("button", { name: "Save measured data", exact: true }),
  ).toBeDisabled();
  await panel
    .getByRole("button", { name: "Reopen saved measurements", exact: true })
    .click();
  await expect(panel.locator(".measurement-table tbody tr")).toHaveCount(3);
  await panel.locator("input[type=file]").setInputFiles({
    name: "restore.powerlab-measurements.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupText),
  });
  await expect(
    panel.getByText(
      "Backup validated. Save to replace the local measured dataset.",
    ),
  ).toBeVisible();
  await expect(panel.locator(".measurement-metrics")).toContainText("2.5 kWh");
  const forged = {
    ...backup,
    rawCSV: "at,reading\n2026-11-05T09:00:00Z,",
    points: [{ kw: 999 }],
  };
  await panel.locator("input[type=file]").setInputFiles({
    name: "invalid-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(forged)),
  });
  await expect(panel.getByRole("alert")).toContainText("validation failed");
  await expect(panel.locator(".measurement-table tbody tr")).toHaveCount(3);
  await expect(panel.locator(".measurement-metrics")).toContainText("2.5 kWh");
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    await page
      .getByRole("button", { name: "Collapse navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Collapse navigation", exact: true })
      .click();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
