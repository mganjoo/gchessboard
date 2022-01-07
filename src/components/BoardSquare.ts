import { getSquareColor, Piece, pieceEqual, Square } from "../utils/chess"
import { makeHTMLElement } from "../utils/dom"
import { BoardPiece } from "./BoardPiece"

export interface BoardSquareConfig {
  /**
   * Square label, e.g. "a5".
   */
  label: Square
  /**
   * Whether the square is used in an interactive grid. Decides whether
   * the square should get visual attributes like tabindex, labels etc.
   */
  interactive?: boolean
  /**
   * Whether this square can be tabbed to by the user (tabindex = 0). By default,
   * all chessboard squares are focusable but not user-tabbable (tabindex = -1).
   */
  tabbable?: boolean
  /**
   * Information about piece associated with the square. This piece is rendered
   * onto the square, and also determines label and class attributes of a square.
   */
  piece?: Piece
  /**
   * Whether a rank label should be shown on the square ("1", "2" etc).
   */
  rankLabelShown?: boolean
  /**
   * Whether a file label should be shown on the square ("a", "b" etc).
   */
  fileLabelShown?: boolean
}

/**
 * Visual representation of a chessboard square, along with attributes
 * that aid in interactivity (ARIA role, labels etc).
 */
export class BoardSquare {
  private readonly element: HTMLDivElement
  private readonly labelSpanElement: HTMLSpanElement
  private readonly rankLabelElement: HTMLSpanElement
  private readonly fileLabelElement: HTMLSpanElement
  private boardPiece?: BoardPiece
  private config: BoardSquareConfig

  constructor(container: HTMLElement, config: BoardSquareConfig) {
    this.config = { ...config }
    this.element = document.createElement("td")
    this.labelSpanElement = makeHTMLElement("span", {
      classes: ["chessboard--square-label"],
    })
    this.fileLabelElement = makeHTMLElement("span", {
      attributes: { "aria-hidden": "true" },
      classes: ["chessboard--file-label"],
    })
    this.rankLabelElement = makeHTMLElement("span", {
      attributes: { "aria-hidden": "true" },
      classes: ["chessboard--rank-label"],
    })
    this.element.appendChild(this.labelSpanElement)
    this.element.appendChild(this.fileLabelElement)
    this.element.appendChild(this.rankLabelElement)
    this.drawSquare()
    container.appendChild(this.element)
  }

  updateConfig(config: Partial<BoardSquareConfig>) {
    this.config = { ...this.config, ...config }
    this.drawSquare()
  }

  /**
   * Rendered width of element, used in making drag threshold calculations.
   */
  get width(): number {
    return this.element.clientWidth
  }

  focus() {
    this.element.focus()
  }

  blur() {
    this.element.blur()
  }

  private drawSquare() {
    // Label and color
    this.element.dataset.square = this.config.label
    this.element.dataset.squareColor = getSquareColor(this.config.label)
    this.labelSpanElement.textContent = this.config.label
    const [filePart, rankPart] = this.config.label.split("")
    this.rankLabelElement.textContent = this.config.rankLabelShown
      ? rankPart
      : null
    this.fileLabelElement.textContent = this.config.fileLabelShown
      ? filePart
      : null

    // Piece placement
    this.placePiece(this.config.piece)
    this.element.classList.toggle("has-piece", !!this.config.piece)

    // Interactivity
    if (this.config.interactive) {
      this.element.setAttribute("role", "gridcell")
      this.element.tabIndex = this.config.tabbable ? 0 : -1
    } else {
      this.element.removeAttribute("role")
      this.element.removeAttribute("tabindex")
    }
  }

  private placePiece(piece?: Piece) {
    if (this.boardPiece && piece && pieceEqual(piece, this.boardPiece.piece)) {
      return
    }
    if (this.boardPiece !== undefined) {
      this.boardPiece.remove()
    }
    this.boardPiece =
      piece !== undefined ? new BoardPiece(this.element, { piece }) : undefined
  }
}
