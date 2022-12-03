import { test, expect } from "@playwright/test";
import {
  expectHasPiece,
  squareLocator,
  tabIntoBoard,
  expectHasFocus,
} from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("drag-based moves work correctly", async ({ page }) => {
  // drag and drop from d1 to g4
  await page.dragAndDrop(`[data-square="d1"]`, `[data-square="g4"]`);

  // second square should be marked with a piece on it, and we should be back to awaiting input
  await expectHasPiece(page, "g4", true);

  // no square should have focus
  await expect(page.locator("body")).toBeFocused();
});

test("drag-based moves should transfer existing focus to new square", async ({
  page,
}) => {
  // tab into board; a1 should have focus
  await tabIntoBoard(page);
  await expectHasFocus(page, "a1");

  // drag and drop from c1 to g4
  await page.dragAndDrop(`[data-square="c1"]`, `[data-square="g4"]`);

  // new square should now have focus
  await expectHasFocus(page, "g4");
});

// If we click on a square, then mousedown (but not mouseup), then we should
// still permit a drag operation to be completed instead of canceling move
// which is the regular behavior.
test("drag is completed even after previous click on square", async ({
  page,
}) => {
  // click on first square once
  await squareLocator(page, "f2").click();

  // get location of f2 and e6 square
  const fromRect = await squareLocator(page, "f2").boundingBox();
  const toRect = await squareLocator(page, "e6").boundingBox();

  // mousedown on f2 again but this time move to e6
  if (fromRect !== null) {
    await page.mouse.move(
      fromRect.x + fromRect.width / 2,
      fromRect.y + fromRect.height / 2
    );
  }
  await page.mouse.down();
  if (toRect !== null) {
    await page.mouse.move(
      toRect.x + toRect.width / 2,
      toRect.y + toRect.height / 2
    );
  }
  await page.mouse.up();

  // second square should be marked with a piece on it, and we should be back to awaiting input
  await expectHasPiece(page, "e6", true);
});

test("drag-based move should cancel if moving off board", async ({ page }) => {
  // tab into board; a1 should have focus
  await tabIntoBoard(page);
  await expectHasFocus(page, "a1");

  // drag and drop from c2 to somewhere outside
  await page.dragAndDrop(`[data-square="c2"]`, `text=Flip`);

  // start square should now have focus
  await expectHasFocus(page, "c2");
});
