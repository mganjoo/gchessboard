import { test, devices } from "@playwright/test";
import { expectHasPiece, expectIsActive, squareLocator } from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.use({ ...devices["Pixel 5"] });
test("two-tap moves work correctly", async ({ page }) => {
  // tap on first square
  await squareLocator(page, "c2").tap();

  // square should be marked as start square, and we should
  // now be waiting for second touch
  await expectIsActive(page, "c2", true);

  // tap on second square
  await squareLocator(page, "c4").tap();

  // second square should be marked with a piece on it
  await expectHasPiece(page, "c4", true);

  // first square should no longer have move class or piece class on it,
  // and we should be re-awaiting input
  await expectHasPiece(page, "c2", false);
  await expectIsActive(page, "c2", false);
});
