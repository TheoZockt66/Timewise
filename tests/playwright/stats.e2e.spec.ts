/**
 * E2E-Tests: M5 – Datenvisualisierung (Testplan Anhang B)
 *
 * TC_ST_08 – Vollständiger Statistik-E2E-Ablauf im Browser:
 *             Aggregationsanfrage mit korrekten Parametern,
 *             Wechsel zur Tagesansicht, Charts werden angezeigt
 *
 * Routen-Reihenfolge: aggregate-Route zuerst registrieren, damit sie in der
 * LIFO-Verarbeitung von Playwright vor dem allgemeinen events-Handler greift.
 */

import { expect, test } from "@playwright/test";

// ── TC_ST_08 ──────────────────────────────────────────────────────────────────
test("TC_ST_08 – Statistikseite lädt Aggregationsdaten und reagiert auf Filterwechsel", async ({
  page,
}) => {
  const today = new Date();
  const eventStart = new Date(today);
  eventStart.setHours(9, 0, 0, 0);

  const events = [
    {
      id: "ev-st-1",
      user_id: "e2e-user",
      label: "TC-ST-08 Lernblock",
      description: null,
      start_time: eventStart.toISOString(),
      end_time: new Date(eventStart.getTime() + 90 * 60_000).toISOString(),
      created_at: "2026-06-04T08:00:00.000Z",
      duration_minutes: 90,
      keywords: [{ id: "kw-1", label: "Mathematik", color: "#7700F4" }],
    },
  ];

  const aggregateData = [
    {
      period: "KW 23",
      total_minutes: 90,
      by_keyword: [
        { keyword_id: "kw-1", keyword_label: "Mathematik", keyword_color: "#7700F4", minutes: 90 },
      ],
    },
  ];

  const aggregateRequests: string[] = [];

  // Mock: Keywords-Liste
  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [{ id: "kw-1", label: "Mathematik", color: "#7700F4" }], error: null }),
    });
  });

  // Mock: rohe Events-Liste zuerst registrieren (allgemeinerer Handler)
  await page.route("**/api/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: events, error: null }),
    });
  });

  // Mock: Aggregate-Endpoint ZULETZT registrieren – Playwright verarbeitet Routen
  // in LIFO-Reihenfolge, also wird dieser spezifischere Handler zuerst geprueft.
  await page.route("**/api/events/aggregate**", async (route) => {
    aggregateRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: aggregateData, error: null }),
    });
  });

  await page.goto("/stats");

  // Überschrift und Statistik-Übersicht sichtbar
  await expect(page.getByRole("heading", { name: "Statistiken" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("Statistikübersicht")).toBeVisible({
    timeout: 8_000,
  });

  // Aggregationsdaten geladen → Gesamtzeit angezeigt (90 Minuten = "1h 30min")
  await expect(page.getByText(/1h 30min|90/i).first()).toBeVisible({
    timeout: 8_000,
  });

  // Chart-Bereiche sichtbar
  await expect(page.getByText("Lernzeit nach Keywords")).toBeVisible();
  await expect(page.getByText("Lernzeit im Zeitverlauf")).toBeVisible();

  // ── Filterwechsel: Woche → Tag ────────────────────────────────────────────
  const tagButton = page.getByRole("button", { name: "Tag" });
  await expect(tagButton).toBeVisible();
  await tagButton.click();

  // Neue Aggregationsanfrage mit granularity=day soll gestellt werden
  await expect.poll(
    () => aggregateRequests.some((url) => url.includes("granularity=day")),
    { timeout: 5_000 }
  ).toBe(true);

  // Tagesansicht zeigt Stunden-Timeline
  await expect(page.getByText("00:00")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("23:00")).toBeVisible({ timeout: 5_000 });
});
