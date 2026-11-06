import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function ready(page: Page, url = "/") {
  await page.goto(url);
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
}

async function openHelp(page: Page) {
  await page
    .locator(".page-heading")
    .getByRole("button", { name: "Help & Support", exact: true })
    .click();
  return page.getByRole("dialog", { name: "Help & Support", exact: true });
}

async function openOhmGuideTool(page: Page) {
  const help = await openHelp(page);
  await help
    .getByRole("searchbox", { name: "Search help", exact: true })
    .fill("T01");
  await expect(
    help.getByRole("article", { name: "Ohm’s law", exact: true }),
  ).toBeVisible();
  await help.getByRole("button", { name: "Open tool", exact: true }).click();
  await expect(help).toHaveCount(0);
  await expect(
    page
      .locator(".tool-workspace")
      .getByRole("heading", { name: "Ohm’s law", exact: true }),
  ).toBeVisible();
}

async function calculateOhmExample(page: Page) {
  const worksheet = page.locator(".tool-workspace");
  await worksheet.getByLabel(/^Voltage/).fill("230");
  await worksheet.getByLabel(/^Resistance/).fill("23");
  await worksheet
    .getByRole("button", { name: "Calculate", exact: true })
    .click();
  const current = worksheet.locator(".result-grid > div").filter({
    has: page.getByText("Current", { exact: true }),
  });
  await expect(current.locator("strong")).toHaveText("10 A");
  await expect(worksheet.locator(".tool-result")).toContainText("2,300");
}

async function projectSnapshot(page: Page) {
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export project", exact: true })
    .click();
  const file = await download;
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}

test("visible Help supports keyboard focus, useful empty results and safe external support", async ({
  page,
}) => {
  await ready(page);
  const launcher = page.locator(".help-launch");
  await expect(launcher).toBeVisible();
  const help = await openHelp(page);
  const search = help.getByRole("searchbox", {
    name: "Search help",
    exact: true,
  });
  await expect(search).toBeFocused();
  const close = help.getByRole("button", { name: "Close", exact: true });
  const support = help.getByRole("link", {
    name: "Open a GitHub issue",
    exact: true,
  });
  await expect(support).toHaveAttribute(
    "href",
    "https://github.com/HephzibahBehulahHQ/AdigunPowerLab/issues/new",
  );
  await expect(support).toHaveAttribute("rel", /noopener/);
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(support).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await search.fill("unmatched-question-709531");
  await expect(
    help.getByRole("heading", {
      name: "No matching help topics.",
      exact: true,
    }),
  ).toBeVisible();
  await help
    .locator(".help-empty")
    .getByRole("button", { name: "Clear search", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(help).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("Help remains discoverable and usable on a narrow mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const launcher = page.locator(".help-launch");
  await expect(launcher).toBeInViewport();
  const box = await launcher.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  const help = await openHelp(page);
  const search = help.getByRole("searchbox", {
    name: "Search help",
    exact: true,
  });
  await expect(search).toBeInViewport();
  await search.fill("T01");
  await expect(
    help.getByRole("article", { name: "Ohm’s law", exact: true }),
  ).toContainText("230");
  await help.getByRole("button", { name: "Open tool", exact: true }).click();
  await expect(
    page
      .locator(".tool-workspace")
      .getByRole("heading", { name: "Ohm’s law", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.body.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("English, German, Yoruba and Pidgin queries open the translated guide", async ({
  page,
}) => {
  await ready(page);
  for (const [locale, title, label, query, toolTitle] of [
    ["en", "Help & Support", "Search help", "Ohm's law", "Ohm’s law"],
    [
      "de",
      "Hilfe & Support",
      "Hilfe durchsuchen",
      "Ohmsches Gesetz",
      "Ohmsches Gesetz",
    ],
    ["yo", "Ìrànlọ́wọ́ àti àtìlẹ́yìn", "Wá ìrànlọ́wọ́", "Ofin Ohm", "Òfin Ohm"],
    ["pcm", "Help & Support", "Search help", "Ohm law", "Ohm law"],
  ]) {
    await page.locator(".language-select").selectOption(locale);
    await page
      .locator(".page-heading")
      .getByRole("button", { name: title, exact: true })
      .click();
    const help = page.getByRole("dialog", { name: title, exact: true });
    await help.getByRole("searchbox", { name: label, exact: true }).fill(query);
    await expect(
      help.getByRole("article", { name: toolTitle, exact: true }),
    ).toBeVisible();
    await expect(help.locator(".help-topic-list")).toContainText("T01");
    await page.keyboard.press("Escape");
    await expect(help).toHaveCount(0);
  }
});

test("command search finds practical help and restores its launcher after the handoff", async ({
  page,
}) => {
  await ready(page);
  const launcher = page.locator(".command-button");
  await launcher.click();
  const commands = page.getByRole("dialog", { name: "Search", exact: true });
  await commands
    .getByPlaceholder("Search tools, loads and pages", { exact: true })
    .fill("Save failed");
  await commands
    .getByRole("button", {
      name: "Help · Understand results and solve problems",
      exact: true,
    })
    .click();
  const help = page.getByRole("dialog", {
    name: "Help & Support",
    exact: true,
  });
  await expect(
    help.getByRole("article", {
      name: "Understand results and solve problems",
      exact: true,
    }),
  ).toContainText("keep the tab open");
  await expect(
    help.getByRole("searchbox", { name: "Search help", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(help).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("guide-to-tool navigation calculates real inputs, handles repeat requests and preserves saved work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.getByRole("button", { name: "Add load", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Add load", exact: true });
  await editor
    .getByLabel("Name", { exact: true })
    .fill("Help regression heater");
  await editor.getByLabel(/^Rating/).fill("2.3");
  await editor.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  const before = await projectSnapshot(page);
  await openOhmGuideTool(page);
  await calculateOhmExample(page);
  await page.locator(".tool-item").filter({ hasText: "T02" }).click();
  await expect(page.locator(".tool-workspace .eyebrow")).toContainText("T02");
  await openOhmGuideTool(page);
  await calculateOhmExample(page);
  await page.locator(".tool-item").filter({ hasText: "T02" }).click();
  await page.locator(".command-button").click();
  const commands = page.getByRole("dialog", { name: "Search", exact: true });
  await commands
    .getByPlaceholder("Search tools, loads and pages", { exact: true })
    .fill("T01");
  await commands
    .getByRole("button", { name: "T01 · Ohm’s law", exact: true })
    .click();
  await expect(commands).toHaveCount(0);
  await expect(page.locator(".tool-workspace .eyebrow")).toContainText("T01");
  await calculateOhmExample(page);
  expect(await projectSnapshot(page)).toEqual(before);
  await page.reload();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  expect(await projectSnapshot(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test("Help does not discard an unfinished settings draft when a guide requests navigation", async ({
  page,
}) => {
  await ready(page, "/#/settings");
  const name = page.getByLabel("Project name", { exact: true });
  await name.fill("Uncommitted help draft");
  const help = await openHelp(page);
  await help
    .getByRole("searchbox", { name: "Search help", exact: true })
    .fill("T01");
  await help.getByRole("button", { name: "Open tool", exact: true }).click();
  await expect(help).toBeVisible();
  await expect(
    help.getByRole("status").filter({
      hasText:
        "Finish or cancel your current edits before opening another workspace.",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/settings$/);
  await page.keyboard.press("Escape");
  await expect(name).toHaveValue("Uncommitted help draft");
  const settings = page.locator("form").filter({ has: name });
  await settings.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Saved locally");
  await openOhmGuideTool(page);
  expect((await projectSnapshot(page)).name).toBe("Uncommitted help draft");
});

test("cached production Help and linked calculations remain available offline", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.config.metadata.production,
    "Requires production service worker",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator(".help-launch")).toBeVisible();
  await openOhmGuideTool(page);
  await calculateOhmExample(page);
  expect(errors).toEqual([]);
});
