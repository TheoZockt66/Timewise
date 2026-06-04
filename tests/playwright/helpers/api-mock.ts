import type { Page } from "@playwright/test";

/**
 * Mockt eine API-Route mit einer erfolgreichen Antwort (data-Wrapper).
 * Alle Requests an `urlPattern` werden mit den gegebenen Daten beantwortet.
 */
export async function mockApi(
  page: Page,
  urlPattern: string,
  data: unknown,
  status = 200
): Promise<void> {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ data, error: null }),
    })
  );
}

/**
 * Mockt eine API-Route mit einer Fehlerantwort.
 */
export async function mockApiError(
  page: Page,
  urlPattern: string,
  code: string,
  message: string,
  status = 400
): Promise<void> {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ data: null, error: { code, message } }),
    })
  );
}
