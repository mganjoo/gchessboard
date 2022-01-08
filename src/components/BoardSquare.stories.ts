import { Meta, Story } from "@storybook/html"
import { BoardSquare, BoardSquareConfig } from "./BoardSquare"
import { PieceType, PIECE_TYPES, Side, SIDE_COLORS } from "../utils/chess"
import { Square } from "../utils/chess"

// Assign as variable to ensure type checking
const LABEL_OPTIONS: Square[] = ["a1", "a8", "b2", "c4", "e6", "f2", "g7"]
type BoardSquareStoryArgs = Omit<BoardSquareConfig, "piece"> & {
  hasPiece: boolean
  pieceType: PieceType
  pieceColor: Side
}

export default {
  title: "Board Square",
  argTypes: {
    label: {
      options: LABEL_OPTIONS,
      control: "select",
    },
    pieceType: {
      options: PIECE_TYPES,
      control: "select",
    },
    pieceColor: {
      options: SIDE_COLORS,
      control: "radio",
    },
  },
} as Meta

const Template: Story<BoardSquareStoryArgs> = (config) => {
  const { hasPiece, pieceType, pieceColor, ...rest } = config
  const grid = document.createElement("table")
  // Define 8 columns, even though we are only rendering one cell, so that
  // width of the rendered cell is one-eighth of the total table width.
  grid.insertAdjacentHTML(
    "afterbegin",
    "<colgroup><col><col><col><col><col><col><col><col></colgroup>"
  )

  const row = document.createElement("tr")
  grid.classList.add("chessboard--squares")
  if (rest.interactive) {
    grid.setAttribute("role", "grid")
    row.setAttribute("role", "row")
  }
  grid.appendChild(row)
  new BoardSquare(row, {
    ...rest,
    piece: hasPiece ? { color: pieceColor, pieceType } : undefined,
  })
  return grid
}

export const Default = Template.bind({})
Default.args = {
  label: "a1",
  interactive: true,
  tabbable: false,
  hasPiece: true,
  pieceType: "queen",
  pieceColor: "black",
  rankLabelShown: false,
  fileLabelShown: false,
}
