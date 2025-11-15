import { expect, test } from "@playwright/test";

test.describe("Layout state persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => (window as any).Alpine !== undefined);
  });

  test("loads saved layout state from server", async ({ page }, testInfo) => {
    const userId = `test-${testInfo.testId}`;
    // Set a specific state via API
    await page.request.post("/api/layout", {
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": userId 
      },
      data: {
        path: "/",
        left_sidebar_open: false,
        left_width: 400,
        theme: "dark"
      }
    });
    
    // Navigate with X-API-Key header
    await page.setExtraHTTPHeaders({ "X-API-Key": userId });
    await page.goto("/");
    await page.waitForFunction(() => (window as any).Alpine !== undefined);
    
    // Check that state was loaded
    const leftSidebar = await page.locator('[aria-label="Left sidebar"]');
    await expect(leftSidebar).not.toBeVisible();
    
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test("persists sidebar toggle to server", async ({ page }, testInfo) => {
    const userId = `test-${testInfo.testId}`;
    await page.setExtraHTTPHeaders({ "X-API-Key": userId });
    await page.goto("/");
    
    const toggleButton = page.getByLabel("Toggle left sidebar").last();
    const leftSidebar = page.locator('[aria-label="Left sidebar"]');
    
    // Initially visible (desktop)
    await expect(leftSidebar).toBeVisible();
    
    // Toggle off
    await toggleButton.click();
    await expect(leftSidebar).not.toBeVisible();
    
    // Wait a bit for the save
    await page.waitForTimeout(500);
    
    // Check the server state for this user
    const response = await page.request.get(`/api/layout?path=/&device=desktop`, {
      headers: { "X-API-Key": userId }
    });
    const data = await response.json();
    expect(data.settings.left_sidebar_open).toBe(false);
  });

  test("persists theme changes to server", async ({ page }, testInfo) => {
    const userId = `test-${testInfo.testId}`;
    await page.setExtraHTTPHeaders({ "X-API-Key": userId });
    await page.goto("/");
    
    const themeToggle = page.getByLabel("Toggle theme");
    
    // Cycle through themes
    await themeToggle.click(); // system -> light
    await page.waitForTimeout(400); // Wait for debounce (300ms) + buffer
    
    await themeToggle.click(); // light -> dark
    await page.waitForTimeout(400);
    
    // Check server state for this user
    const response = await page.request.get(`/api/layout?path=/&device=desktop`, {
      headers: { "X-API-Key": userId }
    });
    const data = await response.json();
    expect(data.settings.theme).toBe('dark');
  });

  test("persists resize width to server", async ({ page }, testInfo) => {
    const userId = `test-${testInfo.testId}`;
    await page.setExtraHTTPHeaders({ "X-API-Key": userId });
    await page.goto("/");
    
    const leftSidebar = page.locator('[aria-label="Left sidebar"]');
    const resizeHandle = leftSidebar.locator('[data-resize-handle="left"]');
    
    const initialWidth = await leftSidebar.evaluate(el => el.getBoundingClientRect().width);
    
    // Drag resize handle
    const box = await resizeHandle.boundingBox();
    if (!box) throw new Error("Resize handle not found");
    
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + box.height / 2);
    await page.mouse.up();
    
    // Wait for save
    await page.waitForTimeout(500);
    
    // Check server state for this user
    const response = await page.request.get(`/api/layout?path=/&device=desktop`, {
      headers: { "X-API-Key": userId }
    });
    const data = await response.json();
    expect(data.settings.left_width).toBeGreaterThan(initialWidth);
  });

  test("state persists across page reloads", async ({ page }, testInfo) => {
    const userId = `test-${testInfo.testId}`;
    await page.setExtraHTTPHeaders({ "X-API-Key": userId });
    await page.goto("/");
    
    const toggleButton = page.getByLabel("Toggle right sidebar").last();
    
    // Toggle off
    await toggleButton.click();
    await page.waitForTimeout(400); // Wait for debounce
    
    // Reload
    await page.reload();
    await page.waitForFunction(() => (window as any).Alpine !== undefined);
    
    // Should still be off
    const rightSidebar = page.locator('[aria-label="Right sidebar"]');
    await expect(rightSidebar).not.toBeVisible();
  });

  test("different paths have isolated state", async ({ page, context }) => {
    // Set state for root path
    await page.request.post("/api/layout", {
      headers: { "Content-Type": "application/json" },
      data: { path: "/", left_width: 500 }
    });
    
    // Set state for /test path
    await page.request.post("/api/layout", {
      headers: { "Content-Type": "application/json" },
      data: { path: "/test", left_width: 600 }
    });
    
    // Verify root path
    await page.goto("/");
    await page.waitForFunction(() => (window as any).Alpine !== undefined);
    await page.waitForTimeout(500);
    
    let leftWidth = await page.evaluate(() => {
      const Alpine = (window as any).Alpine;
      const data = Alpine.$data(document.body);
      return data.leftWidth;
    });
    expect(leftWidth).toBe(500);
    
    // Note: We can't actually test /test path loading without implementing routing
    // This test verifies the API works correctly
  });
});
