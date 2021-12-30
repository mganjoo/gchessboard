import {
  getOppositeSquareColor,
  getSquare,
  getSquareColor,
  getVisualRowColumn,
  keyIsSquare,
  Piece,
  Side,
  Square,
} from "./utils-chess"
import { Pieces } from "./Pieces"
import { makeHTMLElement, removeElement } from "./utils-dom"
import { assertUnreachable } from "./utils-typing"

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
export class Squares {
  private group: HTMLDivElement
  private squareElements: HTMLDivElement[][]
  private pieces: Pieces
  private moveState: MoveState
  private orientation: Side

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void

  constructor(
    container: Element,
    orientation: Side,
    pieces?: Partial<Record<Square, Piece>>
  ) {
    this.squareElements = new Array(8)
    this.moveState = { id: "awaiting-input" }
    this.orientation = orientation

    this.group = makeHTMLElement("div", { attributes: { role: "grid" } })
    for (let i = 0; i < 8; i++) {
      this.squareElements[i] = new Array(8)
      const row = makeHTMLElement("div", {
        attributes: { role: "row" },
        classes: ["squares-row"],
      })
      for (let j = 0; j < 8; j++) {
        this.squareElements[i][j] = makeHTMLElement("div", {
          classes: ["square"],
        })
        row.appendChild(this.squareElements[i][j])
      }
      this.group.appendChild(row)
    }
    container.appendChild(this.group)

    // Build pieces
    this.pieces = new Pieces(this.group, orientation, pieces)

    // Initial render
    this.updateClasses()
    this.draw()

    // Add listeners
    this.mouseDownHandler = this.handleMouseDown.bind(this)
    this.group.addEventListener("mousedown", this.mouseDownHandler)
    this.mouseUpHandler = this.handleMouseUp.bind(this)
    this.group.addEventListener("mouseup", this.mouseUpHandler)
  }

  cleanup() {
    removeElement(this.group)
    this.group.removeEventListener("mousedown", this.mouseDownHandler)
    this.group.removeEventListener("mouseup", this.mouseUpHandler)
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
        this.squareElements[i][j].classList.remove(
          getOppositeSquareColor(color)
        )
        this.squareElements[i][j].classList.add(color)
        this.squareElements[i][j].dataset.square = square
        this.updatePieceContained(square)

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
  }

  private movePiece(from: Square, to: Square) {
    if (this.pieces.movePiece(from, to)) {
      this.updatePieceContained(from)
      this.updatePieceContained(to)
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
        case "touching-first-square":
          // We are in the middle of touching first square (which may turn into
          // drag). Browser shouldn't have fired this event again.
          console.warn(`Unexpected event: ${e}`)
          break
        case "awaiting-second-touch":
          this.movePiece(this.moveState.startSquare, clickedSquare as Square)
          this.moveState = { id: "awaiting-input" }
          break
        default:
          assertUnreachable(this.moveState)
      }

      this.updateClasses()
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

    this.updateClasses()
  }

  /**
   * Update classes for squares group as well as any
   * highlighted/selected squares.
   */
  private updateClasses() {
    this.group.classList.value = `squares ${this.moveState.id}`
  }

  /**
   * Update UI elements associated with a given square, depending
   * on whether it contains a piece.
   */
  private updatePieceContained(square: Square) {
    const hasPiece = this.pieces.hasPieceOn(square)
    const [row, column] = getVisualRowColumn(square, this.orientation)
    this.squareElements[row][column].classList.toggle(HAS_PIECE_CLASS, hasPiece)
    if (hasPiece) {
      this.squareElements[row][column].setAttribute("role", "gridcell")
      this.squareElements[row][column].setAttribute("aria-label", square)
      this.squareElements[row][column].tabIndex = 0
    } else {
      this.squareElements[row][column].removeAttribute("role")
      this.squareElements[row][column].removeAttribute("aria-label")
      this.squareElements[row][column].removeAttribute("tabindex")
    }
  }

  // TODO: mousemove
}
