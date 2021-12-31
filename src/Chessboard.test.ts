import * as fc from "fast-check"
import {
  getOppositeSide,
  getSquare,
  getSquareColor,
  getVisualRowColumn,
  Piece,
  Side,
  Square,
} from "./utils-chess"
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

describe("Chessboard", () => {
  it("should correctly handle two-click moves", async () => {
    const [wrapper] = buildChessboard("white", {
      c3: { color: "black", pieceType: "rook" },
    })
    userEvent.click(within(wrapper).getByRole("gridcell", { name: /c3/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )
    userEvent.click(within(wrapper).getByRole("gridcell", { name: /e7/i }))
    await waitFor(() =>
      expect(wrapper.querySelector('[data-square="e7"]')).toHaveClass(
        "has-piece"
      )
    )
  })
})
