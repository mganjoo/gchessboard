import { Meta, Story } from "@storybook/html"
import { Chessboard } from "./Chessboard"

const DropdownOptions = ["e8", "e6", "c5", "d3"] as const
type HighlightSquare = typeof DropdownOptions[number]

interface ChessboardProps {
  highlightSquare: HighlightSquare
}

export default {
  argTypes: {
    highlightSquare: { options: DropdownOptions, control: "select" },
  },
  decorators: [
    (story) => {
      const wrapperDiv = document.createElement("div")
      wrapperDiv.style.maxWidth = "32rem"
      const wrappedStory = story()
      if (typeof wrappedStory !== "string") {
        wrapperDiv.appendChild(wrappedStory)
      }
      return wrapperDiv
    },
  ],
} as Meta

const Template: Story<ChessboardProps> = (args) => {
  const el = document.createElement("div")
  const x = new Chessboard(el)
  x.highlightSquare = args.highlightSquare
  return el
}

export const Default = Template.bind({})
