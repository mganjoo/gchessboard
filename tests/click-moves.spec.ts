import { test, expect } from "@playwright/test";
import {
  expectHasPiece,
  expectIsActive,
  expectBoardState,
  squareLocator,
  tabIntoBoard,
  expectHasFocus,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("two-click moves work correctly", async ({ page }) => {
  // click on first square
  await squareLocator(page, "e2").click();

  // square should be marked as start square, and we should
  // now be waiting for second touch
  await expectIsActive(page, "e2", true);
  await expectBoardState(page, "moving");

  // click on second square
  await squareLocator(page, "e4").click();

  // second square should be marked with a piece on it
  await expectHasPiece(page, "e4", true);

  // first square should no longer have move class or piece class on it,
  // and we should be re-awaiting input
  await expectHasPiece(page, "e2", false);
  await expectIsActive(page, "e2", false);
  await expectBoardState(page, "ready");
});

test("unoccupied first square is not focused when clicking on it", async ({
  page,
}) => {
  await squareLocator(page, "e4").click();

  // body should still have focus
  await expect(page.locator("body")).toBeFocused();
});

test("first square becomes tabbable after clicking on it", async ({ page }) => {
  // click on first square
  await squareLocator(page, "e2").click();

  // body should still have focus, as click move doesn't transfer focus
  await expect(page.locator("body")).toBeFocused();

  // first square should receive focus after we tab back into board
  await tabIntoBoard(page);
  await expectHasFocus(page, "e2");
});

test("second square becomes tabbable after clicking on it", async ({
  page,
}) => {
  // click on first square
  await squareLocator(page, "e2").click();

  // click on second square
  await squareLocator(page, "e4").click();

  // body should have focus since click-based moves shouldn't transfer focus
  await expect(page.locator("body")).toBeFocused();

  // second square should receive focus after we tab back into board
  await tabIntoBoard(page);
  await expectHasFocus(page, "e4");
});
