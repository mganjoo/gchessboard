import { test, expect } from "@playwright/test";
import { expectHasPiece, expectIsActive, squareLocator } from "./helpers.js";

/**
 * This file is an end-to-end test of various move callbacks, leveraging
 * the "side to move" dropdown option on the gchessboard demo page.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("moves are restricted", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByLabel("Side to play").selectOption("white");
  });

  test("pieces are allowed to move to valid squares", async ({ page }) => {
    await squareLocator(page, "e2").click();
    await expectIsActive(page, "e2", true);
    await squareLocator(page, "e4").click();

    // second square should be marked with a piece on it
    await expectHasPiece(page, "e4", true);
  });

  test("pieces are not allowed to move to invalid squares", async ({
    page,
  }) => {
    await squareLocator(page, "e2").click();
    await squareLocator(page, "e6").click();

    // piece should not have moved
    await expectHasPiece(page, "e6", false);
    await expectHasPiece(page, "e2", true);
  });

  test("other side cannot be selected", async ({ page }) => {
    expect(await squareLocator(page, "d7").isEnabled()).toBe(false);
    expect(await squareLocator(page, "e2").isEnabled()).toBe(true);

    await page.getByLabel("Side to play").selectOption("black");

    expect(await squareLocator(page, "d7").isEnabled()).toBe(true);
    expect(await squareLocator(page, "e2").isEnabled()).toBe(false);
  });
});
