import { expect, test } from "@playwright/test";

type Keyword = {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
};

test("creates, edits and deletes a keyword through the browser UI", async ({ page }) => {
  const keywords: Keyword[] = [];

  await page.route("**/api/keywords**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (method === "GET" && url.pathname === "/api/keywords") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: keywords,
          error: null,
        }),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/keywords") {
      const body = JSON.parse(request.postData() ?? "{}") as Partial<Keyword>;

      const createdKeyword: Keyword = {
        id: `keyword-${keywords.length + 1}`,
        user_id: "playwright-user",
        label: body.label ?? "Unbenannt",
        color: body.color ?? "#000000",
        created_at: "2026-04-20T08:00:00.000Z",
      };

      keywords.push(createdKeyword);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: createdKeyword,
          error: null,
        }),
      });
      return;
    }

    const match = url.pathname.match(/^\/api\/keywords\/(.+)$/);

    if (method === "PUT" && match) {
      const keywordId = match[1];
      const body = JSON.parse(request.postData() ?? "{}") as Partial<Keyword>;
      const keyword = keywords.find((entry) => entry.id === keywordId);

      if (!keyword) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            data: null,
            error: {
              code: "NOT_FOUND",
              message: "Keyword wurde nicht gefunden.",
            },
          }),
        });
        return;
      }

      keyword.label = body.label ?? keyword.label;
      keyword.color = body.color ?? keyword.color;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: keyword,
          error: null,
        }),
      });
      return;
    }

    if (method === "DELETE" && match) {
      const keywordId = match[1];
      const index = keywords.findIndex((keyword) => keyword.id === keywordId);

      if (index !== -1) {
        keywords.splice(index, 1);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: null,
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
          code: "UNHANDLED_KEYWORD_TEST_ROUTE",
          message: `${method} ${url.pathname} wurde im Test nicht gemockt.`,
        },
      }),
    });
  });

  await page.goto("/keywords");

  await expect(page).toHaveURL(/\/keywords$/);
  await expect(
    page.getByRole("heading", { name: "Meine Keywords" }),
  ).toBeVisible();
  await expect(page.getByText("Noch keine Keywords vorhanden")).toBeVisible();

  await page.getByPlaceholder("Neues Keyword").fill("Mathematik");
  await page.getByRole("button", { name: /Hinzuf/i }).click();

  await expect(page.getByText("Noch keine Keywords vorhanden")).toHaveCount(0);
  await expect(page.getByText("Mathematik")).toBeVisible();

  await page.getByRole("button", { name: "Bearbeiten" }).click();
  await page.locator('input:not([type="color"])').nth(1).fill("Mathematik LK");
  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("Mathematik LK")).toBeVisible();

  await page.getByRole("button", { name: /L.schen/i }).click();

  await expect(page.getByText("Noch keine Keywords vorhanden")).toBeVisible();

  await page.getByRole("link", { name: /Zur/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();
});

test("shows the API error when a keyword cannot be created", async ({ page }) => {
  await page.route("**/api/keywords**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (method === "GET" && url.pathname === "/api/keywords") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          error: null,
        }),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/api/keywords") {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          data: null,
          error: {
            code: "DUPLICATE_LABEL",
            message: "Keyword existiert bereits.",
          },
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
          code: "UNHANDLED_KEYWORD_TEST_ROUTE",
          message: `${method} ${url.pathname} wurde im Test nicht gemockt.`,
        },
      }),
    });
  });

  await page.goto("/keywords");

  await page.getByPlaceholder("Neues Keyword").fill("Mathematik");
  await page.getByRole("button", { name: /Hinzuf/i }).click();

  await expect(page.getByText("Keyword existiert bereits.")).toBeVisible();
  await expect(page.getByText("Noch keine Keywords vorhanden")).toBeVisible();
});
