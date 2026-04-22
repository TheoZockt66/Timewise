import { expect, test } from "@playwright/test";

test("logs a user in through the public auth page", async ({ page }) => {
  let loginPayload: { email: string; password: string } | null = null;

  await page.route("**/api/auth/login", async (route) => {
    loginPayload = JSON.parse(route.request().postData() ?? "{}") as {
      email: string;
      password: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user-1",
            email: loginPayload.email,
            created_at: "2026-04-20T08:00:00.000Z",
          },
          session: {
            access_token: "token",
            refresh_token: "refresh-token",
            expires_at: 1_800_000_000,
          },
        },
        error: null,
      }),
    });
  });

  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  await page.getByLabel("E-Mail").fill("student@example.com");
  await page.locator("#password").fill("sicherespasswort");
  await page.getByRole("button", { name: "Login" }).click();

  await expect.poll(() => loginPayload).not.toBeNull();
  expect(loginPayload).toEqual({
    email: "student@example.com",
    password: "sicherespasswort",
  });

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();
});

test("shows the API error when login credentials are invalid", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
        },
      }),
    });
  });

  await page.goto("/login");

  await page.getByLabel("E-Mail").fill("student@example.com");
  await page.locator("#password").fill("falschespasswort");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Anmeldung fehlgeschlagen. Bitte versuche es erneut."),
  ).toBeVisible();
});

test("registers a user through the public auth page", async ({ page }) => {
  let registerPayload: { email: string; password: string } | null = null;

  await page.route("**/api/auth/register", async (route) => {
    registerPayload = JSON.parse(route.request().postData() ?? "{}") as {
      email: string;
      password: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user-2",
            email: registerPayload.email,
            created_at: "2026-04-20T08:00:00.000Z",
          },
          session: {
            access_token: "token",
            refresh_token: "refresh-token",
            expires_at: 1_800_000_000,
          },
        },
        error: null,
      }),
    });
  });

  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: "Registrieren" }),
  ).toBeVisible();

  await page.getByLabel("E-Mail").fill("neu@example.com");
  await page.locator("#password").fill("starkespasswort");
  await page.locator("#confirmPassword").fill("starkespasswort");
  await page.getByRole("button", { name: "Registrieren" }).click();

  await expect.poll(() => registerPayload).not.toBeNull();
  expect(registerPayload).toEqual({
    email: "neu@example.com",
    password: "starkespasswort",
  });

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Dein Arbeitsbereich" }),
  ).toBeVisible();
});

test("blocks registration when the password confirmation does not match", async ({ page }) => {
  let registerCalled = false;

  await page.route("**/api/auth/register", async (route) => {
    registerCalled = true;
    await route.abort();
  });

  await page.goto("/register");

  await page.getByLabel("E-Mail").fill("neu@example.com");
  await page.locator("#password").fill("starkespasswort");
  await page.locator("#confirmPassword").fill("anderespasswort");
  await page.getByRole("button", { name: "Registrieren" }).click();

  await expect(
    page.getByText("Die Passwörter stimmen nicht überein."),
  ).toBeVisible();
  expect(registerCalled).toBe(false);
});

test("shows the password reset confirmation after submitting the form", async ({ page }) => {
  let resetPayload: { email: string } | null = null;

  await page.route("**/api/auth/reset", async (route) => {
    resetPayload = JSON.parse(route.request().postData() ?? "{}") as {
      email: string;
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: null,
      }),
    });
  });

  await page.goto("/reset-password");

  await expect(
    page.getByRole("heading", { name: "Passwort vergessen?" }),
  ).toBeVisible();

  await page.getByLabel("E-Mail").fill("reset@example.com");
  await page.getByRole("button", { name: "Link senden" }).click();

  await expect.poll(() => resetPayload).not.toBeNull();
  expect(resetPayload).toEqual({
    email: "reset@example.com",
  });

  await expect(
    page.getByRole("heading", { name: "E-Mail gesendet" }),
  ).toBeVisible();
  await expect(page.getByText("reset@example.com")).toBeVisible();
});
