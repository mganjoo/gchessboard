import {
  getOppositeColor,
  getSquare,
  getSquareColor,
  getVisualRowColumn,
  keyIsSquare,
  Side,
  Square,
} from "./ChessLogic"
import "./styles.css"
import sprite from "./sprite.svg"
import { ChessboardState, Piece, PieceType } from "./ChessboardState"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const SPRITE_ID_MAP: Record<Side, Record<PieceType, string>> = {
  white: {
    queen: "wq",
    king: "wk",
    knight: "wn",
    pawn: "wp",
    bishop: "wb",
  },
  black: {
    queen: "bq",
    king: "bk",
    knight: "bn",
    pawn: "bp",
    bishop: "bb",
  },
}

export class ChessboardView {
  private svg: SVGElement
  private squareElements: SVGRectElement[]
  private pieceElementsGroup: SVGGElement
  private pieceElements: Partial<Record<Square, SVGUseElement>>
  private _orientation: Side
  private _pieces: Partial<Record<Square, Piece>>

  constructor(container: HTMLElement, state: ChessboardState) {
    // Initialize fields
    this.squareElements = new Array(64)
    this.pieceElements = {}
    this._orientation = state.orientation
    this._pieces = { ...state.pieces }

    // Build SVG container for chessboard
    const boardGroup = this.buildBoardGroup()
    this.pieceElementsGroup = this.makeElement("g", { classes: ["pieces"] })
    this.svg = this.makeElement("svg", {
      attributes: {
        viewbox: "0 0 100 100",
        width: "100%",
        height: "100%",
      },
      classes: ["chessboard"],
    })
    this.svg.appendChild(boardGroup)
    this.svg.appendChild(this.pieceElementsGroup)

    // Manual trigger of initial re-paint and redraw
    this.repaintBoard()

    container.appendChild(this.svg)
  }

  get orientation() {
    return this._orientation
  }

  set orientation(o: Side) {
    this._orientation = o
    this.repaintBoard()
  }

  private buildBoardGroup() {
    // Build board and squares
    const boardGroup = this.makeElement("g", {
      classes: ["board"],
    })

    for (let i = 0; i < 64; i++) {
      const square = this.makeElement("rect", {
        attributes: {
          x: `${(i & 0x7) * 12.5}%`,
          y: `${(7 - (i >> 3)) * 12.5}%`,
          width: "12.5%",
          height: "12.5%",
        },
      })
      this.squareElements[i] = square
      boardGroup.appendChild(square)
    }

    return boardGroup
  }

  private repaintBoard() {
    // Repaint square colors
    for (let i = 0; i < 64; i++) {
      const square = getSquare(this.orientation == "white" ? i : 63 - i)
      const color = getSquareColor(square)
      this.squareElements[i].classList.remove(getOppositeColor(color))
      this.squareElements[i].classList.add(color)
      this.squareElements[i].dataset.square = square
    }

    // Remove old pieces, if any, and remove new ones
    Object.entries(this._pieces).forEach(([key, piece]) => {
      if (keyIsSquare(key)) {
        const existingPiece = this.pieceElements[key]
        const [row, column] = getVisualRowColumn(key, this.orientation)
        if (existingPiece) {
          this.removeElement(existingPiece)
        }
        const newPiece = this.makeElement("use", {
          attributes: {
            href: `${sprite}#${SPRITE_ID_MAP[piece.color][piece.pieceType]}`,
            x: `${column * 12.5}%`,
            y: `${row * 12.5}%`,
            width: "12.5%",
            height: "12.5%",
          },
          data: {
            square: key,
            piece: `${piece.color}-${piece.pieceType}`,
          },
        })
        this.pieceElements[key] = newPiece
        this.pieceElementsGroup.appendChild(newPiece)
      }
    })
  }

  private makeElement<K extends keyof SVGElementTagNameMap>(
    tag: K,
    options?: {
      attributes?: Record<string, string>
      data?: Record<string, string>
      classes?: string[]
    }
  ) {
    const e = document.createElementNS(SVG_NAMESPACE, tag)
    if (options) {
      for (const key in options.attributes) {
        e.setAttribute(key, options.attributes[key])
      }
      for (const key in options.data) {
        e.dataset[key] = options.data[key]
      }
      e.classList.add(...(options.classes || []))
    }
    return e
  }

  private removeElement(elem: Element) {
    elem.parentNode?.removeChild(elem)
  }
}
