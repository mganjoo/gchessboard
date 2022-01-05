import {
  getSquare,
  getSquareColor,
  getVisualIndex,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { makeHTMLElement, removeElement } from "./utils/dom"
import { Pieces } from "./Pieces"

export interface SquaresConfig {
  /**
   * What side's perspective to render squares from (what color appears on bottom).
   */
  orientation: Side
  /**
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  interactive: boolean
  /**
   * Map of square -> piece to initialize with. Since the Squares object manages
   * the pieces layer as well, all pieces management occurs via `SquaresConfig`.
   */
  pieces?: Partial<Record<Square, Piece>>
}

export class Squares {
  pieces: Pieces
  private container: HTMLElement
  private squareElements: HTMLDivElement[]
  private _orientation: Side
  private _interactive: boolean

  /**
   * Square that is considered "tabbable", if any. Keyboard navigation
   * on the board uses a roving tabindex, which means that only one square is
   * "tabbable" at a time (the rest are navigable using up and down keys on
   * the keyboard).
   */
  private _tabbableSquare: Square

  /**
   * Creates a set of elements representing chessboard squares, as well
   * as managing and displaying pieces rendered on the squares.
   *
   * @param container HTML element that will contain squares (e.g. <div>).
   *                  Rendered squares will be appended to this container.
   * @param orientation What side is the player's perspective.
   * @param pieces Any pieces that are on the board in the beginning.
   */
  constructor(container: HTMLElement, config: SquaresConfig) {
    this.squareElements = new Array(64)
    this.container = container
    this._orientation = config.orientation
    this._interactive = config.interactive || false

    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("div", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        this.squareElements[8 * i + j] = document.createElement("div")
        row.appendChild(this.squareElements[8 * i + j])
      }
      container.appendChild(row)
    }

    // Build pieces
    this.pieces = new Pieces(this.container, this.orientation, config.pieces)
    this._tabbableSquare =
      this.pieces.firstOccupiedSquare() || getSquare(56, this.orientation) // bottom right

    // Initial render
    this.draw()
  }

  cleanup() {
    this.pieces.cleanup()
    removeElement(this.container)
  }

  get orientation() {
    return this._orientation
  }

  set orientation(orientation: Side) {
    this._orientation = orientation
    this.pieces.orientation = orientation
    this.draw()
  }

  get interactive() {
    return this._interactive
  }

  set interactive(interactive: boolean) {
    this._interactive = interactive
    this.draw()
  }

  get tabbableSquare() {
    return this._tabbableSquare
  }

  set tabbableSquare(square: Square) {
    if (this.interactive) {
      this.getSquareElement(this._tabbableSquare).tabIndex = -1
      this.getSquareElement(square).tabIndex = 0
    }
    this._tabbableSquare = square
  }

  get squareWidth() {
    return this.squareElements[0].clientWidth
  }

  /**
   * Move piece on `from` to `to`. Update indicator classes for piece,
   * update tabindices, and focus square.
   */
  movePiece(from: Square, to: Square) {
    const moved = this.pieces.movePiece(from, to)
    if (moved) {
      this.toggleElementHasPiece(from)
      this.toggleElementHasPiece(to)
      this.tabbableSquare = to
    }
    return moved
  }

  focusSquare(square: Square) {
    this.getSquareElement(square).focus()
  }

  blurSquare(square: Square) {
    this.getSquareElement(square).blur()
  }

  private draw() {
    this.forEachSquare((square, idx) => {
      const color = getSquareColor(square)
      this.squareElements[idx].dataset.square = square
      this.squareElements[idx].dataset.squareColor = color
      const row = idx >> 3
      const col = idx & 0x7

      // Update interaction attributes, ARIA label, etc
      if (this.interactive) {
        this.squareElements[idx].setAttribute("role", "gridcell")
        this.squareElements[idx].tabIndex =
          square === this.tabbableSquare ? 0 : -1
        this.toggleElementHasPiece(square)
      } else {
        this.squareElements[idx].removeAttribute("role")
        this.squareElements[idx].removeAttribute("aria-label")
        this.squareElements[idx].removeAttribute("tabindex")
      }

      // Rank labels
      if (col === 0) {
        this.squareElements[idx].dataset.rankLabel = `${
          this.orientation === "white" ? 8 - row : row + 1
        }`
      }

      // File labels
      if (row === 7) {
        this.squareElements[idx].dataset.fileLabel = String.fromCharCode(
          "a".charCodeAt(0) + (this.orientation === "white" ? col : 7 - col)
        )
      }
    })
  }

  private toggleElementHasPiece(square: Square) {
    if (this.interactive) {
      const element = this.getSquareElement(square)
      const piece = this.pieces.pieceOn(square)
      element.classList.toggle("has-piece", !!piece)
      element.setAttribute(
        "aria-label",
        piece ? `${square}, ${piece.color} ${piece.pieceType}` : square
      )
    }
  }

  /**
   * Get square HTML element corresponding to square label `square`.
   */
  private getSquareElement(square: Square) {
    return this.squareElements[getVisualIndex(square, this.orientation)]
  }

  /**
   * Call `callback` for each square on the board. The callback receives
   * the square label and index as arguments.
   */
  private forEachSquare(
    callback: (this: Squares, square: Square, idx: number) => void
  ) {
    const boundCallback = callback.bind(this)
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, this.orientation)
      boundCallback(square, i)
    }
  }
}
