import * as fc from "fast-check"
import {
  getOppositeSide,
  getSquare,
  getSquareColor,
  getVisualRowColumn,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { waitFor, within } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { Chessboard } from "./Chessboard"

function buildChessboard(
  orientation: Side,
  pieces?: Partial<Record<Square, Piece>>
): [HTMLElement, Chessboard] {
  const wrapper = document.createElement("div")
  return [wrapper, new Chessboard(wrapper, { orientation, pieces })]
}

describe.each<{ side: Side; flip: boolean }>([
  { side: "white", flip: false },
  { side: "white", flip: true },
  { side: "black", flip: false },
  { side: "black", flip: true },
])(
  "Chessboard with orientation = $side, flip orientation after creation = $flip",
  ({ side, flip }) => {
    const pieces = {
      b3: { color: "white", pieceType: "queen" },
      e6: { color: "black", pieceType: "knight" },
      g1: { color: "white", pieceType: "king" },
    } as const
    const [wrapper, chessboard] = buildChessboard(side, pieces)
    if (flip) {
      chessboard.updateOrientationAndRedraw(getOppositeSide(side))
    }
    const finalSide = flip ? getOppositeSide(side) : side
    const idxsWithPieces = (Object.keys(pieces) as (keyof typeof pieces)[])
      .map((s) => getVisualRowColumn(s, finalSide))
      .flatMap(([row, col]) => row * 8 + col)

    it("should add correct classes and attributes to chessboard", () => {
      fc.assert(
        fc.property(fc.nat({ max: 7 }), fc.nat({ max: 7 }), (row, col) => {
          const squareElement =
            wrapper.querySelectorAll("[data-square]")[row * 8 + col]
          const expectedSquare = getSquare(row, col, finalSide)
          expect(squareElement).toHaveAttribute("data-square", expectedSquare)
          expect(squareElement).toHaveAttribute(
            "data-square-color",
            getSquareColor(expectedSquare)
          )
        })
      )
    })

    it("should not have the .has-piece class on chessboard without pieces", () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 63 }).filter((idx) => !idxsWithPieces.includes(idx)),
          (idx) => {
            expect(
              wrapper.querySelectorAll("[data-square]")[idx]
            ).not.toHaveClass("has-piece")
          }
        )
      )
    })

    it("should have the .has-piece class on chessboard with pieces", () => {
      idxsWithPieces.forEach((i) => {
        expect(wrapper.querySelectorAll("[data-square]")[i]).toHaveClass(
          "has-piece"
        )
      })
    })
  }
)

it("cleanup() removes chessboard correctly", () => {
  const el = document.createElement("div")
  const board = new Chessboard(el)
  expect(el.childNodes.length).toBeGreaterThan(0)
  board.cleanup()
  expect(el.childNodes.length).toEqual(0)
})

describe("Initial chessboard", () => {
  it("should have the same number of clickable cells as number of pieces", () => {
    const pieces = {
      a4: { color: "white", pieceType: "queen" },
      f7: { color: "black", pieceType: "pawn" },
      h2: { color: "black", pieceType: "bishop" },
    } as const
    const [wrapper] = buildChessboard("white", pieces)

    expect(within(wrapper).getAllByRole("gridcell")).toHaveLength(3)
  })

  it("should correctly remove and apply classes and attributes on two-click moves", async () => {
    const pieces = {
      f7: { color: "black", pieceType: "pawn" },
    } as const
    const [wrapper] = buildChessboard("white", pieces)

    expect(wrapper.querySelector('[data-square="f7"]')).toHaveClass("has-piece")
    userEvent.click(within(wrapper).getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )
    userEvent.click(within(wrapper).getByRole("gridcell", { name: /e3/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(wrapper.querySelector('[data-square="e3"]')).toHaveClass("has-piece")
    expect(wrapper.querySelector('[data-square="f7"]')).not.toHaveClass(
      "has-piece"
    )
  })

  it("ignores click events when there is no piece on square", () => {
    const pieces = {
      f7: { color: "black", pieceType: "pawn" },
    } as const
    const [wrapper] = buildChessboard("white", pieces)
    const square = wrapper.querySelector('[data-square="a3"]')
    userEvent.click(square as Element)
    expect(wrapper.firstElementChild).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("ignores click events when data attributes are corrupted", () => {
    const pieces = {
      f7: { color: "black", pieceType: "pawn" },
    } as const
    const [wrapper] = buildChessboard("white", pieces)
    const square = wrapper.querySelector('[data-square="f7"]')
    square?.setAttribute("data-square", "foo")
    userEvent.click(square as Element)
    expect(wrapper.firstElementChild).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("should keep classes and attributes when move is cancelled", async () => {
    const pieces = {
      f7: { color: "black", pieceType: "pawn" },
    } as const
    const [wrapper] = buildChessboard("white", pieces)

    expect(wrapper.querySelector('[data-square="f7"]')).toHaveClass("has-piece")
    userEvent.click(within(wrapper).getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )
    userEvent.click(within(wrapper).getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(wrapper.querySelector('[data-square="f7"]')).toHaveClass("has-piece")
  })
})
