import { Piece, PieceType, Side } from "../utils/chess";
import { makeHTMLElement } from "../utils/dom";
import { assertUnreachable } from "../utils/typing";

export type BoardPieceConfig = {
  /**
   * Piece type and color.
   */
  piece: Piece;

  /**
   * Whether the piece is to be considered a "secondary" piece on the square.
   * A secondary piece is usually used to represent a "ghost piece" while
   * dragging is in progress, or a piece that is about to be animated out as
   * another piece takes its place.
   */
  secondary?: boolean;

  /**
   * Optional animation for piece as it transitions onto square.
   */
  animation?: SlideInAnimation | FadeInAnimation;
};

/**
 * Explicit position for piece that is displaced from the center of a square.
 * There are two options:
 *
 * - type = "coordinates": an explicit (x, y) pixel location for piece. This is
 *   useful if piece is being dragged around or animating into the square from
 *   outside the board.
 *
 * - type = "squareOffset": piece is located on a different square on the board,
 *   `deltaRows` rows away and `deltaCols` columns. A positive value for `deltaRows`
 *   means the initial position has a higher y-coordinate than the current square,
 *   and a positive value for `deltaCols` means the initial position has a higher
 *   x-coordinate.
 */
export type ExplicitPiecePosition =
  | { type: "coordinates"; x: number; y: number }
  | { type: "squareOffset"; deltaRows: number; deltaCols: number };

interface BoardPieceAnimationBase {
  type: string;
  durationMs: number;
}

export interface SlideInAnimation extends BoardPieceAnimationBase {
  type: "slide-in";
  from: ExplicitPiecePosition;
}

export interface FadeInAnimation extends BoardPieceAnimationBase {
  type: "fade-in";
}

export interface FadeOutAnimation extends BoardPieceAnimationBase {
  type: "fade-out";
}

export type BoardPieceAnimation =
  | SlideInAnimation
  | FadeInAnimation
  | FadeOutAnimation;

/**
 * Visual representation of a chessboard piece.
 */
export class BoardPiece {
  readonly piece: Piece;
  animationFinished?: Promise<void>;

  private readonly _element: HTMLSpanElement;
  private readonly _parentElement: HTMLElement;
  private _explicitPosition?: ExplicitPiecePosition;

  /**
   * Map of piece to background image CSS class name.
   */
  private static PIECE_CLASS_MAP: Record<Side, Record<PieceType, string>> = {
    white: {
      queen: "wq",
      king: "wk",
      knight: "wn",
      pawn: "wp",
      bishop: "wb",
      rook: "wr",
    },
    black: {
      queen: "bq",
      king: "bk",
      knight: "bn",
      pawn: "bp",
      bishop: "bb",
      rook: "br",
    },
  };

  constructor(container: HTMLElement, config: BoardPieceConfig) {
    this.piece = config.piece;
    this._parentElement = container;
    this._element = makeHTMLElement("span", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true",
        part: `piece-${
          BoardPiece.PIECE_CLASS_MAP[this.piece.color][this.piece.pieceType]
        }`,
      },
      classes: [
        "piece",
        BoardPiece.PIECE_CLASS_MAP[this.piece.color][this.piece.pieceType],
      ],
    });

    if (config.animation !== undefined) {
      this._setAnimation(config.animation);
    }

    if (config.secondary) {
      this._element.classList.add("secondary");
    }

    container.appendChild(this._element);
  }

  /**
   * Remove piece for square it is contained on, along with any animation
   * listeners.
   */
  remove(animationDurationMs?: number) {
    if (animationDurationMs) {
      this._setAnimation({ type: "fade-out", durationMs: animationDurationMs });
    } else {
      this._parentElement.removeChild(this._element);
    }
  }

  /**
   * Set explicit offset for piece relative to default location in square.
   */
  setExplicitPosition(explicitPosition: ExplicitPiecePosition) {
    this._explicitPosition = explicitPosition;
    const coords = this._getTranslateValues(explicitPosition);
    if (coords) {
      this._element.style.transform = `translate(${coords.x}, ${coords.y})`;
    }
  }

  /**
   * Reset any explicit position set on the piece. If `transition` is true, then
   * the change is accompanied with a transition.
   */
  resetPosition(animateDurationMs?: number) {
    if (animateDurationMs && this._explicitPosition) {
      this._setAnimation({
        type: "slide-in",
        from: this._explicitPosition,
        durationMs: animateDurationMs,
      });
    }

    this._element.style.removeProperty("transform");
    this._explicitPosition = undefined;
  }

  /**
   * Return explicit position of piece on square, if any.
   */
  get explicitPosition(): ExplicitPiecePosition | undefined {
    return this._explicitPosition;
  }

  /**
   * Finish any animations, if in progress.
   */
  finishAnimations() {
    this._element.getAnimations().forEach((a) => {
      a.finish();
    });
  }

  private _getTranslateValues(explicitPosition: ExplicitPiecePosition) {
    if (explicitPosition.type === "coordinates") {
      const squareDims = this._parentElement.getBoundingClientRect();
      const deltaX =
        explicitPosition.x - squareDims.left - squareDims.width / 2;
      const deltaY =
        explicitPosition.y - squareDims.top - squareDims.height / 2;
      if (deltaX !== 0 || deltaY !== 0) {
        return { x: `${deltaX}px`, y: `${deltaY}px` };
      }
    } else {
      if (
        explicitPosition.deltaCols !== 0 ||
        explicitPosition.deltaRows !== 0
      ) {
        return {
          x: `${explicitPosition.deltaCols * 100}%`,
          y: `${explicitPosition.deltaRows * 100}%`,
        };
      }
    }
    return undefined;
  }

  private _setAnimation(animationSpec: BoardPieceAnimation) {
    let keyframes: Keyframe[] | undefined;
    let onfinish: (() => void) | undefined;

    // Always have exactly one animation running at a time.
    this.finishAnimations();

    switch (animationSpec.type) {
      case "slide-in":
        {
          const coords = this._getTranslateValues(animationSpec.from);
          if (coords) {
            keyframes = [
              { transform: `translate(${coords.x}, ${coords.y})` },
              { transform: "none" },
            ];
            this._element.classList.add("moving");
          }
          onfinish = () => {
            this._element.classList.remove("moving");
          };
        }
        break;
      case "fade-in":
        keyframes = [{ opacity: 0 }, { opacity: 1 }];
        break;
      case "fade-out":
        {
          keyframes = [{ opacity: 1 }, { opacity: 0 }];
          const elementCopy = this._element;
          onfinish = () => {
            this._parentElement.removeChild(elementCopy);
          };
        }
        break;
      default:
        assertUnreachable(animationSpec);
    }
    if (
      keyframes !== undefined &&
      typeof this._element.animate === "function"
    ) {
      const animation = this._element.animate(keyframes, {
        duration: Math.max(0, animationSpec.durationMs),
      });

      this.animationFinished = new Promise<void>((resolve) => {
        animation.onfinish = () => {
          if (onfinish !== undefined) {
            onfinish();
          }
          this.animationFinished = undefined;
          resolve();
        };
      });
    } else if (onfinish !== undefined) {
      onfinish();
    }
  }
}
