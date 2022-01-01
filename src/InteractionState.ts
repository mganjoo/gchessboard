import { Square } from "./utils/chess"

export type InteractionState =
  | {
      id: "awaiting-input"
    }
  | {
      id: "touching-first-square"
      square: Square
    }
  | {
      id: "dragging"
      startSquare: Square
    }
  | {
      id: "moving-piece"
    }
  | {
      id: "awaiting-second-touch"
      startSquare: Square
    }
