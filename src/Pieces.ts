import {
  getVisualRowColumn,
  keyIsSquare,
  Piece,
  PieceType,
  Side,
  Square,
} from "./common-types"
import sprite from "./sprite.svg"
import { makeSvgElement, removeSvgElement } from "./svg-utils"

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

export class Pieces {
  pieces: Partial<Record<Square, Piece>>
  group: SVGGElement
  private pieceElements: Partial<Record<Square, SVGUseElement>>

  constructor(container: Element, pieces?: Partial<Record<Square, Piece>>) {
    this.pieces = pieces || {}
    this.group = makeSvgElement("g", { classes: ["pieces"] })
    this.pieceElements = {}

    container.appendChild(this.group)
  }

  cleanup() {
    removeSvgElement(this.group)
  }

  draw(orientation: Side) {
    // Remove old pieces, if any, and remove new ones
    Object.entries(this.pieces).forEach(([key, piece]) => {
      if (keyIsSquare(key)) {
        const existingPiece = this.pieceElements[key]
        const [row, column] = getVisualRowColumn(key, orientation)
        if (existingPiece) {
          removeSvgElement(existingPiece)
        }
        const newPiece = makeSvgElement("use", {
          attributes: {
            href: `${sprite}#${SPRITE_ID_MAP[piece.color][piece.pieceType]}`,
            width: "12.5%",
            height: "12.5%",
          },
          data: {
            square: key,
            piece: `${piece.color}-${piece.pieceType}`,
          },
        })
        newPiece.style.transform = `translate(${column * 12.5}%, ${
          row * 12.5
        }%)`

        this.pieceElements[key] = newPiece
        this.group.appendChild(newPiece)
      }
    })
  }
}
