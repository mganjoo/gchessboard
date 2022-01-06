import {
  getVisualRowColumn,
  Piece,
  PieceType,
  Side,
  Square,
} from "../utils/chess"
import { makeSvgElement, removeElement } from "../utils/dom"
import sprite from "../sprite.svg"

export interface BoardPieceConfig {
  /**
   * Piece type and color.
   */
  piece: Piece
}

/**
 * Visual representation of a chessboard piece and associated sprite.
 */
export class BoardPiece {
  readonly piece: Piece
  private readonly element: SVGUseElement

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
   * as a percentage of the width of the chessboard.
   */
  private static PIECE_PADDING_PCT = 0.4

  constructor(container: SVGElement, config: BoardPieceConfig) {
    this.piece = config.piece
    this.element = makeSvgElement("use", {
      attributes: {
        href: `${sprite}#${
          BoardPiece.SPRITE_ID_MAP[this.piece.color][this.piece.pieceType]
        }`,
        width: `${12.5 - BoardPiece.PIECE_PADDING_PCT * 2}%`,
        height: `${12.5 - BoardPiece.PIECE_PADDING_PCT * 2}%`,
      },
      data: {
        piece: `${this.piece.color}-${this.piece.pieceType}`,
      },
    })
    container.appendChild(this.element)
  }

  cleanup() {
    removeElement(this.element)
  }

  /**
   * Translate piece as if it were on `square`, depending on orientation
   * (starting at top left corner of grid).
   */
  placePiece(square: Square, orientation: Side) {
    const [row, column] = getVisualRowColumn(square, orientation)
    this.element.style.transform = `translate(${
      column * 12.5 + BoardPiece.PIECE_PADDING_PCT
    }%, ${row * 12.5 + BoardPiece.PIECE_PADDING_PCT}%)`
  }
}
