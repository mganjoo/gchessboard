import { test } from "@playwright/test";
import { squareLocator, tabIntoBoard, expectHasFocus } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("focus transfers to square only after mouse up", async ({ page }) => {
  // tab into board
  await tabIntoBoard(page);
  await expectHasFocus(page, "a1");

  // mouse down on square
  const fromRect = await squareLocator(page, "d2").boundingBox();
  if (fromRect !== null) {
    await page.mouse.move(
      fromRect.x + fromRect.width / 2,
      fromRect.y + fromRect.height / 2
    );
  }
  await page.mouse.down();
  await expectHasFocus(page, "a1");

  // focus should transfer after mouseup
  await page.mouse.up();
  await expectHasFocus(page, "d2");
});
