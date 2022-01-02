import {
  getSquare,
  getSquareColor,
  getVisualRowColumn,
  keyIsSquare,
  Piece,
  Side,
  Square,
} from "./utils/chess"
import { Pieces } from "./Pieces"
import { makeHTMLElement, removeElement } from "./utils/dom"
import "./styles.css"
import { InteractionState } from "./InteractionState"
import { assertUnreachable } from "./utils/typing"

export interface ChessboardConfig {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private group: HTMLDivElement
  private squareElements: HTMLDivElement[][]
  private pieces: Pieces
  private interactionState: InteractionState
  private orientation: Side

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void
  private mouseMoveHandler: (e: MouseEvent) => void

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
    this.squareElements = new Array(8)
    this.interactionState = { id: "awaiting-input" }
    this.orientation = config?.orientation || "white"

    this.group = makeHTMLElement("div", {
      attributes: { role: "grid" },
      classes: ["chessboard"],
    })
    for (let i = 0; i < 8; i++) {
      this.squareElements[i] = new Array(8)
      const row = makeHTMLElement("div", {
        attributes: { role: "row" },
      })
      for (let j = 0; j < 8; j++) {
        this.squareElements[i][j] = document.createElement("div")
        row.appendChild(this.squareElements[i][j])
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
    this.group.addEventListener("mousedown", this.mouseDownHandler)
    this.group.addEventListener("mouseup", this.mouseUpHandler)
    this.group.addEventListener("mousemove", this.mouseMoveHandler)
  }

  cleanup() {
    this.pieces.cleanup()
    this.group.removeEventListener("mousedown", this.mouseDownHandler)
    this.group.removeEventListener("mouseup", this.mouseUpHandler)
    this.group.removeEventListener("mousemove", this.mouseMoveHandler)
    removeElement(this.group)
  }

  updateOrientation(orientation: Side) {
    this.orientation = orientation
    this.pieces.updateOrientation(orientation)
    this.draw()
  }

  private draw() {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = getSquare(i, j, this.orientation)
        const color = getSquareColor(square)
        this.squareElements[i][j].dataset.square = square
        this.squareElements[i][j].dataset.squareColor = color
        this.toggleElementHasPiece(
          this.squareElements[i][j],
          this.pieces.hasPieceOn(square)
        )

        // Rank labels
        if (j === 0) {
          this.squareElements[i][j].dataset.rankLabel = `${
            this.orientation === "white" ? 8 - i : i + 1
          }`
        }

        // File labels
        if (i === 7) {
          this.squareElements[i][j].dataset.fileLabel = String.fromCharCode(
            "a".charCodeAt(0) + (this.orientation === "white" ? j : 7 - j)
          )
        }
      }
    }
    this.updateInteractionState(this.interactionState)
  }

  private handleMouseDown(
    this: Chessboard,
    clickedSquare: Square,
    e: MouseEvent
  ) {
    switch (this.interactionState.id) {
      case "awaiting-input":
      case "moving-piece-kb":
        if (this.pieces.hasPieceOn(clickedSquare)) {
          this.updateInteractionState({
            id: "touching-first-square",
            square: clickedSquare,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          })
        }
        break
      case "awaiting-second-touch":
        this.movePiece(this.interactionState.startSquare, clickedSquare)
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

  private handleMouseUp(this: Chessboard, square: Square) {
    switch (this.interactionState.id) {
      case "touching-first-square":
        this.updateInteractionState({
          id: "awaiting-second-touch",
          startSquare: this.interactionState.square,
        })
        break
      case "dragging":
        this.movePiece(this.interactionState.startSquare, square)
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

  private handleMouseMove(this: Chessboard, square: Square, e: MouseEvent) {
    switch (this.interactionState.id) {
      case "touching-first-square":
        {
          const delta = Math.sqrt(
            (e.clientX - this.interactionState.touchStartX) ** 2 +
              (e.clientY - this.interactionState.touchStartY) ** 2
          )
          const elem = this.getSquareElement(square)
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

  private movePiece(from: Square, to: Square) {
    this.pieces.movePiece(from, to)
    this.toggleElementHasPiece(this.getSquareElement(from), false)
    const toElement = this.getSquareElement(to)
    this.toggleElementHasPiece(toElement, true)
    this.updateInteractionState({ id: "awaiting-input" })
    // Programmatically focus target square for cases where the browser
    // won't handle that automatically, e.g. through a drag operation
    toElement.focus()
  }

  private updateInteractionState(state: InteractionState) {
    this.interactionState = state
    this.group.dataset.moveState = this.interactionState.id

    // Reset which squares are considered navigable, based on current
    // interactions state.
    this.forEachSquare((square, squareElement) => {
      switch (this.interactionState.id) {
        case "awaiting-input":
          if (this.pieces.hasPieceOn(square)) {
            this.makeNavigable(squareElement, square)
          } else {
            this.makeUnnavigable(squareElement)
          }
          break
        case "touching-first-square":
        case "awaiting-second-touch":
        case "dragging":
        case "moving-piece-kb":
          // TODO: mark only the states that the piece is allowed to
          // go to. For now, just make all squares navigable.
          this.makeNavigable(squareElement, square)
          break
        // istanbul ignore next
        default:
          assertUnreachable(this.interactionState)
      }
    })
  }

  private makeNavigable(element: HTMLDivElement, square: Square) {
    element.setAttribute("role", "gridcell")
    element.setAttribute("aria-label", square)
    element.tabIndex = 0
  }

  private makeUnnavigable(element: HTMLDivElement) {
    element.removeAttribute("role")
    element.removeAttribute("aria-label")
    element.removeAttribute("tabindex")
  }

  private toggleElementHasPiece(element: HTMLDivElement, force: boolean) {
    element.classList.toggle("has-piece", force)
  }

  /**
   * Make mouse or keyboard event handler for square elements. Ensures
   * that the square element has a square label associated with it, then
   * passes square label and current event to `callback`.
   */
  private makeEventHandler<K extends MouseEvent | KeyboardEvent>(
    callback: (this: Chessboard, square: Square, e: K) => void
  ): (e: K) => void {
    const boundCallback = callback.bind(this)
    return (e: K) => {
      const target = e.target as HTMLElement
      const square = target.dataset.square
      if (keyIsSquare(square)) {
        boundCallback(square, e)
      }
    }
  }

  /**
   * Get square HTML element corresponding to square label `square`.
   */
  private getSquareElement(square: Square) {
    const [row, column] = getVisualRowColumn(square, this.orientation)
    return this.squareElements[row][column]
  }

  /**
   * Call `callback` for each square on the board. The callback receives
   * the square label and HTML element as arguments.
   */
  private forEachSquare(
    callback: (
      this: Chessboard,
      square: Square,
      squareElement: HTMLDivElement
    ) => void
  ) {
    const boundCallback = callback.bind(this)
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = getSquare(i, j, this.orientation)
        boundCallback(square, this.squareElements[i][j])
      }
    }
  }
}
