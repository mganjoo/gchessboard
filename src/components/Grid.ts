import {
  getSquare,
  getVisualIndex,
  getVisualRowColumn,
  positionsEqual,
  Position,
  Side,
  Square,
} from "../utils/chess"
import { makeHTMLElement } from "../utils/dom"
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
  position?: Position
  /**
   * Whether to hide coordinate labels for the board.
   */
  hideCoords: boolean
}

export class Grid {
  private readonly _grid: HTMLElement
  private readonly _boardSquares: BoardSquare[]
  private _orientation: Side
  private _interactive: boolean
  private _hideCoords: boolean
  private _position: Position
  private _tabbableSquare: Square | undefined
  private _currentMove?: {
    square: Square
    piecePositionPx?: { x: number; y: number }
  }
  private _secondaryPieceSquare?: Square

  /**
   * Creates a set of elements representing chessboard squares, as well
   * as managing and displaying pieces rendered on the squares.
   */
  constructor(container: HTMLElement, config: GridConfig) {
    this._boardSquares = new Array(64)
    this._orientation = config.orientation
    this._interactive = config.interactive || false
    this._hideCoords = config.hideCoords || false
    this._position = { ...config.position }

    this._grid = makeHTMLElement("table", {
      attributes: { role: "grid" },
      classes: ["squares"],
    })

    const tabbableSquare = this._tabbableSquare
    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("tr", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        const idx = 8 * i + j
        const square = getSquare(idx, this.orientation)
        this._boardSquares[idx] = new BoardSquare(
          row,
          {
            label: square,
            interactive: this.interactive,
            tabbable: tabbableSquare === square,
            showCoords: !this.hideCoords,
          },
          {
            makeFileLabel: i === 7,
            makeRankLabel: j === 0,
          }
        )
        this._boardSquares[idx].setPiece(this._position[square])
      }
      this._grid.appendChild(row)
    }
    this._grid.addEventListener("slotchange", this._slotChangeListener)

    container.appendChild(this._grid)
  }

  destroy() {
    this._grid.removeEventListener("slotchange", this._slotChangeListener)
    this._boardSquares.forEach((square) => {
      square.destroy()
    })
  }

  /**
   * What side's perspective to render squares from (what color appears on
   * the bottom as viewed on the screen).
   */
  get orientation() {
    return this._orientation
  }

  set orientation(value: Side) {
    this._orientation = value
    this._updateAllSquareProps()
  }

  /**
   * Whether the grid is interactive. This determines the roles and attributes,
   * like tabindex, associated with the grid.
   */
  get interactive() {
    return this._interactive
  }

  set interactive(value: boolean) {
    this._interactive = value
    this._updateAllSquareProps()
  }

  get position() {
    return this._position
  }

  set position(value: Position) {
    if (!positionsEqual(this._position, value)) {
      this._position = { ...value }
      this._updateAllSquareProps()
    }
  }

  get hideCoords() {
    return this._hideCoords
  }

  set hideCoords(value: boolean) {
    this._hideCoords = value
    this._updateAllSquareProps()
  }

  /**
   * Square that is considered "tabbable", if any. Keyboard navigation
   * on the board uses a roving tabindex, which means that only one square is
   * "tabbable" at a time (the rest are navigable using up and down keys on
   * the keyboard).
   */
  get tabbableSquare(): Square {
    return this._tabbableSquare || this._getDefaultTabbableSquare()
  }

  set tabbableSquare(value: Square) {
    // Unset previous tabbable square so that tabindex is changed to -1
    this._getBoardSquare(this.tabbableSquare).tabbable = false
    this._getBoardSquare(value).tabbable = true
    this._tabbableSquare = value
  }

  /**
   * Disable animations.
   */
  disableAnimation = false

  /**
   * Rendered width of currently tabbable square, used in making drag
   * threshold calculations.
   */
  get tabbableSquareWidth() {
    return this._getBoardSquare(this.tabbableSquare).width
  }

  /**
   * Sets information related to a new move for grid.
   * This includes the square that started an ongoing move, as well as
   * an optional position of the piece on the screen (e.g. if it is
   * being dragged).
   */
  startMove(square: Square, piecePositionPx?: { x: number; y: number }) {
    if (
      this._currentMove !== undefined &&
      square !== this._currentMove.square
    ) {
      // Note that this is an async method but we simply ignore the side effect
      this._getBoardSquare(this._currentMove.square).finishMove()
    }
    this._currentMove = {
      square,
      piecePositionPx: piecePositionPx ? { ...piecePositionPx } : undefined,
    }
    this._getBoardSquare(this._currentMove.square).startMove(
      this._currentMove.piecePositionPx
    )
  }

  /**
   * Update position of existing move (say during a drag operation).
   */
  updateMove(piecePositionPx: { x: number; y: number }) {
    if (this._currentMove !== undefined) {
      this._currentMove.piecePositionPx = { ...piecePositionPx }
      this._getBoardSquare(this._currentMove.square).updateMove(piecePositionPx)
    }
  }

  /**
   * Cancels a move, with accompanied optional animation. If animation
   * is enabled and `instant` is false, resolves promise when animation is
   * done; otherwise, resolves immediately.
   */
  async cancelMove(instant?: boolean) {
    if (this._currentMove !== undefined) {
      const moveSquare = this._getBoardSquare(this._currentMove.square)
      this._currentMove = undefined
      await moveSquare.finishMove(!this.disableAnimation && !instant)
    }
  }

  /**
   * Move piece involved in current move (if one exists) to square `to`.
   * If the initial square does not contain a piece or there is no current
   * move in progress, this is a noop.
   *
   * If `instant` is true, then finish move without animation, even if
   * animation is enabled.
   */
  async finishMove(to: Square, instant?: boolean) {
    const move = this._currentMove
    if (move !== undefined && this.pieceOn(move.square) && to !== move.square) {
      const from = move.square
      const [fromRow, fromCol] = getVisualRowColumn(from, this.orientation)
      const [toRow, toCol] = getVisualRowColumn(to, this.orientation)
      const startingPosition = this._getBoardSquare(from)
        .explicitPiecePosition || {
        type: "squareOffset",
        deltaRows: fromRow - toRow,
        deltaCols: fromCol - toCol,
      }
      this._getBoardSquare(from).setPiece(undefined)
      this._getBoardSquare(from).finishMove()
      this._getBoardSquare(to).setPiece(this._position[from], startingPosition)
      this._position[to] = this._position[from]
      delete this._position[from]
      this.tabbableSquare = to
      this._currentMove = undefined
      await this._getBoardSquare(to).finishMove(
        !this.disableAnimation && !instant
      )
    }
  }

  focusSquare(square: Square) {
    this._getBoardSquare(square).focus()
  }

  blurSquare(square: Square) {
    this._getBoardSquare(square).blur()
  }

  showSecondaryPiece(square: Square) {
    this.removeSecondaryPiece()
    this._secondaryPieceSquare = square
    this._getBoardSquare(square).toggleSecondaryPiece(true)
  }

  removeSecondaryPiece() {
    if (this._secondaryPieceSquare) {
      this._getBoardSquare(this._secondaryPieceSquare).toggleSecondaryPiece(
        false
      )
      this._secondaryPieceSquare = undefined
    }
  }

  /**
   * Returns true if there is a piece on `square`.
   */
  pieceOn(square: Square): boolean {
    return !!this._position[square]
  }

  /**
   * Iterate over all squares and set individual props based on top-level config.
   */
  private _updateAllSquareProps() {
    const tabbableSquare = this.tabbableSquare
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, this.orientation)
      this._boardSquares[i].updateAllProps({
        label: square,
        interactive: this.interactive,
        tabbable: tabbableSquare === square,
        showCoords: !this.hideCoords,
      })
      this._boardSquares[i].setPiece(this._position[square])
      this._boardSquares[i].toggleSecondaryPiece(
        !!this._secondaryPieceSquare && this._secondaryPieceSquare === square
      )
    }
    if (this._currentMove !== undefined) {
      this._getBoardSquare(this._currentMove.square).startMove(
        this._currentMove.piecePositionPx
      )
    }
  }

  private _getBoardSquare(square: Square) {
    return this._boardSquares[getVisualIndex(square, this.orientation)]
  }

  /**
   * When no tabbable square has been explicitly set (usually, when user has
   * not yet tabbed into or interacted with the board, we want to calculate
   * the tabbable square dynamically. It is either:
   * - the first occupied square from the player's orientation (i.e. from
   *   bottom left of board), or
   * - the bottom left square of the board.
   */
  private _getDefaultTabbableSquare(): Square {
    for (let row = 7; row >= 0; row--) {
      for (let col = 0; col <= 7; col++) {
        const square = getSquare(8 * row + col, this.orientation)
        if (this.pieceOn(square)) {
          return square
        }
      }
    }
    return getSquare(56, this.orientation)
  }

  private _slotChangeListener: (e: Event) => void = (e) => {
    if (Grid._isSlotElement(e.target)) {
      // Add "has-content" class to parent if slot is occupied
      e.target.parentElement?.parentElement?.classList.toggle(
        "has-content",
        e.target.assignedElements().length > 0
      )
    }
  }

  private static _isSlotElement(e: EventTarget | null): e is HTMLSlotElement {
    return !!e && (e as HTMLSlotElement).assignedElements !== undefined
  }
}
