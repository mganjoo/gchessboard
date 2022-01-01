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

export interface ChessboardConfig {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private group: HTMLDivElement
  private squareElements: HTMLDivElement[][]
  private pieces: Pieces
  private moveState: InteractionState
  private orientation: Side

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void
  private keyDownHandler: (e: KeyboardEvent) => void

  /**
   * Creates a Chessboard UI element and appends it to `container`.
   *
   * @param container HTML element that will contain chessboard (e.g. <div>).
   *                  Rendered chessboard will be appended to this container.
   * @param config Configuration for chessboard (see type definition for details)
   */
  constructor(container: Element, config?: ChessboardConfig) {
    this.squareElements = new Array(8)
    this.moveState = { id: "awaiting-input" }
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
    this.mouseDownHandler = this.makeMouseEventHandler(this.handleMouseDown)
    this.mouseUpHandler = this.makeMouseEventHandler(this.handleMouseUp)
    this.keyDownHandler = this.handleKeyDown.bind(this)
    this.group.addEventListener("mousedown", this.mouseDownHandler)
    this.group.addEventListener("mouseup", this.mouseUpHandler)
    this.group.addEventListener("keydown", this.keyDownHandler)
  }

  cleanup() {
    this.pieces.cleanup()
    this.group.removeEventListener("mousedown", this.mouseDownHandler)
    this.group.removeEventListener("mouseup", this.mouseUpHandler)
    this.group.removeEventListener("keydown", this.keyDownHandler)
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
    this.updateMoveState()
  }

  private makeMouseEventHandler(
    handle: (this: Chessboard, square: Square) => void
  ): (e: MouseEvent) => void {
    const boundHandler = handle.bind(this)
    return (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const square = target.dataset.square
      if (keyIsSquare(square)) {
        boundHandler(square)
      }
    }
  }

  private handleMouseDown(this: Chessboard, clickedSquare: Square) {
    if (this.moveState.id === "awaiting-input") {
      if (this.pieces.hasPieceOn(clickedSquare)) {
        this.moveState = {
          id: "touching-first-square",
          square: clickedSquare,
        }
      }
    } else if (this.moveState.id === "awaiting-second-touch") {
      this.movePiece(this.moveState.startSquare, clickedSquare as Square)
      this.moveState = { id: "awaiting-input" }
    }

    this.updateMoveState()
  }

  private handleMouseUp(this: Chessboard) {
    if (this.moveState.id === "touching-first-square") {
      this.moveState = {
        id: "awaiting-second-touch",
        startSquare: this.moveState.square,
      }
    }

    this.updateMoveState()
  }

  private handleKeyDown(this: Chessboard, e: KeyboardEvent) {
    console.log(e.target, e.key)
  }

  private movePiece(from: Square, to: Square) {
    if (this.pieces.movePiece(from, to)) {
      this.toggleElementHasPiece(this.getSquareElement(from), false)
      this.toggleElementHasPiece(this.getSquareElement(to), true)
    }
  }

  /**
   * Update classes for squares group as well as any
   * highlighted/selected squares.
   */
  private updateMoveState() {
    this.group.dataset.moveState = this.moveState.id
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = getSquare(i, j, this.orientation)
        const hasPiece = this.pieces.hasPieceOn(square)
        if (this.moveState.id === "awaiting-input") {
          if (hasPiece) {
            this.makeNavigable(this.squareElements[i][j], square)
          } else {
            this.makeUnnavigable(this.squareElements[i][j])
          }
        } else if (this.moveState.id === "awaiting-second-touch") {
          // For now, just make all squares navigable
          this.makeNavigable(this.squareElements[i][j], square)
        }
      }
    }
  }

  private getSquareElement(square: Square) {
    const [row, column] = getVisualRowColumn(square, this.orientation)
    return this.squareElements[row][column]
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
}
