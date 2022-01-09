import { Piece, PieceType, Side } from "../utils/chess"
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
  /**
   * Associated `Piece` definition.
   */
  readonly piece: Piece

  /**
   * SVG element representing the piece.
   */
  private readonly _element: SVGSVGElement

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
    container.appendChild(this._element)
  }

  remove() {
    removeElement(this._element)
  }
}
