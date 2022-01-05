import * as fc from "fast-check"
import {
  getOppositeSide,
  getSquare,
  getSquareColor,
  getVisualIndex,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { Chessboard } from "./Chessboard"

function buildChessboard(
  orientation: Side,
  pieces?: Partial<Record<Square, Piece>>,
  interactive?: boolean
): [HTMLElement, Chessboard] {
  const wrapper = document.createElement("div")
  document.body.replaceChildren(wrapper)
  return [
    wrapper,
    new Chessboard(wrapper, { orientation, pieces, interactive }),
  ]
}

describe("Chessboard display based on orientation", () => {
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
        chessboard.orientation = getOppositeSide(side)
      }
      const finalSide = flip ? getOppositeSide(side) : side
      const idxsWithPieces = (
        Object.keys(pieces) as (keyof typeof pieces)[]
      ).map((s) => getVisualIndex(s, finalSide))

      it("should add correct classes and attributes to chessboard", () => {
        fc.assert(
          fc.property(fc.nat({ max: 63 }), (idx) => {
            const squareElement = wrapper.querySelectorAll("[data-square]")[idx]
            const expectedSquare = getSquare(idx, finalSide)
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
})

it("cleanup() removes chessboard correctly", () => {
  const el = document.createElement("div")
  const board = new Chessboard(el)
  expect(el.childNodes.length).toBeGreaterThan(0)
  board.cleanup()
  expect(el.childNodes.length).toEqual(0)
})

describe("Click-based moves", () => {
  const pieces = {
    b3: { color: "white", pieceType: "queen" },
    e6: { color: "black", pieceType: "knight" },
    f7: { color: "black", pieceType: "pawn" },
  } as const

  it("works correctly", async () => {
    const [wrapper] = buildChessboard("white", pieces)

    expect(
      screen.getByRole("gridcell", { name: /f7, black pawn/i })
    ).toHaveClass("has-piece")
    userEvent.click(screen.getByRole("gridcell", { name: /f7, black pawn/i }))
    expect(
      screen.getByRole("gridcell", { name: /f7, black pawn/i })
    ).toHaveFocus()
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )

    userEvent.click(screen.getByRole("gridcell", { name: /e3/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(
      screen.getByRole("gridcell", { name: /e3, black pawn/i })
    ).toHaveClass("has-piece")
    expect(
      screen.getByRole("gridcell", { name: /e3, black pawn/i })
    ).toHaveAttribute("aria-label")
    expect(
      screen.getByRole("gridcell", { name: /e3, black pawn/i })
    ).toHaveFocus()

    expect(screen.getByRole("gridcell", { name: /f7/i })).not.toHaveClass(
      "has-piece"
    )
  })

  it("ignores click events when there is no piece on square", () => {
    const [wrapper] = buildChessboard("white", pieces)
    userEvent.click(screen.getByRole("gridcell", { name: /a3/i }))
    expect(wrapper.firstElementChild).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("ignores click events when clicking on a cell that does not have a square attribute", () => {
    const [wrapper] = buildChessboard("white", pieces)
    const square = wrapper.querySelector('[data-square="f7"]')
    square?.setAttribute("data-square", "foo")
    userEvent.click(square as Element)
    expect(wrapper.firstElementChild).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("cancels move when square is clicked again", async () => {
    const [wrapper] = buildChessboard("white", pieces)

    expect(wrapper.querySelector('[data-square="f7"]')).toHaveClass("has-piece")
    userEvent.click(screen.getByRole("gridcell", { name: /black pawn/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-second-touch"
      )
    )

    userEvent.click(screen.getByRole("gridcell", { name: /f7/i }))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(wrapper.querySelector('[data-square="f7"]')).toHaveClass("has-piece")
    expect(wrapper.querySelector('[data-square="f7"]')).not.toHaveFocus()
  })

  it("cancels move when pressing enter on starting square", async () => {
    const [wrapper] = buildChessboard("white", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /black pawn/i }))
    userEvent.keyboard("[Enter]")
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(wrapper.querySelector('[data-square="f7"]')).not.toHaveFocus()
  })

  it("cancels move when grid loses focus", async () => {
    const [wrapper] = buildChessboard("black", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
    screen.getByRole("gridcell", { name: /e6/i }).blur()
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
  })

  it("cancels move when clicking outside grid", async () => {
    const [wrapper] = buildChessboard("white", pieces)
    const button = document.createElement("button")
    button.innerText = "button outside"
    document.body.appendChild(button)

    userEvent.click(screen.getByRole("gridcell", { name: /black pawn/i }))
    userEvent.click(screen.getByRole("button"))
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
  })

  it("allows keyboard to take over after first square is clicked", async () => {
    const [wrapper] = buildChessboard("black", pieces)

    userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
    userEvent.keyboard("[ArrowUp][ArrowUp][ArrowLeft][Enter]") // e6 -> e5 -> e4 -> f4
    await waitFor(() =>
      expect(wrapper.firstElementChild).toHaveAttribute(
        "data-move-state",
        "awaiting-input"
      )
    )
    expect(wrapper.querySelector('[data-square="f4"]')).toHaveClass("has-piece")
    expect(wrapper.querySelector('[data-square="f4"]')).toHaveFocus()
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
  })

  it("tabs into first occupied piece from bottom left, orientation = black", () => {
    buildChessboard("black", pieces)
    expect(document.body).toHaveFocus()
    userEvent.tab()
    expect(screen.getByRole("gridcell", { name: /e6/i })).toHaveFocus()
  })

  it("handles keyboard navigation correctly", () => {
    const [wrapper] = buildChessboard("white", pieces)
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

    // Only one square should have tabindex 0, rest should have tabindex -1
    let tabIndexMinus1Count = 0
    let tabIndex0Count = 0
    wrapper.querySelectorAll("[data-square]").forEach((n) => {
      tabIndexMinus1Count +=
        parseInt(n.getAttribute("tabIndex") || "") === -1 ? 1 : 0
      tabIndex0Count += parseInt(n.getAttribute("tabIndex") || "") === 0 ? 1 : 0
    })
    expect(tabIndex0Count).toBe(1)
    expect(tabIndexMinus1Count).toBe(63)
  })

  it("handles keyboard-based moves correctly", () => {
    const [wrapper] = buildChessboard("black", pieces)
    userEvent.tab()
    userEvent.keyboard("[Enter]")
    expect(wrapper.firstElementChild).toHaveAttribute(
      "data-move-state",
      "moving-piece-kb"
    )
    userEvent.keyboard("[ArrowRight][ArrowRight][ArrowUp][Enter]") // e6 -> c5 -> enter
    expect(
      screen.getByRole("gridcell", { name: /c5, black knight/i })
    ).toHaveFocus()
    expect(
      screen.getByRole("gridcell", { name: /c5, black knight/i })
    ).toHaveClass("has-piece")
  })

  it("ignores keypress events when there is no piece on square", () => {
    const [wrapper] = buildChessboard("white", pieces)
    userEvent.tab()
    userEvent.keyboard("[Home][Enter]")
    expect(wrapper.firstElementChild).toHaveAttribute(
      "data-move-state",
      "awaiting-input"
    )
  })

  it("ignores keypress events when pressing enter on a div that does not have a square attribute", () => {
    const [wrapper] = buildChessboard("white", pieces)
    userEvent.tab()
    const square = wrapper.querySelector('[data-square="g1"]')
    square?.setAttribute("data-square", "foo")
    userEvent.keyboard("[Enter]")
    expect(wrapper.firstElementChild).toHaveAttribute(
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
    expect(screen.getByRole("gridcell", { name: /h5/i })).toHaveFocus()
    expect(
      screen.getByRole("gridcell", { name: /h5, black knight/i })
    ).toHaveClass("has-piece")
  })
})

describe("Chessboard interactivity", () => {
  const pieces = {
    e6: { color: "black", pieceType: "knight" },
  } as const

  it("ignores interactions when initialized with interactive = false", async () => {
    const [wrapper] = buildChessboard("white", pieces, false)
    expect(screen.queryByRole("gridcell")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(wrapper.firstElementChild).not.toHaveAttribute("data-move-state")
    )
    userEvent.click(wrapper.querySelector('[data-square="e6"]') as Element)
    userEvent.click(wrapper.querySelector('[data-square="g1"]') as Element)
    await waitFor(() =>
      expect(wrapper.firstElementChild).not.toHaveAttribute("data-move-state")
    )
    expect(wrapper.querySelector('[data-square="g1"]')).not.toHaveClass(
      "has-piece"
    )
  })

  it("ignores interactions when interactive is changed to false", async () => {
    const [wrapper, chessboard] = buildChessboard("white", pieces)
    userEvent.click(screen.getByRole("gridcell", { name: /e6/i }))
    userEvent.click(screen.getByRole("gridcell", { name: /d3/i }))
    expect(
      screen.getByRole("gridcell", { name: /d3, black knight/i })
    ).toHaveClass("has-piece")
    chessboard.interactive = false

    expect(screen.queryByRole("gridcell")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(wrapper.firstElementChild).not.toHaveAttribute("data-move-state")
    )
    userEvent.click(wrapper.querySelector('[data-square="d3"]') as Element)
    userEvent.click(wrapper.querySelector('[data-square="g1"]') as Element)
    await waitFor(() =>
      expect(wrapper.firstElementChild).not.toHaveAttribute("data-move-state")
    )
    expect(wrapper.querySelector('[data-square="g1"]')).not.toHaveClass(
      "has-piece"
    )
  })
})
