/**
 * E2E-Tests: M6 – Zielsystem (Testplan Anhang B)
 *
 * TC_GO_E2E_01 – Ziel CRUD im Browser (Erstellen, Bearbeiten, Löschen)
 * TC_GO_E2E_02 – Ladefehler auf der Zielseite → Fehlermeldung + Retry
 *
 * Technik: Einzelner Route-Handler fuer alle api/goals-Routen mit Methoden-Weiche
 * und In-Memory-Array als Datenbasis.
 */

import { expect, test } from "@playwright/test";

type Keyword = { id: string; user_id: string; label: string; color: string; created_at: string };

type Goal = {
  id: string; user_id: string; label: string;
  description: string | null; start_time: string | null; end_time: string | null;
  target_study_time: string | null; created_at: string;
  keywords: Keyword[]; logged_minutes: number; target_minutes: number;
  percentage: number; is_achieved: boolean; remaining_minutes: number; days_remaining: number;
};

function intervalToMinutes(interval: string | null): number {
  if (!interval) return 0;
  const [h = "0", m = "0"] = interval.split(":");
  return Number(h) * 60 + Number(m);
}

// ── TC_GO_E2E_01 ──────────────────────────────────────────────────────────────
test("TC_GO_E2E_01 – Ziel anlegen, bearbeiten und löschen", async ({ page }) => {
  const availableKeywords: Keyword[] = [
    {
      id: "kw-go-1",
      user_id: "e2e-user",
      label: "E2E-Mathe",
      color: "#5500B0",
      created_at: "2026-06-04T08:00:00.000Z",
    },
  ];

  const goals: Goal[] = [];

  const buildGoal = (id: string, body: Record<string, unknown>): Goal => {
    const targetStudyTime = (body.target_study_time as string | null) ?? null;
    const targetMinutes = intervalToMinutes(targetStudyTime);
    const loggedMinutes = 0;
    const keywordIds = (body.keyword_ids as string[] | undefined) ?? [];
    return {
      id,
      user_id: "e2e-user",
      label: (body.label as string) ?? "Unbenanntes Ziel",
      description: (body.description as string | null) ?? null,
      start_time: (body.start_time as string | null) ?? null,
      end_time: (body.end_time as string | null) ?? null,
      target_study_time: targetStudyTime,
      created_at: "2026-06-04T08:00:00.000Z",
      keywords: availableKeywords.filter((k) => keywordIds.includes(k.id)),
      logged_minutes: loggedMinutes,
      target_minutes: targetMinutes,
      percentage: 0,
      is_achieved: false,
      remaining_minutes: targetMinutes,
      days_remaining: 26,
    };
  };

  // Mock: Keywords für GoalForm
  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: availableKeywords, error: null }),
    });
  });

  // Mock: Goals CRUD mit Methoden-Weiche
  await page.route("**/api/goals**", async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());

    if (method === "GET" && url.pathname === "/api/goals") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: goals, error: null }),
      });
    }

    if (method === "POST" && url.pathname === "/api/goals") {
      const body = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
      const created = buildGoal(`goal-${goals.length + 1}`, body);
      goals.unshift(created);
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: created, error: null }),
      });
    }

    const match = url.pathname.match(/^\/api\/goals\/(.+)$/);

    if (method === "PUT" && match) {
      const id = match[1];
      const body = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
      const idx = goals.findIndex((g) => g.id === id);
      if (idx !== -1) goals[idx] = buildGoal(id, body);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: goals[idx] ?? null, error: null }),
      });
    }

    if (method === "DELETE" && match) {
      const id = match[1];
      const idx = goals.findIndex((g) => g.id === id);
      if (idx !== -1) goals.splice(idx, 1);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { success: true }, error: null }),
      });
    }

    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ data: null, error: { code: "UNHANDLED", message: `${method} ${url.pathname} nicht gemockt` } }),
    });
  });

  await page.goto("/goals");
  await expect(page.getByRole("heading", { name: "Meine Ziele" })).toBeVisible();
  await expect(page.getByText("Noch keine Ziele vorhanden.")).toBeVisible();

  // ── Ziel anlegen ─────────────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Formular ausklappen" }).click();
  await page.getByPlaceholder("Bezeichnung").fill("E2E-Klausurvorbereitung");
  await page.getByRole("button", { name: /Hinzuf/i }).click();

  await expect(page.getByText("Noch keine Ziele vorhanden.")).toHaveCount(0);
  await expect(page.getByText("E2E-Klausurvorbereitung")).toBeVisible();

  // ── Ziel bearbeiten ───────────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Formular einklappen" }).click();
  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.getByPlaceholder("Bezeichnung").fill("E2E-Prüfungsvorbereitung");
  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("E2E-Prüfungsvorbereitung")).toBeVisible();

  // ── Ziel löschen ─────────────────────────────────────────────────────────────
  await page.getByRole("button", { name: /L.schen/i }).click();

  await expect(page.getByText("Noch keine Ziele vorhanden.")).toBeVisible();
});

// ── TC_GO_E2E_02 ──────────────────────────────────────────────────────────────
test("TC_GO_E2E_02 – Ladefehler auf der Zielseite zeigt Fehlermeldung und Retry lädt Seite neu", async ({
  page,
}) => {
  let requestCount = 0;

  await page.route("**/api/keywords", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], error: null }),
    });
  });

  await page.route("**/api/goals**", async (route) => {
    requestCount += 1;

    if (requestCount === 1) {
      // Erste Anfrage schlägt fehl
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          data: null,
          error: { code: "FETCH_FAILED", message: "Ziele konnten nicht geladen werden." },
        }),
      });
    }

    // Alle weiteren Anfragen (nach Retry) liefern leere Liste
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], error: null }),
    });
  });

  await page.goto("/goals");

  // Fehlermeldung sichtbar
  await expect(
    page.getByText("Ziele konnten nicht geladen werden.")
  ).toBeVisible({ timeout: 8_000 });

  // Retry-Button klicken
  await page.getByRole("button", { name: "Erneut laden" }).click();

  // Fehlermeldung verschwindet, leere Liste wird angezeigt
  await expect(page.getByText("Ziele konnten nicht geladen werden.")).toHaveCount(0);
  await expect(page.getByText("Noch keine Ziele vorhanden.")).toBeVisible({ timeout: 5_000 });
});
