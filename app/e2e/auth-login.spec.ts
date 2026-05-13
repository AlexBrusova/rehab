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
});
