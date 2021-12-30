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
import { Squares } from "./Squares"

function buildSquares(
  orientation: Side,
  pieces?: Partial<Record<Square, Piece>>
): [HTMLElement, Squares] {
  const wrapper = document.createElement("div")
  return [wrapper, new Squares(wrapper, orientation, pieces)]
}

describe.each<{ side: Side; flip: boolean }>([
  { side: "white", flip: false },
  { side: "white", flip: true },
  { side: "black", flip: false },
  { side: "black", flip: true },
])(
  "Squares with orientation = $side, flip orientation after creation = $flip",
  ({ side, flip }) => {
    const pieces = {
      b3: { color: "white", pieceType: "queen" },
      e6: { color: "black", pieceType: "knight" },
      g1: { color: "white", pieceType: "king" },
    } as const
    const [wrapper, squares] = buildSquares(side, pieces)
    if (flip) {
      squares.updateOrientationAndRedraw(getOppositeSide(side))
    }
    const finalSide = flip ? getOppositeSide(side) : side
    const idxsWithPieces = (Object.keys(pieces) as (keyof typeof pieces)[])
      .map((s) => getVisualRowColumn(s, finalSide))
      .flatMap(([row, col]) => row * 8 + col)

    it("should add correct classes and attributes to squares", () => {
      fc.assert(
        fc.property(fc.nat({ max: 7 }), fc.nat({ max: 7 }), (row, col) => {
          const squareElement =
            wrapper.querySelectorAll(".square")[row * 8 + col]
          const expectedSquare = getSquare(row, col, finalSide)
          expect(squareElement).toHaveAttribute("data-square", expectedSquare)
          expect(squareElement).toHaveClass(getSquareColor(expectedSquare))
        })
      )
    })

    it("should not have the .has-piece class on squares without pieces", () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 63 }).filter((idx) => !idxsWithPieces.includes(idx)),
          (idx) => {
            expect(wrapper.querySelectorAll(".square")[idx]).not.toHaveClass(
              "has-piece"
            )
          }
        )
      )
    })

    it("should have the .has-piece class on squares with pieces", () => {
      idxsWithPieces.forEach((i) => {
        expect(wrapper.querySelectorAll(".square")[i]).toHaveClass("has-piece")
      })
    })
  }
)

describe("Squares", () => {
  it.skip("should correctly handle two-click moves", async () => {
    const [wrapper] = buildSquares("white", {
      c3: { color: "black", pieceType: "rook" },
    })
    userEvent.click(within(wrapper).getByRole("button", { name: /c3/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveClass("awaiting-second-touch")
    )
    userEvent.click(within(wrapper).getByLabelText(/e7/i))
  })
})
