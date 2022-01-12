import { test } from "@playwright/test"
import { expectHasPiece, expectMoveState, squareLocator } from "./helpers"

test.beforeEach(async ({ page }) => {
  page.goto("/")
})

test("drag-based moves work correctly", async ({ page }) => {
  // drag and drop from d1 to g4
  await page.dragAndDrop(
    `[role="gridcell"]:has-text("d1")`,
    `[role="gridcell"]:has-text("g4")`
  )
  await squareLocator(page, "e2").click()

  // second square should be marked with a piece on it, and we should be back to awaiting input
  await expectHasPiece(page, "g4", true)
  await expectMoveState(page, "awaiting-second-touch")
})
