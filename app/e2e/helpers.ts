import { expect, type Page } from "@playwright/test";

export async function loginAsManager(page: Page) {
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
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("page-title")).toHaveText(/Dashboard/, {
    timeout: 30_000,
  });
  await patientsResponse;
}

export async function openSidebar(page: Page) {
  await page.getByTestId("sidebar-toggle").click();
}

export async function goToScreen(page: Page, navId: string) {
  await openSidebar(page);
  await page.getByTestId(`nav-${navId}`).click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.getByTestId("toast");
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(text);
}
