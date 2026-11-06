import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../tests/browser",
  testMatch: [
    "detail-modes.spec.ts",
    "accessibility.spec.ts",
    "update-guards.spec.ts",
    "help-support.spec.ts",
  ],
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4176",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4176 --strictPort",
    url: "http://127.0.0.1:4176",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
