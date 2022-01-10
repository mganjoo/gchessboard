import * as fc from "fast-check"
import {
  getSquare,
  getSquareColor,
  getVisualIndex,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { ChessxBoard } from "./ChessxBoard"

customElements.define(
  "test-component",
  class extends HTMLElement {
    constructor() {
      super()
      const div = document.createElement("div")
      const p = document.createElement("p")
      p.dataset.square = "a3"
      p.textContent = "It does work"
      div.appendChild(p)
      this.appendChild(div)
    }
  }
)

customElements.define("chessx-board", ChessxBoard)

function buildChessboard(
  orientation: Side,
  pieces?: Partial<Record<Square, Piece>>,
  interactive?: boolean
) {
  const interactiveFinal = interactive !== undefined ? interactive : true
  document.body.innerHTML = `
    <chessx-board
      orientation="${orientation}"
      interactive=${interactiveFinal.toString()}>
    </chessx-board>`
  const board = document.querySelector("chessx-board") as ChessxBoard
  if (pieces !== undefined) {
    board.pieces = pieces
  }
  return board
}

describe("Chessboard creation and cleanup", () => {
  const pieces = {
    b3: { color: "white", pieceType: "queen" },
    e6: { color: "black", pieceType: "knight" },
    g1: { color: "white", pieceType: "king" },
  } as const
  const side = "white"
  buildChessboard(side, pieces)
  const idxsWithPieces = (Object.keys(pieces) as (keyof typeof pieces)[]).map(
    (s) => getVisualIndex(s, side)
  )

  it("should add correct classes and attributes to chessboard", () => {
    fc.assert(
      fc.property(fc.nat({ max: 63 }), (idx) => {
        const squareElement = document.querySelectorAll("[data-square]")[idx]
        const expectedSquare = getSquare(idx, side)
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
            document.querySelectorAll("[data-square]")[idx]
          ).not.toHaveClass("has-piece")
        }
      )
    )
  })

  it("should have the .has-piece class on chessboard with pieces", () => {
    idxsWithPieces.forEach((i) => {
      expect(document.querySelectorAll("[data-square]")[i]).toHaveClass(
        "has-piece"
      )
    })
  })
})

describe("Click-based moving", () => {
  const pieces = {
    b3: { color: "white", pieceType: "queen" },
    e6: { color: "black", pieceType: "knight" },
    f7: { color: "black", pieceType: "pawn" },
  } as const

  it("works correctly", async () => {
    const chessboard = buildChessboard("white", pieces)

    expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveClass(
      "has-piece"
    )
    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveFocus()
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )

    userEvent.click(screen.getByRole("gridcell", { name: "e3" }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(screen.getByRole("gridcell", { name: /e3/i })).toHaveClass(
      "has-piece"
    )
    // Focus doesn't move with mouse-based moves
    expect(screen.getByRole("gridcell", { name: /e3/i })).not.toHaveFocus()

    // Emptied previous square
    expect(screen.getByRole("gridcell", { name: "f7" })).not.toHaveClass(
      "has-piece"
    )
  })

  it("ignores click events when there is no piece on square", () => {
    const chessboard = buildChessboard("white", pieces)
    userEvent.click(screen.getByRole("gridcell", { name: /a3/i }))
    expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("ignores click events when clicking on a cell that does not have a square attribute", () => {
    const chessboard = buildChessboard("white", pieces)
    const square = chessboard.querySelector('[data-square="f7"]')
    square?.setAttribute("data-square", "foo")
    userEvent.click(square as Element)
    expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("cancels move when square is clicked again", async () => {
    const chessboard = buildChessboard("white", pieces)

    expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveClass(
      "has-piece"
    )
    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )

    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveClass(
      "has-piece"
    )
    expect(screen.getByRole("gridcell", { name: /f7/i })).not.toHaveFocus()
  })

  it("cancels move when pressing enter on starting square", async () => {
    const chessboard = buildChessboard("white", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    userEvent.keyboard("[Enter]")
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    // Keep focus on square if the cancel was keyboard-based
    expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveFocus()
  })

  it("cancels move when grid loses focus", async () => {
    const chessboard = buildChessboard("black", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
    screen.getByRole("gridcell", { name: /e6/i }).blur()
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
  })

  it("cancels move when clicking outside grid", async () => {
    const chessboard = buildChessboard("white", pieces)
    const button = document.createElement("button")
    button.innerText = "button outside"
    document.body.appendChild(button)

    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    userEvent.click(screen.getByRole("button"))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
  })

  it("allows keyboard to take over after first square is clicked", async () => {
    const chessboard = buildChessboard("black", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
    userEvent.keyboard("[ArrowUp][ArrowUp][ArrowLeft][Enter]") // e6 -> e5 -> e4 -> f4
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(screen.getByRole("gridcell", { name: /f4/i })).toHaveFocus()
  })
})

describe("Keyboard-based interaction", () => {
  const pieces = {
    a4: { color: "white", pieceType: "bishop" },
    e6: { color: "black", pieceType: "knight" },
    g1: { color: "white", pieceType: "king" },
  } as const

  it("tabs into first occupied piece from bottom left, orientation = white", () => {
    buildChessboard("white", pieces)
    expect(document.body).toHaveFocus()
    userEvent.tab()
    expect(screen.getByRole("gridcell", { name: /g1/i })).toHaveFocus()
    // Next tab should tab out of grid
    userEvent.tab()
    expect(document.body).toHaveFocus()
  })

  it("tabs into first occupied piece from bottom left, orientation = black", () => {
    buildChessboard("black", pieces)
    expect(document.body).toHaveFocus()
    userEvent.tab()
    expect(screen.getByRole("gridcell", { name: /e6/i })).toHaveFocus()
    // Next tab should tab out of grid
    userEvent.tab()
    expect(document.body).toHaveFocus()
  })

  it("handles keyboard navigation correctly", () => {
    buildChessboard("white", pieces)
    userEvent.tab()
    expect(screen.getByRole("gridcell", { name: /white king/i })).toHaveFocus()
    userEvent.keyboard(
      "[ArrowDown][ArrowRight][ArrowUp][ArrowUp][ArrowLeft][ArrowUp][ArrowLeft][ArrowDown]"
    ) // g1 -> f3
    expect(screen.getByRole("gridcell", { name: /f3/i })).toHaveFocus()
    userEvent.keyboard("[PageUp]") // f3 -> f8
    expect(screen.getByRole("gridcell", { name: /f8/i })).toHaveFocus()
    userEvent.keyboard("[ArrowDown][Home]") // f8 -> a7
    expect(screen.getByRole("gridcell", { name: /a7/i })).toHaveFocus()
    userEvent.keyboard("[ArrowDown][End]") // a7 -> h6
    expect(screen.getByRole("gridcell", { name: /h6/i })).toHaveFocus()
    userEvent.keyboard("[ArrowRight][ArrowLeft][PageDown]") // h6 -> g1
    expect(screen.getByRole("gridcell", { name: /g1/i })).toHaveFocus()
    userEvent.keyboard("[ArrowUp][ControlLeft>][Home]") // g1 -> a8
    expect(screen.getByRole("gridcell", { name: /a8/i })).toHaveFocus()
    userEvent.keyboard("[ArrowRight][ControlLeft>][End]") // a8 -> h1
    expect(screen.getByRole("gridcell", { name: /h1/i })).toHaveFocus()

    // Still only one square should be tabbable
    userEvent.tab()
    expect(document.body).toHaveFocus()
    userEvent.tab({ shift: true })
    expect(screen.getByRole("gridcell", { name: /h1/i })).toHaveFocus()
    userEvent.tab({ shift: true })
    expect(document.body).toHaveFocus()
  })

  it("handles keyboard-based moves correctly", () => {
    const chessboard = buildChessboard("black", pieces)
    userEvent.tab()
    userEvent.keyboard("[Enter]")
    expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
      "data-move-state",
      "moving-piece-kb"
    )
    userEvent.keyboard("[ArrowRight][ArrowRight][ArrowUp][Enter]") // e6 -> c5 -> enter
    expect(screen.getByRole("gridcell", { name: /c5/i })).toHaveFocus()
    expect(screen.getByRole("gridcell", { name: /c5/i })).toHaveClass(
      "has-piece"
    )
  })

  it("ignores keypress events when there is no piece on square", () => {
    const chessboard = buildChessboard("white", pieces)
    userEvent.tab()
    userEvent.keyboard("[Home][Enter]")
    expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("ignores keypress events when pressing enter on a div that does not have a square attribute", () => {
    const chessboard = buildChessboard("white", pieces)
    userEvent.tab()
    const square = chessboard.querySelector('[data-square="g1"]')
    square?.setAttribute("data-square", "foo")
    userEvent.keyboard("[Enter]")
    expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("lets mouse take over from navigation", () => {
    buildChessboard("black", pieces)
    userEvent.tab()
    userEvent.keyboard("[Enter]")
    userEvent.keyboard("[ArrowRight][ArrowRight][ArrowUp]") // e6 -> c5
    userEvent.click(screen.getByRole("gridcell", { name: /h5/i }))
    // Mouse-based clicks should not transfer focus
    expect(screen.getByRole("gridcell", { name: /h5/i })).not.toHaveFocus()
    expect(screen.getByRole("gridcell", { name: /h5/i })).toHaveClass(
      "has-piece"
    )
  })
})

describe("Drag-based interaction", () => {
  const pieces = {
    f7: { color: "black", pieceType: "pawn" },
  } as const

  it("works correctly", async () => {
    const chessboard = buildChessboard("white", pieces)

    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "touching-first-square"
      )
    )
    fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f6/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "dragging"
      )
    )
    fireEvent.mouseUp(screen.getByRole("gridcell", { name: /f5/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(screen.getByRole("gridcell", { name: /f5/i })).toHaveClass(
      "has-piece"
    )
    // Drag moves should not transfer focus
    expect(screen.getByRole("gridcell", { name: /f5/i })).not.toHaveFocus()
  })

  it("cancels move when move when dropping on same square", async () => {
    const chessboard = buildChessboard("white", pieces)

    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f8/i }))
    fireEvent.mouseUp(screen.getByRole("gridcell", { name: /f7/i }))
    expect(screen.getByRole("gridcell", { name: /f7/i })).not.toHaveFocus()
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
  })

  it("ignores additional mousedown events or concurrent keyboard events", async () => {
    const chessboard = buildChessboard("white", pieces)

    userEvent.tab()
    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "touching-first-square"
      )
    )

    // Ignores additional mouse down events
    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "touching-first-square"
      )
    )

    // Start dragging
    fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f6/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "dragging"
      )
    )

    // Ignores additional mouse down events
    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "dragging"
      )
    )

    // Ignore additional mouse move events
    fireEvent.mouseMove(screen.getByRole("gridcell", { name: /a3/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "dragging"
      )
    )

    // Let focus move around, but ignore enter press
    userEvent.tab()
    userEvent.keyboard("[ArrowLeft][ArrowLeft][Enter]")
    expect(screen.getByRole("gridcell", { name: /d7/i })).toHaveFocus()
    expect(screen.getByRole("gridcell", { name: /f7/i })).toHaveClass(
      "has-piece"
    )

    // Finish dragging
    fireEvent.mouseUp(screen.getByRole("gridcell", { name: /f5/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(screen.getByRole("gridcell", { name: /f5/i })).toHaveClass(
      "has-piece"
    )
    expect(document.body).toHaveFocus()
  })

  it("ignores cancellation on start square if it leads into drag", async () => {
    const chessboard = buildChessboard("white", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )
    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "canceling-second-touch"
      )
    )
    fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f6/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "dragging"
      )
    )
  })

  it("continues with cancellation after second touch on start square if it does not lead into drag", async () => {
    const chessboard = buildChessboard("white", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )
    fireEvent.mouseDown(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "canceling-second-touch"
      )
    )
    fireEvent.mouseMove(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).toHaveAttribute(
        "data-move-state",
        "canceling-second-touch"
      )
    )
  })
})

describe("Chessboard interactivity", () => {
  const pieces = {
    e6: { color: "black", pieceType: "knight" },
  } as const

  it("ignores interactions when initialized with interactive = false", async () => {
    const chessboard = buildChessboard("white", pieces, false)
    expect(screen.queryByRole("gridcell")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
        "data-move-state"
      )
    )
    userEvent.click(chessboard.querySelector('[data-square="e6"]') as Element)
    userEvent.click(chessboard.querySelector('[data-square="g1"]') as Element)
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
        "data-move-state"
      )
    )
    expect(chessboard.querySelector('[data-square="g1"]')).not.toHaveClass(
      "has-piece"
    )
  })

  it("ignores interactions when interactive is changed to false", async () => {
    const chessboard = buildChessboard("white", pieces)
    userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
    userEvent.click(screen.getByRole("gridcell", { name: /d3/i }))
    expect(screen.getByRole("gridcell", { name: /d3/i })).toHaveClass(
      "has-piece"
    )
    chessboard.interactive = false

    expect(screen.queryByRole("gridcell")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
        "data-move-state"
      )
    )
    userEvent.click(chessboard.querySelector('[data-square="d3"]') as Element)
    userEvent.click(chessboard.querySelector('[data-square="g1"]') as Element)
    await waitFor(() =>
      expect(chessboard.querySelector(".chessboard")).not.toHaveAttribute(
        "data-move-state"
      )
    )
    expect(chessboard.querySelector('[data-square="g1"]')).not.toHaveClass(
      "has-piece"
    )
  })
})
