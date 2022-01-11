import { test } from "@playwright/test"
import {
  expectHasPiece,
  expectIsMoveStart,
  expectMoveState,
  squareLocator,
} from "./helpers"

test.beforeEach(async ({ page }) => {
  page.goto("/")
})

test("keyboard-based moves work correctly", async ({ page }) => {
  // tab into chessboard - a1 is focused by default
  await page.click("body")
  await page.keyboard.press("Tab")

  // navigate to c2 and start move
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")

  // move should have started at c2
  await expectMoveState(page, "moving-piece-kb")
  await expectIsMoveStart(page, "c2", true)

  // move piece c2 -> (right) -> d2 -> (up) -> d3 -> (up) -> d4 -> (left) -> c4
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Enter")

  // move should have finished and c4 should now have piece
  await expectMoveState(page, "awaiting-input")
  await expectHasPiece(page, "c4", true)
})

test("focus remains on destination square after move", async ({ page }) => {
  // tab into chessboard
  await page.click("body")
  await page.keyboard.press("Tab")

  // navigate to b2 and start move
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")

  // navigate to a3 and finish move
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Enter")

  // start move again
  await page.keyboard.press("Enter")

  // move should have started again, this time at a3
  await expectMoveState(page, "moving-piece-kb")
  await expectIsMoveStart(page, "a3", true)
})

test("pressing enter on an unoccupied square does not start move", async ({
  page,
}) => {
  // tab into chessboard
  await page.click("body")
  await page.keyboard.press("Tab")

  // navigate to a3 and attempt to start move
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Enter")

  // no move should have started
  await expectMoveState(page, "awaiting-input")
})

test("click move overrides keyboard-based move", async ({ page }) => {
  // tab into chessboard
  await page.click("body")
  await page.keyboard.press("Tab")

  // navigate to c3 and start move
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")

  // navigate to a3
  await page.keyboard.press("Home")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowLeft")

  // click on f4
  await squareLocator(page, "f4").click()

  // f4 should now have piece, and we should be back to awaiting input
  await expectHasPiece(page, "f4", true)
  await expectMoveState(page, "awaiting-input")
})

// TODO orientation test to see that bottom left is always selected when tabbing in, even after switch
// TODO more comprehensive navigation test including home, end, ctrl home, pgup, pdown
