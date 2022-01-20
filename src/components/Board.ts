import {
  getSquare,
  getVisualIndex,
  getVisualRowColumn,
  positionsEqual,
  Position,
  Side,
  Square,
  keyIsSquare,
} from "../utils/chess"
import { makeHTMLElement } from "../utils/dom"
import { BoardState } from "../utils/BoardState"
import { assertUnreachable, hasDataset } from "../utils/typing"
import { BoardSquare } from "./BoardSquare"

export class Board {
  private readonly _table: HTMLElement
  private readonly _boardSquares: BoardSquare[]
  private _orientation: Side
  private _interactive: boolean
  private _hideCoords: boolean
  private _position: Position
  private _tabbableSquare: Square | undefined
  private _secondaryPieceSquare?: Square
  private _focusedSquare?: Square
  private _boardState: BoardState

  // Event handlers
  private _mouseDownHandler: (e: MouseEvent) => void
  private _mouseUpHandler: (e: MouseEvent) => void
  private _mouseMoveHandler: (e: MouseEvent) => void
  private _focusInHandler: (e: FocusEvent) => void
  private _focusOutHandler: (e: FocusEvent) => void
  private _keyDownHandler: (e: KeyboardEvent) => void

  /**
   * Fraction of square width that mouse must be moved to be
   * considered a "drag" action.
   */
  private static DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION = 0.1

  /**
   * Minimum number of pixels to enable dragging.
   */
  private static DRAG_THRESHOLD_MIN_PIXELS = 2

  /**
   * Creates a set of elements representing chessboard squares, as well
   * as managing and displaying pieces rendered on the squares.
   */
  constructor() {
    this._boardSquares = new Array(64)
    this._orientation = "white"
    this._interactive = false
    this._hideCoords = false
    this._position = {}
    this._boardState = { id: "default" }

    this._table = makeHTMLElement("table", {
      attributes: {
        role: "table",
        "aria-label": "Chess board",
      },
      classes: ["board"],
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
            interactive: false,
            tabbable: tabbableSquare === square,
            showCoords: true,
          },
          {
            makeFileLabel: i === 7,
            makeRankLabel: j === 0,
          }
        )
      }
      this._table.appendChild(row)
    }

    this._mouseDownHandler = this._makeEventHandler(this._handleMouseDown)
    this._mouseUpHandler = this._makeEventHandler(this._handleMouseUp)
    this._mouseMoveHandler = this._makeEventHandler(this._handleMouseMove)
    this._keyDownHandler = this._makeEventHandler(this._handleKeyDown)
    this._focusInHandler = this._makeEventHandler(this._handleFocusIn)
    this._focusOutHandler = this._makeEventHandler(this._handleFocusOut)

    this._table.addEventListener("slotchange", this._slotChangeHandler)
    this._table.addEventListener("transitionend", this._transitionHandler)
    this._table.addEventListener("transitioncancel", this._transitionHandler)
  }

  /**
   * Remove all event listeners for the grid and nested objects.
   */
  destroy() {
    this._table.removeEventListener("slotchange", this._slotChangeHandler)
    this._table.removeEventListener("transitionend", this._transitionHandler)
    this._table.removeEventListener("transitioncancel", this._transitionHandler)
    this._toggleInputHandlers(false)
  }

  get element() {
    return this._table
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
    if (this._focusedSquare) {
      this._getBoardSquare(this._focusedSquare).focus()
    }
    this._cancelMove(false)
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
    this._table.setAttribute("role", value ? "grid" : "table")
    this._cancelMove(false)
    this._getBoardSquare(this.tabbableSquare).blur()
    this._setBoardState(value ? { id: "awaiting-input" } : { id: "default" })
    this._updateAllSquareProps()
    this._toggleInputHandlers(value)
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

  private _startMove() {
    switch (this._boardState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
        this._getBoardSquare(this._boardState.startSquare).startMove()
        break
      case "dragging":
        this._getBoardSquare(this._boardState.startSquare).startMove({
          x: this._boardState.x,
          y: this._boardState.y,
        })
        break
      case "awaiting-input":
      case "touching-first-square":
      case "canceling-second-touch":
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _finishMove(to: Square, animate: boolean) {
    switch (this._boardState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
      case "dragging":
        {
          const from = this._boardState.startSquare
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
          this._getBoardSquare(to).setPiece(
            this._position[from],
            startingPosition
          )
          this._position[to] = this._position[from]
          delete this._position[from]
          this.tabbableSquare = to
          this._getBoardSquare(to).finishMove(animate)
          this._setBoardState({ id: "awaiting-input" })
        }
        break
      case "awaiting-input":
      case "touching-first-square":
      case "canceling-second-touch":
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _cancelMove(animate: boolean) {
    switch (this._boardState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
      case "dragging":
      case "touching-first-square":
      case "canceling-second-touch":
        this._getBoardSquare(this._boardState.startSquare).finishMove(animate)
        this._setBoardState({
          id: this.interactive ? "awaiting-input" : "default",
        })
        this._removeSecondaryPiece()
        break
      case "awaiting-input":
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _showSecondaryPiece(square: Square) {
    this._secondaryPieceSquare = square
    this._getBoardSquare(this._secondaryPieceSquare).toggleSecondaryPiece(true)
  }

  private _removeSecondaryPiece() {
    if (this._secondaryPieceSquare) {
      this._getBoardSquare(this._secondaryPieceSquare).toggleSecondaryPiece(
        false
      )
      this._secondaryPieceSquare = undefined
    }
  }

  private _pieceOn(square: Square): boolean {
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
    // Refresh existing move, if one is in progress
    this._startMove()
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
        if (this._pieceOn(square)) {
          return square
        }
      }
    }
    return getSquare(56, this.orientation)
  }

  private _setBoardState(state: BoardState) {
    this._boardState = state
    this._updateContainerInteractionStateLabel()
  }

  private _toggleInputHandlers(enabled: boolean) {
    if (enabled) {
      this._table.addEventListener("mousedown", this._mouseDownHandler)
      // Document-level listeners for mouse-up and mouse-move to detect interaction outside
      document.addEventListener("mouseup", this._mouseUpHandler)
      document.addEventListener("mousemove", this._mouseMoveHandler)
      this._table.addEventListener("focusin", this._focusInHandler)
      this._table.addEventListener("focusout", this._focusOutHandler)
      this._table.addEventListener("keydown", this._keyDownHandler)
    } else {
      this._table.removeEventListener("mousedown", this._mouseDownHandler)
      document.removeEventListener("mouseup", this._mouseUpHandler)
      document.removeEventListener("mousemove", this._mouseMoveHandler)
      this._table.addEventListener("focusin", this._focusInHandler)
      this._table.removeEventListener("focusout", this._focusOutHandler)
      this._table.removeEventListener("keydown", this._keyDownHandler)
    }
  }

  private _handleMouseDown(
    this: Board,
    clickedSquare: Square | undefined,
    e: MouseEvent
  ) {
    // We will control focus entirely ourselves
    e.preventDefault()
    switch (this._boardState.id) {
      case "awaiting-input":
        if (clickedSquare && this._pieceOn(clickedSquare)) {
          // Blur any existing tabbable square if it exists. This cancels
          // existing moves by default so must occur before we update to
          // new state.
          this._getBoardSquare(this.tabbableSquare).blur()
          this._setBoardState({
            id: "touching-first-square",
            startSquare: clickedSquare,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          })
          this._showSecondaryPiece(clickedSquare)
        }
        break
      case "moving-piece-kb":
      case "awaiting-second-touch":
        if (clickedSquare && this._boardState.startSquare !== clickedSquare) {
          const tabbableSquare = this.tabbableSquare
          this._finishMove(clickedSquare, true)
          this._getBoardSquare(tabbableSquare).blur()
        } else if (this._boardState.startSquare === clickedSquare) {
          // Second mousedown on the same square *may* be a cancel, but could
          // also be a misclick/readjustment in order to begin dragging. Wait
          // till corresponding mouseup event in order to cancel.
          this._getBoardSquare(this.tabbableSquare).blur()
          this._setBoardState({
            id: "canceling-second-touch",
            startSquare: clickedSquare,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          })
          this._showSecondaryPiece(clickedSquare)
        }
        break
      case "dragging":
      case "touching-first-square":
      case "canceling-second-touch":
        // Noop: mouse is already down while dragging or touching first square
        break
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _handleMouseUp(this: Board, square: Square | undefined) {
    switch (this._boardState.id) {
      case "touching-first-square":
        this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare,
        })
        this._removeSecondaryPiece()
        this.tabbableSquare = this._boardState.startSquare
        this._startMove()
        this._getBoardSquare(this._boardState.startSquare).focus()
        break
      case "dragging":
        this._removeSecondaryPiece()
        if (square && this._boardState.startSquare !== square) {
          const tabbableSquare = this.tabbableSquare
          // Snap after drag should be instant
          this._finishMove(square, false)
          this._getBoardSquare(tabbableSquare).blur()
        } else {
          // For pieces that left board area, do an animated snap back.
          // For others move instantly (without animation)
          this._cancelMove(!square)
          this._getBoardSquare(this.tabbableSquare).blur()
        }
        break
      case "canceling-second-touch":
        // User cancels by clicking on the same square.
        this._removeSecondaryPiece()
        this._cancelMove(false)
        this._getBoardSquare(this.tabbableSquare).blur()
        break
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        // Noop: mouse up only matters when there is an active
        // touch interaction
        break
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _handleMouseMove(
    this: Board,
    square: Square | undefined,
    e: MouseEvent
  ) {
    switch (this._boardState.id) {
      case "touching-first-square":
      case "canceling-second-touch":
        {
          const delta = Math.sqrt(
            (e.clientX - this._boardState.touchStartX) ** 2 +
              (e.clientY - this._boardState.touchStartY) ** 2
          )
          const squareWidth = this._getBoardSquare(this.tabbableSquare).width
          const threshold = Math.max(
            Board.DRAG_THRESHOLD_MIN_PIXELS,
            Board.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION * squareWidth
          )
          // Consider a "dragging" action to be when we have moved the mouse a sufficient
          // threshold, or we are now in a different square from where we started.
          if (
            (squareWidth !== 0 && delta > threshold) ||
            square !== this._boardState.startSquare
          ) {
            this._setBoardState({
              id: "dragging",
              startSquare: this._boardState.startSquare,
              x: e.clientX,
              y: e.clientY,
            })
            this._startMove()
            this.tabbableSquare = this._boardState.startSquare
          }
        }
        break
      case "dragging":
        this._boardState = { ...this._boardState, x: e.clientX, y: e.clientY }
        this._getBoardSquare(this._boardState.startSquare).updateMove({
          x: e.clientX,
          y: e.clientY,
        })
        break
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _handleFocusIn(this: Board, square: Square | undefined) {
    if (square) {
      this._focusedSquare = square
    }
  }

  private _handleFocusOut(
    this: Board,
    square: Square | undefined,
    e: FocusEvent
  ) {
    this._focusedSquare = undefined
    switch (this._boardState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
      case "touching-first-square":
      case "canceling-second-touch":
        {
          const hasFocusInSquare =
            hasDataset(e.relatedTarget) && "square" in e.relatedTarget.dataset
          // If outgoing focus target has a square, and incoming does not, then board
          // lost focus and we can cancel ongoing moves.
          if (square && !hasFocusInSquare) {
            this._cancelMove(false)
          }
        }
        break
      case "awaiting-input":
      case "dragging":
        // Noop: continue with drag operation even if focus was moved around
        break
      case "default":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState)
    }
  }

  private _handleKeyDown(
    this: Board,
    pressedSquare: Square | undefined,
    e: KeyboardEvent
  ) {
    if (e.key === "Enter") {
      switch (this._boardState.id) {
        case "awaiting-input":
          // Ignore presses for squares that have no piece on them
          if (pressedSquare && this._pieceOn(pressedSquare)) {
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: pressedSquare,
            })
            this._startMove()
            this.tabbableSquare = pressedSquare
          }
          break
        case "moving-piece-kb":
        case "awaiting-second-touch":
          // Only move if enter was inside squares area and if start
          // and end square are not the same.
          if (pressedSquare && this._boardState.startSquare !== pressedSquare) {
            this._finishMove(pressedSquare, true)
          } else {
            this._cancelMove(false)
          }
          break
        case "dragging":
        case "touching-first-square":
        case "canceling-second-touch":
          // Noop: don't handle keypresses in active mouse states
          break
        case "default":
          break
        // istanbul ignore next
        default:
          assertUnreachable(this._boardState)
      }
    } else {
      const currentIdx = getVisualIndex(this.tabbableSquare, this.orientation)
      const currentRow = currentIdx >> 3
      const currentCol = currentIdx & 0x7
      let newIdx = currentIdx
      let keyHandled = false
      switch (e.key) {
        case "ArrowRight":
        case "Right":
          newIdx = 8 * currentRow + Math.min(7, currentCol + 1)
          keyHandled = true
          break
        case "ArrowLeft":
        case "Left":
          newIdx = 8 * currentRow + Math.max(0, currentCol - 1)
          keyHandled = true
          break
        case "ArrowDown":
        case "Down":
          newIdx = 8 * Math.min(7, currentRow + 1) + currentCol
          keyHandled = true
          break
        case "ArrowUp":
        case "Up":
          newIdx = 8 * Math.max(0, currentRow - 1) + currentCol
          keyHandled = true
          break
        case "Home":
          newIdx = e.ctrlKey ? 0 : 8 * currentRow
          keyHandled = true
          break
        case "End":
          newIdx = e.ctrlKey ? 63 : 8 * currentRow + 7
          keyHandled = true
          break
        case "PageUp":
          newIdx = currentCol
          keyHandled = true
          break
        case "PageDown":
          newIdx = 56 + currentCol
          keyHandled = true
          break
      }

      if (keyHandled) {
        // Prevent native browser scrolling via any of the
        // navigation keys since the focus below will auto-scroll
        e.preventDefault()
      }

      if (newIdx !== currentIdx) {
        this.tabbableSquare = getSquare(newIdx, this.orientation)
        this._getBoardSquare(this.tabbableSquare).focus()

        // If we are currently in a non-keyboard friendly state, we should
        // still transition to one since we started keyboard navigation.
        switch (this._boardState.id) {
          case "awaiting-input":
          case "moving-piece-kb":
            break
          case "awaiting-second-touch":
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: this._boardState.startSquare,
            })
            break
          // istanbul ignore next
          case "touching-first-square": // istanbul ignore next
          case "canceling-second-touch":
            // Similar to canceling move, but don't blur focused square
            // since we just gave it focus through keyboard navigation
            // istanbul ignore next
            this._setBoardState({ id: "awaiting-input" })
            break
          case "dragging":
            // Noop: continue with drag operation even if focus was moved around
            break
          case "default":
            break
          // istanbul ignore next
          default:
            assertUnreachable(this._boardState)
        }
      }
    }
  }

  /**
   * Sets (or removes) the `board-state` attribute on the container, which
   * facilitates CSS styling (pointer events, hover state) based on current
   * interaction state.
   */
  private _updateContainerInteractionStateLabel() {
    if (this._boardState.id !== "default") {
      this._table.dataset.boardState = this._boardState.id
    } else {
      delete this._table.dataset["boardState"]
    }
  }

  /**
   * Convenience wrapper to make mouse, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  private _makeEventHandler<K extends MouseEvent | KeyboardEvent | FocusEvent>(
    callback: (this: Board, square: Square | undefined, e: K) => void
  ): (e: K) => void {
    const boundCallback = callback.bind(this)
    return (e: K) => {
      const target =
        e.composedPath().length > 0 ? e.composedPath()[0] : e.target
      const square = hasDataset(target)
        ? target.dataset.square
        : /* istanbul ignore next */ undefined
      boundCallback(keyIsSquare(square) ? square : undefined, e)
    }
  }

  private _slotChangeHandler: (e: Event) => void = (e) => {
    if (Board._isSlotElement(e.target) && keyIsSquare(e.target.name)) {
      this._getBoardSquare(e.target.name).hasContent =
        e.target.assignedElements().length > 0
    }
  }

  private _transitionHandler: (e: TransitionEvent) => void = (e) => {
    // Delete transition-property style at the end of all transitions
    if (e.target && (e.target as HTMLElement).style !== undefined) {
      const style = (e.target as HTMLElement).style
      style.removeProperty("transition-property")
    }
  }

  private static _isSlotElement(e: EventTarget | null): e is HTMLSlotElement {
    return !!e && (e as HTMLSlotElement).assignedElements !== undefined
  }
}
