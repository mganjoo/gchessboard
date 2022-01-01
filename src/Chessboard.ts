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
import { assertUnreachable } from "./utils/typing"
import "./styles.css"

export interface ChessboardConfig {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}

interface AwaitingInput {
  id: "awaiting-input"
}
interface ClickingFirstSquare {
  id: "touching-first-square"
  startSquare: Square
}

interface AwaitingSecondClick {
  id: "awaiting-second-touch"
  startSquare: Square
}

type MoveState = AwaitingInput | ClickingFirstSquare | AwaitingSecondClick

const HAS_PIECE_CLASS = "has-piece"
export class Chessboard {
  private group: HTMLDivElement
  private squareElements: HTMLDivElement[][]
  private pieces: Pieces
  private moveState: MoveState
  private orientation: Side

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void

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
        this.squareElements[i][j] = makeHTMLElement("div", {
          attributes: {
            role: "gridcell",
          },
        })
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
    this.mouseDownHandler = this.handleMouseDown.bind(this)
    this.group.addEventListener("mousedown", this.mouseDownHandler)
    this.mouseUpHandler = this.handleMouseUp.bind(this)
    this.group.addEventListener("mouseup", this.mouseUpHandler)
  }

  cleanup() {
    this.pieces.cleanup()
    this.group.removeEventListener("mousedown", this.mouseDownHandler)
    this.group.removeEventListener("mouseup", this.mouseUpHandler)
    removeElement(this.group)
  }

  updateOrientationAndRedraw(orientation: Side) {
    this.orientation = orientation
    this.pieces.updateOrientationAndRedraw(orientation)
    this.draw()
  }

  private draw() {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = getSquare(i, j, this.orientation)
        const color = getSquareColor(square)
        this.squareElements[i][j].dataset.square = square
        this.squareElements[i][j].dataset.squareColor = color
        this.squareElements[i][j].classList.toggle(
          HAS_PIECE_CLASS,
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

  private movePiece(from: Square, to: Square) {
    if (this.pieces.movePiece(from, to)) {
      this.getSquareElement(from).classList.toggle(HAS_PIECE_CLASS, false)
      this.getSquareElement(to).classList.toggle(HAS_PIECE_CLASS, true)
    }
  }

  private handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement
    const clickedSquare = target.dataset.square

    if (keyIsSquare(clickedSquare)) {
      switch (this.moveState.id) {
        case "awaiting-input":
          if (this.pieces.hasPieceOn(clickedSquare)) {
            this.moveState = {
              id: "touching-first-square",
              startSquare: clickedSquare,
            }
          }
          break
        // istanbul ignore next
        case "touching-first-square":
          // We are in the middle of touching first square (which may turn into
          // drag). Browser shouldn't have fired this event again.
          console.warn(`Unexpected event: ${e}`)
          break
        case "awaiting-second-touch":
          this.movePiece(this.moveState.startSquare, clickedSquare as Square)
          this.moveState = { id: "awaiting-input" }
          break
        // istanbul ignore next
        default:
          assertUnreachable(this.moveState)
      }

      this.updateMoveState()
    }
  }

  private handleMouseUp(e: MouseEvent) {
    const target = e.target as HTMLElement
    const clickedSquare = target.dataset.square

    if (keyIsSquare(clickedSquare)) {
      switch (this.moveState.id) {
        case "touching-first-square":
          this.moveState = {
            id: "awaiting-second-touch",
            startSquare: this.moveState.startSquare,
          }
          break
      }
    }

    this.updateMoveState()
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
}
