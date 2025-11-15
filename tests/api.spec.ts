import { expect, test } from "@playwright/test";

test.describe("API endpoints", () => {
  test("GET /api/layout returns layout state", async ({ request }) => {
    const response = await request.get("/api/layout?path=/");
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("user_id", "default");
    expect(data).toHaveProperty("context_key");
    expect(data).toHaveProperty("settings");
    expect(data.settings).toHaveProperty("left_sidebar_open");
    expect(data.settings).toHaveProperty("right_sidebar_open");
    expect(data.settings).toHaveProperty("left_width");
    expect(data.settings).toHaveProperty("right_width");
    expect(data.settings).toHaveProperty("theme");
  });

  test("POST /api/layout updates layout state", async ({ request }) => {
    // First, get current state
    const getResponse = await request.get("/api/layout?path=/test");
    const initialData = await getResponse.json();
    
    // Update the state
    const updatePayload = {
      path: "/test",
      left_sidebar_open: false,
      left_width: 400
    };
    
    const postResponse = await request.post("/api/layout", {
      headers: { "Content-Type": "application/json" },
      data: updatePayload
    });
    
    expect(postResponse.ok()).toBeTruthy();
    expect(postResponse.status()).toBe(200);
    
    const updatedData = await postResponse.json();
    expect(updatedData.settings.left_sidebar_open).toBe(false);
    expect(updatedData.settings.left_width).toBe(400);
    
    // Verify the change persisted
    const verifyResponse = await request.get("/api/layout?path=/test");
    const verifiedData = await verifyResponse.json();
    expect(verifiedData.settings.left_sidebar_open).toBe(false);
    expect(verifiedData.settings.left_width).toBe(400);
  });

  test("Different paths have different contexts", async ({ request }) => {
    // Update state for path /page1
    await request.post("/api/layout", {
      headers: { "Content-Type": "application/json" },
      data: { path: "/page1", left_width: 500 }
    });
    
    // Update state for path /page2
    await request.post("/api/layout", {
      headers: { "Content-Type": "application/json" },
      data: { path: "/page2", left_width: 600 }
    });
    
    // Verify they are different
    const page1Response = await request.get("/api/layout?path=/page1");
    const page1Data = await page1Response.json();
    expect(page1Data.settings.left_width).toBe(500);
    
    const page2Response = await request.get("/api/layout?path=/page2");
    const page2Data = await page2Response.json();
    expect(page2Data.settings.left_width).toBe(600);
  });

  test("POST with invalid JSON returns 400", async ({ request }) => {
    const response = await request.post("/api/layout", {
      headers: { "Content-Type": "application/json" },
      body: "invalid json"
    });
    
    expect(response.status()).toBe(400);
  });

  test("Unsupported method returns 405 with Allow header", async ({ request }) => {
    const response = await request.delete("/api/layout");
    
    expect(response.status()).toBe(405);
    expect(response.headers()["allow"]).toBe("GET, POST");
  });
});
