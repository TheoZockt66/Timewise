/**
 * E2E-Tests: M1 – Auth & Benutzerverwaltung
 *
 * Abgedeckte Testfälle aus dem Testplan:
 *   TC_AU_E2E_01 – Login über Browser → Dashboard sichtbar
 *   TC_AU_E2E_02 – Falsche Credentials → Fehlermeldung sichtbar
 *   TC_AU_E2E_03 – Registrierung über Browser → Weiterleitung
 *   TC_AU_E2E_04 – Passwort-Reset-Formular → Bestätigungsmeldung
 *   TC_AU_E2E_05 – Logout über Dashboard → Weiterleitung zu Login-Seite
 *
 * Technik:
 *   - E2E_BYPASS_AUTH=1 ist im Playwright-Config gesetzt → Middleware lässt
 *     alle Seiten ohne echte Supabase-Session durch.
 *   - /api/auth/* werden mit page.route() gemockt, damit kein echter
 *     Supabase-Account benötigt wird.
 */

import { test, expect } from "@playwright/test";
import { mockApi, mockApiError } from "./helpers/api-mock";

// ── TC_AU_E2E_01 ──────────────────────────────────────────────────────────────
test("TC_AU_E2E_01 – erfolgreicher Login zeigt das Dashboard", async ({ page }) => {
  // Mock: Login-API antwortet mit einem gültigen User
  await mockApi(page, "**/api/auth/login", {
    user: { id: "user-1", email: "user@example.com", created_at: "2026-01-01T00:00:00Z" },
    session: { access_token: "fake-token", refresh_token: "fake-refresh", expires_at: 9999999999 },
  });

  await page.goto("/login");

  await page.fill("#email", "user@example.com");
  await page.fill("#password", "Passwort12!");
  await page.click('button[type="submit"]');

  // App führt router.push("/") aus → Dashboard-Startseite wird geladen
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await expect(page.getByText("Dein Arbeitsbereich")).toBeVisible();
});

// ── TC_AU_E2E_02 ──────────────────────────────────────────────────────────────
test("TC_AU_E2E_02 – falsche Credentials zeigen Fehlermeldung ohne Redirect", async ({ page }) => {
  // Mock: Login-API antwortet mit 401 INVALID_CREDENTIALS
  await mockApiError(
    page,
    "**/api/auth/login",
    "INVALID_CREDENTIALS",
    "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
    401
  );

  await page.goto("/login");

  await page.fill("#email", "user@example.com");
  await page.fill("#password", "FalschesPasswort");
  await page.click('button[type="submit"]');

  // Fehlermeldung sichtbar, Seite bleibt auf /login
  await expect(
    page.getByText("E-Mail oder Passwort ist falsch. Bitte versuche es erneut.")
  ).toBeVisible();
  await expect(page).toHaveURL("/login");
});

// ── TC_AU_E2E_03 ──────────────────────────────────────────────────────────────
test("TC_AU_E2E_03 – erfolgreiche Registrierung leitet zum Dashboard weiter", async ({ page }) => {
  // Mock: Register-API antwortet mit 201 Created
  await mockApi(
    page,
    "**/api/auth/register",
    {
      user: { id: "user-2", email: "new@example.com", created_at: "2026-01-01T00:00:00Z" },
      session: { access_token: "fake-token", refresh_token: "fake-refresh", expires_at: 9999999999 },
    },
    201
  );

  await page.goto("/register");

  await page.fill("#email", "new@example.com");
  await page.fill("#password", "Passwort12!");
  await page.fill("#confirmPassword", "Passwort12!");
  await page.click('button[type="submit"]');

  // App führt router.push("/") aus → Dashboard
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await expect(page.getByText("Dein Arbeitsbereich")).toBeVisible();
});

// ── TC_AU_E2E_04 ──────────────────────────────────────────────────────────────
test("TC_AU_E2E_04 – Passwort-Reset-Formular zeigt Bestätigungsmeldung", async ({ page }) => {
  // Mock: Reset-API antwortet mit 200 (API gibt immer Erfolg zurück)
  await mockApi(page, "**/api/auth/reset", { success: true });

  await page.goto("/reset-password");

  await page.fill("#email", "user@example.com");
  await page.click('button[type="submit"]');

  // Bestätigungsmeldung sichtbar (isSubmitted → true im State)
  // Die Reset-Seite zeigt nach dem Absenden den Text "Wir haben eine E-Mail an ... gesendet."
  await expect(page.getByText(/Wir haben eine E-Mail/i)).toBeVisible({
    timeout: 5_000,
  });
});

// ── TC_AU_E2E_05 ──────────────────────────────────────────────────────────────
test("TC_AU_E2E_05 – Logout-Button leitet zur Login-Seite weiter", async ({ page }) => {
  // Mock: Logout-API antwortet mit 204 No Content
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 204, body: "" })
  );

  // Dashboard ist mit E2E_BYPASS_AUTH=1 direkt erreichbar
  await page.goto("/");
  await expect(page.getByText("Dein Arbeitsbereich")).toBeVisible();

  await page.click('button:has-text("Abmelden")');

  // App führt router.push("/login") aus
  await expect(page).toHaveURL("/login", { timeout: 10_000 });
});
