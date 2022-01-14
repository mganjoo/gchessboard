import { test, expect } from "@playwright/test"
import { expectHasPiece, expectMoveState, squareLocator } from "./helpers"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("drag-based moves work correctly", async ({ page }) => {
  // drag and drop from d1 to g4
  await page.dragAndDrop(
    `[role="gridcell"]:has-text("d1")`,
    `[role="gridcell"]:has-text("g4")`
  )

  // second square should be marked with a piece on it, and we should be back to awaiting input
  await expectHasPiece(page, "g4", true)
  await expectMoveState(page, "awaiting-input")

  // no square should have focus
  await expect(page.locator("body")).toBeFocused()
})

// If we click on a square, then mousedown (but not mouseup), then we should
// still permit a drag operation to be completed instead of canceling move
// which is the regular behavior.
test("drag is completed even after previous click on square", async ({
  page,
}) => {
  // click on first square once
  await squareLocator(page, "f2").click()

  // get location of f2 and e6 square
  const fromRect = await squareLocator(page, "f2").boundingBox()
  const toRect = await squareLocator(page, "e6").boundingBox()

  // mousedown on f2 again but this time move to e6
  if (fromRect !== null) {
    await page.mouse.move(
      fromRect.x + fromRect.width / 2,
      fromRect.y + fromRect.height / 2
    )
  }
  await page.mouse.down()
  if (toRect !== null) {
    await page.mouse.move(
      toRect.x + toRect.width / 2,
      toRect.y + toRect.height / 2
    )
  }
  await page.mouse.up()

  // second square should be marked with a piece on it, and we should be back to awaiting input
  await expectHasPiece(page, "e6", true)
  await expectMoveState(page, "awaiting-input")
})
