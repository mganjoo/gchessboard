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
  private readonly _slotElement: HTMLSlotElement;

  private _label: Square;
  private _tabbable = false;
  private _moveable = false;
  private _interactive = false;
  private _boardPiece?: BoardPiece;
  private _secondaryBoardPiece?: BoardPiece;
  private _hasContent?: boolean;
  private _active = false;
  private _moveTarget = false;
  private _dragHovering = false;

  constructor(container: HTMLElement, label: Square) {
    this._element = makeHTMLElement("td", { attributes: { role: "cell" } });
    this._labelSpanElement = makeHTMLElement("span", { classes: ["label"] });
    this._element.appendChild(this._labelSpanElement);
    this._label = label;

    const slotWrapper = makeHTMLElement("div", { classes: ["content"] });
    this._slotElement = document.createElement("slot");
    slotWrapper.appendChild(this._slotElement);
    this._element.appendChild(slotWrapper);

    this._updateLabelVisuals();

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
    this._updateActiveClass();
    this._updateMoveableClass();
    this._updateMoveTargetClass();
    this._updateDragHoveringClass();
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
   * Whether this square is a valid move target. These are highlighted
   * when move is in progress, indicating squares that we can move to.
   */
  get moveTarget(): boolean {
    return this._moveTarget;
  }

  set moveTarget(value: boolean) {
    this._moveTarget = value;
    this._updateMoveTargetClass();
  }

  /**
   * Whether this square is currently being hovered over (during a drag move).
   */
  get dragHovering(): boolean {
    return this._dragHovering;
  }

  set dragHovering(value: boolean) {
    this._dragHovering = value;
    this._updateDragHoveringClass();
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
   * Mark this square as being interacted with.
   */
  startInteraction() {
    if (this._boardPiece !== undefined && this.moveable) {
      this._active = true;
      this._updateActiveClass();
      this._boardPiece.finishAnimations();
    }
  }

  /**
   * Set piece to explicit pixel location. Ignore if square has no piece.
   */
  displacePiece(x: number, y: number) {
    this._boardPiece?.setExplicitPosition({ type: "coordinates", x, y });
  }

  /**
   * Cancel ongoing interaction and reset position.
   */
  cancelInteraction(animateDurationMs?: number) {
    this._active = false;
    this._updateActiveClass();
    this._boardPiece?.resetPosition(animateDurationMs);
  }

  private _updateLabelVisuals() {
    this._element.dataset.square = this.label;
    this._element.dataset.squareColor = getSquareColor(this.label);
    this._slotElement.name = this.label;
    this._labelSpanElement.textContent = this.label;
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

  private _updateActiveClass() {
    this._updateInteractiveCssClass("active", this._active);
  }

  private _updateMoveTargetClass() {
    this._updateInteractiveCssClass("move-target", this._moveTarget);
  }

  private _updateMoveableClass() {
    this._updateInteractiveCssClass("moveable", this.moveable);
  }

  private _updateDragHoveringClass() {
    this._updateInteractiveCssClass("drag-hovering", this.dragHovering);
  }

  private _updateInteractiveCssClass(name: string, value: boolean) {
    if (this.interactive) {
      this._element.classList.toggle(name, value);
    } else {
      this._element.classList.remove(name);
    }
  }

  private _updateSquareAfterPieceChange() {
    this._element.classList.toggle("has-piece", !!this._boardPiece);

    // Always cancel ongoing interactions when piece changes
    this._active = false;
    this._updateActiveClass();

    // Ensure secondary piece is toggled off if piece is changed
    this.toggleSecondaryPiece(false);
  }
}
