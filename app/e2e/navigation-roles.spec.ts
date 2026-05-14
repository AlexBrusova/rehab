import { expect, test } from "@playwright/test";
import {
  goToScreen,
  loginAsCounselor,
  loginAsDoctor,
  loginAsManager,
  loginAsOrgManager,
  loginAsTherapist,
} from "./helpers";
import {
  SCREEN_TITLES,
  COUNSELOR_NAV_IDS,
  DOCTOR_NAV_IDS,
  MANAGER_NAV_IDS,
  ORG_MANAGER_NAV_IDS,
  THERAPIST_NAV_IDS,
} from "./expectedTitles";

type LoginFn = (page: import("@playwright/test").Page) => Promise<void>;

const ROLE_NAV_CASES: { name: string; login: LoginFn; ids: readonly string[] }[] = [
  { name: "manager", login: loginAsManager, ids: MANAGER_NAV_IDS },
  { name: "org_manager", login: loginAsOrgManager, ids: ORG_MANAGER_NAV_IDS },
  { name: "counselor", login: loginAsCounselor, ids: COUNSELOR_NAV_IDS },
  { name: "doctor", login: loginAsDoctor, ids: DOCTOR_NAV_IDS },
  { name: "therapist", login: loginAsTherapist, ids: THERAPIST_NAV_IDS },
];

for (const { name, login, ids } of ROLE_NAV_CASES) {
  test.describe(`Navigation (${name})`, () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    for (const id of ids) {
      test(`sidebar → ${id} shows title "${SCREEN_TITLES[id]}"`, async ({ page }) => {
        await goToScreen(page, id);
        await expect(page.getByTestId("page-title")).toHaveText(SCREEN_TITLES[id]);
      });
    }
  });
}
