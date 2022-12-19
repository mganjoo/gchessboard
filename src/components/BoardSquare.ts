import { getSquareColor, Piece, pieceEqual, Square } from "../utils/chess.js";
import { makeHTMLElement } from "../utils/dom.js";
import {
  BoardPiece,
  ExplicitPiecePosition,
  FadeInAnimation,
  SlideInAnimation,
} from "./BoardPiece";

/**
 * Identifies how the square contributes to an ongoing move.
 * - undefined = there is no current move in progress, here or at any other square.
 * - "move-start" = square is currently the start square of an ongoing move.
 * - "move-target" = square is an eligible target for an ongoing move.
 * - "move-nontarget" = there is an ongoing move, but square is not an eligible target.
 */
type BoardSquareMoveState = "move-start" | "move-target" | "move-nontarget";

/**
 * Visual representation of a chessboard square, along with attributes
 * that aid in interactivity (ARIA role, labels etc).
 */
export class BoardSquare {
  private readonly _tdElement: HTMLTableCellElement;
  private readonly _contentElement: HTMLDivElement;
  private readonly _slotWrapper: HTMLElement;
  private readonly _slotElement: HTMLSlotElement;

  private _label: Square;
  private _interactive = false;
  private _tabbable = false;
  private _moveable = false;
  private _boardPiece?: BoardPiece;
  private _secondaryBoardPiece?: BoardPiece;
  private _hasContent?: boolean;
  private _hover = false;
  private _markedTarget = false;
  private _moveState?: BoardSquareMoveState;

  constructor(container: HTMLElement, label: Square) {
    this._tdElement = makeHTMLElement("td", { attributes: { role: "cell" } });
    this._label = label;

    this._contentElement = makeHTMLElement("div", { classes: ["content"] });

    this._slotWrapper = makeHTMLElement("div", {
      classes: ["slot"],
      attributes: { role: "presentation" },
    });
    this._slotElement = document.createElement("slot");
    this._slotWrapper.appendChild(this._slotElement);

    this._contentElement.appendChild(this._slotWrapper);

    this._updateLabelVisuals();

    this._tdElement.appendChild(this._contentElement);
    container.appendChild(this._tdElement);
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
    this._moveState = undefined;

    // Aria roles
    this._tdElement.setAttribute("role", value ? "gridcell" : "cell");
    if (value) {
      this._contentElement.setAttribute("role", "button");
    } else {
      this._contentElement.removeAttribute("role");
    }

    this._updateTabIndex();
    this._updateMoveStateVisuals();
    this._updateLabelVisuals();
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
    this._contentElement.classList.toggle("has-content", value);
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
      this._updateMoveStateVisuals();
      this._updateLabelVisuals();
    }
  }

  /**
   * Whether this square is a valid move target. These are highlighted
   * when move is in progress, indicating squares that we can move to.
   */
  get moveTarget(): boolean {
    return this._moveState === "move-target";
  }

  set moveTarget(value: boolean) {
    this._moveState = value ? "move-target" : "move-nontarget";
    this._updateMoveStateVisuals();
    this._updateLabelVisuals();
  }

  removeMoveState() {
    this._moveState = undefined;
    this._updateMoveStateVisuals();
    this._updateLabelVisuals();
  }

  /**
   * Whether this square is currently a "hover" target: the equivalent of a
   * :hover pseudoclass while mousing over a target square, but for drag
   * and keyboard moves.
   */
  get hover(): boolean {
    return this._hover;
  }

  set hover(value: boolean) {
    this._hover = value;
    this._contentElement.classList.toggle("hover", value);
  }

  /**
   * Whether this square is currently a marked destination of a move. This
   * is usually shown with a marker or other indicator on the square.
   */
  get markedTarget(): boolean {
    return this._markedTarget;
  }

  set markedTarget(value: boolean) {
    this._markedTarget = value;
    this._contentElement.classList.toggle("marked-target", value);
  }

  /**
   * Rendered width of element (in integer), used in making drag threshold calculations.
   */
  get width(): number {
    return this._contentElement.clientWidth;
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
    this._contentElement.focus();
  }

  /**
   * Blur element associated with square.
   */
  blur() {
    this._contentElement.blur();
  }

  /**
   * Return BoardPiece on this square, if it exists.
   */
  get boardPiece() {
    return this._boardPiece;
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
      this._boardPiece = new BoardPiece(this._contentElement, {
        piece,
        animation,
      });
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
      this._secondaryBoardPiece = new BoardPiece(this._contentElement, {
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
      this._moveState = "move-start";
      this._updateMoveStateVisuals();
      this._updateLabelVisuals();
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
   * Set piece back to original location. Ignore if square has no piece.
   */
  resetPiecePosition(animateDurationMs?: number) {
    this._boardPiece?.resetPosition(animateDurationMs);
  }

  /**
   * Cancel ongoing interaction and reset position.
   */
  cancelInteraction(animateDurationMs?: number) {
    this._moveState = undefined;
    this._updateMoveStateVisuals();
    this._updateLabelVisuals();
    this.resetPiecePosition(animateDurationMs);
  }

  private _updateLabelVisuals() {
    this._contentElement.dataset.square = this.label;
    this._contentElement.dataset.squareColor = getSquareColor(this.label);
    const labelParts = [
      this._boardPiece
        ? `${this.label}, ${this._boardPiece.piece.color} ${this._boardPiece.piece.pieceType}`
        : `${this.label}`,
    ];
    if (this._moveState === "move-start") {
      labelParts.push("start of move");
    }
    if (this._moveState === "move-target") {
      labelParts.push("target square");
    }
    this._contentElement.setAttribute("aria-label", labelParts.join(", "));
    this._slotElement.name = this.label;
  }

  private _updateTabIndex() {
    if (this.interactive) {
      this._contentElement.tabIndex = this.tabbable ? 0 : -1;
    } else {
      this._contentElement.removeAttribute("tabindex");
    }
  }

  private _updateMoveStateVisuals() {
    this._updateInteractiveCssClass(
      "moveable",
      this.moveable && !this._moveState
    );

    this._updateInteractiveCssClass(
      "move-start",
      this._moveState === "move-start"
    );

    this._updateInteractiveCssClass(
      "move-target",
      this._moveState === "move-target"
    );

    this._contentElement.setAttribute(
      "aria-disabled",
      (!this._moveState && !this.moveable).toString()
    );
  }

  private _updateInteractiveCssClass(name: string, value: boolean) {
    this._contentElement.classList.toggle(name, this.interactive && value);
  }

  private _updateSquareAfterPieceChange() {
    this._contentElement.classList.toggle("has-piece", !!this._boardPiece);

    // Always cancel ongoing interactions when piece changes
    this._moveState = undefined;
    this._updateMoveStateVisuals();

    // Ensure secondary piece is toggled off if piece is changed
    this.toggleSecondaryPiece(false);

    // Update label
    this._updateLabelVisuals();
  }
}
