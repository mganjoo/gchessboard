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
  private labelsGroup: SVGGElement
  private pieceElements: Partial<Record<Square, SVGUseElement>>
  private rankLabelElements: SVGTextElement[]
  private fileLabelElements: SVGTextElement[]
  private pieces: Partial<Record<Square, Piece>>
  private _orientation: Side

  constructor(container: HTMLElement, state: ChessboardState) {
    // Initialize fields
    this.squareElements = new Array(64)
    this.pieceElements = {}
    this._orientation = state.orientation
    this.pieces = { ...state.pieces }
    this.rankLabelElements = new Array(8)
    this.fileLabelElements = new Array(8)

    // Build SVG container for chessboard
    const boardGroup = this.buildBoardGroup()
    this.pieceElementsGroup = this.makeElement("g", { classes: ["pieces"] })
    this.labelsGroup = this.buildLabelsGroup()
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
    this.svg.appendChild(this.labelsGroup)

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

  private buildLabelsGroup() {
    const labelsGroup = this.makeElement("g", { classes: ["labels"] })
    // Rank labels
    for (let i = 0; i < 8; i++) {
      const elem = this.makeElement("text", {
        attributes: {
          x: "0.5%",
          y: `${i * 12.5 + 1}%`,
          width: "12.5%",
          height: "12.5%",
          "dominant-baseline": "hanging",
        },
        classes: [i % 2 == 0 ? "light" : "dark"],
      })
      this.rankLabelElements[i] = elem
      labelsGroup.appendChild(elem)
    }
    // File labels
    for (let i = 0; i < 8; i++) {
      const elem = this.makeElement("text", {
        attributes: {
          x: `${(i + 1) * 12.5 - 0.75}%`,
          y: "99%",
          width: "12.5%",
          height: "12.5%",
          "text-anchor": "end",
        },
        classes: [i % 2 == 0 ? "dark" : "light"],
      })
      this.fileLabelElements[i] = elem
      labelsGroup.appendChild(elem)
    }
    return labelsGroup
  }

  private repaintBoard() {
    // Repaint square colors
    for (let i = 0; i < 64; i++) {
      const square = getSquare(this.orientation === "white" ? i : 63 - i)
      const color = getSquareColor(square)
      this.squareElements[i].classList.remove(getOppositeColor(color))
      this.squareElements[i].classList.add(color)
      this.squareElements[i].dataset.square = square
    }

    // Remove old pieces, if any, and remove new ones
    Object.entries(this.pieces).forEach(([key, piece]) => {
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

    // Update labels
    for (let i = 0; i < 8; i++) {
      this.rankLabelElements[i].textContent = `${
        this.orientation === "white" ? 8 - i : i + 1
      }`
      this.fileLabelElements[i].textContent = String.fromCharCode(
        "a".charCodeAt(0) + (this.orientation === "white" ? i : 7 - i)
      )
    }
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
