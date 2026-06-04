/**
 * E2E-Tests: M2 – Keyword-System (Testplan Anhang B)
 *
 * TC_KW_E2E_01 – Keyword CRUD im Browser (Erstellen, Bearbeiten, Löschen)
 * TC_KW_E2E_02 – Keyword-Erstellung schlägt fehl → Fehlermeldung im UI
 *
 * Technik: Ein einzelner page.route-Handler prueft HTTP-Methode und Pfad
 * und pflegt ein lokales In-Memory-Array als Datenbasis des Mocks.
 */

import { expect, test } from "@playwright/test";

type Keyword = {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
};

// ── TC_KW_E2E_01 ──────────────────────────────────────────────────────────────
test("TC_KW_E2E_01 – Keyword anlegen, bearbeiten und löschen", async ({ page }) => {
  const keywords: Keyword[] = [];

  // Einzelner Handler für alle /api/keywords-Routen mit Methoden-Weiche
  await page.route("**/api/keywords**", async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());

    if (method === "GET" && url.pathname === "/api/keywords") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: keywords, error: null }),
      });
    }

    if (method === "POST" && url.pathname === "/api/keywords") {
      const body = JSON.parse(req.postData() ?? "{}") as Partial<Keyword>;
      const created: Keyword = {
        id: `kw-${keywords.length + 1}`,
        user_id: "e2e-user",
        label: body.label ?? "Unbenannt",
        color: body.color ?? "#000000",
        created_at: "2026-06-04T08:00:00.000Z",
      };
      keywords.push(created);
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: created, error: null }),
      });
    }

    const match = url.pathname.match(/^\/api\/keywords\/(.+)$/);

    if (method === "PUT" && match) {
      const id = match[1];
      const body = JSON.parse(req.postData() ?? "{}") as Partial<Keyword>;
      const kw = keywords.find((k) => k.id === id);
      if (kw) {
        kw.label = body.label ?? kw.label;
        kw.color = body.color ?? kw.color;
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: kw ?? null, error: null }),
      });
    }

    if (method === "DELETE" && match) {
      const id = match[1];
      const idx = keywords.findIndex((k) => k.id === id);
      if (idx !== -1) keywords.splice(idx, 1);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null, error: null }),
      });
    }

    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: { code: "UNHANDLED_ROUTE", message: `${method} ${url.pathname} nicht gemockt` },
      }),
    });
  });

  await page.goto("/keywords");
  await expect(page.getByRole("heading", { name: "Meine Keywords" })).toBeVisible();
  await expect(page.getByText("Noch keine Keywords vorhanden")).toBeVisible();

  // ── Keyword anlegen ──────────────────────────────────────────────────────────
  await page.getByPlaceholder("Neues Keyword").fill("E2E-Mathe");
  await page.getByRole("button", { name: /Hinzuf/i }).click();

  await expect(page.getByText("Noch keine Keywords vorhanden")).toHaveCount(0);
  await expect(page.getByText("E2E-Mathe")).toBeVisible();

  // ── Keyword bearbeiten ───────────────────────────────────────────────────────
  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.locator('input:not([type="color"])').nth(1).fill("E2E-Physik");
  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("E2E-Physik")).toBeVisible();

  // ── Keyword löschen ──────────────────────────────────────────────────────────
  await page.getByRole("button", { name: /L.schen/i }).click();

  await expect(page.getByText("Noch keine Keywords vorhanden")).toBeVisible();
});

// ── TC_KW_E2E_02 ──────────────────────────────────────────────────────────────
test("TC_KW_E2E_02 – Keyword-Erstellung schlägt fehl, Fehlermeldung im UI sichtbar", async ({
  page,
}) => {
  await page.route("**/api/keywords**", async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());

    if (method === "GET" && url.pathname === "/api/keywords") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], error: null }),
      });
    }

    if (method === "POST" && url.pathname === "/api/keywords") {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Label darf maximal 50 Zeichen lang sein" },
        }),
      });
    }

    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ data: null, error: { code: "UNHANDLED_ROUTE", message: "nicht gemockt" } }),
    });
  });

  await page.goto("/keywords");

  await page.getByPlaceholder("Neues Keyword").fill("Valides Label für den Test");
  await page.getByRole("button", { name: /Hinzuf/i }).click();

  // Fehlermeldung vom Backend sichtbar
  await expect(
    page.getByText("Label darf maximal 50 Zeichen lang sein")
  ).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("Noch keine Keywords vorhanden")).toBeVisible();
});
