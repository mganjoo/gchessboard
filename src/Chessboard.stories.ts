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
    e4: { color: "white", pieceType: "queen" },
    g5: { color: "black", pieceType: "knight" },
    b2: { color: "white", pieceType: "king" },
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
