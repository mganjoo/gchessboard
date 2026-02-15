import { test, expect } from "@playwright/test";
import {
  expectHasPiece,
  squareLocator,
  setCustomPieceTypes,
  setFen,
} from "./helpers.js";
import type { GChessBoardElement } from "../src/index.js";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("custom pieces render on the board", async ({ page }) => {
  await setCustomPieceTypes(page, { a: "amazon" });
  await setFen(page, "rnbakbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBAKBNR");

  // Check that amazon pieces are present on expected squares
  await expectHasPiece(page, "d8", true);
  await expectHasPiece(page, "d1", true);

  // Check aria-labels contain custom piece name
  const d8Label = await squareLocator(page, "d8").getAttribute("aria-label");
  expect(d8Label).toContain("black amazon");

  const d1Label = await squareLocator(page, "d1").getAttribute("aria-label");
  expect(d1Label).toContain("white amazon");
});

test("pending FEN: set FEN before registry", async ({ page }) => {
  // First clear the board
  await setFen(page, "8/8/8/8/8/8/8/8");

  // Set FEN with custom letters (no registry) - board should stay empty
  await setFen(page, "rnbakbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBAKBNR");
  await expectHasPiece(page, "d8", false);
  await expectHasPiece(page, "d1", false);

  // Then set registry - all pieces should appear
  await setCustomPieceTypes(page, { a: "amazon" });
  await expectHasPiece(page, "d8", true);
  await expectHasPiece(page, "d1", true);

  // Verify pieces are on correct squares
  const d8Label = await squareLocator(page, "d8").getAttribute("aria-label");
  expect(d8Label).toContain("black amazon");
});

test("pending FEN: set registry before FEN", async ({ page }) => {
  // Set registry first
  await setCustomPieceTypes(page, { a: "amazon" });

  // Then set FEN - pieces should appear immediately
  await setFen(page, "rnbakbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBAKBNR");
  await expectHasPiece(page, "d8", true);
  await expectHasPiece(page, "d1", true);
});

test("custom pieces can be moved (click)", async ({ page }) => {
  // Set up interactive board with custom pieces
  await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.customPieceTypes = { a: "amazon" };
      board.fen = "8/8/8/8/8/8/8/A7";
    }
  });

  // Click on amazon
  await squareLocator(page, "a1").click();

  // Click on destination
  await squareLocator(page, "a4").click();

  // Verify piece moved
  await expectHasPiece(page, "a1", false);
  await expectHasPiece(page, "a4", true);

  const a4Label = await squareLocator(page, "a4").getAttribute("aria-label");
  expect(a4Label).toContain("white amazon");
});

test("custom pieces can be moved (drag)", async ({ page }) => {
  // Set up interactive board with custom pieces
  await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.customPieceTypes = { a: "amazon" };
      board.fen = "8/8/8/8/8/8/8/A7";
    }
  });

  // Drag and drop
  await page.dragAndDrop(`[data-square="a1"]`, `[data-square="h8"]`);

  // Verify piece moved
  await expectHasPiece(page, "a1", false);
  await expectHasPiece(page, "h8", true);

  const h8Label = await squareLocator(page, "h8").getAttribute("aria-label");
  expect(h8Label).toContain("white amazon");
});

test("FEN round-trip", async ({ page }) => {
  // Set custom pieces and FEN
  await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.customPieceTypes = { a: "amazon" };
      board.fen = "rnbakbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBAKBNR";
    }
  });

  // Read back FEN
  const fen = await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    return board?.fen;
  });

  expect(fen).toEqual("rnbakbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBAKBNR");
});

test("position setter clears pending FEN", async ({ page }) => {
  // Set FEN with unresolved letters (stored as pending)
  await setFen(page, "rnbakbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBAKBNR");

  // Set position directly - pending should be cleared
  await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.position = { e4: { pieceType: "pawn", color: "white" } };
    }
  });

  // Set registry later - board should NOT retroactively apply the old pending FEN
  await setCustomPieceTypes(page, { a: "amazon" });

  // Only the pawn on e4 should be present
  await expectHasPiece(page, "e4", true);
  await expectHasPiece(page, "d8", false);
  await expectHasPiece(page, "d1", false);
});

test("invalid custom piece type key 'p' rejected", async ({ page }) => {
  const error = await page.evaluate(() => {
    try {
      const board = document.getElementById(
        "board"
      ) as GChessBoardElement | null;
      if (board) {
        board.customPieceTypes = { p: "pawn" };
      }
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  });

  expect(error).toContain("conflicts with standard FEN piece letter");
});

test("invalid custom piece type key 'ab' rejected", async ({ page }) => {
  const error = await page.evaluate(() => {
    try {
      const board = document.getElementById(
        "board"
      ) as GChessBoardElement | null;
      if (board) {
        board.customPieceTypes = { ab: "thing" };
      }
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  });

  expect(error).toContain("must be a single lowercase letter");
});

test("changing custom piece mapping updates piece part/class", async ({
  page,
}) => {
  await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.animationDuration = 0;
      board.customPieceTypes = { a: "amazon" };
      board.position = {
        a1: { pieceType: "amazon", color: "white" },
      };
    }
  });

  const initialPiecePart = await squareLocator(page, "a1").evaluate((e) => {
    const piece = e.querySelector(".piece");
    return piece?.getAttribute("part");
  });
  expect(initialPiecePart).toEqual("piece-wa");

  await setCustomPieceTypes(page, { c: "amazon" });

  await expect
    .poll(async () => {
      return squareLocator(page, "a1").evaluate((e) => {
        const piece = e.querySelector(".piece");
        return piece?.getAttribute("part");
      });
    })
    .toEqual("piece-wc");
});

test("removing active custom piece mapping is rejected", async ({ page }) => {
  await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    if (board) {
      board.animationDuration = 0;
      board.customPieceTypes = { a: "amazon" };
      board.position = {
        a1: { pieceType: "amazon", color: "white" },
      };
    }
  });

  const error = await page.evaluate(() => {
    try {
      const board = document.getElementById(
        "board"
      ) as GChessBoardElement | null;
      if (board) {
        board.customPieceTypes = undefined;
      }
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  });

  expect(error).toContain("No FEN letter mapping");

  const currentMap = await page.evaluate(() => {
    const board = document.getElementById("board") as GChessBoardElement | null;
    return board?.customPieceTypes;
  });
  expect(currentMap).toMatchObject({ a: "amazon" });
  await expectHasPiece(page, "a1", true);
});
