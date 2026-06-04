/**
 * E2E-Tests: M4 – Kalenderansicht (Testplan Anhang B)
 *
 * TC_KA_07 – Vollständiger Kalender-E2E-Ablauf im Browser:
 *             Event sichtbar, Detailansicht öffnet, Bearbeitungsmodus erreichbar
 *
 * Route-Muster "...api/events..." (doppelter Stern beidseitig) matcht alle
 * Events-Endpunkte inklusive Query-Strings.
 */

import { expect, test } from "@playwright/test";
import calendarEventFixture from "../fixtures/calendar/calendar-event.json";

// ── TC_KA_07 ──────────────────────────────────────────────────────────────────
test("TC_KA_07 – Kalender lädt Events, Detailansicht öffnet und Bearbeitungsmodus ist erreichbar", async ({
  page,
}) => {
  // Datum auf heute setzen damit das Event in der Standard-Wochenansicht sichtbar ist
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 90);

  const calendarEvent = {
    ...calendarEventFixture,
    label: "TC-KA-07 Lernblock",
    description: "Automatisierter E2E-Test",
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };

  // Mock: alle Events-Anfragen (inklusive Query-Parameter)
  await page.route("**/api/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [calendarEvent], error: null }),
    });
  });

  // Mock: Keywords (für EventForm beim Bearbeiten)
  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: calendarEvent.keywords, error: null }),
    });
  });

  await page.goto("/calendar");

  // Kalender-Seite und Grid rendern
  await expect(
    page.getByRole("heading", { name: "Mein Lernkalender" })
  ).toBeVisible({ timeout: 10_000 });

  // Event-Label im Kalender sichtbar
  await expect(page.getByText(calendarEvent.label).first()).toBeVisible({
    timeout: 10_000,
  });

  // Klick auf Event → Detailansicht öffnet
  await page.getByText(calendarEvent.label).first().click();

  await expect(
    page.getByRole("heading", { name: calendarEvent.label })
  ).toBeVisible({ timeout: 5_000 });

  // "Bearbeiten"-Button sichtbar → Bearbeitungsmodus erreichbar
  await expect(page.getByRole("button", { name: "Bearbeiten" })).toBeVisible();
  await page.getByRole("button", { name: "Bearbeiten" }).click();

  // EventForm im Bearbeitungsmodus geladen
  await expect(
    page.getByText("Lernzeit bearbeiten")
  ).toBeVisible({ timeout: 5_000 });
});
