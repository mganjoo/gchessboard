import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  testDir: "tests",
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 3 : undefined,
  use: {
    baseURL: "http://localhost:8000",
    trace: "on-first-retry",
  },
};
export default config;
