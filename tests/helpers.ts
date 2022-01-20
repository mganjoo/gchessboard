import { expect } from "@playwright/test"
import { Page } from "@playwright/test"

/**
 * Returns a Locator object for a specific chessboard square.
 */
export function squareLocator(page: Page, square: string) {
  return page.locator(`[role="gridcell"]:has-text("${square}")`)
}

/**
 * Assert that chessboard container has attributes corresponding to move state
 * `state`, which corresponds to the "id" field of InteractionState (e.g.
 * 'awaiting-input').
 */
export async function expectMoveState(page: Page, state: string) {
  await expect(page.locator("table")).toHaveAttribute("data-move-state", state)
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
  ).toBe(value)
}

/**
 * Assert that `square` is marked as the starting square of an in-progress move.
 */
export async function expectIsMoveStart(
  page: Page,
  square: string,
  value: boolean
) {
  expect(
    await squareLocator(page, square).evaluate((e) =>
      e.classList.contains("move-start")
    )
  ).toBe(value)
}
