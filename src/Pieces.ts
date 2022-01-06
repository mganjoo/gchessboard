import { getSquare, Piece, Side, Square } from "./utils/chess"
import { BoardPiece } from "./components/BoardPiece"
import { makeHTMLElement, removeElement } from "./utils/dom"

/**
 * Visual layer for management of chessboard pieces and their rendering.
 */
export class Pieces {
  private readonly piecesContainer: HTMLElement
  private readonly pieces: Partial<Record<Square, BoardPiece>>
  private _orientation: Side

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
    this._orientation = orientation
    this.piecesContainer = makeHTMLElement("div", {
      attributes: { role: "presentation" },
      classes: ["chessboard--pieces"],
    })
    this.pieces = {}
    Object.entries(pieces || {}).forEach(([key, piece]) => {
      this.pieces[key as Square] = new BoardPiece(this.piecesContainer, {
        piece,
      })
    })
    container.appendChild(this.piecesContainer)

    // Initial render
    this.draw()
  }

  cleanup() {
    removeElement(this.piecesContainer)
  }

  get orientation() {
    return this._orientation
  }

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
      // Remove existing piece on target if it exists
      this.pieces[endSquare]?.cleanup()

      // Move piece and place on grid
      this.pieces[endSquare] = piece
      piece.placePiece(endSquare, this.orientation)

      // Remove entry for old piece
      delete this.pieces[startSquare]
      return true
    }
    return false
  }

  private draw() {
    Object.entries(this.pieces).forEach(([key, piece]) => {
      piece.placePiece(key as Square, this.orientation)
    })
  }
}
