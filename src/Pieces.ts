import {
  getVisualRowColumn,
  Piece,
  PieceType,
  Side,
  Square,
} from "./utils-chess"
import sprite from "./sprite.svg"
import { makeSvgElement, removeElement } from "./utils-dom"

const SPRITE_ID_MAP: Record<Side, Record<PieceType, string>> = {
  white: {
    queen: "wq",
    king: "wk",
    knight: "wn",
    pawn: "wp",
    bishop: "wb",
    rook: "wr",
  },
  black: {
    queen: "bq",
    king: "bk",
    knight: "bn",
    pawn: "bp",
    bishop: "bb",
    rook: "br",
  },
}

interface PieceWrapper {
  piece: Piece
  element: SVGUseElement
}

export class Pieces {
  private group: SVGSVGElement
  pieces: Partial<Record<Square, PieceWrapper>>
  private orientation: Side

  constructor(
    container: Element,
    orientation: Side,
    pieces?: Partial<Record<Square, Piece>>
  ) {
    this.group = makeSvgElement("svg", {
      attributes: {
        viewbox: "0 0 100 100",
        width: "100%",
        height: "100%",
      },
      classes: ["pieces"],
    })
    this.orientation = orientation
    this.pieces = {}
    Object.entries(pieces || {}).forEach(([key, piece]) => {
      const element = this.makePieceElement(piece)
      this.pieces[key as Square] = { piece, element }
      this.group.appendChild(element)
    })

    // Initial render
    this.draw()

    container.appendChild(this.group)
  }

  cleanup() {
    removeElement(this.group)
  }

  updateOrientationAndRedraw(orientation: Side) {
    this.orientation = orientation
    this.draw()
  }

  hasPieceOn(square: Square): boolean {
    return square in this.pieces
  }

  movePiece(startSquare: Square, endSquare: Square): boolean {
    const piece = this.pieces[startSquare]
    if (piece) {
      if (endSquare === startSquare) {
        // noop
        return false
      } else {
        const existing = this.pieces[endSquare]

        // TODO: animate removal
        if (existing) {
          removeElement(existing.element)
        }

        this.pieces[endSquare] = piece
        this.drawPiece(piece.element, endSquare)
        // TODO: animate moving from original square
        delete this.pieces[startSquare]

        return true
      }
    } else {
      return false
    }
  }

  private draw() {
    Object.entries(this.pieces).forEach(([key, piece]) => {
      this.drawPiece(piece.element, key as Square)
    })
  }

  private makePieceElement(piece: Piece): SVGUseElement {
    return makeSvgElement("use", {
      attributes: {
        href: `${sprite}#${SPRITE_ID_MAP[piece.color][piece.pieceType]}`,
        width: "12.5%",
        height: "12.5%",
      },
      data: {
        piece: `${piece.color}-${piece.pieceType}`,
      },
    })
  }

  private drawPiece(pieceElement: SVGUseElement, square: Square) {
    const [row, column] = getVisualRowColumn(square, this.orientation)
    pieceElement.style.transform = `translate(${column * 12.5}%, ${
      row * 12.5
    }%)`
  }
}
