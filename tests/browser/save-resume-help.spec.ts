import type { Page } from "@playwright/test";
import type { ProjectRecord } from "../../src/storage/projects";
import { test, expect, saveProject, resumeProject } from "./fixtures";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page), "No unhandled browser errors").toEqual([]);
});

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".overview-banner")).toBeVisible();
  await expect(page.locator(".save-badge")).toContainText("Not saved");
}

async function savedProjects(page: Page): Promise<ProjectRecord[]> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("AdigunPowerLab");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<ProjectRecord[]>((resolve, reject) => {
        const transaction = database.transaction("projects");
        const request = transaction.objectStore("projects").getAll();
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  });
}

async function blocksLeaving(page: Page) {
  return page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
}

async function addLoad(page: Page, name: string, rating = "2.3") {
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Add load", exact: true });
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByLabel(/^Rating/).fill(rating);
  await dialog.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

async function setRating(page: Page, name: string, rating: string) {
  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit load", exact: true });
  await dialog.getByLabel(/^Rating/).fill(rating);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

async function billing(page: Page) {
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Reports & Estimates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Customer bill", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save draft locally", exact: true }),
  ).toBeEnabled();
}

test("a fresh workspace never warns or creates an automatic saved project", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator(".project-interview")).toBeVisible();
  expect(await blocksLeaving(page)).toBe(false);
  expect(await savedProjects(page)).toHaveLength(0);
  // Grant real browser user activation; absence of a dialog must not merely be
  // Chromium suppressing beforeunload on an untouched page.
  await page.locator(".page-heading h2").click();
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.type());
    await dialog.accept();
  });
  await page.reload();
  await expect(page.locator(".project-interview")).toBeVisible();
  await expect(page.locator(".save-badge")).toContainText("Not saved");
  expect(dialogs).toEqual([]);
  expect(await savedProjects(page)).toHaveLength(0);
});

test("native reload cancellation retains the interview; accepting discards only its unsaved draft", async ({
  page,
}) => {
  await ready(page);
  const interview = page.locator(".project-interview");
  await interview
    .getByLabel("Project name", { exact: true })
    .fill("Unfinished interview fixture");
  await interview
    .getByRole("button", { name: "Next step", exact: true })
    .click();
  expect(await blocksLeaving(page)).toBe(true);
  const before = await interview.innerText();

  const cancelledDialog = page.waitForEvent("dialog");
  const cancelledReload = page.reload({ timeout: 5000 }).catch(() => null);
  const cancel = await cancelledDialog;
  expect(cancel.type()).toBe("beforeunload");
  await cancel.dismiss();
  await cancelledReload;
  await expect(page.locator(".project-switch")).toContainText(
    "Unfinished interview fixture",
  );
  expect(await interview.innerText()).toBe(before);
  expect(await blocksLeaving(page)).toBe(true);
  expect(await savedProjects(page)).toHaveLength(0);

  const acceptedDialog = page.waitForEvent("dialog");
  const acceptedReload = page.reload();
  const accept = await acceptedDialog;
  expect(accept.type()).toBe("beforeunload");
  await accept.accept();
  await acceptedReload;
  await expect(interview).toBeVisible();
  await expect(page.locator(".project-switch")).toContainText(
    "Untitled project",
  );
  await expect(
    interview.getByLabel("Project name", { exact: true }),
  ).not.toHaveValue("Unfinished interview fixture");
  expect(await blocksLeaving(page)).toBe(false);
  expect(await savedProjects(page)).toHaveLength(0);
});

test("an explicit checkpoint restores the exact interview step and project after later edits are discarded", async ({
  page,
}) => {
  await ready(page);
  const interview = page.locator(".project-interview");
  await interview
    .getByLabel("Project name", { exact: true })
    .fill("Saved interview fixture");
  await interview
    .getByRole("button", { name: "Next step", exact: true })
    .click();
  const savedInterview = await interview.innerText();
  await saveProject(page);
  const [checkpoint] = await savedProjects(page);
  expect(checkpoint.project.name).toBe("Saved interview fixture");
  expect(await blocksLeaving(page)).toBe(false);

  await interview.getByRole("button", { name: "Back", exact: true }).click();
  await interview
    .getByLabel("Project name", { exact: true })
    .fill("Discard this later edit");
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(page.locator(".project-switch")).toContainText(
    "Untitled project",
  );
  expect(await savedProjects(page)).toEqual([checkpoint]);
  await resumeProject(page, "Saved interview fixture");
  await expect(page.locator(".project-switch")).toContainText(
    "Saved interview fixture",
  );
  expect(await interview.innerText()).toBe(savedInterview);
  expect(await blocksLeaving(page)).toBe(false);
  expect(await savedProjects(page)).toEqual([checkpoint]);

  const prompts: string[] = [];
  page.on("dialog", async (dialog) => {
    prompts.push(dialog.type());
    await dialog.accept();
  });
  await page.reload();
  await expect(page.locator(".save-badge")).toContainText("Not saved");
  expect(prompts).toEqual([]);
  await resumeProject(page, "Saved interview fixture");
  expect(await interview.innerText()).toBe(savedInterview);
});

test("cancelling a new-project switch keeps both the active work and the proposed project name", async ({
  page,
}) => {
  await ready(page);
  await page
    .locator(".project-interview")
    .getByLabel("Project name", { exact: true })
    .fill("Keep the current interview");
  await page
    .getByRole("button", { name: "Resume project", exact: true })
    .click();
  const projects = page.getByRole("dialog", {
    name: "Open project",
    exact: true,
  });
  await projects
    .getByLabel("New project", { exact: true })
    .fill("Keep this proposed name too");
  const confirmation = page.waitForEvent("dialog");
  const creating = projects
    .getByRole("button", { name: "Create", exact: true })
    .click();
  const native = await confirmation;
  expect(native.type()).toBe("confirm");
  await native.dismiss();
  await creating;
  await expect(projects).toBeVisible();
  await expect(projects.getByLabel("New project", { exact: true })).toHaveValue(
    "Keep this proposed name too",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".project-switch")).toContainText(
    "Keep the current interview",
  );
  expect(await blocksLeaving(page)).toBe(true);
  expect(await savedProjects(page)).toHaveLength(0);
});

test("a delayed Resume cannot replace edits entered while its storage read is pending", async ({
  page,
}) => {
  await ready(page);
  const interviewName = page
    .locator(".project-interview")
    .getByLabel("Project name", { exact: true });
  await interviewName.fill("Resume race Alpha");
  await saveProject(page);
  await page
    .getByRole("button", { name: "Resume project", exact: true })
    .click();
  let projects = page.getByRole("dialog", {
    name: "Open project",
    exact: true,
  });
  await projects
    .getByLabel("New project", { exact: true })
    .fill("Resume race Beta");
  await projects.getByRole("button", { name: "Create", exact: true }).click();
  await expect(projects).not.toBeVisible();
  await saveProject(page);
  const snapshots = await savedProjects(page);
  await page
    .getByRole("button", { name: "Resume project", exact: true })
    .click();
  projects = page.getByRole("dialog", { name: "Open project", exact: true });
  const alpha = projects
    .locator(".project-list > div > button:first-child")
    .filter({ hasText: "Resume race Alpha" });
  await expect(alpha).toBeVisible();
  await page.evaluate(() => {
    const state = window as unknown as {
      holdNextProjectRead: boolean;
      projectReadHeld: boolean;
      projectReadCompleted: boolean;
      releaseProjectRead: boolean;
    };
    state.holdNextProjectRead = true;
    state.projectReadHeld = false;
    state.projectReadCompleted = false;
    state.releaseProjectRead = false;
    const native = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (names, mode, options) {
      const tx = native.call(this, names, mode, options);
      if (
        tx.mode === "readonly" &&
        tx.objectStoreNames.contains("projects") &&
        state.holdNextProjectRead
      ) {
        state.holdNextProjectRead = false;
        state.projectReadHeld = true;
        tx.addEventListener("complete", () => { state.projectReadCompleted = true; });
        const keepAlive = () => {
          if (state.releaseProjectRead) return;
          tx.objectStore("projects").get("__resume_read_probe__").onsuccess =
            keepAlive;
        };
        keepAlive();
      }
      return tx;
    };
  });
  await alpha.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { projectReadHeld: boolean }).projectReadHeld,
      ),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await interviewName.fill("Beta edits entered during the read");
  await page.evaluate(() => {
    (window as unknown as { releaseProjectRead: boolean }).releaseProjectRead =
      true;
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { projectReadCompleted: boolean }).projectReadCompleted)).toBe(true);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator(".project-switch")).toContainText(
    "Beta edits entered during the read",
  );
  await expect(interviewName).toHaveValue("Beta edits entered during the read");
  expect(await blocksLeaving(page)).toBe(true);
  expect(await savedProjects(page)).toEqual(snapshots);
});

test("Saved is withheld until transaction commit and edits made during saving stay dirty", async ({
  page,
}) => {
  await ready(page);
  await addLoad(page, "Commit boundary heater");
  await saveProject(page);
  await setRating(page, "Commit boundary heater", "3");
  await page.evaluate(() => {
    const state = window as unknown as {
      holdProjectSave: boolean;
      projectSaveHeld: boolean;
    };
    state.holdProjectSave = true;
    state.projectSaveHeld = false;
    const native = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (names, mode, options) {
      const tx = native.call(this, names, mode, options);
      if (
        mode === "readwrite" &&
        tx.objectStoreNames.contains("projects") &&
        state.holdProjectSave
      ) {
        state.projectSaveHeld = true;
        const keepAlive = () => {
          if (!state.holdProjectSave) return;
          tx
            .objectStore("projects")
            .get("__commit_boundary_probe__").onsuccess = keepAlive;
        };
        keepAlive();
      }
      return tx;
    };
  });
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { projectSaveHeld: boolean }).projectSaveHeld,
      ),
    )
    .toBe(true);
  await expect(page.locator(".save-badge")).toContainText("Saving");
  expect(await blocksLeaving(page)).toBe(true);
  await setRating(page, "Commit boundary heater", "4");
  await page.evaluate(() => {
    (window as unknown as { holdProjectSave: boolean }).holdProjectSave = false;
  });
  await expect(page.locator(".save-badge")).toContainText("Unsaved changes");
  const [snapshot] = await savedProjects(page);
  expect(snapshot.project.loads[0].rating).toBe(3);
  expect(await blocksLeaving(page)).toBe(true);
  await saveProject(page);
  expect((await savedProjects(page))[0].project.loads[0].rating).toBe(4);
  expect(await blocksLeaving(page)).toBe(false);
});

test("an aborted project-and-bill save retains the earlier checkpoint and retries without losing bill entries", async ({
  page,
}) => {
  await ready(page);
  await addLoad(page, "Billing checkpoint heater");
  await saveProject(page);
  const [original] = await savedProjects(page);
  await billing(page);
  await page
    .getByLabel("Document number", { exact: true })
    .fill("SAVE-CHECKPOINT-001");
  await page
    .getByLabel("Supplier", { exact: true })
    .fill("Analytical supplier fixture");
  await page
    .getByLabel("Customer", { exact: true })
    .fill("Analytical customer fixture");
  await page.getByRole("button", { name: "Add line", exact: false }).click();
  await page
    .getByLabel("Description 1", { exact: true })
    .fill("Entered cable work");
  await page.getByLabel("Qty 1", { exact: true }).fill("2.5");
  await page.getByLabel("Unit price 1", { exact: true }).fill("19.99");
  await page.evaluate(() => {
    const native = IDBObjectStore.prototype.put;
    let rejectNextProject = true;
    IDBObjectStore.prototype.put = function (value, key) {
      const request =
        key === undefined
          ? native.call(this, value)
          : native.call(this, value, key);
      if (this.name === "projects" && rejectNextProject) {
        rejectNextProject = false;
        const transaction = this.transaction;
        request.addEventListener("success", () => transaction.abort(), {
          once: true,
        });
      }
      return request;
    };
  });
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.locator(".save-badge")).toContainText("Save failed");
  expect(await savedProjects(page)).toEqual([original]);
  expect(await blocksLeaving(page)).toBe(true);
  await expect(page.getByLabel("Document number", { exact: true })).toHaveValue(
    "SAVE-CHECKPOINT-001",
  );
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€49.98",
  );
  await saveProject(page);
  expect(await blocksLeaving(page)).toBe(false);
  await page.reload();
  await expect(page.locator(".save-badge")).toContainText("Not saved");
  await resumeProject(page, original.project.name);
  await billing(page);
  await expect(page.getByLabel("Document number", { exact: true })).toHaveValue(
    "SAVE-CHECKPOINT-001",
  );
  await expect(
    page.getByRole("textbox", { name: "Customer", exact: true }),
  ).toHaveValue("Analytical customer fixture");
  await expect(page.getByLabel("Description 1", { exact: true })).toHaveValue(
    "Entered cable work",
  );
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€49.98",
  );
  expect(await blocksLeaving(page)).toBe(false);

  // Resuming the already-open ID must also reset mounted billing form state.
  await page
    .getByRole("textbox", { name: "Customer", exact: true })
    .fill("Discard this unsaved customer edit");
  await page.getByLabel("Unit price 1", { exact: true }).fill("30");
  await page.getByLabel("Unit price 1", { exact: true }).blur();
  expect(await blocksLeaving(page)).toBe(true);
  page.once("dialog", (dialog) => dialog.accept());
  await resumeProject(page, original.project.name);
  await billing(page);
  await expect(
    page.getByRole("textbox", { name: "Customer", exact: true }),
  ).toHaveValue("Analytical customer fixture");
  await expect(page.getByLabel("Unit price 1", { exact: true })).toHaveValue(
    "19.99",
  );
  await expect(page.locator(".billing-grand-total strong")).toHaveText(
    "€49.98",
  );
  expect(await blocksLeaving(page)).toBe(false);
});

test("closing a dirty tab can be cancelled, and explicitly saved BOT drafts resume after a fresh load", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  await bot.locator("textarea").fill("A saved unfinished engineering question");
  const cancelDialog = page.waitForEvent("dialog");
  const closing = page.close({ runBeforeUnload: true });
  const cancel = await cancelDialog;
  expect(cancel.type()).toBe("beforeunload");
  await cancel.dismiss();
  await closing;
  expect(page.isClosed()).toBe(false);
  await expect(bot.locator("textarea")).toHaveValue(
    "A saved unfinished engineering question",
  );
  await saveProject(page);
  expect(await blocksLeaving(page)).toBe(false);
  await page.reload();
  await expect(page.locator(".save-badge")).toContainText("Not saved");
  await resumeProject(page);
  await expect(bot).toBeVisible();
  await expect(bot.locator("textarea")).toHaveValue(
    "A saved unfinished engineering question",
  );
  expect(await blocksLeaving(page)).toBe(false);
});

test("Help & Support is searchable, keyboard accessible and preserves unsaved work on desktop and mobile", async ({
  page,
}) => {
  await ready(page);
  await addLoad(page, "Help preservation heater");
  const originalRow = await page
    .locator(".load-table tbody tr")
    .filter({ hasText: "Help preservation heater" })
    .innerText();
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  const bot = page.getByRole("region", { name: "Adigun BOT", exact: true });
  await bot.locator("textarea").fill("Keep this question while I read help");
  await bot.getByRole("button", { name: "Close", exact: true }).click();
  const opener = page
    .getByRole("button", { name: "Help & Support", exact: true })
    .first();
  await opener.click();
  const help = page.getByRole("dialog", {
    name: "Help & Support",
    exact: true,
  });
  await expect(help).toBeVisible();
  await help
    .getByRole("searchbox", { name: "Search the help guide", exact: true })
    .fill("bill");
  await help
    .getByRole("button", {
      name: "Create and print a customer bill",
      exact: true,
    })
    .click();
  await expect(help).toContainText(/customer/i);
  await expect(help).toContainText(/price/i);
  await expect(help).toContainText(/print/i);
  await page.screenshot({ path: test.info().outputPath("help-desktop.png") });
  await help
    .getByRole("searchbox", { name: "Search the help guide", exact: true })
    .fill("T01");
  await help.getByRole("button", { name: /^T01 ·/ }).click();
  await expect(help.locator(".help-result-values")).toContainText("10 A");
  await expect(help.locator(".help-result-values")).toContainText("2,300 W");
  await page.keyboard.press("Tab");
  expect(
    await help.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(help).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator(".load-table")).toContainText(
    "Help preservation heater",
  );
  expect(
    await page
      .locator(".load-table tbody tr")
      .filter({ hasText: "Help preservation heater" })
      .innerText(),
  ).toBe(originalRow);
  expect(await blocksLeaving(page)).toBe(true);
  expect(await savedProjects(page)).toHaveLength(0);
  await page
    .getByRole("button", { name: "Open Adigun BOT", exact: true })
    .click();
  await expect(bot.locator("textarea")).toHaveValue(
    "Keep this question while I read help",
  );
  await bot.getByRole("button", { name: "Close", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(help).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("help-mobile.png") });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(page.locator(".load-table")).toContainText(
    "Help preservation heater",
  );
});

test("F1 opens help above an unfinished load editor and returns to its exact inputs", async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Add load", exact: true })
    .first()
    .click();
  const editor = page.getByRole("dialog", { name: "Add load", exact: true });
  const name = editor.getByLabel("Name", { exact: true });
  await name.fill("Unsubmitted editor fixture");
  await editor.getByLabel(/^Rating/).fill("4.2");
  await name.focus();
  await page.keyboard.press("F1");
  const help = page.getByRole("dialog", {
    name: "Help & Support",
    exact: true,
  });
  await expect(help).toBeVisible();
  await expect(page.locator(".modal[aria-label='Add load']")).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(help).not.toBeVisible();
  await expect(editor).toBeVisible();
  await expect(name).toBeFocused();
  await expect(name).toHaveValue("Unsubmitted editor fixture");
  await expect(editor.getByLabel(/^Rating/)).toHaveValue("4.2");
  expect(await blocksLeaving(page)).toBe(true);
  expect(await savedProjects(page)).toHaveLength(0);
  await editor.getByRole("button", { name: "Add load", exact: true }).click();
  await expect(page.locator(".load-table")).toContainText(
    "Unsubmitted editor fixture",
  );
});
