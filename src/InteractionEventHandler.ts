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
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  interactive: boolean
}

export class InteractionEventHandler {
  private container: HTMLElement
  private squares: Grid
  private interactionState: InteractionState
  private _interactive: boolean

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void
  private mouseMoveHandler: (e: MouseEvent) => void
  private focusOutHandler: (e: FocusEvent) => void
  private keyDownHandler: (e: KeyboardEvent) => void

  /**
   * Fraction of square width that mouse must be moved to be
   * considered a "drag" action.
   */
  private static DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION = 0.3

  private static DRAG_THRESHOLD_MIN_PIXELS = 2

  constructor(
    container: HTMLElement,
    squares: Grid,
    config: InteractionEventHandlerConfig
  ) {
    this.squares = squares
    this.container = container
    this._interactive = config.interactive
    this.interactionState = { id: "awaiting-input" }
    this.updateContainerInteractionStateLabel(this.interactive)

    // Add listeners
    this.mouseDownHandler = this.makeEventHandler(this.handleMouseDown)
    this.mouseUpHandler = this.makeEventHandler(this.handleMouseUp)
    this.mouseMoveHandler = this.makeEventHandler(this.handleMouseMove)
    this.keyDownHandler = this.makeEventHandler(this.handleKeyDown)
    this.focusOutHandler = this.makeEventHandler(this.handleFocusOut)
    this.toggleHandlers(this.interactive)
  }

  cleanup() {
    this.toggleHandlers(false)
  }

  get interactive() {
    return this._interactive
  }

  set interactive(interactive: boolean) {
    this._interactive = interactive
    this.updateContainerInteractionStateLabel(interactive)
    this.toggleHandlers(interactive)
  }

  private toggleHandlers(enabled: boolean) {
    if (enabled) {
      document.addEventListener("mousedown", this.mouseDownHandler)
      document.addEventListener("mouseup", this.mouseUpHandler)
      document.addEventListener("mousemove", this.mouseMoveHandler)
      document.addEventListener("focusout", this.focusOutHandler)
      // For keyboard, add listener only on the chessboard
      this.container.addEventListener("keydown", this.keyDownHandler)
    } else {
      document.removeEventListener("mousedown", this.mouseDownHandler)
      document.removeEventListener("mouseup", this.mouseUpHandler)
      document.removeEventListener("mousemove", this.mouseMoveHandler)
      document.removeEventListener("focusout", this.focusOutHandler)
      this.container.removeEventListener("keydown", this.keyDownHandler)
    }
  }

  private handleMouseDown(
    this: InteractionEventHandler,
    clickedSquare: Square | undefined,
    e: MouseEvent
  ) {
    switch (this.interactionState.id) {
      case "awaiting-input":
        if (clickedSquare) {
          this.squares.tabbableSquare = clickedSquare
          if (this.squares.pieceOn(clickedSquare)) {
            this.updateInteractionState({
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
          this.interactionState.startSquare !== clickedSquare
        ) {
          this.movePiece(this.interactionState.startSquare, clickedSquare)
        } else if (this.interactionState.startSquare === clickedSquare) {
          // Second mousedown on the same square *may* be a cancel, but could
          // also be a misclick/readjustment in order to begin dragging. Wait
          // till corresponding mouseup event in order to cancel.
          this.updateInteractionState(
            {
              id: "canceling-second-touch",
              startSquare: clickedSquare,
              touchStartX: e.clientX,
              touchStartY: e.clientY,
            },
            clickedSquare
          )
        } else {
          // Cancel move if touch was outside squares area.
          this.cancelMove()
        }
        break
      case "dragging":
      case "touching-first-square":
      case "canceling-second-touch":
        // Noop: mouse is already down while dragging or touching first square
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleMouseUp(
    this: InteractionEventHandler,
    square: Square | undefined
  ) {
    switch (this.interactionState.id) {
      case "touching-first-square":
        this.updateInteractionState({
          id: "awaiting-second-touch",
          startSquare: this.interactionState.startSquare,
        })
        break
      case "dragging":
        if (square && this.interactionState.startSquare !== square) {
          this.movePiece(this.interactionState.startSquare, square)
        } else {
          this.cancelMove()
        }
        break
      case "canceling-second-touch":
        // User cancels by clicking on the same square.
        this.cancelMove()
        break
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        // Noop: mouse up only matters when there is an active
        // touch interaction
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleMouseMove(
    this: InteractionEventHandler,
    square: Square | undefined,
    e: MouseEvent
  ) {
    switch (this.interactionState.id) {
      case "touching-first-square":
      case "canceling-second-touch":
        if (
          this.cursorPassedDragThreshold(
            e.clientX,
            e.clientY,
            square,
            this.interactionState.touchStartX,
            this.interactionState.touchStartY,
            this.interactionState.startSquare
          )
        ) {
          this.updateInteractionState({
            id: "dragging",
            startSquare: this.interactionState.startSquare,
          })
        }
        break
      case "dragging":
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleFocusOut(
    this: InteractionEventHandler,
    square: Square | undefined,
    e: FocusEvent
  ) {
    switch (this.interactionState.id) {
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
            this.cancelMove()
          }
        }
        break
      case "awaiting-input":
      case "dragging":
        // Noop: continue with drag operation even if focus was moved around
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleKeyDown(
    this: InteractionEventHandler,
    pressedSquare: Square | undefined,
    e: KeyboardEvent
  ) {
    if (e.key === "Enter") {
      switch (this.interactionState.id) {
        case "awaiting-input":
          // Ignore presses for squares that have no piece on them
          if (pressedSquare && this.squares.pieceOn(pressedSquare)) {
            this.updateInteractionState(
              {
                id: "moving-piece-kb",
                startSquare: pressedSquare,
              },
              pressedSquare
            )
          }
          break
        case "moving-piece-kb":
        case "awaiting-second-touch":
          // Only move if enter was inside squares area and if start
          // and end square are not the same.
          if (
            pressedSquare &&
            this.interactionState.startSquare !== pressedSquare
          ) {
            this.movePiece(this.interactionState.startSquare, pressedSquare)
          } else {
            this.cancelMove()
          }
          break
        case "dragging":
        case "touching-first-square":
        case "canceling-second-touch":
          // Noop: don't handle keypresses in active mouse states
          break
        // istanbul ignore next
        default:
          assertUnreachable(this.interactionState)
      }
    } else {
      const currentIdx = getVisualIndex(
        this.squares.tabbableSquare,
        this.squares.orientation
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
        this.squares.tabbableSquare = getSquare(
          newIdx,
          this.squares.orientation
        )
        this.squares.focusSquare(this.squares.tabbableSquare)

        // If we are currently in a non-keyboard friendly state, we should
        // still transition to one since we started keyboard navigation.
        switch (this.interactionState.id) {
          case "awaiting-input":
          case "moving-piece-kb":
            break
          case "awaiting-second-touch":
            this.updateInteractionState({
              id: "moving-piece-kb",
              startSquare: this.interactionState.startSquare,
            })
            break
          // istanbul ignore next
          case "touching-first-square": // istanbul ignore next
          case "canceling-second-touch":
            // Similar to canceling move, but don't blur focused square
            // since we just gave it focus through keyboard navigation
            // istanbul ignore next
            this.updateInteractionState({ id: "awaiting-input" })
            break
          case "dragging":
            // Noop: continue with drag operation even if focus was moved around
            break
          // istanbul ignore next
          default:
            assertUnreachable(this.interactionState)
        }
      }
    }
  }

  private movePiece(from: Square, to: Square) {
    this.squares.movePiece(from, to)
    this.updateInteractionState({ id: "awaiting-input" })
    // Programmatically focus target square for cases where the browser
    // won't handle that automatically, e.g. through a drag operation
    this.squares.focusSquare(to)
  }

  private cancelMove() {
    this.updateInteractionState({ id: "awaiting-input" })
    // Programmatically blur starting square for cases where the browser
    // won't handle that automatically, (through a drag operation)
    this.squares.blurSquare(this.squares.tabbableSquare)
  }

  private updateInteractionState(
    state: InteractionState,
    newTabbableSquare?: Square
  ) {
    this.interactionState = state
    this.updateContainerInteractionStateLabel(true)

    if (newTabbableSquare !== undefined) {
      this.squares.tabbableSquare = newTabbableSquare
    }
  }

  private updateContainerInteractionStateLabel(interactive: boolean) {
    if (interactive) {
      this.container.dataset.moveState = this.interactionState.id
    } else {
      delete this.container.dataset["moveState"]
    }
  }

  /**
   * Convenience wrapper to make mouse, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  private makeEventHandler<K extends MouseEvent | KeyboardEvent | FocusEvent>(
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
  private cursorPassedDragThreshold(
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
        this.squares.squareWidth
    )
    // Consider a "dragging" action to be when we have moved the mouse a sufficient
    // threshold, or we are now in a different square from where we started.
    return (
      (this.squares.squareWidth !== 0 && delta > threshold) ||
      square !== startSquare
    )
  }
}
