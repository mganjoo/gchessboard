import { Grid } from "./Grid"

describe("Grid.movePiece()", () => {
  it("ignores a move from and to the same square", () => {
    const wrapper = document.createElement("div")
    document.body.replaceChildren(wrapper)
    const squares = new Grid(wrapper, {
      orientation: "white",
      pieces: { e7: { pieceType: "knight", color: "white" } },
      interactive: true,
    })
    squares.movePiece("e7", "e7")
    expect(squares.tabbableSquare).toBe("e7")
  })
})
