import { Pieces } from "./Pieces"
import { Piece, Side, Square } from "./utils/chess"

function buildPieces(
  pieces?: Partial<Record<Square, Piece>>,
  orientation?: Side
): [HTMLElement, Pieces] {
  const wrapper = document.createElement("div")
  document.body.replaceChildren(wrapper)
  return [wrapper, new Pieces(wrapper, orientation || "white", pieces)]
}

describe("Pieces.movePiece()", () => {
  it("correctly moves piece between two squares", async () => {
    const [, pieces] = buildPieces({
      b3: { color: "white", pieceType: "queen" },
    })
    expect(pieces.getPieceOn("b3")).not.toBeUndefined()
    pieces.movePiece("b3", "d5")
    expect(pieces.getPieceOn("d5")).not.toBeUndefined()
    expect(pieces.getPieceOn("b3")).toBeUndefined()
  })

  it("ignores move from square that doesn't contain piece", async () => {
    const [, pieces] = buildPieces({
      b3: { color: "white", pieceType: "queen" },
    })
    pieces.movePiece("a1", "d5")
    expect(pieces.getPieceOn("d5")).toBeUndefined()
  })

  it("replaces piece if target square already contains one", async () => {
    const [wrapper, pieces] = buildPieces({
      a1: { color: "black", pieceType: "knight" },
      b3: { color: "white", pieceType: "queen" },
    })
    expect(wrapper.querySelectorAll("use").length).toEqual(2)
    pieces.movePiece("b3", "a1")
    expect(wrapper.querySelectorAll("use").length).toEqual(1)
  })
})

describe("Pieces.firstOccupiedSquarePlayerView()", () => {
  it("works correctly for orientation = white", () => {
    const [, pieces] = buildPieces(
      {
        f5: { color: "white", pieceType: "pawn" },
        g1: { color: "black", pieceType: "knight" },
        b3: { color: "white", pieceType: "queen" },
      },
      "white"
    )
    expect(pieces.firstOccupiedSquarePlayerView()).toBe("g1")
  })
  it("works correctly for orientation = black", () => {
    const [, pieces] = buildPieces(
      {
        f5: { color: "white", pieceType: "pawn" },
        g1: { color: "black", pieceType: "knight" },
        b3: { color: "white", pieceType: "queen" },
      },
      "black"
    )
    expect(pieces.firstOccupiedSquarePlayerView()).toBe("f5")
  })
})
