import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "tests",
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
};
export default config;
