import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Square } from "../src/utils/chess";
import type { GChessBoardElement } from "../src/index";

/**
 * Returns a Locator object for a specific chessboard square.
 */
export function squareLocator(page: Page, square: string) {
  return page.locator(`[data-square="${square}"]`);
}

/**
 * Assert that the board has a piece of square `square`.
 */
export async function expectHasPiece(
  page: Page,
  square: string,
  value: boolean
) {
  expect(
    await squareLocator(page, square).evaluate((e) =>
      e.classList.contains("has-piece")
    )
  ).toEqual(value);
}

/**
 * Assert that `square` is marked as the starting square of an in-progress move.
 */
export async function expectIsActive(
  page: Page,
  square: string,
  value: boolean
) {
  expect(
    await squareLocator(page, square).evaluate((e) =>
      e.classList.contains("move-start")
    )
  ).toEqual(value);
}

/**
 * Shortcut combination to tab into board.
 */
export async function tabIntoBoard(page: Page) {
  await page.focus("text=Flip");
  await page.keyboard.press("Shift+Tab");
}

/**
 * Return focused square element, if it exists, on board.
 */
export async function expectHasFocus(page: Page, square: Square) {
  return expect(
    await page
      .locator("g-chess-board")
      .evaluate(
        (e) =>
          (e.shadowRoot?.activeElement as HTMLElement | undefined)?.dataset
            .square
      )
  ).toEqual(square);
}

/**
 * Set custom piece types on the board.
 */
export async function setCustomPieceTypes(
  page: Page,
  map: Record<string, string>
) {
  await page.evaluate((m) => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.customPieceTypes = m;
    }
  }, map);
}

/**
 * Set FEN string on the board.
 */
export async function setFen(page: Page, fen: string) {
  await page.evaluate((f) => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.fen = f;
    }
  }, fen);
}
