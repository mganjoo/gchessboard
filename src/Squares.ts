import {
  getOppositeColor,
  getSquare,
  getSquareColor,
  getVisualRowColumnFromIdx,
  Piece,
  Side,
  Square,
} from "./common-types"
import { Pieces } from "./Pieces"
import { makeSvgElement, removeSvgElement } from "./svg-utils"

export class Squares {
  private group: SVGGElement
  private squareElements: SVGRectElement[]
  private pieces: Pieces

  // Event handlers
  private mouseDownHandler: (e: MouseEvent) => void

  constructor(container: Element, pieces?: Partial<Record<Square, Piece>>) {
    this.squareElements = new Array(64)

    // Build board and squares
    this.group = makeSvgElement("g", {
      classes: ["board"],
    })
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
    this.pieces = new Pieces(container, pieces)

    // Add listeners
    this.mouseDownHandler = this.handleMouseDown.bind(this)
    this.group.addEventListener("mousedown", this.mouseDownHandler)
  }

  cleanup() {
    removeSvgElement(this.group)
    this.group.removeEventListener("mousedown", this.mouseDownHandler)
  }

  draw(orientation: Side) {
    for (let i = 0; i < 64; i++) {
      const square = getSquare(orientation === "white" ? i : 63 - i)
      const color = getSquareColor(square)
      this.squareElements[i].classList.remove(getOppositeColor(color))
      this.squareElements[i].classList.add(color)
      this.squareElements[i].dataset.square = square
    }

    this.pieces.draw(orientation)
  }

  handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement
    console.log(target.dataset.square)
  }
}
