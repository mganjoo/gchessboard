import { Pieces } from "./Pieces"
import { Piece, Square } from "./utils/chess"

function buildPieces(
  pieces?: Partial<Record<Square, Piece>>
): [HTMLElement, Pieces] {
  const wrapper = document.createElement("div")
  document.body.replaceChildren(wrapper)
  return [wrapper, new Pieces(wrapper, "white", pieces)]
}

describe("Pieces.movePiece()", () => {
  it("correctly moves piece between two squares", async () => {
    const [, pieces] = buildPieces({
      b3: { color: "white", pieceType: "queen" },
    })
    expect(pieces.hasPieceOn("b3")).toBeTruthy()
    pieces.movePiece("b3", "d5")
    expect(pieces.hasPieceOn("d5")).toBeTruthy()
    expect(pieces.hasPieceOn("b3")).not.toBeTruthy()
  })

  it("ignores move from square that doesn't contain piece", async () => {
    const [, pieces] = buildPieces({
      b3: { color: "white", pieceType: "queen" },
    })
    pieces.movePiece("a1", "d5")
    expect(pieces.hasPieceOn("d5")).not.toBeTruthy()
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
