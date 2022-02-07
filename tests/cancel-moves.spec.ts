import { expect, test } from "@playwright/test";
import { expectIsActive, squareLocator, tabIntoBoard } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("clicking twice on a square cancels move", async ({ page }) => {
  // click on square twice
  await squareLocator(page, "e2").click();
  await squareLocator(page, "e2").click();

  // move state should be expecting input and no square should be focused
  await expect(page.locator("body")).toBeFocused();
});

test("pressing enter twice on a square cancels move but not focus", async ({
  page,
}) => {
  // tab into chessboard
  await tabIntoBoard(page);

  // press enter twice
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // move state should be expecting input and body should not be focused
  await expect(page.locator("body")).not.toBeFocused();
});

test("pressing enter and then clicking on a square cancels move but not focus", async ({
  page,
}) => {
  // tab into chessboard
  await tabIntoBoard(page);

  // press enter and then click a1 square
  await page.keyboard.press("Enter");
  await squareLocator(page, "a1").click();

  // body should be focused
  await expect(page.locator("body")).not.toBeFocused();
});

test("tabbing out of board does not cancel move", async ({ page }) => {
  // tab into chessboard
  await tabIntoBoard(page);

  // press enter and then click a1 square
  await page.keyboard.press("Enter");

  // tab out of keyboard
  await page.keyboard.press("Tab");

  // page should be in awaiting input
  await expectIsActive(page, "a1", true);
});
