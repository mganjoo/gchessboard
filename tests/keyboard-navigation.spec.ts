import { test } from "@playwright/test";
import { expectHasPiece, tabIntoBoard } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("tabbing into board focuses on the first occupied square from the bottom, orientation = white", async ({
  page,
}) => {
  // set to puzzle position
  await page.click("text=Puzzle position");

  // tab into chessboard
  await tabIntoBoard(page);

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
  await tabIntoBoard(page);

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
  await tabIntoBoard(page);

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
  await tabIntoBoard(page);

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
  await tabIntoBoard(page);

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
  await tabIntoBoard(page);

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
  await tabIntoBoard(page);

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
