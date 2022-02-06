import { expect } from "@playwright/test";
import { Page } from "@playwright/test";
import { Square } from "../src/utils/chess";

/**
 * Returns a Locator object for a specific chessboard square.
 */
export function squareLocator(page: Page, square: string) {
  return page.locator(`[data-square="${square}"]`);
}

/**
 * Assert that chessboard container has attributes corresponding to move state
 * `state`, which corresponds to the "id" field of InteractionState (e.g.
 * 'awaiting-input').
 */
export async function expectBoardState(page: Page, state: string) {
  expect(
    await page.locator("table").evaluate((e, state: string) => {
      return e.classList.contains(state);
    }, state)
  ).toBe(true);
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
