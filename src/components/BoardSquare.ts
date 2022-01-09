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
  private readonly _element: HTMLDivElement
  private readonly _labelSpanElement: HTMLSpanElement
  private readonly _rankLabelElement: HTMLSpanElement
  private readonly _fileLabelElement: HTMLSpanElement
  private _boardPiece?: BoardPiece
  private _config: BoardSquareConfig

  constructor(container: HTMLElement, config: BoardSquareConfig) {
    this._config = { ...config }
    this._element = document.createElement("td")
    this._labelSpanElement = makeHTMLElement("span", {
      classes: ["chessboard--square-label"],
    })
    this._fileLabelElement = makeHTMLElement("span", {
      attributes: { "aria-hidden": "true" },
      classes: ["chessboard--file-label"],
    })
    this._rankLabelElement = makeHTMLElement("span", {
      attributes: { "aria-hidden": "true" },
      classes: ["chessboard--rank-label"],
    })
    this._element.appendChild(this._labelSpanElement)
    this._element.appendChild(this._fileLabelElement)
    this._element.appendChild(this._rankLabelElement)
    this._updateSquareVisuals()
    container.appendChild(this._element)
  }

  updateConfig(config: Partial<BoardSquareConfig>) {
    this._config = { ...this._config, ...config }
    this._updateSquareVisuals()
  }

  /**
   * Rendered width of element, used in making drag threshold calculations.
   */
  get width(): number {
    return this._element.clientWidth
  }

  focus() {
    this._element.focus()
  }

  blur() {
    this._element.blur()
  }

  private _updateSquareVisuals() {
    // Label and color
    this._element.dataset.square = this._config.label
    this._element.dataset.squareColor = getSquareColor(this._config.label)
    this._labelSpanElement.textContent = this._config.label
    const [filePart, rankPart] = this._config.label.split("")
    this._rankLabelElement.textContent = this._config.rankLabelShown
      ? rankPart
      : null
    this._fileLabelElement.textContent = this._config.fileLabelShown
      ? filePart
      : null

    // Piece placement
    this._replacePiece(this._config.piece)
    this._element.classList.toggle("has-piece", !!this._config.piece)

    // Interactivity
    if (this._config.interactive) {
      this._element.setAttribute("role", "gridcell")
      this._element.tabIndex = this._config.tabbable ? 0 : -1
    } else {
      this._element.removeAttribute("role")
      this._element.removeAttribute("tabindex")
    }
  }

  private _replacePiece(piece?: Piece) {
    if (
      this._boardPiece &&
      piece &&
      pieceEqual(piece, this._boardPiece.piece)
    ) {
      return
    }
    if (this._boardPiece !== undefined) {
      this._boardPiece.remove()
    }
    this._boardPiece =
      piece !== undefined ? new BoardPiece(this._element, { piece }) : undefined
  }
}
