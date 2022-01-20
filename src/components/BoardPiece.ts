import { Piece, PieceType, Side } from "../utils/chess"
import { makeSvgElement } from "../utils/dom"
import sprite from "../sprite.svg"

export interface BoardPieceConfig {
  /**
   * Piece type and color.
   */
  piece: Piece

  /**
   * Whether the piece is to be considered a "secondary" piece on the square.
   * A secondary piece is usually used to represent a "ghost piece" while
   * dragging is in progress, or a piece that is about to be animated out as
   * another piece takes its place.
   */
  secondary?: boolean

  /**
   * Optional position for piece, in case it needs to be placed off square.
   */
  explicitPosition?: ExplicitPiecePosition
}

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
  | { type: "squareOffset"; deltaRows: number; deltaCols: number }

/**
 * Visual representation of a chessboard piece and associated sprite.
 */
export class BoardPiece {
  readonly piece: Piece
  private readonly _element: SVGSVGElement
  private readonly _parentElement: HTMLElement
  private _explicitPosition?: ExplicitPiecePosition

  /**
   * Map of piece to sprite ID in "sprite.svg". The ID will be referenced
   * as `#id` in a <use> block.
   */
  private static SPRITE_ID_MAP: Record<Side, Record<PieceType, string>> = {
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
  }

  /**
   * Padding applied to a piece when placing a piece on a square,
   * as a percentage of the width of the square.
   */
  private static PIECE_PADDING_PCT = 3

  constructor(container: HTMLElement, config: BoardPieceConfig) {
    this.piece = config.piece
    this._parentElement = container
    this._element = makeSvgElement("svg", {
      attributes: {
        viewbox: "0 0 45 45",
        role: "img",
        "aria-label": `${this.piece.color} ${this.piece.pieceType}`,
      },
      classes: ["piece"],
    })
    this._element.appendChild(
      makeSvgElement("use", {
        attributes: {
          href: `${sprite}#${
            BoardPiece.SPRITE_ID_MAP[this.piece.color][this.piece.pieceType]
          }`,
          x: `${BoardPiece.PIECE_PADDING_PCT}%`,
          y: `${BoardPiece.PIECE_PADDING_PCT}%`,
          width: `${100 - BoardPiece.PIECE_PADDING_PCT * 2}%`,
          height: `${100 - BoardPiece.PIECE_PADDING_PCT * 2}%`,
        },
        data: {
          piece: `${this.piece.color}-${this.piece.pieceType}`,
        },
      })
    )
    if (config.explicitPosition !== undefined) {
      this.setExplicitPosition(config.explicitPosition)
    }

    if (config.secondary) {
      this._element.classList.add("secondary")
    }

    container.appendChild(this._element)
  }

  remove() {
    this._parentElement.removeChild(this._element)
  }

  /**
   * Set explicit offset for piece relative to default location in square.
   */
  setExplicitPosition(explicitPosition: ExplicitPiecePosition) {
    this._explicitPosition = explicitPosition
    if (explicitPosition.type === "coordinates") {
      const squareDims = this._parentElement.getBoundingClientRect()
      const deltaX = explicitPosition.x - squareDims.left - squareDims.width / 2
      const deltaY = explicitPosition.y - squareDims.top - squareDims.height / 2
      if (deltaX !== 0 || deltaY !== 0) {
        this._element.style.left = `${deltaX}px`
        this._element.style.top = `${deltaY}px`
      }
    } else {
      if (
        explicitPosition.deltaCols !== 0 ||
        explicitPosition.deltaRows !== 0
      ) {
        this._element.style.left = `${explicitPosition.deltaCols * 100}%`
        this._element.style.top = `${explicitPosition.deltaRows * 100}%`
      }
    }
  }

  /**
   * Reset any explicit position set on the piece. If `transition` is true, then
   * the change is accompanied with a transition.
   */
  resetPosition(transition?: boolean) {
    this._explicitPosition = undefined

    if (transition) {
      this._element.style.transitionProperty = "top, left"
      // Get bounding box for element to force layout before
      // removing top/left property
      // https://gist.github.com/paulirish/5d52fb081b3570c81e3a
      this._parentElement.getBoundingClientRect()
    } else {
      this._element.style.removeProperty("transition-property")
    }

    this._element.style.removeProperty("left")
    this._element.style.removeProperty("top")
  }

  /**
   * Return explicit position of piece on square, if any.
   */
  get explicitPosition() {
    return this._explicitPosition
  }
}
