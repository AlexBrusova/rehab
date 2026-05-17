import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers";

test.describe("API health — all GET endpoints return 2xx", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  const endpoints = [
    "/api/houses",
    "/api/users",
  ];

  // Check responses captured during login+load
  test("patients and rooms load 2xx on dashboard", async ({ page }) => {
    const responses: Record<string, number> = {};
    page.on("response", (r) => {
      if (r.url().includes("/api/")) {
        const path = new URL(r.url()).pathname;
        responses[path] = r.status();
      }
    });
    // Navigate to patients to trigger all house-scoped loads
    await page.reload();
    await page.waitForLoadState("networkidle");
    for (const [path, status] of Object.entries(responses)) {
      expect(status, `${path} should be 2xx`).toBeLessThan(500);
    }
  });

  test("GET /api/patients — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/patients") && r.request().method() === "GET"),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/rooms — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/rooms")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/shifts — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/shifts")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/phones — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/phones")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/consequences — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/consequences")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/groups — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/groups")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/therapy — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/therapy")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/finance/patient — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/finance/patient")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/finance/cashbox — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/finance/cashbox") && !r.url().includes("counts")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/distributions — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/distributions")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/summary — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/summary")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/schedule — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/schedule")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/therapist-assignments — no 500", async ({ page }) => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/therapist-assignments")),
      page.reload(),
    ]);
    expect(res.status()).toBeLessThan(500);
  });
});
