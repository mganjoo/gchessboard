import { getSquareColor, Piece, pieceEqual, Square } from "../utils/chess"
import { makeHTMLElement } from "../utils/dom"
import { BoardPiece, ExplicitPiecePosition } from "./BoardPiece"

/**
 * Visual attributes related to a square, that can change over the
 * course of the square lifecycle.
 */
export interface BoardSquareProps {
  /**
   * Square label, e.g. "a5".
   */
  label: Square
  /**
   * Whether the square is used in an interactive grid. Decides whether
   * the square should get visual attributes like tabindex, labels etc.
   */
  interactive: boolean
  /**
   * Whether this square can be tabbed to by the user (tabindex = 0). By default,
   * all chessboard squares are focusable but not user-tabbable (tabindex = -1).
   */
  tabbable: boolean
  /**
   * Whether rank or file labels on the square (if they exist) should be shown.
   */
  showCoords: boolean
}

/**
 * Visual representation of a chessboard square, along with attributes
 * that aid in interactivity (ARIA role, labels etc).
 */
export class BoardSquare {
  private readonly _element: HTMLTableCellElement
  private readonly _labelSpanElement: HTMLSpanElement
  private readonly _rankLabelElement?: HTMLSpanElement
  private readonly _fileLabelElement?: HTMLSpanElement
  private readonly _slotElement: HTMLSlotElement
  private _boardPiece?: BoardPiece
  private _secondaryBoardPiece?: BoardPiece
  private _props: BoardSquareProps

  /**
   * Whether this square should be marked as the start of an ongoing move.
   */
  private _moveStart?: boolean

  constructor(
    container: HTMLElement,
    props: BoardSquareProps,
    // File and rank label creation is determined exactly once at construction
    constructorOptions?: { makeRankLabel?: boolean; makeFileLabel?: boolean }
  ) {
    this._props = { ...props }
    this._element = document.createElement("td")
    this._labelSpanElement = makeHTMLElement("span", {
      classes: ["label"],
    })
    const slotWrapper = makeHTMLElement("div", {
      classes: ["content"],
    })
    this._slotElement = document.createElement("slot")
    slotWrapper.appendChild(this._slotElement)

    this._element.appendChild(this._labelSpanElement)
    this._element.appendChild(slotWrapper)

    if (constructorOptions?.makeFileLabel) {
      this._fileLabelElement = makeHTMLElement("span", {
        attributes: { "aria-hidden": "true" },
        classes: ["file-label"],
      })

      this._element.appendChild(this._fileLabelElement)
    }
    if (constructorOptions?.makeRankLabel) {
      this._rankLabelElement = makeHTMLElement("span", {
        attributes: { "aria-hidden": "true" },
        classes: ["rank-label"],
      })
      this._element.appendChild(this._rankLabelElement)
    }

    this._updateSquareVisuals()
    container.appendChild(this._element)
  }

  destroy() {
    this._boardPiece?.remove()
    this._secondaryBoardPiece?.remove()
  }

  /**
   * Update all props of the square at once. Useful for cases requiring
   * a large-scale re-render, e.g. change in orientation or interactivity.
   */
  updateAllProps(props: BoardSquareProps) {
    this._props = { ...props }
    this._updateSquareVisuals()
  }

  get tabbable(): boolean {
    return !!this._props.tabbable
  }

  set tabbable(value: boolean) {
    this._props.tabbable = value
    this._updateTabIndex()
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
   * Set primary piece associated with the square. This piece is rendered either
   * onto the square (default) or at an explicit location `position`.
   */
  setPiece(piece: Piece | undefined, explicitPosition?: ExplicitPiecePosition) {
    // Avoid unnecessary rendering if the existing piece is exactly the same
    if (!pieceEqual(this._boardPiece?.piece, piece) || explicitPosition) {
      if (this._boardPiece) {
        // Also cancels animations
        this._boardPiece.remove()
      }
      this._boardPiece = piece
        ? new BoardPiece(this._element, { piece, explicitPosition })
        : undefined
      this._element.classList.toggle("has-piece", !!piece)

      // Always treat a piece change as the end of a move
      this._moveStart = false
      this._updateMoveStartClass()
    }
  }

  /**
   * Optionally, squares may have a secondary piece, such as a ghost piece shown
   * while dragging. The secondary piece is always shown *behind* the primary
   * piece in the DOM.
   */
  toggleSecondaryPiece(show: boolean) {
    if (!show && this._secondaryBoardPiece !== undefined) {
      this._secondaryBoardPiece.remove()
    }
    this._secondaryBoardPiece =
      show && this._boardPiece !== undefined
        ? new BoardPiece(this._element, {
            piece: this._boardPiece.piece,
            secondary: true,
          })
        : undefined
  }

  /**
   * Start a move. If provided, piece position is set to `piecePositionPx`
   * explicitly.
   */
  startMove(piecePositionPx?: { x: number; y: number }) {
    if (this._boardPiece !== undefined) {
      this._moveStart = true
      this._updateMoveStartClass()

      if (piecePositionPx !== undefined) {
        this.updateMove(piecePositionPx)
      }
    }
  }

  /**
   * Update piece location for existing move. Ignore if square has no
   * piece or no move is in progress.
   */
  updateMove(piecePositionPx: { x: number; y: number }) {
    if (this._boardPiece !== undefined && this._moveStart) {
      this._boardPiece.setExplicitPosition({
        type: "coordinates",
        ...piecePositionPx,
      })
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
    this._element.dataset.square = this._props.label
    this._element.dataset.squareColor = getSquareColor(this._props.label)
    this._labelSpanElement.textContent = this._props.label
    this._slotElement.name = this._props.label

    const [filePart, rankPart] = this._props.label.split("")
    if (this._rankLabelElement) {
      this._rankLabelElement.textContent = this._props.showCoords
        ? rankPart
        : null
    }
    if (this._fileLabelElement) {
      this._fileLabelElement.textContent = this._props.showCoords
        ? filePart
        : null
    }

    // Interactivity
    if (this._props.interactive) {
      this._element.setAttribute("role", "gridcell")
    } else {
      this._element.removeAttribute("role")
    }
    this._updateTabIndex()
    this._updateMoveStartClass()
  }

  private _updateMoveStartClass() {
    if (this._props.interactive) {
      this._element.classList.toggle("move-start", !!this._moveStart)
    } else {
      this._element.classList.remove("move-start")
    }
  }

  private _updateTabIndex() {
    if (this._props.interactive) {
      this._element.tabIndex = this._props.tabbable ? 0 : -1
    } else {
      this._element.removeAttribute("tabindex")
    }
  }
}
