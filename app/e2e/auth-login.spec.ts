import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers";

test.describe("Login", () => {
  test("rejects wrong password", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.getByTestId("login-username").fill("manager1");
    await page.getByTestId("login-password").fill("wrong-password");
    await page.getByTestId("login-submit").click();
    await expect(page.getByText("Invalid username or password")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("login-submit")).toBeVisible();
  });

  test("manager can sign in", async ({ page }) => {
    await loginAsManager(page);
    await expect(page.getByTestId("page-title")).toHaveText("Dashboard");
  });

  test("login submit is disabled while connecting (no double-submit)", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/");
    await page.getByTestId("login-username").fill("manager1");
    await page.getByTestId("login-password").fill("1234");
    const patientsResponse = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.url().includes("/api/patients") &&
        r.url().includes("houseId=") &&
        r.ok(),
      { timeout: 60_000 },
    );
    const submit = page.getByTestId("login-submit");
    await submit.click();
    await expect(submit).toBeDisabled({ timeout: 3000 });
    await expect(submit).toHaveText(/Connecting/i, { timeout: 3000 });
    await patientsResponse;
    await expect(page.getByTestId("page-title")).toHaveText("Dashboard");
  });
});
