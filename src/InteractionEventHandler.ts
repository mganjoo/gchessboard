import { Grid } from "./components/Grid"
import { getSquare, getVisualIndex, keyIsSquare, Square } from "./utils/chess"
import { assertUnreachable, hasDataset } from "./utils/typing"

type InteractionState =
  | {
      id: "awaiting-input"
    }
  | {
      id: "touching-first-square"
      startSquare: Square
      touchStartX: number
      touchStartY: number
    }
  | {
      id: "dragging"
      startSquare: Square
    }
  | {
      id: "moving-piece-kb"
      startSquare: Square
    }
  | {
      id: "awaiting-second-touch"
      startSquare: Square
    }
  | {
      id: "canceling-second-touch"
      startSquare: Square
      touchStartX: number
      touchStartY: number
    }

export interface InteractionEventHandlerConfig {
  /**
   * Whether the interaction handler is enabled. This decides whether to
   * apply attributes like ARIA labels and roles.
   */
  enabled: boolean
}

export class InteractionEventHandler {
  private _container: HTMLElement
  private _grid: Grid
  private _enabled: boolean
  private _interactionState: InteractionState

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
  private static DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION = 0.3

  /**
   * Minimum number of pixels to enable dragging.
   */
  private static DRAG_THRESHOLD_MIN_PIXELS = 2

  constructor(
    container: HTMLElement,
    grid: Grid,
    config: InteractionEventHandlerConfig
  ) {
    this._grid = grid
    this._container = container
    this._enabled = config.enabled
    this._interactionState = { id: "awaiting-input" }
    this._updateContainerInteractionStateLabel(this.enabled)

    this._mouseDownHandler = this._makeEventHandler(this._handleMouseDown)
    this._mouseUpHandler = this._makeEventHandler(this._handleMouseUp)
    this._mouseMoveHandler = this._makeEventHandler(this._handleMouseMove)
    this._keyDownHandler = this._makeEventHandler(this._handleKeyDown)
    this._focusInHandler = this._makeEventHandler(this._handleFocusIn)
    this._focusOutHandler = this._makeEventHandler(this._handleFocusOut)

    this._toggleHandlers(this._enabled)
  }

  /**
   * Remove all listeners, whether or not they are active.
   */
  deactivate() {
    this._toggleHandlers(false)
  }

  /**
   * Whether interaction event handler is active and listening for events.
   */
  get enabled() {
    return this._enabled
  }

  set enabled(value: boolean) {
    this._enabled = value
    this._updateContainerInteractionStateLabel(value)
    this._toggleHandlers(value)
    if (!value) {
      // Always reset to awaiting-input when disabling interactivity
      this._interactionState = { id: "awaiting-input" }
    }
  }

  private _toggleHandlers(enabled: boolean) {
    if (enabled) {
      this._container.addEventListener("mousedown", this._mouseDownHandler)
      document.addEventListener("mouseup", this._mouseUpHandler)
      document.addEventListener("mousemove", this._mouseMoveHandler)
      this._container.addEventListener("focusin", this._focusInHandler)
      this._container.addEventListener("focusout", this._focusOutHandler)
      this._container.addEventListener("keydown", this._keyDownHandler)
    } else {
      this._container.removeEventListener("mousedown", this._mouseDownHandler)
      document.removeEventListener("mouseup", this._mouseUpHandler)
      document.removeEventListener("mousemove", this._mouseMoveHandler)
      this._container.removeEventListener("focusin", this._focusInHandler)
      this._container.removeEventListener("focusout", this._focusOutHandler)
      this._container.removeEventListener("keydown", this._keyDownHandler)
    }
  }

  private _handleMouseDown(
    this: InteractionEventHandler,
    clickedSquare: Square | undefined,
    e: MouseEvent
  ) {
    switch (this._interactionState.id) {
      case "awaiting-input":
        if (clickedSquare) {
          if (this._grid.pieceOn(clickedSquare)) {
            this._updateInteractionState({
              id: "touching-first-square",
              startSquare: clickedSquare,
              touchStartX: e.clientX,
              touchStartY: e.clientY,
            })
          }
        }
        break
      case "moving-piece-kb":
      case "awaiting-second-touch":
        if (
          clickedSquare &&
          this._interactionState.startSquare !== clickedSquare
        ) {
          this._movePiece(this._interactionState.startSquare, clickedSquare)
        } else if (this._interactionState.startSquare === clickedSquare) {
          // Second mousedown on the same square *may* be a cancel, but could
          // also be a misclick/readjustment in order to begin dragging. Wait
          // till corresponding mouseup event in order to cancel.
          this._updateInteractionState({
            id: "canceling-second-touch",
            startSquare: clickedSquare,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          })
        }
        break
      case "dragging":
      case "touching-first-square":
      case "canceling-second-touch":
        // Noop: mouse is already down while dragging or touching first square
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._interactionState)
    }
  }

  private _handleMouseUp(
    this: InteractionEventHandler,
    square: Square | undefined
  ) {
    switch (this._interactionState.id) {
      case "touching-first-square":
        this._updateInteractionState({
          id: "awaiting-second-touch",
          startSquare: this._interactionState.startSquare,
        })
        this._grid.moveStartSquare = this._interactionState.startSquare
        break
      case "dragging":
        if (square && this._interactionState.startSquare !== square) {
          this._movePiece(this._interactionState.startSquare, square)
        } else {
          this._cancelMove()
        }
        break
      case "canceling-second-touch":
        // User cancels by clicking on the same square.
        this._cancelMove()
        break
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        // Noop: mouse up only matters when there is an active
        // touch interaction
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._interactionState)
    }
  }

  private _handleMouseMove(
    this: InteractionEventHandler,
    square: Square | undefined,
    e: MouseEvent
  ) {
    switch (this._interactionState.id) {
      case "touching-first-square":
      case "canceling-second-touch":
        if (
          this._cursorPassedDragThreshold(
            e.clientX,
            e.clientY,
            square,
            this._interactionState.touchStartX,
            this._interactionState.touchStartY,
            this._interactionState.startSquare
          )
        ) {
          this._updateInteractionState({
            id: "dragging",
            startSquare: this._interactionState.startSquare,
          })
          this._grid.moveStartSquare = this._interactionState.startSquare
        }
        break
      case "dragging":
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._interactionState)
    }
  }

  private _handleFocusIn(
    this: InteractionEventHandler,
    square: Square | undefined
  ) {
    switch (this._interactionState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
      case "touching-first-square":
      case "canceling-second-touch":
      case "awaiting-input":
      case "dragging":
        // If we ever focus into a square, change tabbable square to it
        if (square) {
          this._grid.tabbableSquare = square
        }
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._interactionState)
    }
  }

  private _handleFocusOut(
    this: InteractionEventHandler,
    square: Square | undefined,
    e: FocusEvent
  ) {
    switch (this._interactionState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
      case "touching-first-square":
      case "canceling-second-touch":
        {
          const hasFocusInSquare =
            hasDataset(e.relatedTarget) && "square" in e.relatedTarget.dataset
          // If outgoing focus target has a square, and incoming does not, then board
          // lost focus and we can cancel the move.
          if (square && !hasFocusInSquare) {
            this._cancelMove()
          }
        }
        break
      case "awaiting-input":
      case "dragging":
        // Noop: continue with drag operation even if focus was moved around
        break
      // istanbul ignore next
      default:
        assertUnreachable(this._interactionState)
    }
  }

  private _handleKeyDown(
    this: InteractionEventHandler,
    pressedSquare: Square | undefined,
    e: KeyboardEvent
  ) {
    if (e.key === "Enter") {
      switch (this._interactionState.id) {
        case "awaiting-input":
          // Ignore presses for squares that have no piece on them
          if (pressedSquare && this._grid.pieceOn(pressedSquare)) {
            this._updateInteractionState({
              id: "moving-piece-kb",
              startSquare: pressedSquare,
            })
            this._grid.moveStartSquare = pressedSquare
            this._grid.tabbableSquare = pressedSquare
          }
          break
        case "moving-piece-kb":
        case "awaiting-second-touch":
          // Only move if enter was inside squares area and if start
          // and end square are not the same.
          if (
            pressedSquare &&
            this._interactionState.startSquare !== pressedSquare
          ) {
            this._movePiece(this._interactionState.startSquare, pressedSquare)
          } else {
            this._cancelMove()
          }
          break
        case "dragging":
        case "touching-first-square":
        case "canceling-second-touch":
          // Noop: don't handle keypresses in active mouse states
          break
        // istanbul ignore next
        default:
          assertUnreachable(this._interactionState)
      }
    } else {
      const currentIdx = getVisualIndex(
        this._grid.tabbableSquare,
        this._grid.orientation
      )
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
        this._grid.tabbableSquare = getSquare(newIdx, this._grid.orientation)
        this._grid.focusTabbableSquare()

        // If we are currently in a non-keyboard friendly state, we should
        // still transition to one since we started keyboard navigation.
        switch (this._interactionState.id) {
          case "awaiting-input":
          case "moving-piece-kb":
            break
          case "awaiting-second-touch":
            this._updateInteractionState({
              id: "moving-piece-kb",
              startSquare: this._interactionState.startSquare,
            })
            break
          // istanbul ignore next
          case "touching-first-square": // istanbul ignore next
          case "canceling-second-touch":
            // Similar to canceling move, but don't blur focused square
            // since we just gave it focus through keyboard navigation
            // istanbul ignore next
            this._updateInteractionState({ id: "awaiting-input" })
            break
          case "dragging":
            // Noop: continue with drag operation even if focus was moved around
            break
          // istanbul ignore next
          default:
            assertUnreachable(this._interactionState)
        }
      }
    }
  }

  private _movePiece(from: Square, to: Square) {
    this._grid.movePiece(from, to)
    this._updateInteractionState({ id: "awaiting-input" })
    // Programmatically focus target square for cases where the browser
    // won't handle that automatically, e.g. through a drag operation
    this._grid.focusTabbableSquare()
  }

  private _cancelMove() {
    this._updateInteractionState({ id: "awaiting-input" })
    this._grid.moveStartSquare = undefined
    // Programmatically blur starting square for cases where the browser
    // won't handle that automatically, (through a drag operation)
    this._grid.blurTabbableSquare()
  }

  private _updateInteractionState(state: InteractionState) {
    this._interactionState = state
    this._updateContainerInteractionStateLabel(true)
  }

  /**
   * Sets (or removes) the `move-state` attribute on the container, which
   * facilitates CSS styling (pointer events, hover state) based on current
   * interaction state.
   */
  private _updateContainerInteractionStateLabel(interactive: boolean) {
    if (interactive) {
      this._container.dataset.moveState = this._interactionState.id
    } else {
      delete this._container.dataset["moveState"]
    }
  }

  /**
   * Convenience wrapper to make mouse, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  private _makeEventHandler<K extends MouseEvent | KeyboardEvent | FocusEvent>(
    callback: (
      this: InteractionEventHandler,
      square: Square | undefined,
      e: K
    ) => void
  ): (e: K) => void {
    const boundCallback = callback.bind(this)
    return (e: K) => {
      const square = hasDataset(e.target)
        ? e.target.dataset.square
        : /* istanbul ignore next */ undefined
      boundCallback(keyIsSquare(square) ? square : undefined, e)
    }
  }

  /**
   * Return true if cursor on (`x`, `y`) and `square` exceeds "drag"
   * threshold, either if:
   * - distance from start X and Y is greater than a threshold percent of
   *   square width
   * - the current mouseover square is different from starting square
   */
  private _cursorPassedDragThreshold(
    x: number,
    y: number,
    square: Square | undefined,
    startX: number,
    startY: number,
    startSquare: Square
  ) {
    const delta = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2)
    const threshold = Math.max(
      InteractionEventHandler.DRAG_THRESHOLD_MIN_PIXELS,
      InteractionEventHandler.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION *
        this._grid.tabbableSquareWidth
    )
    // Consider a "dragging" action to be when we have moved the mouse a sufficient
    // threshold, or we are now in a different square from where we started.
    return (
      (this._grid.tabbableSquareWidth !== 0 && delta > threshold) ||
      square !== startSquare
    )
  }
}
