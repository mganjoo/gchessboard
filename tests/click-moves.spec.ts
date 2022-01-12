import { test, expect } from "@playwright/test"
import {
  expectHasPiece,
  expectIsMoveStart,
  expectMoveState,
  squareLocator,
} from "./helpers"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("two-click moves work correctly", async ({ page }) => {
  // click on first square
  await squareLocator(page, "e2").click()

  // square should be marked as start square, and we should
  // now be waiting for second touch
  await expectIsMoveStart(page, "e2", true)
  await expectMoveState(page, "awaiting-second-touch")

  // click on second square
  await squareLocator(page, "e4").click()

  // second square should be marked with a piece on it
  await expectHasPiece(page, "e4", true)

  // first square should no longer have move class or piece class on it,
  // and we should be re-awaiting input
  await expectHasPiece(page, "e2", false)
  await expectIsMoveStart(page, "e2", false)
  await expectMoveState(page, "awaiting-input")
})

test("occupied first square is focused when clicking on it", async ({
  page,
}) => {
  // click on first square
  await squareLocator(page, "g1").click()

  // body should now no longer be focused
  await expect(page.locator("body")).not.toBeFocused()

  // square should be focused, so we can use arrow keys
  // keys: up -> up -> left -> <enter>
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("Enter")

  // second square should now have piece on it
  await expectHasPiece(page, "f3", true)
})

test("unoccupied first square is not focused when clicking on it", async ({
  page,
}) => {
  await squareLocator(page, "e4").click()

  // body should still have focus
  await expect(page.locator("body")).toBeFocused()
})

test("second square is focused after clicking on it", async ({ page }) => {
  // click on first square
  await squareLocator(page, "e2").click()

  // click on second square
  await squareLocator(page, "e4").click()

  // body should have focus since click-based moves shouldn't transfer focus
  await expect(page.locator("body")).toBeFocused()

  // second square should receive focus after we tab back into board
  await page.click("body")
  await page.keyboard.press("Tab")

  // move piece up a square
  await page.keyboard.press("Enter")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Enter")

  // destination should now have piece
  await expectHasPiece(page, "e5", true)
})

// import * as fc from "fast-check"
// import {
//   getSquare,
//   getSquareColor,
//   getVisualIndex,
//   Piece,
//   Side,
//   Square,
// } from "./utils/chess"
// import { fireEvent, screen, waitFor } from "@testing-library/dom"
// import userEvent from "@testing-library/user-event"
// import { ChessxBoard } from "./ChessxBoard"
// import { makeHTMLElement } from "./utils/dom"

// customElements.define("chessx-board", ChessxBoard)

// function buildChessboard(
//   orientation: Side,
//   pieces?: Partial<Record<Square, Piece>>,
//   interactive?: boolean
// ) {
//   const interactiveFinal = interactive !== undefined ? interactive : true
//   const board = makeHTMLElement("chessx-board", {
//     attributes: { orientation, interactive: interactiveFinal.toString() },
//   })
//   if (pieces !== undefined) {
//     board.pieces = pieces
//   }
//   document.body.replaceChildren(board)
//   return board
// }

// describe("Chessboard creation and cleanup", () => {
//   const pieces = {
//     b3: { color: "white", pieceType: "queen" },
//     e6: { color: "black", pieceType: "knight" },
//     g1: { color: "white", pieceType: "king" },
//   } as const
//   const side = "white"
//   buildChessboard(side, pieces)
//   const idxsWithPieces = (Object.keys(pieces) as (keyof typeof pieces)[]).map(
//     (s) => getVisualIndex(s, side)
//   )

//   it("should add correct classes and attributes to chessboard", () => {
//     fc.assert(
//       fc.property(fc.nat({ max: 63 }), (idx) => {
//         const squareElement = document.querySelectorAll("[data-square]")[idx]
//         const expectedSquare = getSquare(idx, side)
//         expect(squareElement).toHaveAttribute("data-square", expectedSquare)
//         expect(squareElement).toHaveAttribute(
//           "data-square-color",
//           getSquareColor(expectedSquare)
//         )
//       })
//     )
//   })

//   it("should not have the .has-piece class on chessboard without pieces", () => {
//     fc.assert(
//       fc.property(
//         fc.nat({ max: 63 }).filter((idx) => !idxsWithPieces.includes(idx)),
//         (idx) => {
//           expect(
//             document.querySelectorAll("[data-square]")[idx]
//           ).not.toHaveClass("has-piece")
//         }
//       )
//     )
//   })

//   it("should have the .has-piece class on chessboard with pieces", () => {
//     idxsWithPieces.forEach((i) => {
//       expect(document.querySelectorAll("[data-square]")[i]).toHaveClass(
//         "has-piece"
//       )
//     })
//   })
// })

// describe("Drag-based interaction", () => {
//   const pieces = {
//     f7: { color: "black", pieceType: "pawn" },
//   } as const

//   it("works correctly", async () => {
//     const chessboard = buildChessboard("white", pieces)

//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "touching-first-square"
//       )
//     )
//     fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f6/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "dragging"
//       )
//     )
//     fireEvent.mouseUp(screen.getByRole("gridcell", { name: /f5/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "awaiting-input"
//       )
//     )
//     expect(screen.getByRole("gridcell", { name: /f5/i })).toHaveClass(
//       "has-piece"
//     )
//     // Drag moves should not transfer focus
//     expect(screen.getByRole("gridcell", { name: /f5/i })).not.toHaveFocus()
//   })

//   it("cancels move when move when dropping on same square", async () => {
//     const chessboard = buildChessboard("white", pieces)

//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f8/i }))
//     fireEvent.mouseUp(screen.getByRole("gridcell", { name: /f7/i }))
//     expect(screen.getByRole("gridcell", { name: /f7/i })).not.toHaveFocus()
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "awaiting-input"
//       )
//     )
//   })

//   it("ignores additional mousedown events or concurrent keyboard events", async () => {
//     const chessboard = buildChessboard("white", pieces)

//     userEvent.tab()
//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "touching-first-square"
//       )
//     )

//     // Ignores additional mouse down events
//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "touching-first-square"
//       )
//     )

//     // Start dragging
//     fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f6/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "dragging"
//       )
//     )

//     // Ignores additional mouse down events
//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "dragging"
//       )
//     )

//     // Ignore additional mouse move events
//     fireEvent.mouseMove(screen.getByRole("gridcell", { name: /a3/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "dragging"
//       )
//     )

//     // Let focus move around, but ignore enter press
//     userEvent.tab()
//     userEvent.keyboard("[ArrowLeft][ArrowLeft][Enter]")
//     expect(screen.getByRole("gridcell", { name: /d7/i })).toHaveFocus()
//     expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveClass(
//       "has-piece"
//     )

//     // Finish dragging
//     fireEvent.mouseUp(screen.getByRole("gridcell", { name: /f5/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "awaiting-input"
//       )
//     )
//     expect(screen.getByRole("gridcell", { name: /f5/i })).toHaveClass(
//       "has-piece"
//     )
//     expect(document.body).toHaveFocus()
//   })

//   it("ignores cancellation on start square if it leads into drag", async () => {
//     const chessboard = buildChessboard("white", pieces)

//     userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "awaiting-second-touch"
//       )
//     )
//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "canceling-second-touch"
//       )
//     )
//     fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f6/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "dragging"
//       )
//     )
//   })

//   it("continues with cancellation after second touch on start square if it does not lead into drag", async () => {
//     const chessboard = buildChessboard("white", pieces)

//     userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "awaiting-second-touch"
//       )
//     )
//     fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "canceling-second-touch"
//       )
//     )
//     fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f7/i }))
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
//         "data-move-state",
//         "canceling-second-touch"
//       )
//     )
//   })
// })

// describe("Chessboard interactivity", () => {
//   const pieces = {
//     e6: { color: "black", pieceType: "knight" },
//   } as const

//   it("ignores interactions when initialized with interactive = false", async () => {
//     const chessboard = buildChessboard("white", pieces, false)
//     expect(screen.queryByRole("gridcell")).not.toBeInTheDocument()
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
//         "data-move-state"
//       )
//     )
//     userEvent.click(chessboard.querySelector('[data-square="e6"]') as Element)
//     userEvent.click(chessboard.querySelector('[data-square="g1"]') as Element)
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
//         "data-move-state"
//       )
//     )
//     expect(chessboard.querySelector('[data-square="g1"]')).not.toHaveClass(
//       "has-piece"
//     )
//   })

//   it("ignores interactions when interactive is changed to false", async () => {
//     const chessboard = buildChessboard("white", pieces)
//     userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
//     userEvent.click(screen.getByRole("gridcell", { name: /d3/i }))
//     expect(screen.getByRole("gridcell", { name: /d3/i })).toHaveClass(
//       "has-piece"
//     )
//     chessboard.interactive = false

//     expect(screen.queryByRole("gridcell")).not.toBeInTheDocument()
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
//         "data-move-state"
//       )
//     )
//     userEvent.click(chessboard.querySelector('[data-square="d3"]') as Element)
//     userEvent.click(chessboard.querySelector('[data-square="g1"]') as Element)
//     await waitFor(() =>
//       expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
//         "data-move-state"
//       )
//     )
//     expect(chessboard.querySelector('[data-square="g1"]')).not.toHaveClass(
//       "has-piece"
//     )
//   })
// })
