import { getSquareColor, Piece, Square } from "../utils/chess"
import { makeHTMLElement } from "../utils/dom"
import { BoardPiece, ExplicitPiecePosition } from "./BoardPiece"

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
  private readonly _element: HTMLTableCellElement
  private readonly _labelSpanElement: HTMLSpanElement
  private readonly _rankLabelElement: HTMLSpanElement
  private readonly _fileLabelElement: HTMLSpanElement
  private _boardPiece?: BoardPiece
  private _secondaryBoardPiece?: BoardPiece
  private _config: BoardSquareConfig

  /**
   * Whether this square should be marked as the start of an ongoing move.
   */
  private _moveStart?: boolean

  constructor(container: HTMLElement, config: BoardSquareConfig) {
    this._config = { ...config }
    this._element = document.createElement("td")
    this._labelSpanElement = makeHTMLElement("span", {
      classes: ["label"],
    })
    this._fileLabelElement = makeHTMLElement("span", {
      attributes: { "aria-hidden": "true" },
      classes: ["file-label"],
    })
    this._rankLabelElement = makeHTMLElement("span", {
      attributes: { "aria-hidden": "true" },
      classes: ["rank-label"],
    })
    this._element.appendChild(this._labelSpanElement)
    this._element.appendChild(this._fileLabelElement)
    this._element.appendChild(this._rankLabelElement)
    this._updateSquareVisuals()
    container.appendChild(this._element)
  }

  destroy() {
    this._boardPiece?.remove()
    this._secondaryBoardPiece?.remove()
  }

  updateConfig(config: Partial<BoardSquareConfig>) {
    this._config = { ...this._config, ...config }
    this._updateSquareVisuals()
  }

  /**
   * Rendered width of element (in integer), used in making drag threshold calculations.
   */
  get width(): number {
    return this._element.clientWidth
  }

  /**
   * Get explicit position of primary piece, if set.
   */
  get explicitPiecePosition(): ExplicitPiecePosition | undefined {
    return this._boardPiece?.explicitPosition
  }

  focus() {
    this._element.focus()
  }

  blur() {
    this._element.blur()
  }

  /**
   * Set primary piece associated with the square. This piece is rendered onto
   * the square or at an explicit location `position`, and also
   * determines class attributes of a square.
   */
  setPiece(piece: Piece | undefined, position?: ExplicitPiecePosition) {
    if (this._boardPiece !== undefined) {
      // Unmount piece (which also cancels animations)
      this._boardPiece.remove()
    }
    this._boardPiece =
      piece !== undefined
        ? new BoardPiece(this._element, { piece, explicitPosition: position })
        : undefined
    this._element.classList.toggle("has-piece", !!piece)

    // Always treat a piece change as the end of a move
    this._moveStart = false
    this._updateMoveStartClass()
  }

  /**
   * Optionally, squares may have a secondary piece, such as a ghost piece shown
   * while dragging, or a temporary state where a captured piece is animating out
   * as a new piece is entering.The secondary piece is always shown *behind* the
   * primary piece in the DOM.
   */
  setSecondaryPiece(piece: Piece | undefined) {
    if (this._secondaryBoardPiece !== undefined) {
      this._secondaryBoardPiece.remove()
    }
    this._secondaryBoardPiece =
      piece !== undefined
        ? new BoardPiece(this._element, { piece, secondary: true })
        : undefined
  }

  /**
   * Start, or update location of, a move. Piece position is set to
   * `piecePositionPx` explicitly.
   */
  startOrUpdateMove(piecePositionPx?: { x: number; y: number }) {
    if (this._boardPiece !== undefined) {
      this._moveStart = true
      this._updateMoveStartClass()

      if (piecePositionPx !== undefined) {
        this._boardPiece?.setExplicitPosition({
          type: "coordinates",
          ...piecePositionPx,
        })
      }
    }
  }

  /**
   * Finish ongoing move, if it exists. The method is declared as async
   * for callers to perform side effects on animation end.
   */
  async finishMove(animate?: boolean) {
    this._moveStart = false
    this._updateMoveStartClass()
    await this._boardPiece?.resetPosition(animate)
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

    // Interactivity
    if (this._config.interactive) {
      this._element.setAttribute("role", "gridcell")
      this._element.tabIndex = this._config.tabbable ? 0 : -1
    } else {
      this._element.removeAttribute("role")
      this._element.removeAttribute("tabindex")
    }
    this._updateMoveStartClass()
  }

  private _updateMoveStartClass() {
    if (this._config.interactive) {
      this._element.classList.toggle("move-start", !!this._moveStart)
    } else {
      this._element.classList.remove("move-start")
    }
  }
}
