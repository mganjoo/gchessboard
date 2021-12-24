import { Meta, Story } from "@storybook/html"
import { ChessboardHtmlView } from "./ChessboardHtmlView"

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
      wrapperDiv.style.maxWidth = "28rem"
      const wrappedStory = story()
      if (typeof wrappedStory !== "string") {
        wrapperDiv.appendChild(wrappedStory)
      }
      return wrapperDiv
    },
  ],
} as Meta

const Template: Story<ChessboardProps> = () => {
  const el = document.createElement("div")
  new ChessboardHtmlView(el)
  return el
}

export const Default = Template.bind({})
