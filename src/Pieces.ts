import {
  getVisualRowColumn,
  Piece,
  PieceType,
  Side,
  Square,
} from "./utils/chess"
import sprite from "./sprite.svg"
import { makeSvgElement, removeElement } from "./utils/dom"

export class Pieces {
  private group: SVGSVGElement
  private pieces: Partial<
    Record<
      Square,
      {
        piece: Piece
        element: SVGUseElement
      }
    >
  >
  private orientation: Side
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

  constructor(
    container: Element,
    orientation: Side,
    pieces?: Partial<Record<Square, Piece>>
  ) {
    this.group = makeSvgElement("svg", {
      attributes: {
        viewbox: "0 0 100 100",
        width: "100%",
        height: "100%",
      },
      classes: ["pieces"],
    })
    this.orientation = orientation
    this.pieces = {}
    Object.entries(pieces || {}).forEach(([key, piece]) => {
      const element = this.makePieceElement(piece)
      this.pieces[key as Square] = { piece, element }
      this.group.appendChild(element)
    })

    // Initial render
    this.draw()

    container.appendChild(this.group)
  }

  cleanup() {
    removeElement(this.group)
  }

  updateOrientation(orientation: Side) {
    this.orientation = orientation
    this.draw()
  }

  /**
   * Return true if `square` has a piece currently on it.
   */
  hasPieceOn(square: Square): boolean {
    return square in this.pieces
  }

  /**
   * Move a piece (if it exists) from `startSquare` to `endSquare`.
   */
  movePiece(startSquare: Square, endSquare: Square) {
    const piece = this.pieces[startSquare]
    if (piece && endSquare !== startSquare) {
      const existing = this.pieces[endSquare]
      if (existing) {
        removeElement(existing.element)
      }
      this.pieces[endSquare] = piece
      // TODO: animate moving from original square
      this.drawPiece(piece.element, endSquare)
      delete this.pieces[startSquare]
    }
  }

  private draw() {
    Object.entries(this.pieces).forEach(([key, piece]) => {
      this.drawPiece(piece.element, key as Square)
    })
  }

  private makePieceElement(piece: Piece): SVGUseElement {
    return makeSvgElement("use", {
      attributes: {
        href: `${sprite}#${Pieces.SPRITE_ID_MAP[piece.color][piece.pieceType]}`,
        width: `${12.5 - Pieces.PIECE_PADDING_PCT * 2}%`,
        height: `${12.5 - Pieces.PIECE_PADDING_PCT * 2}%`,
      },
      data: {
        piece: `${piece.color}-${piece.pieceType}`,
      },
    })
  }

  private drawPiece(pieceElement: SVGUseElement, square: Square) {
    const [row, column] = getVisualRowColumn(square, this.orientation)
    pieceElement.style.transform = `translate(${
      column * 12.5 + Pieces.PIECE_PADDING_PCT
    }%, ${row * 12.5 + Pieces.PIECE_PADDING_PCT}%)`
  }
}
