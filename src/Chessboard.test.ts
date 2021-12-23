import { Chessboard } from "./Chessboard"

describe("Chessboard", () => {
  it("sets highlight square", () => {
    const el = document.createElement("div")
    const board = new Chessboard(el)
    board.highlightSquare = "e6"
    expect(board.highlightSquare).toBe("e6")
  })
})
