import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager } from "./helpers";
import { MANAGER_NAV_IDS, SCREEN_TITLES } from "./expectedTitles";

test.describe("Manager navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  for (const id of MANAGER_NAV_IDS) {
    test(`screen ${id} shows title "${SCREEN_TITLES[id]}"`, async ({ page }) => {
      await goToScreen(page, id);
      await expect(page.getByTestId("page-title")).toHaveText(SCREEN_TITLES[id]);
    });
  }
});
