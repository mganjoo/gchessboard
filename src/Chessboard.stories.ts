import { Meta, Story } from "@storybook/html"
import { Chessboard } from "./Chessboard"
import { Side } from "./utils/chess"
interface ChessboardProps {
  orientation: Side
  showOutsideLink: boolean
}

const SIDE_OPTIONS: Side[] = ["white", "black"]

export default {
  argTypes: {
    orientation: {
      options: SIDE_OPTIONS,
      control: { type: "radio" },
    },
    showOutsideLink: {
      type: "boolean",
    },
  },
} as Meta

const Template: Story<ChessboardProps> = ({ orientation, showOutsideLink }) => {
  const wrapperDiv = document.createElement("div")
  wrapperDiv.style.maxWidth = "28rem"
  new Chessboard(wrapperDiv, {
    orientation: orientation,
    pieces: {
      e4: { color: "white", pieceType: "queen" },
      g5: { color: "black", pieceType: "knight" },
      b2: { color: "white", pieceType: "king" },
    },
  })
  if (showOutsideLink) {
    const a = document.createElement("a")
    a.href = "#"
    a.innerText = "sample outside link to test focus/blur"
    wrapperDiv.appendChild(a)
  }
  return wrapperDiv
}

export const Default = Template.bind({})
Default.args = {
  orientation: "white",
  showOutsideLink: false,
}
