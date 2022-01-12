import { test, expect } from "@playwright/test"
import { expectHasPiece, expectMoveState } from "./helpers"

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

test("keyboard-based move is ignored while drag is in progress", async () => {
  test.fixme()
})

// If we click on a square, then mousedown (but not mouseup), then we should
// still permit a drag operation to be completed instead of canceling move
// which is the regular behavior.
test("drag is completed even after previous click on square", async () => {
  test.fixme()
})
