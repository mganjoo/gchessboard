import { Meta, Story } from "@storybook/html"
import { Chessboard, ChessboardConfig } from "./Chessboard"
import { Side } from "./utils/chess"

// Assign as variable to ensure type checking
const SIDE_OPTIONS: Side[] = ["white", "black"]

export default {
  title: "Chessboard",
  decorators: [
    (storyDiv) => {
      const d = storyDiv() as HTMLDivElement
      d.style.maxWidth = "24rem"
      return d
    },
  ],
  argTypes: {
    orientation: {
      options: SIDE_OPTIONS,
      control: { type: "radio" },
    },
  },
} as Meta

const Template: Story<ChessboardConfig> = (config) => {
  const container = document.createElement("div")
  new Chessboard(container, config)
  return container
}

export const Default = Template.bind({})
Default.args = {
  orientation: "white",
  pieces: {
    a1: { color: "white", pieceType: "rook" },
    b1: { color: "white", pieceType: "knight" },
    c1: { color: "white", pieceType: "bishop" },
    d1: { color: "white", pieceType: "queen" },
    e1: { color: "white", pieceType: "king" },
    f1: { color: "white", pieceType: "bishop" },
    g1: { color: "white", pieceType: "knight" },
    h1: { color: "white", pieceType: "rook" },
    a2: { color: "white", pieceType: "pawn" },
    b2: { color: "white", pieceType: "pawn" },
    c2: { color: "white", pieceType: "pawn" },
    d2: { color: "white", pieceType: "pawn" },
    e2: { color: "white", pieceType: "pawn" },
    f2: { color: "white", pieceType: "pawn" },
    g2: { color: "white", pieceType: "pawn" },
    h2: { color: "white", pieceType: "pawn" },
    a8: { color: "black", pieceType: "rook" },
    b8: { color: "black", pieceType: "knight" },
    c8: { color: "black", pieceType: "bishop" },
    d8: { color: "black", pieceType: "queen" },
    e8: { color: "black", pieceType: "king" },
    f8: { color: "black", pieceType: "bishop" },
    g8: { color: "black", pieceType: "knight" },
    h8: { color: "black", pieceType: "rook" },
    a7: { color: "black", pieceType: "pawn" },
    b7: { color: "black", pieceType: "pawn" },
    c7: { color: "black", pieceType: "pawn" },
    d7: { color: "black", pieceType: "pawn" },
    e7: { color: "black", pieceType: "pawn" },
    f7: { color: "black", pieceType: "pawn" },
    g7: { color: "black", pieceType: "pawn" },
    h7: { color: "black", pieceType: "pawn" },
  },
}

export const Wrapped = Template.bind({})
Wrapped.args = {
  ...Default.args,
}
Wrapped.decorators = [
  (storyDiv) => {
    const wrapper = document.createElement("div")
    wrapper.appendChild(storyDiv() as HTMLDivElement)
    wrapper.insertAdjacentHTML(
      "beforeend",
      `<p>
        Here is some sample text, including a <a href="#">link</a>, to test focus/blur.
      </p>`
    )
    return wrapper
  },
]
