import {
  getSquare,
  getSquareColor,
  getVisualIndex,
  keyIsSquare,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { Pieces } from "./Pieces"
import { makeHTMLElement, removeElement } from "./utils/dom"
import "./styles.css"
import { InteractionState } from "./InteractionState"
import { assertUnreachable, hasDataset, hasParentNode } from "./utils/typing"

export interface ChessboardConfig {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private group: HTMLDivElement
  private squareElements: HTMLDivElement[]
  private pieces: Pieces
  private interactionState: InteractionState
  private orientation: Side

  /**
   * Square that is considered "tabbable", if any. Keyboard navigation
   * on the board uses a roving tabindex, which means that only one square is
   * "tabbable" at a time (the rest are navigable using up and down keys on
   * the keyboard).
   */
  private tabbableSquare: Square | undefined

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
    this.squareElements = new Array(64)
    this.interactionState = { id: "awaiting-input" }
    this.orientation = config?.orientation || "white"

    this.group = makeHTMLElement("div", {
      attributes: { role: "grid" },
      classes: ["chessboard"],
    })
    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("div", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        this.squareElements[8 * i + j] = document.createElement("div")
        row.appendChild(this.squareElements[8 * i + j])
      }
      this.group.appendChild(row)
    }
    container.appendChild(this.group)

    // Build pieces
    this.pieces = new Pieces(this.group, this.orientation, config?.pieces)

    // Initial render
    this.draw()

    // Add listeners
    this.mouseDownHandler = this.makeEventHandler(this.handleMouseDown)
    this.mouseUpHandler = this.makeEventHandler(this.handleMouseUp)
    this.mouseMoveHandler = this.makeEventHandler(this.handleMouseMove)
    this.blurHandler = this.handleBlur.bind(this)
    this.focusInHandler = this.makeEventHandler(this.handleFocusIn)
    this.keyDownHandler = this.makeEventHandler(this.handleKeyDown)
    document.addEventListener("mousedown", this.mouseDownHandler)
    document.addEventListener("mouseup", this.mouseUpHandler)
    document.addEventListener("mousemove", this.mouseMoveHandler)
    document.addEventListener("focusin", this.focusInHandler)
    // Blur handler uses useCapture so that we can detect window blur
    document.addEventListener("blur", this.blurHandler, true)
    // For keyboard, add listener only on the chessboard
    this.group.addEventListener("keydown", this.keyDownHandler)
  }

  cleanup() {
    this.pieces.cleanup()
    document.removeEventListener("mousedown", this.mouseDownHandler)
    document.removeEventListener("mouseup", this.mouseUpHandler)
    document.removeEventListener("mousemove", this.mouseMoveHandler)
    document.removeEventListener("focusin", this.focusInHandler)
    document.removeEventListener("blur", this.blurHandler)
    removeElement(this.group)
  }

  updateOrientation(orientation: Side) {
    this.orientation = orientation
    this.pieces.updateOrientation(orientation)
    this.draw()
  }

  private draw() {
    this.forEachSquare((square, idx) => {
      const color = getSquareColor(square)
      this.squareElements[idx].dataset.square = square
      this.squareElements[idx].dataset.squareColor = color
      this.toggleElementHasPiece(
        this.squareElements[idx],
        !!this.pieces.pieceOn(square)
      )
      const row = idx >> 3
      const col = idx & 0x7

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
    this.updateInteractionState(this.interactionState)
  }

  private handleMouseDown(
    this: Chessboard,
    clickedSquare: Square | undefined,
    e: MouseEvent
  ) {
    switch (this.interactionState.id) {
      case "awaiting-input":
        // Ignore clicks that are outside board or have no piece on them
        if (clickedSquare && this.pieces.pieceOn(clickedSquare)) {
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
          const elem = this.getSquareElement(this.interactionState.square)
          // Consider a "dragging" action to be when we have moved the mouse a sufficient
          // threshold, or we are now in a different square from where we started.
          if (
            delta / elem.clientWidth >
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
    // Only handle keypresses if there is a tabbable square, or we are
    // not actively using the mouse (for a click or drag)
    if (
      this.tabbableSquare &&
      !this.isActiveMouseState(this.interactionState)
    ) {
      if (e.key === "Enter") {
        switch (this.interactionState.id) {
          case "awaiting-input":
            // Ignore presses that are outside board or have no piece on them
            if (pressedSquare && this.pieces.pieceOn(pressedSquare)) {
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
        const currentIdx = getVisualIndex(this.tabbableSquare, this.orientation)
        const currentRow = currentIdx >> 3
        const currentCol = currentIdx & 0x7
        let newIdx = currentIdx
        switch (e.key) {
          case "ArrowRight":
          case "Right":
            for (let i = currentCol + 1; i < 8; i++) {
              const idx = 8 * currentRow + i
              if (this.squareIsNavigable(idx)) {
                newIdx = idx
                break
              }
            }
            break
          case "ArrowLeft":
          case "Left":
            for (let i = currentCol - 1; i >= 0; i--) {
              const idx = 8 * currentRow + i
              if (this.squareIsNavigable(idx)) {
                newIdx = idx
                break
              }
            }
            break
          case "ArrowDown":
          case "Down":
            for (let i = currentRow + 1; i < 8; i++) {
              const idx = 8 * i + currentCol
              if (this.squareIsNavigable(idx)) {
                newIdx = idx
                break
              }
            }
            break
          case "ArrowUp":
          case "Up":
            for (let i = currentRow - 1; i >= 0; i--) {
              const idx = 8 * i + currentCol
              if (this.squareIsNavigable(idx)) {
                newIdx = idx
                break
              }
            }
            break
          case "Home":
            {
              const start = e.ctrlKey ? 0 : 8 * currentRow
              for (let idx = start; idx < currentIdx; idx++) {
                if (this.squareIsNavigable(idx)) {
                  newIdx = idx
                  break
                }
              }
            }
            break
          case "End":
            {
              const end = e.ctrlKey ? 63 : 8 * currentRow + 7
              for (let idx = end; idx > currentIdx; idx--) {
                if (this.squareIsNavigable(idx)) {
                  newIdx = idx
                  break
                }
              }
            }
            break
          case "PageUp":
            for (let i = 0; i < currentRow; i++) {
              const idx = 8 * i + currentCol
              if (this.squareIsNavigable(idx)) {
                newIdx = idx
                break
              }
            }
            break
          case "PageDown":
            for (let i = 7; i > currentRow; i--) {
              const idx = 8 * i + currentCol
              if (this.squareIsNavigable(idx)) {
                newIdx = idx
                break
              }
            }
            break
        }

        if (newIdx !== currentIdx) {
          this.squareElements[currentIdx].tabIndex = -1
          this.squareElements[newIdx].tabIndex = 0
          this.tabbableSquare = getSquare(newIdx, this.orientation)
          this.squareElements[newIdx].focus()
        }
      }
    }
  }

  private movePiece(from: Square, to: Square) {
    this.pieces.movePiece(from, to)
    this.toggleElementHasPiece(this.getSquareElement(from), false)
    const toElement = this.getSquareElement(to)
    this.toggleElementHasPiece(toElement, true)
    this.tabbableSquare = to
    this.updateInteractionState({ id: "awaiting-input" })
    // Programmatically focus target square for cases where the browser
    // won't handle that automatically, e.g. through a drag operation
    toElement.focus()
  }

  private cancelMove(moveStartSquare: Square) {
    this.updateInteractionState({ id: "awaiting-input" })
    // Programmatically blur starting square for cases where the browser
    // won't handle that automatically, (through a drag operation)
    this.getSquareElement(moveStartSquare).blur()
  }

  private updateInteractionState(state: InteractionState) {
    const previousState = this.interactionState
    this.interactionState = state
    this.group.dataset.moveState = this.interactionState.id

    // Reset tabbable index if this is a state switch, or
    // tabbable index is not set.
    if (
      previousState.id !== this.interactionState.id ||
      this.tabbableSquare === undefined
    ) {
      let newTabbableSquare: Square | undefined
      switch (this.interactionState.id) {
        case "awaiting-input":
          if (this.tabbableSquare === undefined) {
            // Find first square from bottom containing a piece
            // that is visitable and set that as tabbable index.
            newTabbableSquare = this.pieces.firstOccupiedSquare()
          }
          break
        case "touching-first-square":
          newTabbableSquare = this.interactionState.square
          break
        case "awaiting-second-touch":
        case "dragging":
        case "moving-piece-kb":
          newTabbableSquare = this.interactionState.startSquare
          break
        default:
          assertUnreachable(this.interactionState)
      }
      if (newTabbableSquare !== undefined) {
        if (this.tabbableSquare !== undefined) {
          this.getSquareElement(this.tabbableSquare).tabIndex = -1
        }
        this.getSquareElement(newTabbableSquare).tabIndex = 0
        this.tabbableSquare = newTabbableSquare
      }
    }

    // Reset which squares are considered navigable, based on current
    // interactions state.
    // Set all squares to be navigable. TODO: later, consider restricting
    this.forEachSquare((square, idx) => {
      this.makeNavigable(idx, square)
    })
  }

  /**
   * Make the square element at `idx` non-navigable, by adding an ARIA role,
   * label and index.
   */
  private makeNavigable(idx: number, square: Square) {
    this.squareElements[idx].setAttribute("role", "gridcell")
    const piece = this.pieces.pieceOn(square)
    this.squareElements[idx].setAttribute(
      "aria-label",
      piece ? `${square}, ${piece.color} ${piece.pieceType}` : square
    )
    this.squareElements[idx].tabIndex = square === this.tabbableSquare ? 0 : -1
  }

  /**
   * Make the square element at `idx` navigable, by removing the ARIA role,
   * label and index.
   */
  private makeUnnavigable(idx: number) {
    this.squareElements[idx].removeAttribute("role")
    this.squareElements[idx].removeAttribute("aria-label")
    this.squareElements[idx].removeAttribute("tabindex")
  }

  private toggleElementHasPiece(element: HTMLDivElement, force: boolean) {
    element.classList.toggle("has-piece", force)
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

  /**
   * Get square HTML element corresponding to square label `square`.
   */
  private getSquareElement(square: Square) {
    return this.squareElements[getVisualIndex(square, this.orientation)]
  }

  /**
   * Call `callback` for each square on the board. The callback receives
   * the square label and HTML element as arguments.
   */
  private forEachSquare(
    callback: (this: Chessboard, square: Square, idx: number) => void
  ) {
    const boundCallback = callback.bind(this)
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, this.orientation)
      boundCallback(square, i)
    }
  }

  /**
   * Return true if square index corresponds to a navigable square (role = gridcell).
   */
  private squareIsNavigable(squareIdx: number) {
    return this.squareElements[squareIdx].getAttribute("role") === "gridcell"
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
