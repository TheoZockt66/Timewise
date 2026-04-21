import { expect, test } from "@playwright/test";
import calendarEventFixture from "../fixtures/calendar/calendar-event.json";

test("navigates from the dashboard start page to the calendar page and back", async ({ page }) => {
  const start = new Date();
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 90);

  const calendarEvent = {
    ...calendarEventFixture,
    label: "Playwright Fokusblock",
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };

  await page.route("**/api/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [calendarEvent],
        error: null,
      }),
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();
  await expect(page.getByAltText("Timewise Logo")).toBeVisible();

  await page.locator('a[href="/calendar"]').click();

  await expect(page).toHaveURL(/\/calendar$/);
  await expect(
    page.getByRole("heading", { name: "Mein Lernkalender" }),
  ).toBeVisible();
  await expect(page.getByText("Lade Termine...")).toHaveCount(0);
  await expect(page.getByText(calendarEvent.label).first()).toBeVisible();
  await expect(page.getByAltText("Timewise Logo")).toBeVisible();

  await page.getByRole("link", { name: /Zur/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();
});
