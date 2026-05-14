import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager } from "./helpers";
import { SCREEN_TITLES } from "./expectedTitles";

/** Rapid sidebar hops should always settle on the expected title (no stuck UI). */
test.describe("Navigation stress", () => {
  test("manager: quick A→B→A cycle completes each time", async ({ page }) => {
    await loginAsManager(page);
    const cycle = [
      "medications",
      "patients",
      "groups",
      "medications",
      "dashboard",
      "rooms",
      "finance",
      "dashboard",
    ] as const;
    for (const id of cycle) {
      await goToScreen(page, id);
      await expect(page.getByTestId("page-title")).toHaveText(SCREEN_TITLES[id], {
        timeout: 12_000,
      });
    }
  });
});
