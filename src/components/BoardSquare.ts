import { getSquareColor, Piece, Square } from "../utils/chess"
import { removeElement } from "../utils/dom"

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
   * Information about piece associated with the square. This doesn't actually
   * get rendered directly onto the square (piece rendering is handled by another
   * layer), but is used to determine label and class attributes of a square.
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
  private config: BoardSquareConfig

  constructor(container: HTMLElement, config: BoardSquareConfig) {
    this.element = document.createElement("td")
    this.labelSpanElement = document.createElement("span")
    this.element.appendChild(this.labelSpanElement)
    this.config = { ...config }
    this.drawSquare()
    container.appendChild(this.element)
  }

  cleanup() {
    removeElement(this.element)
  }

  updateConfig(config: Partial<BoardSquareConfig>) {
    this.config = { ...this.config, ...config }
    this.drawSquare()
  }

  /**
   * Rendered width of element (useful in making drag threshold calculations).
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
    const color = getSquareColor(this.config.label)
    const textLabel = this.config.piece
      ? `${this.config.piece.color} ${this.config.piece.pieceType} on ${this.config.label}`
      : this.config.label
    this.element.dataset.square = this.config.label
    this.element.dataset.squareColor = color
    this.labelSpanElement.textContent = textLabel

    if (this.config.interactive) {
      this.element.setAttribute("role", "gridcell")
      this.element.tabIndex = this.config.tabbable ? 0 : -1
    } else {
      this.element.removeAttribute("role")
      this.element.removeAttribute("tabindex")
    }

    this.element.classList.toggle("has-piece", !!this.config.piece)

    const [filePart, rankPart] = this.config.label.split("")
    if (this.config.rankLabelShown) {
      this.element.dataset.rankLabel = rankPart
    } else {
      delete this.element.dataset["rankLabel"]
    }
    if (this.config.fileLabelShown) {
      this.element.dataset.fileLabel = filePart
    } else {
      delete this.element.dataset["fileLabel"]
    }
  }
}
