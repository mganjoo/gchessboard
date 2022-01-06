import { screen } from "@testing-library/dom"
import { PieceType, Side, Square, SquareColor } from "../utils/chess"
import { BoardSquare, BoardSquareConfig } from "./BoardSquare"

function makeBoardSquare(
  config: BoardSquareConfig
): [HTMLElement, BoardSquare] {
  const table = document.createElement("table")
  const tr = document.createElement("tr")
  table.appendChild(tr)
  const square = new BoardSquare(tr, config)
  document.body.replaceChildren(table)
  return [table, square]
}
describe("BoardSquare", () => {
  it.each<{ square: Square; color: SquareColor }>([
    { square: "g5", color: "dark" },
    { square: "c4", color: "light" },
    { square: "f8", color: "dark" },
    { square: "e2", color: "light" },
  ])("renders square $square with color $color", ({ square, color }) => {
    const [elem] = makeBoardSquare({
      label: square,
    })
    expect(elem.querySelector("td")).toHaveAttribute("data-square", square)
    expect(elem.querySelector("td")).toHaveAttribute("data-square-color", color)
    expect(elem.querySelector("td")).not.toHaveAttribute("role")
    expect(elem.querySelector("td")).not.toHaveAttribute("tabindex")
    expect(elem.querySelector("td")).not.toHaveClass("has-piece")
  })

  it.each<{ square: Square; tabbable: boolean; tabindex: string }>([
    { square: "g5", tabbable: true, tabindex: "0" },
    { square: "c4", tabbable: false, tabindex: "-1" },
    { square: "f8", tabbable: true, tabindex: "0" },
  ])(
    "renders interactive square $square correctly that is tabbable = $tabbable",
    ({ square, tabbable, tabindex }) => {
      makeBoardSquare({
        label: square,
        interactive: true,
        tabbable,
      })
      expect(screen.getByRole("gridcell", { name: square })).toHaveAttribute(
        "data-square",
        square
      )
      expect(screen.getByRole("gridcell", { name: square })).toHaveAttribute(
        "tabindex",
        tabindex
      )
      expect(screen.getByRole("gridcell", { name: square })).not.toHaveClass(
        "has-piece"
      )
    }
  )

  it.each<{ square: Square; color: Side; pieceType: PieceType }>([
    { square: "g5", color: "white", pieceType: "king" },
    { square: "c4", color: "black", pieceType: "queen" },
    { square: "f8", color: "white", pieceType: "pawn" },
  ])(
    "renders piece ($pieceType, $color) label correctly",
    ({ square, color, pieceType }) => {
      const [elem] = makeBoardSquare({
        label: square,
        piece: { color, pieceType },
      })
      expect(elem.querySelector("td span")).toHaveTextContent(
        `${color} ${pieceType} on ${square}`
      )
      expect(elem.querySelector("td")).toHaveClass("has-piece")
    }
  )

  it.each<{
    square: Square
    rankLabelShown: boolean
    fileLabelShown: boolean
    rankLabel: string | null
    fileLabel: string | null
  }>([
    {
      square: "g5",
      rankLabelShown: true,
      fileLabelShown: true,
      rankLabel: "5",
      fileLabel: "g",
    },
    {
      square: "c4",
      rankLabelShown: false,
      fileLabelShown: true,
      rankLabel: null,
      fileLabel: "c",
    },
    {
      square: "f8",
      rankLabelShown: true,
      fileLabelShown: false,
      rankLabel: "8",
      fileLabel: null,
    },
    {
      square: "a3",
      rankLabelShown: false,
      fileLabelShown: false,
      rankLabel: null,
      fileLabel: null,
    },
    {
      square: "d2",
      rankLabelShown: false,
      fileLabelShown: true,
      rankLabel: null,
      fileLabel: "d",
    },
  ])(
    "renders rank and file label for $square correctly, showRank = $rankLabelShown, showFile = $fileLabelShown",
    ({ square, rankLabelShown, fileLabelShown, rankLabel, fileLabel }) => {
      const [elem] = makeBoardSquare({
        label: square,
        rankLabelShown,
        fileLabelShown,
      })
      const actualRankLabel = elem
        .querySelector("td")
        ?.getAttribute("data-rank-label")
      const actualFileLabel = elem
        .querySelector("td")
        ?.getAttribute("data-file-label")
      expect(actualRankLabel).toBe(rankLabel)
      expect(actualFileLabel).toBe(fileLabel)
    }
  )
})
