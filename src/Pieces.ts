import {
  getSquare,
  getVisualIndex,
  Piece,
  PieceType,
  Side,
  Square,
} from "./utils/chess"
import sprite from "./sprite.svg"
import { makeSvgElement, removeElement } from "./utils/dom"

/**
 * Visual layer for management of chessboard pieces and their rendering.
 */
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
  private _orientation: Side

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

  /**
   * Creates an SVG layer for display and manipulation of pieces.
   *
   * @param container element that should contain pieces SVG.
   * @param orientation initial orientation for pieces.
   * @param pieces optional map of square -> piece.
   */
  constructor(
    container: HTMLElement,
    orientation: Side,
    pieces?: Partial<Record<Square, Piece>>
  ) {
    this.group = makeSvgElement("svg", {
      attributes: {
        viewbox: "0 0 100 100",
        width: "100%",
        height: "100%",
        role: "presentation",
      },
      classes: ["pieces"],
    })
    this._orientation = orientation
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

  get orientation() {
    return this._orientation
  }

  /**
   * Update orientation of pieces to `orientation` and update visual elements.
   */
  set orientation(orientation: Side) {
    this._orientation = orientation
    this.draw()
  }

  /**
   * Return the piece on `square` if it exists.
   */
  pieceOn(square: Square): Piece | undefined {
    return this.pieces[square]?.piece
  }

  /**
   * Return the first occupied square, from the player's orientation (i.e.
   * from bottom left of the visual board), if it exists.
   */
  firstOccupiedSquare(): Square | undefined {
    for (let row = 7; row >= 0; row--) {
      for (let col = 0; col < 8; col++) {
        const square = getSquare(8 * row + col, this.orientation)
        if (square in this.pieces) {
          return square
        }
      }
    }
    return undefined
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
      return true
    }
    return false
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
    const idx = getVisualIndex(square, this.orientation)
    pieceElement.style.transform = `translate(${
      (idx & 0x7) * 12.5 + Pieces.PIECE_PADDING_PCT
    }%, ${(idx >> 3) * 12.5 + Pieces.PIECE_PADDING_PCT}%)`
  }
}
