import {
  getOppositeColor,
  getSequentialIdx,
  getSquare,
  getSquareColor,
  getVisualRowColumnFromIdx,
  keyIsSquare,
  Piece,
  Side,
  Square,
} from "./common-types"
import { Pieces } from "./Pieces"
import { makeSvgElement, removeSvgElement } from "./svg-utils"
import { assertUnreachable } from "./typing-utils"

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
  private group: SVGGElement
  private squareElements: SVGRectElement[]
  private pieces: Pieces
  private moveState: MoveState
  private orientation: Side

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void
  private mouseUpHandler: (e: MouseEvent) => void

  constructor(
    container: SVGSVGElement,
    orientation: Side,
    pieces?: Partial<Record<Square, Piece>>
  ) {
    this.squareElements = new Array(64)
    this.moveState = { id: "awaiting-input" }
    this.orientation = orientation

    // Build board and squares
    this.group = makeSvgElement("g")
    for (let i = 0; i < 64; i++) {
      const [rank, file] = getVisualRowColumnFromIdx(i)
      const square = makeSvgElement("rect", {
        attributes: {
          x: `${file * 12.5}%`,
          y: `${rank * 12.5}%`,
          width: "12.5%",
          height: "12.5%",
        },
      })
      this.squareElements[i] = square
      this.group.appendChild(square)
    }
    container.appendChild(this.group)

    // Build pieces
    this.pieces = new Pieces(container, orientation, pieces)

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
    removeSvgElement(this.group)
    this.group.removeEventListener("mousedown", this.mouseDownHandler)
    this.group.removeEventListener("mouseup", this.mouseUpHandler)
  }

  updateOrientationAndRedraw(orientation: Side) {
    this.orientation = orientation
    this.pieces.updateOrientationAndRedraw(orientation)
    this.draw()
  }

  private draw() {
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, this.orientation)
      const color = getSquareColor(square)
      this.squareElements[i].classList.remove(getOppositeColor(color))
      this.squareElements[i].classList.add(color)
      this.squareElements[i].dataset.square = square
      this.squareElements[i].classList.toggle(
        HAS_PIECE_CLASS,
        this.pieces.hasPieceOn(square)
      )
    }
  }

  private movePiece(from: Square, to: Square) {
    if (this.pieces.movePiece(from, to)) {
      this.squareElements[
        getSequentialIdx(from, this.orientation)
      ].classList.remove(HAS_PIECE_CLASS)
      this.squareElements[getSequentialIdx(to, this.orientation)].classList.add(
        HAS_PIECE_CLASS
      )
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

  // TODO: mousemove
}
