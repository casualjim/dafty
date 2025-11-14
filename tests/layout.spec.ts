import { expect, test } from "@playwright/test";

const ENTRY_URL = new URL("../index.html", import.meta.url).href;

test.describe("Left rail interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ENTRY_URL, { waitUntil: "domcontentloaded" });
  });

  test("rail exposes the workspace icon buttons", async ({ page }) => {
    const rail = page.getByLabel("Workspace navigation");
    await expect(rail).toBeVisible();
    await expect(rail.getByLabel("Home workspace")).toBeVisible();
    await expect(rail.getByLabel("Shared spaces")).toBeVisible();
    await expect(rail.getByLabel("Boards")).toBeVisible();
    await expect(rail.getByLabel("Notifications")).toBeVisible();
  });

  test("avatar button toggles the profile menu", async ({ page }) => {
    const dropdown = page.locator('[data-profile-dropdown]');
    const toggle = dropdown.locator('summary');
    const menu = dropdown.getByRole("menu");

    await expect(dropdown).not.toHaveAttribute("open", "");

    await toggle.click();
    await expect(dropdown).toHaveAttribute("open", "");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Profile")).toBeVisible();
    await expect(menu.getByText("Settings")).toBeVisible();
    await expect(menu.getByText("Sign out")).toBeVisible();

    await toggle.click();
    await expect(dropdown).not.toHaveAttribute("open", "");
    await expect(menu).not.toBeVisible();
  });
});
