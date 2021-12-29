import * as fc from "fast-check"
import {
  getSequentialIdx,
  getSquare,
  getSquareColor,
  Piece,
  Side,
  SIDE_COLORS,
  Square,
} from "./common-types"
import { Squares } from "./Squares"

function buildSquares(
  orientation: Side,
  pieces?: Partial<Record<Square, Piece>>
): [Squares, SVGSVGElement] {
  const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  return [new Squares(wrapper, orientation, pieces), wrapper]
}

describe("Squares", () => {
  it("should add correct classes and attributes to each square", () => {
    const pieces = {
      b3: { color: "white", pieceType: "queen" },
      e6: { color: "black", pieceType: "knight" },
      g1: { color: "white", pieceType: "king" },
    } as const
    SIDE_COLORS.forEach((color) => {
      const [, wrapper] = buildSquares(color, pieces)
      const idxsWithPieces = (
        Object.keys(pieces) as (keyof typeof pieces)[]
      ).map((s) => getSequentialIdx(s, color))
      fc.assert(
        fc.property(fc.nat({ max: 63 }), (idx) => {
          const squareElement = wrapper.getElementsByTagName("rect")[idx]
          expect(squareElement).toHaveAttribute(
            "data-square",
            getSquare(idx, color)
          )
          expect(squareElement).toHaveClass(
            getSquareColor(getSquare(idx, color))
          )
        })
      )
      fc.assert(
        fc.property(
          fc.nat({ max: 63 }).filter((i) => !idxsWithPieces.includes(i)),
          (idx) => {
            expect(wrapper.getElementsByTagName("rect")[idx]).not.toHaveClass(
              "has-piece"
            )
          }
        )
      )
      idxsWithPieces.forEach((i) => {
        expect(wrapper.getElementsByTagName("rect")[i]).toHaveClass("has-piece")
      })
    })
  })

  it("should update classes and attributes when orientation changes", () => {
    const pieces = {
      c3: { color: "black", pieceType: "rook" },
      f6: { color: "white", pieceType: "bishop" },
      d1: { color: "black", pieceType: "pawn" },
    } as const
    ;[0, 1].forEach((i) => {
      const color = SIDE_COLORS[i]
      const flippedColor = SIDE_COLORS[1 - i]
      const [squares, wrapper] = buildSquares(color, pieces)
      squares.updateOrientationAndRedraw(flippedColor)
      const idxsWithPieces = (
        Object.keys(pieces) as (keyof typeof pieces)[]
      ).map((s) => getSequentialIdx(s, flippedColor))
      fc.assert(
        fc.property(fc.nat({ max: 63 }), (idx) => {
          const squareElement = wrapper.getElementsByTagName("rect")[idx]
          expect(squareElement).toHaveAttribute(
            "data-square",
            getSquare(idx, flippedColor)
          )
          expect(squareElement).toHaveClass(
            getSquareColor(getSquare(idx, flippedColor))
          )
        })
      )
      fc.assert(
        fc.property(
          fc.nat({ max: 63 }).filter((i) => !idxsWithPieces.includes(i)),
          (idx) => {
            expect(wrapper.getElementsByTagName("rect")[idx]).not.toHaveClass(
              "has-piece"
            )
          }
        )
      )
      idxsWithPieces.forEach((i) => {
        expect(wrapper.getElementsByTagName("rect")[i]).toHaveClass("has-piece")
      })
    })
  })
})
