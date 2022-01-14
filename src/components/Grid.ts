import {
  getSquare,
  getVisualIndex,
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
    posPx?: { x: number; y: number }
  }

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
      classes: ["chessboard--squares"],
    })

    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("tr", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        const idx = 8 * i + j
        this._boardSquares[idx] = new BoardSquare(row, {
          label: getSquare(idx, this.orientation),
        })
      }
      this._grid.appendChild(row)
    }
    container.appendChild(this._grid)
    this._updateSquareProps()
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
    this._updateSquareProps()
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
    this._updateSquareProps()
  }

  get position() {
    return this._position
  }

  set position(value: Position) {
    if (!positionsEqual(this._position, value)) {
      this._position = { ...value }
      this._updateSquareProps()
    }
  }

  get hideCoords() {
    return this._hideCoords
  }

  set hideCoords(value: boolean) {
    this._hideCoords = value
    this._updateSquareProps()
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
    this._getBoardSquare(this.tabbableSquare).updateConfig({
      tabbable: false,
    })
    this._getBoardSquare(value).updateConfig({
      tabbable: true,
    })
    this._tabbableSquare = value
  }

  /**
   * Rendered width of currently tabbable square, used in making drag
   * threshold calculations.
   */
  get tabbableSquareWidth() {
    return this._getBoardSquare(this.tabbableSquare).width
  }

  /**
   * Information related to ongoing move (if it exists) for grid.
   * This includes the square that started an ongoing move, as well as
   * an optional position of the piece on the screen (e.g. if it is
   * being dragged).
   */
  get currentMove() {
    return this._currentMove
  }

  set currentMove(
    value:
      | { square: Square; piecePositionPx?: { x: number; y: number } }
      | undefined
  ) {
    if (this._currentMove !== undefined) {
      if (value === undefined || value.square !== this._currentMove.square) {
        this._getBoardSquare(this._currentMove.square).updateConfig({
          moveStart: false,
          piecePositionPx: undefined,
        })
      }
    }
    if (value !== undefined) {
      this._getBoardSquare(value.square).updateConfig({
        moveStart: true,
        piecePositionPx: value.piecePositionPx,
      })
    }
    this._currentMove = value
  }

  /**
   * Move a piece (if it exists) from `from` to `to`.
   */
  movePiece(from: Square, to: Square) {
    const piece = this._position[from]
    if (piece && to !== from) {
      this._getBoardSquare(from).updateConfig({ piece: undefined })
      this._getBoardSquare(to).updateConfig({ piece: this._position[from] })
      this._position[to] = this._position[from]
      delete this._position[from]
      this.tabbableSquare = to
      this.currentMove = undefined
      return true
    }
    return false
  }

  focusSquare(square: Square) {
    this._getBoardSquare(square).focus()
  }

  blurSquare(square: Square) {
    this._getBoardSquare(square).blur()
  }

  /**
   * Returns true if there is a piece on `square`.
   */
  pieceOn(square: Square): boolean {
    return !!this._position[square]
  }

  /**
   * Iterate over all squares and set individual props based
   * on top-level config.
   */
  private _updateSquareProps() {
    const tabbableSquare = this.tabbableSquare
    const interactive = this.interactive
    const hideCoords = this.hideCoords
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, this.orientation)
      const row = i >> 3
      const col = i & 0x7
      this._boardSquares[i].updateConfig({
        label: square,
        interactive,
        tabbable: tabbableSquare === square,
        piece: this._position[square],
        rankLabelShown: !hideCoords && col === 0,
        fileLabelShown: !hideCoords && row === 7,
      })
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
        if (square in this._position) {
          return square
        }
      }
    }
    return getSquare(56, this.orientation)
  }
}
