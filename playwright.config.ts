import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const retries = (() => {
  const raw = process.env.PLAYWRIGHT_RETRIES;
  if (raw === undefined) {
    return isCI ? 2 : 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : isCI ? 2 : 0;
})();

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    actionTimeout: 5_000,
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retry-with-video",
  },
  webServer: {
    command: "bun index.ts",
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
