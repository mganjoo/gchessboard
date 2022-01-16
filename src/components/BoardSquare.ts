import { getSquareColor, Piece, Square } from "../utils/chess"
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
   * Whether a rank label should be shown on the square ("1", "2" etc).
   */
  rankLabelShown?: boolean
  /**
   * Whether a file label should be shown on the square ("a", "b" etc).
   */
  fileLabelShown?: boolean
}

/**
 * Explicit position for piece that is displaced from the center of a square.
 * There are two options:
 *
 * - type = "coordinates": an explicit (x, y) pixel location for piece. This is
 *   useful if piece is being dragged around or animating into the square from
 *   outside the board.
 *
 * - type = "squareOffset": piece is located on a different square on the board,
 *   `deltaRows` rows away and `deltaCols` columns. A positive value for `deltaRows`
 *   means the initial position has a higher y-coordinate than the current square,
 *   and a positive value for `deltaCols` means the initial position has a higher
 *   x-coordinate.
 */
export type ExplicitPiecePosition =
  | { type: "coordinates"; x: number; y: number }
  | { type: "squareOffset"; deltaRows: number; deltaCols: number }

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
  private _secondaryBoardPiece?: BoardPiece
  private _config: BoardSquareConfig
  private _explicitPosition?: ExplicitPiecePosition

  /**
   * Whether this square should be marked as the starting square of an ongoing
   * move.
   */
  private _moveStart?: boolean

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

  destroy() {
    this._boardPiece?.remove()
    this._secondaryBoardPiece?.remove()
  }

  updateConfig(config: Partial<BoardSquareConfig>) {
    // TODO: check for difference in values before updating
    this._config = { ...this._config, ...config }
    this._updateSquareVisuals()
  }

  /**
   * Rendered width of element (in integer), used in making drag threshold calculations.
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
      piece !== undefined ? new BoardPiece(this._element, { piece }) : undefined
    this._element.classList.toggle("has-piece", !!piece)

    this._explicitPosition = piece !== undefined ? position : undefined
    this._updatePieceLocation()

    // Always treat a piece change as the end or cancellation of a move
    this._moveStart = false
    this._updateMoveStartVisuals()
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

  startOrUpdateMove(piecePositionPx?: { x: number; y: number }) {
    if (this._boardPiece !== undefined) {
      this._moveStart = true
      this._updateMoveStartVisuals()

      this._explicitPosition =
        piecePositionPx !== undefined
          ? { type: "coordinates", ...piecePositionPx }
          : undefined

      this._updatePieceLocation()
    }
  }

  /**
   * Cancel ongoing move, if it exists. The method is declared as async
   * for callers to perform side effects on animation end.
   */
  async cancelMove(animate?: boolean) {
    this._moveStart = false
    this._updateMoveStartVisuals()
    this._explicitPosition = undefined
    await this._boardPiece?.setOffset(undefined, animate)
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
    this._updateMoveStartVisuals()
  }

  private _updateMoveStartVisuals() {
    if (this._config.interactive) {
      this._element.classList.toggle("move-start", !!this._moveStart)
    } else {
      this._element.classList.remove("move-start")
    }
  }

  private _updatePieceLocation() {
    if (this._boardPiece !== undefined) {
      if (this._explicitPosition !== undefined) {
        const squareDims = this._element.getBoundingClientRect()
        const leftOffset =
          this._explicitPosition.type === "coordinates"
            ? `${
                this._explicitPosition.x -
                squareDims.left -
                squareDims.width / 2
              }px`
            : `${this._explicitPosition.deltaCols * 100}%`
        const topOffset =
          this._explicitPosition.type === "coordinates"
            ? `${
                this._explicitPosition.y -
                squareDims.top -
                squareDims.height / 2
              }px`
            : `${this._explicitPosition.deltaRows * 100}%`
        this._boardPiece.setOffset({ left: leftOffset, top: topOffset })
      } else {
        this._boardPiece.setOffset(undefined)
      }
    }
  }
}
