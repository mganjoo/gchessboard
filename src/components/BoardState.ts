import { Square } from "../utils/chess";

export type BoardState =
  | {
      id: "default";
      startSquare?: undefined;
    }
  | {
      id: "awaiting-input";
      startSquare?: undefined;
    }
  | {
      id: "touching-first-square";
      startSquare: Square;
      touchStartX: number;
      touchStartY: number;
    }
  | {
      id: "dragging";
      startSquare: Square;
      highlightedSquare: Square | undefined;
    }
  | {
      id: "moving-piece-kb";
      startSquare: Square;
      highlightedSquare: Square | undefined;
    }
  | {
      id: "awaiting-second-touch";
      startSquare: Square;
    }
  | {
      id: "canceling-second-touch";
      startSquare: Square;
      touchStartX: number;
      touchStartY: number;
    };
