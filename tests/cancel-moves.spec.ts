import { expect, test } from "@playwright/test";
import { expectBoardState, squareLocator } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("clicking twice on a square cancels move and focus", async ({ page }) => {
  // click on square twice
  await squareLocator(page, "e2").click();
  await squareLocator(page, "e2").click();

  // move state should be expecting input and no square should be focused
  await expectBoardState(page, "ready");
  await expect(page.locator("body")).toBeFocused();
});

test("pressing enter twice on a square cancels move but not focus", async ({
  page,
}) => {
  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // press enter twice
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  // move state should be expecting input and body should not be focused
  await expectBoardState(page, "ready");
  await expect(page.locator("body")).not.toBeFocused();
});

test("clicking and then pressing enter on a square cancels move but not focus", async ({
  page,
}) => {
  // click on square and then press Enter
  await squareLocator(page, "e2").click();
  await page.keyboard.press("Enter");

  // move state should be expecting input and no square should be focused
  await expectBoardState(page, "ready");
  await expect(page.locator("body")).not.toBeFocused();
});

test("pressing enter and then clicking on a square cancels move and focus", async ({
  page,
}) => {
  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // press enter and then click a2 square
  await page.keyboard.press("Enter");
  await squareLocator(page, "a2").click();

  // move state should be expecting input and body should be focused
  await expectBoardState(page, "ready");
  await expect(page.locator("body")).toBeFocused();
});

test("tabbing out of board does not cancel move", async ({ page }) => {
  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // press enter and then click a2 square
  await page.keyboard.press("Enter");

  // page should be in awaiting keyboard input mode
  await expectBoardState(page, "moving");

  // tab out of keyboard
  await page.keyboard.press("Tab");

  // page should be in awaiting input
  await expectBoardState(page, "moving");
});
