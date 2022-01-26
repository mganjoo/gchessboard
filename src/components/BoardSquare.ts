import { getSquareColor, Piece, pieceEqual, Square } from "../utils/chess";
import { makeHTMLElement } from "../utils/dom";
import {
  BoardPiece,
  ExplicitPiecePosition,
  FadeInAnimation,
  SlideInAnimation,
} from "./BoardPiece";

/**
 * Visual representation of a chessboard square, along with attributes
 * that aid in interactivity (ARIA role, labels etc).
 */
export class BoardSquare {
  private readonly _element: HTMLTableCellElement;
  private readonly _labelSpanElement: HTMLSpanElement;
  private readonly _rankLabelElement?: HTMLSpanElement;
  private readonly _fileLabelElement?: HTMLSpanElement;
  private readonly _slotElement: HTMLSlotElement;

  private _label: Square;
  private _tabbable = false;
  private _moveable = false;
  private _hideCoords = false;
  private _interactive = false;
  private _boardPiece?: BoardPiece;
  private _secondaryBoardPiece?: BoardPiece;
  private _hasContent?: boolean;
  private _moveStart = false;

  constructor(
    container: HTMLElement,
    label: Square,
    // File and rank label creation is determined exactly once at construction
    constructorOptions?: { makeRankLabel?: boolean; makeFileLabel?: boolean }
  ) {
    this._element = makeHTMLElement("td", { attributes: { role: "cell" } });

    this._label = label;
    this._labelSpanElement = makeHTMLElement("span", { classes: ["label"] });
    this._element.appendChild(this._labelSpanElement);

    const slotWrapper = makeHTMLElement("div", { classes: ["content"] });
    this._slotElement = document.createElement("slot");
    slotWrapper.appendChild(this._slotElement);
    this._element.appendChild(slotWrapper);

    if (constructorOptions?.makeFileLabel) {
      this._fileLabelElement = makeHTMLElement("span", {
        attributes: { "aria-hidden": "true" },
        classes: ["file-label"],
      });

      this._element.appendChild(this._fileLabelElement);
    }
    if (constructorOptions?.makeRankLabel) {
      this._rankLabelElement = makeHTMLElement("span", {
        attributes: { "aria-hidden": "true" },
        classes: ["rank-label"],
      });
      this._element.appendChild(this._rankLabelElement);
    }
    this.label = label;

    container.appendChild(this._element);
  }

  /**
   * Label associated with the square (depends on orientation of square
   * on the board).
   */
  get label(): Square {
    return this._label;
  }

  set label(value: Square) {
    this._label = value;
    this._updateLabelVisuals();
    this._updateCoords();
  }

  /**
   * Whether the square is used in an interactive grid. Decides whether
   * the square should get visual attributes like tabindex, labels etc.
   */
  get interactive(): boolean {
    return this._interactive;
  }

  set interactive(value: boolean) {
    this._interactive = value;
    this._updateAriaRole();
    this._updateTabIndex();
    this._updateMoveStartClass();
    this._updateMoveableClass();
  }

  /**
   * Whether rank or file labels on the square (if they exist) should be hidden.
   */
  get hideCoords(): boolean {
    return this._hideCoords;
  }

  set hideCoords(value: boolean) {
    this._hideCoords = value;
    this._updateCoords();
  }

  /**
   * Whether this square can be tabbed to by the user (tabindex = 0). By default,
   * all chessboard squares are focusable but not user-tabbable (tabindex = -1).
   */
  get tabbable(): boolean {
    return this._tabbable;
  }

  set tabbable(value: boolean) {
    this._tabbable = value;
    this._updateTabIndex();
  }

  /**
   * Whether this square should be marked as containing any slotted content.
   */
  get hasContent(): boolean {
    return !!this._hasContent;
  }

  set hasContent(value: boolean) {
    this._hasContent = value;
    this._element.classList.toggle("has-content", value);
  }

  /**
   * Whether the piece on this square is moveable through user interaction.
   * To be set to true, a piece must actually exist on the square.
   */
  get moveable(): boolean {
    return this._moveable;
  }

  set moveable(value: boolean) {
    if (!value || this._boardPiece) {
      this._moveable = value;
      this._updateMoveableClass();
    }
  }

  /**
   * Rendered width of element (in integer), used in making drag threshold calculations.
   */
  get width(): number {
    return this._element.clientWidth;
  }

  /**
   * Get explicit position of primary piece, if set.
   */
  get explicitPiecePosition(): ExplicitPiecePosition | undefined {
    return this._boardPiece?.explicitPosition;
  }

  /**
   * Focus element associated with square.
   */
  focus() {
    this._element.focus();
  }

  /**
   * Blur element associated with square.
   */
  blur() {
    this._element.blur();
  }

  /**
   * Set primary piece associated with the square. This piece is rendered either
   * directly onto the square (default) or optionally, animating in from an
   * explicit position `animateFromPosition`.
   *
   * If the piece being set is the same as the one already present on the
   * square, and the new piece is not animating in from anywhere, this will
   * be a no-op since the position of the two pieces would otherwise be exactly
   * the same.
   */
  setPiece(
    piece: Piece,
    moveable: boolean,
    animation?: SlideInAnimation | FadeInAnimation
  ) {
    if (!pieceEqual(this._boardPiece?.piece, piece) || animation) {
      this.clearPiece(animation?.durationMs);
      this._boardPiece = new BoardPiece(this._element, { piece, animation });
      this.moveable = moveable;
      this._updateSquareAfterPieceChange();
    }
  }

  clearPiece(animationDurationMs?: number) {
    if (this._boardPiece !== undefined) {
      this.moveable = false;
      this._boardPiece.remove(animationDurationMs);
      this._boardPiece = undefined;
      this._updateSquareAfterPieceChange();
    }
  }

  /**
   * Optionally, squares may have a secondary piece, such as a ghost piece shown
   * while dragging. The secondary piece is always shown *behind* the primary
   * piece in the DOM.
   */
  toggleSecondaryPiece(show: boolean) {
    if (show && !this._secondaryBoardPiece && this._boardPiece) {
      this._secondaryBoardPiece = new BoardPiece(this._element, {
        piece: this._boardPiece.piece,
        secondary: true,
      });
    }
    if (!show) {
      if (this._secondaryBoardPiece !== undefined) {
        this._secondaryBoardPiece.remove();
      }
      this._secondaryBoardPiece = undefined;
    }
  }

  /**
   * Start a move. If provided, piece position is set to `piecePositionPx`
   * explicitly.
   */
  startMove(piecePositionPx?: { x: number; y: number }) {
    if (this._boardPiece !== undefined && this.moveable) {
      this._moveStart = true;
      this._updateMoveStartClass();
      this._boardPiece.finishAnimations();

      if (piecePositionPx !== undefined) {
        this.updateMove(piecePositionPx);
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
      });
    }
  }

  /**
   * Finish ongoing move, if it exists.
   */
  finishMove(animateDurationMs?: number) {
    this._moveStart = false;
    this._updateMoveStartClass();
    this._boardPiece?.resetPosition(animateDurationMs);
  }

  private _updateLabelVisuals() {
    this._element.dataset.square = this.label;
    this._element.dataset.squareColor = getSquareColor(this.label);
    this._labelSpanElement.textContent = this.label;
    this._slotElement.name = this.label;
  }

  private _updateCoords() {
    const [filePart, rankPart] = this.label.split("");
    if (this._rankLabelElement) {
      this._rankLabelElement.textContent = this.hideCoords ? null : rankPart;
    }
    if (this._fileLabelElement) {
      this._fileLabelElement.textContent = this.hideCoords ? null : filePart;
    }
  }

  private _updateAriaRole() {
    this._element.setAttribute("role", this.interactive ? "gridcell" : "cell");
  }

  private _updateTabIndex() {
    if (this.interactive) {
      this._element.tabIndex = this.tabbable ? 0 : -1;
    } else {
      this._element.removeAttribute("tabindex");
    }
  }

  private _updateMoveStartClass() {
    if (this.interactive) {
      this._element.classList.toggle("move-start", this._moveStart);
    } else {
      this._element.classList.remove("move-start");
    }
  }

  private _updateMoveableClass() {
    if (this.interactive) {
      this._element.classList.toggle("moveable", this.moveable);
    } else {
      this._element.classList.remove("moveable");
    }
  }

  private _updateSquareAfterPieceChange() {
    this._element.classList.toggle("has-piece", !!this._boardPiece);

    // Always treat a piece change as the end of a move
    this._moveStart = false;
    this._updateMoveStartClass();

    // Ensure secondary piece is toggled off if piece is changed
    this.toggleSecondaryPiece(false);
  }
}
