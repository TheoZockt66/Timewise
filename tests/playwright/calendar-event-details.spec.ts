import { expect, test } from "@playwright/test";
import calendarEventFixture from "../fixtures/calendar/calendar-event.json";

test("opens event details in the calendar and switches into edit mode", async ({ page }) => {
  const start = new Date();
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 90);

  const calendarEvent = {
    ...calendarEventFixture,
    label: "Playwright Fokusblock",
    description: "Mechanik Wiederholung",
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

  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: calendarEvent.keywords,
        error: null,
      }),
    });
  });

  await page.goto("/calendar");

  await expect(
    page.getByRole("heading", { name: "Mein Lernkalender" }),
  ).toBeVisible();
  await expect(page.getByText(calendarEvent.label).first()).toBeVisible();

  await page.getByText(calendarEvent.label).first().click();

  await expect(
    page.getByRole("heading", { name: calendarEvent.label }),
  ).toBeVisible();
  await expect(page.getByText("Mechanik Wiederholung")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bearbeiten" })).toBeVisible();

  await page.getByRole("button", { name: "Bearbeiten" }).click();

  await expect(page.getByText("Lernzeit bearbeiten")).toBeVisible();
  await expect(page.locator("#event-label")).toHaveValue(calendarEvent.label);

  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: calendarEvent.label }),
  ).toBeVisible();
});
