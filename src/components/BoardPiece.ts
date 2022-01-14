import { Piece, PieceType, Side } from "../utils/chess"
import { makeSvgElement, removeElement } from "../utils/dom"
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
   * Optional pixel position for piece, in case it needs to be placed off square.
   */
  explicitPosPx?: { x: number; y: number }
}

/**
 * Visual representation of a chessboard piece and associated sprite.
 */
export class BoardPiece {
  readonly piece: Piece
  private readonly _element: SVGSVGElement
  private _offsetPx?: { dx: number; dy: number }

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
    this._element = makeSvgElement("svg", {
      attributes: {
        viewbox: "0 0 45 45",
        role: "img",
        "aria-label": `${this.piece.color} ${this.piece.pieceType}`,
      },
      classes: ["chessboard--piece"],
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
    if (config.secondary) {
      this._element.classList.add("is-secondary")
    }
    container.appendChild(this._element)
  }

  remove() {
    removeElement(this._element)
  }

  /**
   * Explicit offset for piece relative to default location in square. This is
   * used to represent a piece mid-drag.
   */
  get offsetPx() {
    return this._offsetPx
  }

  set offsetPx(value: { dx: number; dy: number } | undefined) {
    this._offsetPx = value
    if (value === undefined) {
      this._element.style.removeProperty("left")
      this._element.style.removeProperty("top")
    } else {
      this._element.style.left = `${value.dx}px`
      this._element.style.top = `${value.dy}px`
    }
  }
}