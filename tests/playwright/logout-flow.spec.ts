import { expect, test } from "@playwright/test";

test("logs the user out from the dashboard start page", async ({ page }) => {
  let logoutCalled = false;

  await page.route("**/api/auth/logout", async (route) => {
    logoutCalled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: null,
      }),
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Abmelden" }).click();

  await expect.poll(() => logoutCalled).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("stays on the dashboard when the logout request fails", async ({ page }) => {
  await page.route("**/api/auth/logout", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Abmelden" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Abmelden" })).toBeVisible();
});
