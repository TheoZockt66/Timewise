import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E-Konfiguration für Timewise.
 *
 * Wichtig: Der Next.js-Dev-Server wird mit E2E_BYPASS_AUTH=1 gestartet.
 * Dadurch überspringt die Middleware alle Supabase-Auth-Prüfungen,
 * sodass alle Seiten ohne echte Session zugänglich sind.
 *
 * API-Calls (/api/*) werden in den Tests per page.route() gemockt,
 * da die Route-Handler weiterhin Auth prüfen.
 *
 * Lokale Ausführung: npm run test:e2e
 * Mit UI:            npm run test:e2e:ui
 */
export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    timeout: 120_000,
    // Lokal: bestehenden Server wiederverwenden; in CI immer neu starten
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      E2E_BYPASS_AUTH: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
