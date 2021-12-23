import { Meta, Story } from "@storybook/html"
import { Chessboard } from "./Chessboard"

interface ChessboardProps {
  name: string
}

export default {
  argTypes: {
    name: { control: "text" },
  },
} as Meta

const Template: Story<ChessboardProps> = (args) => {
  const el = document.createElement("div")
  const x = new Chessboard(el)
  x.setName(args.name)
  return el
}

export const Default = Template.bind({})
