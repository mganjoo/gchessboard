import { Square } from "../utils/chess.js";

export type BoardState =
  | {
      id: "default";
      startSquare?: undefined;
      highlightedSquare?: undefined;
    }
  | {
      id: "awaiting-input";
      startSquare?: undefined;
      highlightedSquare?: undefined;
    }
  | {
      id: "touching-first-square";
      startSquare: Square;
      touchStartX: number;
      touchStartY: number;
      highlightedSquare?: undefined;
    }
  | {
      id: "touching-second-square";
      startSquare: Square;
      highlightedSquare?: undefined;
    }
  | {
      id: "dragging";
      startSquare: Square;
      highlightedSquare: Square | undefined;
    }
  | {
      id: "dragging-outside";
      startSquare: Square;
      highlightedSquare?: undefined;
    }
  | {
      id: "moving-piece-kb";
      startSquare: Square;
      highlightedSquare: Square | undefined;
    }
  | {
      id: "awaiting-second-touch";
      startSquare: Square;
      highlightedSquare?: undefined;
    }
  | {
      id: "canceling-second-touch";
      startSquare: Square;
      touchStartX: number;
      touchStartY: number;
      highlightedSquare?: undefined;
    };
