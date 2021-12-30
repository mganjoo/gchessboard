import { Meta, Story } from "@storybook/html"
import { Chessboard } from "./Chessboard"
import { Side } from "./common-types"
interface ChessboardProps {
  orientation: Side
}

const SIDE_OPTIONS: Side[] = ["white", "black"]

export default {
  argTypes: {
    orientation: {
      options: SIDE_OPTIONS,
      control: { type: "radio" },
    },
  },
  decorators: [
    (story) => {
      const wrapperDiv = document.createElement("div")
      wrapperDiv.style.maxWidth = "28rem"
      const wrappedStory = story()
      if (typeof wrappedStory !== "string") {
        wrapperDiv.appendChild(wrappedStory)
      }
      return wrapperDiv
    },
  ],
} as Meta

const Template: Story<ChessboardProps> = ({ orientation }) => {
  const el = document.createElement("div")
  new Chessboard(el, {
    orientation: orientation,
    pieces: {
      e4: { color: "white", pieceType: "queen" },
      g5: { color: "black", pieceType: "knight" },
      b2: { color: "white", pieceType: "king" },
    },
  })
  return el
}

export const Default = Template.bind({})
Default.args = {
  orientation: "white",
}
