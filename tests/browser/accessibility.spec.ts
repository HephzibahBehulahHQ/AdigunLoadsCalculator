import { test, expect } from "./fixtures";

test("load dialog keeps keyboard focus inside and restores the opening control", async ({
  page,
}) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Add load", exact: true });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Add load", exact: true });
  await expect(
    dialog.getByRole("textbox", { name: "Name", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  const submit = dialog.getByRole("button", { name: "Add load", exact: true });
  await submit.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
});

test("navigation width has a keyboard alternative to dragging", async ({
  page,
}) => {
  await page.goto("/");
  const separator = page.getByRole("separator", {
    name: "Navigation width",
    exact: true,
  });
  await separator.focus();
  const initial = Number(await separator.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  await expect(separator).toHaveAttribute(
    "aria-valuenow",
    String(initial + 10),
  );
  await page.keyboard.press("Home");
  await expect(separator).toHaveAttribute(
    "aria-valuenow",
    (await separator.getAttribute("aria-valuemin"))!,
  );
  await page.keyboard.press("End");
  await expect(separator).toHaveAttribute(
    "aria-valuenow",
    (await separator.getAttribute("aria-valuemax"))!,
  );
});
