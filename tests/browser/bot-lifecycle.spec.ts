import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

async function ready(page: Page) {
  await page.goto("/");
  expect(new URL(page.url()).origin).toBe(
    new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:4176").origin,
  );
  await expect(page.locator(".overview-banner")).toBeVisible();
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Adigun BOT", exact: true }),
  ).toBeVisible();
}

async function projects(page: Page) {
  await page.locator(".project-actions > summary").click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  return page.getByRole("dialog", { name: "Open project", exact: true });
}

async function createProject(page: Page, name: string) {
  const dialog = await projects(page);
  await dialog.getByLabel("New project", { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

test("quick actions and window lifecycle preserve the unfinished draft and conversation", async ({
  page,
}) => {
  await ready(page);
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const composer = bot.getByRole("textbox", {
    name: "Ask about your project",
    exact: true,
  });
  const draft = "load: Unfinished heater; 2.3 kW;\n230 V; PF 1; 8 h";
  await composer.fill(draft);
  await bot.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(bot.locator(".bot-message.assistant")).toHaveCount(1);
  await expect(composer).toHaveValue(draft);
  await bot.getByRole("button", { name: "Minimize", exact: true }).click();
  await expect(composer).not.toBeVisible();
  await bot.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(composer).toHaveValue(draft);
  await bot.getByRole("button", { name: "Close", exact: true }).click();
  await expect(bot).not.toBeVisible();
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  await expect(composer).toHaveValue(draft);
  await expect(bot.locator(".bot-message.user")).toHaveText("summary");
  await expect(bot.locator(".bot-message.assistant")).toHaveCount(1);
  await bot.getByRole("button", { name: "Send", exact: true }).click();
  await expect(composer).toHaveValue("");
  await expect(
    bot.getByRole("button", { name: "Apply confirmed changes", exact: true }),
  ).toBeVisible();
});

test("project switches preserve distinct drafts and transcripts without leaking messages", async ({
  page,
}) => {
  await ready(page);
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const composer = bot.locator("textarea");
  await createProject(page, "BOT Alpha");
  await composer.fill("Alpha conversation");
  await bot.getByRole("button", { name: "Send", exact: true }).click();
  await expect(bot.locator(".bot-message.assistant")).toHaveCount(1);
  await composer.fill("Unfinished Alpha command");
  await createProject(page, "BOT Beta");
  await expect(bot.locator(".bot-message")).toHaveCount(0);
  await expect(composer).toHaveValue("");
  await composer.fill("Beta conversation");
  await bot.getByRole("button", { name: "Send", exact: true }).click();
  await expect(bot.locator(".bot-message.assistant")).toHaveCount(1);
  await composer.fill("Unfinished Beta command");
  for (const name of ["Alpha", "Beta", "Alpha"]) {
    const dialog = await projects(page);
    await dialog
      .locator(".project-list > div > button:first-child")
      .filter({ hasText: `BOT ${name}` })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(composer).toHaveValue(`Unfinished ${name} command`);
    await expect(bot.locator(".bot-message.user")).toHaveText(
      `${name} conversation`,
    );
    await expect(bot.locator(".bot-message.assistant")).toHaveCount(1);
  }
});

test("only title-bar keyboard movement changes normal window geometry", async ({
  page,
}) => {
  await ready(page);
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const header = bot.locator(".bot-header");
  const initial = await bot.boundingBox();
  expect(initial).not.toBeNull();
  await bot.getByRole("button", { name: "Minimize", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Home");
  expect(await bot.boundingBox()).toEqual(initial);
  await header.focus();
  await page.keyboard.press("Shift+ArrowLeft");
  const moved = await bot.boundingBox();
  expect(moved?.x).toBe(initial!.x - 40);
  expect(moved?.y).toBe(initial!.y);
  await bot.getByRole("button", { name: "Maximize", exact: true }).click();
  await header.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Home");
  await bot.getByRole("button", { name: "Restore", exact: true }).click();
  expect(await bot.boundingBox()).toEqual(moved);
});

test("Escape closes only the focused BOT and returns focus without losing its draft", async ({
  page,
}) => {
  await ready(page);
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const launcher = page.getByRole("button", {
    name: "Open Adigun BOT",
    exact: true,
  });
  const composer = bot.locator("textarea");
  await expect(composer).toBeFocused();
  await composer.fill("Keep my unfinished command");
  await page.keyboard.press("Escape");
  await expect(bot).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(composer).toBeFocused();
  await expect(composer).toHaveValue("Keep my unfinished command");
  const language = page.getByLabel("Language", { exact: true });
  await language.focus();
  await page.keyboard.press("Escape");
  await expect(bot).toBeVisible();
  await expect(language).toBeFocused();
  await bot.getByRole("button", { name: "Close", exact: true }).click();
  await expect(launcher).toBeFocused();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Settings/ })
    .click();
  const settingsOpener = page.getByRole("button", {
    name: "Open / restore Adigun BOT",
    exact: true,
  });
  await settingsOpener.click();
  await expect(composer).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(settingsOpener).toBeFocused();
});

test("IME composition cannot submit or close the BOT while ordinary Enter still sends", async ({
  page,
}) => {
  await ready(page);
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const composer = bot.locator("textarea");
  await composer.fill("summary");
  await composer.dispatchEvent("compositionstart");
  await composer.dispatchEvent("keydown", { key: "Enter" });
  await composer.dispatchEvent("keydown", { key: "Escape" });
  await expect(bot).toBeVisible();
  await expect(composer).toHaveValue("summary");
  await expect(bot.locator(".bot-message")).toHaveCount(0);
  await composer.dispatchEvent("compositionend");
  await composer.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await composer.dispatchEvent("keydown", { key: "Enter", keyCode: 229 });
  await expect(composer).toHaveValue("summary");
  await expect(bot.locator(".bot-message")).toHaveCount(0);
  await composer.dispatchEvent("compositionstart");
  await bot.getByRole("button", { name: "Overview", exact: true }).focus();
  await composer.focus();
  await composer.press("Shift+Enter");
  await expect(composer).toHaveValue("summary\n");
  await composer.press("Enter");
  await expect(composer).toHaveValue("");
  await expect(bot.locator(".bot-message.user")).toHaveText("summary");
  await expect(bot.locator(".bot-message.assistant")).toHaveCount(1);
});

test("proactive findings preserve minimized focus and stale previews remain rejected", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  const composer = bot.locator("textarea");
  await composer.fill("load: Supply warning; 20 kW; 230 V; PF 1; 8 h");
  await bot.getByRole("button", { name: "Send", exact: true }).click();
  await bot.locator(".bot-settings > summary").click();
  await bot
    .getByLabel("Live assistance", { exact: true })
    .selectOption("proactive");
  await bot
    .getByRole("button", { name: "Apply confirmed changes", exact: true })
    .click();
  await bot.getByRole("button", { name: "Minimize", exact: true }).click();
  const language = page.getByLabel("Language", { exact: true });
  await language.focus();
  await page.clock.fastForward(1200);
  await expect(bot).toHaveClass(/is-minimized/);
  await expect(language).toBeFocused();
  await bot.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(bot.locator(".bot-message.assistant")).toHaveCount(2);
  await expect(bot.locator(".bot-message.assistant").last()).toContainText(
    "supply limit",
  );
  await composer.fill("load: Older preview; 1 kW; 230 V; PF 1; 8 h");
  await bot.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    bot.getByRole("button", { name: "Apply confirmed changes", exact: true }),
  ).toBeVisible();
  await page.locator(".project-actions > summary").click();
  await page
    .getByRole("button", { name: "Rename project", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Rename project",
    exact: true,
  });
  await dialog
    .getByLabel("Project name", { exact: true })
    .fill("Changed after preview");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(bot.locator(".bot-stale")).toHaveText(
    "This preview is stale. Request a new one.",
  );
  await expect(
    bot.getByRole("button", { name: "Apply confirmed changes", exact: true }),
  ).toHaveCount(0);
  await bot.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await language.focus();
  await page.clock.fastForward(31000);
  await expect(bot).not.toBeVisible();
  await expect(language).toBeFocused();
});
