import { expect, test } from "@playwright/test";

type Keyword = {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
};

type Goal = {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  target_study_time: string | null;
  created_at: string;
  keywords: Keyword[];
  logged_minutes: number;
  target_minutes: number;
  percentage: number;
  is_achieved: boolean;
  remaining_minutes: number;
  days_remaining: number;
};

function intervalToMinutes(interval: string | null): number {
  if (!interval) {
    return 0;
  }

  const [hours = "0", minutes = "0"] = interval.split(":");
  return Number(hours) * 60 + Number(minutes);
}

test("creates, edits and deletes a goal through the browser UI", async ({ page }) => {
  const availableKeywords: Keyword[] = [
    {
      id: "keyword-1",
      user_id: "playwright-user",
      label: "Mathematik",
      color: "#7700F4",
      created_at: "2026-04-20T08:00:00.000Z",
    },
  ];

  const goals: Goal[] = [];

  const buildGoal = (goalId: string, body: Record<string, unknown>): Goal => {
    const targetStudyTime = (body.target_study_time as string | null) ?? null;
    const targetMinutes = intervalToMinutes(targetStudyTime);
    const loggedMinutes = 60;
    const keywordIds = (body.keyword_ids as string[] | undefined) ?? [];

    return {
      id: goalId,
      user_id: "playwright-user",
      label: (body.label as string) ?? "Unbenanntes Ziel",
      description: (body.description as string | null) ?? null,
      start_time: (body.start_time as string | null) ?? null,
      end_time: (body.end_time as string | null) ?? null,
      target_study_time: targetStudyTime,
      created_at: "2026-04-20T08:00:00.000Z",
      keywords: availableKeywords.filter((keyword) => keywordIds.includes(keyword.id)),
      logged_minutes: loggedMinutes,
      target_minutes: targetMinutes,
      percentage:
        targetMinutes > 0 ? Math.round((loggedMinutes / targetMinutes) * 100) : 0,
      is_achieved: targetMinutes > 0 ? loggedMinutes >= targetMinutes : false,
      remaining_minutes: targetMinutes > 0 ? Math.max(targetMinutes - loggedMinutes, 0) : 0,
      days_remaining: 7,
    };
  };

  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: availableKeywords,
        error: null,
      }),
    });
  });

  await page.route("**/api/goals**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (method === "GET" && url.pathname === "/api/goals") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: goals,
          error: null,
        }),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/goals") {
      const body = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
      const createdGoal = buildGoal(`goal-${goals.length + 1}`, body);

      goals.unshift(createdGoal);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: createdGoal,
          error: null,
        }),
      });
      return;
    }

    const match = url.pathname.match(/^\/api\/goals\/(.+)$/);

    if (method === "PUT" && match) {
      const goalId = match[1];
      const body = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
      const index = goals.findIndex((goal) => goal.id === goalId);

      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            data: null,
            error: {
              code: "NOT_FOUND",
              message: "Ziel wurde nicht gefunden.",
            },
          }),
        });
        return;
      }

      goals[index] = buildGoal(goalId, body);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: goals[index],
          error: null,
        }),
      });
      return;
    }

    if (method === "DELETE" && match) {
      const goalId = match[1];
      const index = goals.findIndex((goal) => goal.id === goalId);

      if (index !== -1) {
        goals.splice(index, 1);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            success: true,
          },
          error: null,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: {
          code: "UNHANDLED_GOAL_TEST_ROUTE",
          message: `${method} ${url.pathname} wurde im Test nicht gemockt.`,
        },
      }),
    });
  });

  await page.goto("/goals");

  await expect(page).toHaveURL(/\/goals$/);
  await expect(
    page.getByRole("heading", { name: "Meine Ziele" }),
  ).toBeVisible();
  await expect(page.getByText("Noch keine Ziele vorhanden.")).toBeVisible();

  await page.getByRole("button", { name: "Formular ausklappen" }).click();
  await page.getByPlaceholder("Bezeichnung").fill("Mathe wiederholen");
  await page.getByPlaceholder("Beschreibung (optional)").fill("Analysis Kapitel 4");
  await page.getByPlaceholder("Keine").fill("4");
  await page.getByRole("button", { name: "Mathematik" }).click();
  await page.getByRole("button", { name: /Hinzuf/i }).click();

  await expect(page.getByText("Noch keine Ziele vorhanden.")).toHaveCount(0);
  await expect(page.getByText("Mathe wiederholen")).toBeVisible();
  await expect(page.getByText("Analysis Kapitel 4")).toBeVisible();

  await page.getByRole("button", { name: "Formular einklappen" }).click();
  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.getByPlaceholder("Bezeichnung").fill("Mathe Prüfung");
  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("Mathe Prüfung")).toBeVisible();

  await page.getByRole("button", { name: /L.schen/i }).click();

  await expect(page.getByText("Noch keine Ziele vorhanden.")).toBeVisible();

  await page.getByRole("link", { name: /Zur/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("shows a loading error on the goals page and recovers via retry", async ({ page }) => {
  let goalsRequestCount = 0;

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

  await page.route("**/api/goals**", async (route) => {
    goalsRequestCount += 1;

    if (goalsRequestCount === 1) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          data: null,
          error: {
            code: "FETCH_FAILED",
            message: "Ziele konnten nicht geladen werden.",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        error: null,
      }),
    });
  });

  await page.goto("/goals");

  await expect(
    page.getByText("Ziele konnten nicht geladen werden."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Erneut laden" }).click();

  await expect(page.getByText("Ziele konnten nicht geladen werden.")).toHaveCount(0);
  await expect(page.getByText("Noch keine Ziele vorhanden.")).toBeVisible();
});
