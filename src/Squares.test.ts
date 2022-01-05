import { Squares } from "./Squares"

describe("Squares.movePiece()", () => {
  it("ignores a move from and to the same square", () => {
    const wrapper = document.createElement("div")
    document.body.replaceChildren(wrapper)
    const squares = new Squares(wrapper, {
      orientation: "white",
      pieces: { e7: { pieceType: "knight", color: "white" } },
      interactive: true,
    })
    squares.movePiece("e7", "e7")
    expect(squares.tabbableSquare).toBe("e7")
  })

  it("does not add class and label when interactive = false", () => {
    const wrapper = document.createElement("div")
    document.body.replaceChildren(wrapper)
    const squares = new Squares(wrapper, {
      orientation: "white",
      pieces: { e7: { pieceType: "knight", color: "white" } },
      interactive: false,
    })
    expect(wrapper.querySelector('[data-square="e7"]')).not.toHaveClass(
      "has-piece"
    )
    squares.movePiece("e7", "f3")
    expect(wrapper.querySelector('[data-square="f3"]')).not.toHaveClass(
      "has-piece"
    )
    expect(wrapper.querySelector('[data-square="f3"]')).not.toHaveAttribute(
      "aria-label"
    )
    expect(wrapper.querySelector('[data-square="f3"]')).not.toHaveAttribute(
      "tabindex"
    )
  })
})
