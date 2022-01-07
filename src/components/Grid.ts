import {
  getSquare,
  getVisualIndex,
  getVisualRowColumn,
  Piece,
  Side,
  Square,
} from "../utils/chess"
import { makeHTMLElement, removeElement } from "../utils/dom"
import { BoardSquare } from "./BoardSquare"

export interface GridConfig {
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
   * Map of square -> piece to initialize with. Since the Grid object manages
   * the pieces layer as well, all pieces management occurs via `GridConfig`.
   */
  pieces?: Partial<Record<Square, Piece>>
}

export class Grid {
  private readonly squaresContainer: HTMLElement
  private readonly boardSquares: BoardSquare[]
  private readonly pieces: Partial<Record<Square, Piece>>
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
  constructor(container: HTMLElement, config: GridConfig) {
    this.boardSquares = new Array(64)
    this._orientation = config.orientation
    this._interactive = config.interactive || false
    this.pieces = { ...config.pieces }

    this.squaresContainer = makeHTMLElement("table", {
      attributes: { role: "grid" },
      classes: ["chessboard--squares"],
    })

    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("tr", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        const idx = 8 * i + j
        this.boardSquares[idx] = new BoardSquare(row, {
          label: getSquare(idx, this.orientation),
        })
      }
      this.squaresContainer.appendChild(row)
    }
    container.appendChild(this.squaresContainer)

    this._tabbableSquare =
      this.firstOccupiedSquare() || getSquare(56, this.orientation) // bottom right

    // Initial render
    this.updateSquareProps()
  }

  cleanup() {
    removeElement(this.squaresContainer)
  }

  get orientation() {
    return this._orientation
  }

  set orientation(orientation: Side) {
    this._orientation = orientation
    this.updateSquareProps()
  }

  get interactive() {
    return this._interactive
  }

  set interactive(interactive: boolean) {
    this._interactive = interactive
    this.updateSquareProps()
  }

  get tabbableSquare() {
    return this._tabbableSquare
  }

  set tabbableSquare(square: Square) {
    // Unset previous tabbable square so that tabindex is changed to -1
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
   * Move a piece (if it exists) from `from` to `to`.
   */
  movePiece(from: Square, to: Square) {
    const piece = this.pieces[from]
    if (piece && to !== from) {
      this.getBoardSquare(from).updateConfig({ piece: undefined })
      this.getBoardSquare(to).updateConfig({ piece: this.pieces[from] })
      this.pieces[to] = this.pieces[from]
      delete this.pieces[from]
      this.tabbableSquare = to
      return true
    }
    return false
  }

  pieceOn(square: Square): boolean {
    return !!this.pieces[square]
  }

  focusSquare(square: Square) {
    this.getBoardSquare(square).focus()
  }

  blurSquare(square: Square) {
    this.getBoardSquare(square).blur()
  }

  /**
   * Return the first occupied square, from the player's orientation (i.e.
   * from bottom left of the visual board), if it exists.
   */
  private firstOccupiedSquare(): Square | undefined {
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

  private updateSquareProps() {
    this.forEachSquare((square, idx) => {
      const [row, col] = getVisualRowColumn(square, this.orientation)
      this.boardSquares[idx].updateConfig({
        label: square,
        interactive: this.interactive,
        tabbable: this.tabbableSquare === square,
        piece: this.pieces[square],
        rankLabelShown: col === 0,
        fileLabelShown: row === 7,
      })
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
    callback: (this: Grid, square: Square, idx: number) => void
  ) {
    const boundCallback = callback.bind(this)
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, this.orientation)
      boundCallback(square, i)
    }
  }
}
