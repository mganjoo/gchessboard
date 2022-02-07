import { test } from "@playwright/test";
import {
  expectHasPiece,
  expectIsActive,
  squareLocator,
  tabIntoBoard,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("keyboard-based moves work correctly", async ({ page }) => {
  // tab into chessboard - a1 is focused by default
  await tabIntoBoard(page);

  // navigate to c2 and start move
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  // move should have started at c2
  await expectIsActive(page, "c2", true);

  // move piece c2 -> (right) -> d2 -> (up) -> d3 -> (up) -> d4 -> (left) -> c4
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  // move should have finished and c4 should now have piece
  await expectHasPiece(page, "c4", true);
});

test("focus remains on destination square after move", async ({ page }) => {
  await tabIntoBoard(page);

  // navigate to b2 and start move
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  // navigate to a3 and finish move
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  // start move again
  await page.keyboard.press("Enter");

  // move should have started again, this time at a3
  await expectIsActive(page, "a3", true);
});

test("pressing enter on an unoccupied square does not start move", async ({
  page,
}) => {
  await tabIntoBoard(page);

  // navigate to a3 and attempt to start move
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  // no move should have started
  await expectIsActive(page, "a3", false);
});

test("click move overrides keyboard-based move", async ({ page }) => {
  await tabIntoBoard(page);

  // navigate to c3 and start move
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  // navigate to a3
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");

  // click on f4
  await squareLocator(page, "f4").click();

  // f4 should now have piece, and we should be back to awaiting input
  await expectHasPiece(page, "f4", true);
});
