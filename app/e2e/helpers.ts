import { expect, type Page } from "@playwright/test";

const DEFAULT_PASSWORD = "1234";

/**
 * Log in and wait until the first patients list for the active house has loaded.
 */
export async function loginAs(page: Page, username: string, password = DEFAULT_PASSWORD) {
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
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(password);
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

export async function loginAsManager(page: Page) {
  await loginAs(page, "manager1");
}

export async function loginAsOrgManager(page: Page) {
  await loginAs(page, "org_manager1");
}

export async function loginAsCounselor(page: Page) {
  await loginAs(page, "counselor1");
}

export async function loginAsDoctor(page: Page) {
  await loginAs(page, "doctor1");
}

export async function loginAsTherapist(page: Page) {
  await loginAs(page, "therapist1");
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
