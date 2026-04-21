import { expect, test } from "@playwright/test";

test("renders the stats overview and switches to the day timeline", async ({ page }) => {
  const aggregateRequests: string[] = [];

  const today = new Date();
  const firstEventStart = new Date(today);
  firstEventStart.setHours(9, 0, 0, 0);

  const secondEventStart = new Date(today);
  secondEventStart.setHours(13, 0, 0, 0);

  const events = [
    {
      id: "event-1",
      user_id: "playwright-user",
      label: "Matheblock",
      description: "Analysis",
      start_time: firstEventStart.toISOString(),
      end_time: new Date(firstEventStart.getTime() + 90 * 60 * 1000).toISOString(),
      created_at: "2026-04-20T08:00:00.000Z",
      duration_minutes: 90,
      keywords: [
        {
          id: "keyword-1",
          label: "Mathematik",
          color: "#7700F4",
        },
      ],
    },
    {
      id: "event-2",
      user_id: "playwright-user",
      label: "Mathe Übung",
      description: "Kurvendiskussion",
      start_time: secondEventStart.toISOString(),
      end_time: new Date(secondEventStart.getTime() + 60 * 60 * 1000).toISOString(),
      created_at: "2026-04-20T08:00:00.000Z",
      duration_minutes: 60,
      keywords: [
        {
          id: "keyword-1",
          label: "Mathematik",
          color: "#7700F4",
        },
      ],
    },
  ];

  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "keyword-1",
            label: "Mathematik",
            color: "#7700F4",
          },
        ],
        error: null,
      }),
    });
  });

  await page.route("**/api/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: events,
        error: null,
      }),
    });
  });

  await page.route("**/api/events/aggregate**", async (route) => {
    aggregateRequests.push(route.request().url());

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            period: "KW 17",
            total_minutes: 150,
            by_keyword: [
              {
                keyword_id: "keyword-1",
                keyword_label: "Mathematik",
                keyword_color: "#7700F4",
                minutes: 150,
              },
            ],
          },
        ],
        error: null,
      }),
    });
  });

  await page.goto("/stats");

  await expect(page).toHaveURL(/\/stats$/);
  await expect(
    page.getByRole("heading", { name: "Statistiken" }),
  ).toBeVisible();
  await expect(page.getByText("Statistikübersicht")).toBeVisible();
  await expect(page.getByText("2h 30min")).toBeVisible();
  await expect(page.getByTitle("Mathematik")).toBeVisible();
  await expect(page.getByText("Lernzeit nach Keywords")).toBeVisible();
  await expect(page.getByText("Lernzeit im Zeitverlauf")).toBeVisible();

  await page.getByRole("button", { name: "Tag" }).click();

  await expect.poll(
    () =>
      aggregateRequests.some((requestUrl) =>
        requestUrl.includes("granularity=day"),
      ),
  ).toBe(true);
  await expect(page.getByText("00:00")).toBeVisible();
  await expect(page.getByText("23:00")).toBeVisible();
});

test("shows the empty state when no statistics data is available", async ({ page }) => {
  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        error: null,
      }),
    });
  });

  await page.route("**/api/events/aggregate**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        error: null,
      }),
    });
  });

  await page.route("**/api/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        error: null,
      }),
    });
  });

  await page.goto("/stats");

  await expect(
    page.getByRole("heading", { name: "Statistiken" }),
  ).toBeVisible();
  await expect(page.getByText("Statistikübersicht")).toBeVisible();
  await expect(page.getByText("Alle Keywords ausgewählt")).toBeVisible();
  await expect(page.getByText("Keine Daten vorhanden")).toBeVisible();
});
