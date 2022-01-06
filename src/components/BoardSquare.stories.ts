import { Meta, Story } from "@storybook/html"
import { BoardSquare, BoardSquareConfig } from "./BoardSquare"
import { PieceType, PIECE_TYPES, Side, SIDE_COLORS } from "../utils/chess"
import { Square } from "../utils/chess"

// Assign as variable to ensure type checking
const LABEL_OPTIONS: Square[] = ["a1", "a8", "b2", "c4", "e6", "f2", "g7"]
type BoardSquareStoryArgs = Omit<BoardSquareConfig, "piece"> & {
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
  const { pieceType, pieceColor, ...rest } = config
  const grid = document.createElement("table")
  const row = document.createElement("tr")
  grid.classList.add("chessboard--squares")
  grid.style.width = "4rem"
  grid.style.height = "4rem"
  if (rest.interactive) {
    grid.setAttribute("role", "grid")
    row.setAttribute("role", "row")
  }
  grid.appendChild(row)
  new BoardSquare(row, {
    ...rest,
    piece: { color: pieceColor, pieceType },
  })
  return grid
}

export const Default = Template.bind({})
Default.args = {
  label: "a1",
  interactive: true,
  tabbable: false,
  pieceType: "queen",
  pieceColor: "black",
  rankLabelShown: false,
  fileLabelShown: false,
}
