import { getSquare, getVisualIndex, Piece, Side, Square } from "./utils/chess"
import { makeHTMLElement, removeElement } from "./utils/dom"
import { Pieces } from "./Pieces"
import { BoardSquare } from "./components/BoardSquare"

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
  private boardSquares: BoardSquare[]
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
    this.boardSquares = new Array(64)
    this.container = container
    this._orientation = config.orientation
    this._interactive = config.interactive || false

    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("div", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        const idx = 8 * i + j
        this.boardSquares[idx] = new BoardSquare(row, {
          label: getSquare(idx, this.orientation),
        })
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
    this.forEachSquare((_, idx) => this.boardSquares[idx].cleanup())
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
    this.getBoardSquare(this._tabbableSquare).updateConfig({ tabbable: false })
    this.getBoardSquare(square).updateConfig({
      tabbable: true,
    })
    this._tabbableSquare = square
  }

  get squareWidth() {
    return this.boardSquares[0].width
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
    this.getBoardSquare(square).focus()
  }

  blurSquare(square: Square) {
    this.getBoardSquare(square).blur()
  }

  private draw() {
    this.forEachSquare((square, idx) => {
      const row = idx >> 3
      const col = idx & 0x7
      this.boardSquares[idx].updateConfig({
        label: square,
        interactive: this.interactive,
        tabbable: this.tabbableSquare === square,
        piece: this.pieces.pieceOn(square),
        rankLabelShown: col === 0,
        fileLabelShown: row === 7,
      })
    })
  }

  private toggleElementHasPiece(square: Square) {
    this.getBoardSquare(square).updateConfig({
      piece: this.pieces.pieceOn(square),
    })
  }

  private getBoardSquare(square: Square) {
    return this.boardSquares[getVisualIndex(square, this.orientation)]
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
