import { Square } from "./utils/chess"

export type InteractionState =
  | {
      id: "awaiting-input"
    }
  | {
      id: "touching-first-square"
      square: Square
      touchStartX: number
      touchStartY: number
    }
  | {
      id: "dragging"
      startSquare: Square
      x: number
      y: number
    }
  | {
      id: "moving-piece-kb"
      startSquare: Square
    }
  | {
      id: "awaiting-second-touch"
      startSquare: Square
    }
