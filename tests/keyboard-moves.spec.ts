import { test } from "@playwright/test";
import {
  expectHasPiece,
  expectIsMoveStart,
  expectMoveState,
  squareLocator,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("keyboard-based moves work correctly", async ({ page }) => {
  // tab into chessboard - a1 is focused by default
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // navigate to c2 and start move
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  // move should have started at c2
  await expectMoveState(page, "moving-piece-kb");
  await expectIsMoveStart(page, "c2", true);

  // move piece c2 -> (right) -> d2 -> (up) -> d3 -> (up) -> d4 -> (left) -> c4
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");

  // move should have finished and c4 should now have piece
  await expectMoveState(page, "awaiting-input");
  await expectHasPiece(page, "c4", true);
});

test("focus remains on destination square after move", async ({ page }) => {
  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

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
  await expectMoveState(page, "moving-piece-kb");
  await expectIsMoveStart(page, "a3", true);
});

test("pressing enter on an unoccupied square does not start move", async ({
  page,
}) => {
  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // navigate to a3 and attempt to start move
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  // no move should have started
  await expectMoveState(page, "awaiting-input");
});

test("click move overrides keyboard-based move", async ({ page }) => {
  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

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
  await expectMoveState(page, "awaiting-input");
});

test("tabbing into board focuses on the first occupied square from the bottom, orientation = white", async ({
  page,
}) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // press enter; a2 square gets selected
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  // a3 should have piece on it
  await expectHasPiece(page, "a3", true);
});

test("tabbing into board focuses on the first occupied square from the bottom, orientation = black", async ({
  page,
}) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // flip board and tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Shift+Tab");

  // press enter; f7 square gets selected
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  // a3 should have piece on it
  await expectHasPiece(page, "f6", true);
});

test("navigation with PageUp works correctly", async ({ page }) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // start move on a2 -> move to c8
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("PageUp");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  // c7 should have piece
  await expectHasPiece(page, "c7", true);
});

test("navigation with End works correctly", async ({ page }) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // start move on a2 -> move to h2
  await page.keyboard.press("Enter");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");

  // h2 should have piece
  await expectHasPiece(page, "h2", true);
});

test("navigation with Control+End works correctly", async ({ page }) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // start move on a2 -> move to h1
  await page.keyboard.press("Enter");
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");

  // h1 should have piece
  await expectHasPiece(page, "h1", true);
});

test("navigation with PageDown works correctly", async ({ page }) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // start move on a2 -> move to d1
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("PageDown");
  await page.keyboard.press("Enter");

  // d1 should have piece
  await expectHasPiece(page, "d1", true);
});

test("navigation with Home works correctly", async ({ page }) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // start move on e2 -> move to a3
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");

  // a3 should have piece
  await expectHasPiece(page, "a3", true);
});

test("navigation with Control+Home works correctly", async ({ page }) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");

  // start move on a2 -> move to a8
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("Enter");

  // a8 should have piece
  await expectHasPiece(page, "a8", true);
});
