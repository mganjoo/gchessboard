import {
  getSquare,
  getVisualIndex,
  keyIsSquare,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { makeHTMLElement, removeElement } from "./utils/dom"
import "./styles.css"
import { InteractionState } from "./InteractionState"
import { assertUnreachable, hasDataset, hasParentNode } from "./utils/typing"
import { Squares } from "./Squares"

export interface ChessboardConfig {
  /**
   * What side's perspective to render squares from (what color appears on bottom).
   */
  orientation: Side
  /**
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  interactive?: boolean
  /**
   * Map of square -> piece to initialize with. Since the Squares object manages
   * the pieces layer as well, all pieces management occurs via `SquaresConfig`.
   */
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private group: HTMLDivElement
  private squares: Squares
  private interactionState: InteractionState
  private _orientation: Side
  private _interactive: boolean

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void
  private mouseMoveHandler: (e: MouseEvent) => void
  private focusInHandler: (e: FocusEvent) => void
  private blurHandler: (e: FocusEvent) => void
  private keyDownHandler: (e: KeyboardEvent) => void

  /**
   * Fraction of square width that mouse must be moved to be
   * considered a "drag" action.
   */
  private static DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION = 0.3

  /**
   * Creates a Chessboard UI element and appends it to `container`.
   *
   * @param container HTML element that will contain chessboard (e.g. <div>).
   *                  Rendered chessboard will be appended to this container.
   * @param config Configuration for chessboard (see type definition for details)
   */
  constructor(container: Element, config?: ChessboardConfig) {
    const { orientation, interactive, pieces } = config || {}
    this._orientation = orientation || "white"
    this._interactive = interactive || true

    this.group = makeHTMLElement("div", {
      attributes: { role: "grid" },
      classes: ["chessboard"],
    })
    this.squares = new Squares(this.group, {
      orientation: this.orientation,
      interactive: this.interactive,
      pieces,
    })
    this.interactionState = { id: "awaiting-input" }

    container.appendChild(this.group)

    // Initial render
    this.draw()

    // Add listeners
    this.mouseDownHandler = this.makeEventHandler(this.handleMouseDown)
    this.mouseUpHandler = this.makeEventHandler(this.handleMouseUp)
    this.mouseMoveHandler = this.makeEventHandler(this.handleMouseMove)
    this.blurHandler = this.handleBlur.bind(this)
    this.focusInHandler = this.makeEventHandler(this.handleFocusIn)
    this.keyDownHandler = this.makeEventHandler(this.handleKeyDown)
    this.toggleHandlers(this.interactive)
  }

  cleanup() {
    this.squares.cleanup()
    this.toggleHandlers(false)
    removeElement(this.group)
  }

  get orientation() {
    return this._orientation
  }

  set orientation(orientation: Side) {
    this._orientation = orientation
    this.squares.orientation = orientation
    this.draw()
  }

  get interactive() {
    return this._interactive
  }

  set interactive(interactive: boolean) {
    this._interactive = interactive
    this.squares.interactive = interactive
    this.draw()
    this.toggleHandlers(interactive)
  }

  private draw() {
    this.updateInteractionState(this.interactionState)
  }

  private toggleHandlers(enabled: boolean) {
    if (enabled) {
      document.addEventListener("mousedown", this.mouseDownHandler)
      document.addEventListener("mouseup", this.mouseUpHandler)
      document.addEventListener("mousemove", this.mouseMoveHandler)
      document.addEventListener("focusin", this.focusInHandler)
      // Blur handler uses useCapture so that we can detect window blur
      document.addEventListener("blur", this.blurHandler, true)
      // For keyboard, add listener only on the chessboard
      this.group.addEventListener("keydown", this.keyDownHandler)
    } else {
      document.removeEventListener("mousedown", this.mouseDownHandler)
      document.removeEventListener("mouseup", this.mouseUpHandler)
      document.removeEventListener("mousemove", this.mouseMoveHandler)
      document.removeEventListener("focusin", this.focusInHandler)
      document.removeEventListener("blur", this.blurHandler)
    }
  }

  private handleMouseDown(
    this: Chessboard,
    clickedSquare: Square | undefined,
    e: MouseEvent
  ) {
    switch (this.interactionState.id) {
      case "awaiting-input":
        // Ignore clicks that are outside board or have no piece on them
        if (clickedSquare && this.squares.pieces.pieceOn(clickedSquare)) {
          this.updateInteractionState({
            id: "touching-first-square",
            square: clickedSquare,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          })
        }
        break
      case "moving-piece-kb":
      case "awaiting-second-touch":
        if (
          clickedSquare &&
          this.interactionState.startSquare !== clickedSquare
        ) {
          this.movePiece(this.interactionState.startSquare, clickedSquare)
        } else {
          // Cancel move if touch was outside squares area or if start
          // and end square are the same. Before canceling move, prevent
          // default action if we clicked on the same square as start
          // square (to prevent re-focusing)
          if (this.interactionState.startSquare === clickedSquare) {
            e.preventDefault()
          }
          this.cancelMove(this.interactionState.startSquare)
        }
        break
      case "dragging":
      case "touching-first-square":
        // Noop: mouse is already down while dragging or touching first square
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleMouseUp(this: Chessboard, square: Square | undefined) {
    switch (this.interactionState.id) {
      case "touching-first-square":
        this.updateInteractionState({
          id: "awaiting-second-touch",
          startSquare: this.interactionState.square,
        })
        break
      case "dragging":
        if (square && this.interactionState.startSquare !== square) {
          this.movePiece(this.interactionState.startSquare, square)
        } else {
          this.cancelMove(this.interactionState.startSquare)
        }
        break
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleMouseMove(
    this: Chessboard,
    square: Square | undefined,
    e: MouseEvent
  ) {
    switch (this.interactionState.id) {
      case "touching-first-square":
        {
          const delta = Math.sqrt(
            (e.clientX - this.interactionState.touchStartX) ** 2 +
              (e.clientY - this.interactionState.touchStartY) ** 2
          )
          // Consider a "dragging" action to be when we have moved the mouse a sufficient
          // threshold, or we are now in a different square from where we started.
          if (
            delta / this.squares.squareWidth >
              Chessboard.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION ||
            square !== this.interactionState.square
          ) {
            this.updateInteractionState({
              id: "dragging",
              startSquare: this.interactionState.square,
              x: e.clientX,
              y: e.clientY,
            })
          }
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

  private handleFocusIn(this: Chessboard, square: Square | undefined) {
    switch (this.interactionState.id) {
      case "moving-piece-kb":
      case "awaiting-second-touch":
      case "dragging":
        // If element does not have square (is outside of board), then cancel
        // any moves in progress
        if (!square) {
          this.cancelMove(this.interactionState.startSquare)
        }
        break
      case "touching-first-square":
        if (!square) {
          this.cancelMove(this.interactionState.square)
        }
        break
      case "awaiting-input":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleBlur(this: Chessboard, e: FocusEvent) {
    switch (this.interactionState.id) {
      case "awaiting-second-touch":
      case "dragging":
      case "moving-piece-kb":
        // If we lose focus from root document element, cancel any moves in progres
        if (!hasParentNode(e.target)) {
          this.cancelMove(this.interactionState.startSquare)
        }
        break
      case "touching-first-square":
        // If we lose focus from root document element, cancel any moves in progres
        if (!hasParentNode(e.target)) {
          this.cancelMove(this.interactionState.square)
        }
        break
      case "awaiting-input":
        break
      // istanbul ignore next
      default:
        assertUnreachable(this.interactionState)
    }
  }

  private handleKeyDown(
    this: Chessboard,
    pressedSquare: Square | undefined,
    e: KeyboardEvent
  ) {
    // Only handle keypresses if we are not actively using the mouse
    // (for a click or drag)
    if (!this.isActiveMouseState(this.interactionState)) {
      if (e.key === "Enter") {
        switch (this.interactionState.id) {
          case "awaiting-input":
            // Ignore presses that are outside board or have no piece on them
            if (pressedSquare && this.squares.pieces.pieceOn(pressedSquare)) {
              this.updateInteractionState({
                id: "moving-piece-kb",
                startSquare: pressedSquare,
              })
            }
            break
          case "moving-piece-kb":
          case "awaiting-second-touch":
            if (
              pressedSquare &&
              this.interactionState.startSquare !== pressedSquare
            ) {
              this.movePiece(this.interactionState.startSquare, pressedSquare)
            } else {
              // Cancel move if touch was outside squares area or if start
              // and end square are the same. Before canceling move, prevent
              // default action if we pressed the same square as start
              // square (to prevent re-focusing)
              if (this.interactionState.startSquare === pressedSquare) {
                e.preventDefault()
              }
              this.cancelMove(this.interactionState.startSquare)
            }
            break
          case "dragging":
          case "touching-first-square":
            // Noop: don't handle keypresses in active mouse states
            break
          // istanbul ignore next
          default:
            assertUnreachable(this.interactionState)
        }
      } else {
        const currentIdx = getVisualIndex(
          this.squares.tabbableSquare,
          this.orientation
        )
        const currentRow = currentIdx >> 3
        const currentCol = currentIdx & 0x7
        let newIdx = currentIdx
        switch (e.key) {
          case "ArrowRight":
          case "Right":
            newIdx = 8 * currentRow + Math.min(7, currentCol + 1)
            break
          case "ArrowLeft":
          case "Left":
            newIdx = 8 * currentRow + Math.max(0, currentCol - 1)
            break
          case "ArrowDown":
          case "Down":
            newIdx = 8 * Math.min(7, currentRow + 1) + currentCol
            break
          case "ArrowUp":
          case "Up":
            newIdx = 8 * Math.max(0, currentRow - 1) + currentCol
            break
          case "Home":
            newIdx = e.ctrlKey ? 0 : 8 * currentRow
            break
          case "End":
            newIdx = e.ctrlKey ? 63 : 8 * currentRow + 7
            break
          case "PageUp":
            newIdx = currentCol
            break
          case "PageDown":
            newIdx = 56 + currentCol
            break
        }

        if (newIdx !== currentIdx) {
          this.squares.tabbableSquare = getSquare(newIdx, this.orientation)
          this.squares.focusSquare(this.squares.tabbableSquare)
        }
      }
    }
  }

  private movePiece(from: Square, to: Square) {
    if (this.squares.movePiece(from, to)) {
      this.updateInteractionState({ id: "awaiting-input" })
    }
  }

  private cancelMove(moveStartSquare: Square) {
    this.updateInteractionState({ id: "awaiting-input" })
    // Programmatically blur starting square for cases where the browser
    // won't handle that automatically, (through a drag operation)
    this.squares.blurSquare(moveStartSquare)
  }

  private updateInteractionState(state: InteractionState) {
    const previousState = this.interactionState
    this.interactionState = state
    this.group.dataset.moveState = this.interactionState.id

    // Reset tabbable index if this is a state switch.
    if (previousState.id !== this.interactionState.id) {
      switch (this.interactionState.id) {
        case "touching-first-square":
          this.squares.tabbableSquare = this.interactionState.square
          break
        case "awaiting-second-touch":
        case "dragging":
        case "moving-piece-kb":
          this.squares.tabbableSquare = this.interactionState.startSquare
          break
        case "awaiting-input":
          break
        default:
          assertUnreachable(this.interactionState)
      }
    }
  }

  /**
   * Convenience wrapper to make mouse, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  private makeEventHandler<K extends MouseEvent | KeyboardEvent | FocusEvent>(
    callback: (this: Chessboard, square: Square | undefined, e: K) => void
  ): (e: K) => void {
    const boundCallback = callback.bind(this)
    return (e: K) => {
      const square = hasDataset(e.target) ? e.target.dataset.square : undefined
      boundCallback(keyIsSquare(square) ? square : undefined, e)
    }
  }

  private isActiveMouseState(interactionState: InteractionState) {
    switch (interactionState.id) {
      case "dragging":
      case "touching-first-square":
        return true
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        return false
      default:
        assertUnreachable(interactionState)
    }
  }
}
