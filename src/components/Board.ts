import {
  calcPositionDiff,
  getSquare,
  getVisualIndex,
  getVisualRowColumn,
  positionsEqual,
  Position,
  Side,
  Square,
  keyIsSquare,
} from "../utils/chess";
import { makeHTMLElement } from "../utils/dom";
import { BoardState } from "./BoardState";
import { assertUnreachable, hasDataset } from "../utils/typing";
import { BoardSquare } from "./BoardSquare";

export class Board {
  private readonly _table: HTMLElement;
  private readonly _boardSquares: BoardSquare[];
  private _orientation: Side;
  private _interactive: boolean;
  private _hideCoords: boolean;
  private _position: Position;
  private _boardState: BoardState;

  private _moveStartSquare?: Square;
  private _tabbableSquare?: Square;
  private _focused?: boolean;
  private _doingProgrammaticBlur = false;
  private _defaultTabbableSquare: Square;

  // Event handlers
  private _mouseDownHandler: (e: MouseEvent) => void;
  private _mouseUpHandler: (e: MouseEvent) => void;
  private _mouseMoveHandler: (e: MouseEvent) => void;
  private _focusInHandler: (e: FocusEvent) => void;
  private _focusOutHandler: (e: FocusEvent) => void;
  private _keyDownHandler: (e: KeyboardEvent) => void;

  /**
   * Fraction of square width that mouse must be moved to be
   * considered a "drag" action.
   */
  private static DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION = 0.1;

  /**
   * Minimum number of pixels to enable dragging.
   */
  private static DRAG_THRESHOLD_MIN_PIXELS = 2;

  /**
   * Creates a set of elements representing chessboard squares, as well
   * as managing and displaying pieces rendered on the squares.
   */
  constructor(initValues: { orientation: Side; animationDurationMs: number }) {
    this._boardSquares = new Array(64);
    this._orientation = initValues.orientation;
    this.animationDurationMs = initValues.animationDurationMs;
    this._interactive = false;
    this._hideCoords = false;
    this._position = {};
    this._boardState = { id: "default" };

    // Bottom left corner white orientation = white
    this._defaultTabbableSquare = "a1";

    this._table = makeHTMLElement("table", {
      attributes: {
        role: "table",
        "aria-label": "Chess board",
      },
      classes: ["board"],
    });

    for (let i = 0; i < 8; i++) {
      const row = makeHTMLElement("tr", {
        attributes: { role: "row" },
      });
      for (let j = 0; j < 8; j++) {
        const idx = 8 * i + j;
        const square = getSquare(idx, this.orientation);
        this._boardSquares[idx] = new BoardSquare(row, square, {
          makeFileLabel: i === 7,
          makeRankLabel: j === 0,
        });
      }
      this._table.appendChild(row);
    }
    this._getBoardSquare(this._defaultTabbableSquare).tabbable = true;

    this._mouseDownHandler = this._makeEventHandler(this._handleMouseDown);
    this._mouseUpHandler = this._makeEventHandler(this._handleMouseUp);
    this._mouseMoveHandler = this._makeEventHandler(this._handleMouseMove);
    this._keyDownHandler = this._makeEventHandler(this._handleKeyDown);
    this._focusInHandler = this._makeEventHandler(this._handleFocusIn);
    this._focusOutHandler = this._makeEventHandler(this._handleFocusOut);

    this._table.addEventListener("mousedown", this._mouseDownHandler);
    this._table.addEventListener("focusin", this._focusInHandler);
    this._table.addEventListener("focusout", this._focusOutHandler);
    this._table.addEventListener("keydown", this._keyDownHandler);
    this._table.addEventListener("slotchange", this._slotChangeHandler);
    this._table.addEventListener("transitionend", this._transitionHandler);
    this._table.addEventListener("transitioncancel", this._transitionHandler);
  }

  /**
   * Add event listeners that operate outside shadow DOM (mouse up and move).
   * These listeners should be unbound when the element is removed from the DOM.
   */
  addGlobalListeners() {
    document.addEventListener("mouseup", this._mouseUpHandler);
    document.addEventListener("mousemove", this._mouseMoveHandler);
  }

  /**
   * Removes global listeners for mouse up and move.
   */
  removeGlobalListeners() {
    document.removeEventListener("mouseup", this._mouseUpHandler);
    document.removeEventListener("mousemove", this._mouseMoveHandler);
  }

  /**
   * HTML element associated with board.
   */
  get element() {
    return this._table;
  }

  /**
   * What side's perspective to render squares from (what color appears on
   * the bottom as viewed on the screen).
   */
  get orientation(): Side {
    return this._orientation;
  }

  set orientation(value: Side) {
    this._cancelMove(false);

    this._orientation = value;
    this._refreshDefaultTabbableSquare();
    for (let i = 0; i < 64; i++) {
      const square = getSquare(i, value);
      const piece = this._position[square];
      this._boardSquares[i].label = square;
      this._boardSquares[i].tabbable = this.tabbableSquare === square;
      if (piece) {
        this._boardSquares[i].setPiece(piece);
      } else {
        this._boardSquares[i].clearPiece();
      }
    }
    if (this._focused) {
      // Refresh focused square on orientation change
      this._focusTabbableSquare();
    }
  }

  /**
   * Whether the grid is interactive. This determines the roles and attributes,
   * like tabindex, associated with the grid.
   */
  get interactive(): boolean {
    return this._interactive;
  }

  set interactive(value: boolean) {
    this._interactive = value;
    this._cancelMove(false);
    this._blurTabbableSquare();
    this._table.setAttribute("role", value ? "grid" : "table");
    this._boardSquares.forEach((s) => {
      s.interactive = value;
    });
  }

  /**
   * Current `Position` object of board.
   */
  get position(): Position {
    return this._position;
  }

  set position(value: Position) {
    if (!positionsEqual(this._position, value)) {
      this._cancelMove(false);

      const diff = calcPositionDiff(this._position, value);
      this._position = { ...value };

      diff.moved.forEach(({ oldSquare }) => {
        // Remove all copies of moved piece from starting squares, without animation
        this._getBoardSquare(oldSquare).clearPiece();
      });

      diff.removed.forEach(({ square }) => {
        this._getBoardSquare(square).clearPiece(this.animationDurationMs);
      });

      diff.moved.forEach(({ piece, oldSquare, newSquare }) => {
        // Render moved piece at location of old square, and animate in to new square
        const startingPosition = this._getStartingPositionForMove(
          oldSquare,
          newSquare
        );
        this._getBoardSquare(newSquare).setPiece(piece, {
          type: "slide-in",
          from: startingPosition,
          durationMs: this.animationDurationMs,
        });
      });

      diff.added.forEach(({ piece, square }) => {
        this._getBoardSquare(square).setPiece(piece, {
          type: "fade-in",
          durationMs: this.animationDurationMs,
        });
      });

      // Default tabbable square might change with position change
      this._refreshDefaultTabbableSquare();
    }
  }

  /**
   * Whether to hide coordinates on the board (by default, coordinates are shown).
   */
  get hideCoords() {
    return this._hideCoords;
  }

  set hideCoords(value: boolean) {
    this._hideCoords = value;
    this._boardSquares.forEach((s) => {
      s.hideCoords = value;
    });
  }

  /**
   * Square that is considered "tabbable", if any. Keyboard navigation
   * on the board uses a roving tabindex, which means that only one square is
   * "tabbable" at a time (the rest are navigable using up and down keys on
   * the keyboard).
   */
  get tabbableSquare(): Square {
    return this._tabbableSquare || this._defaultTabbableSquare;
  }

  set tabbableSquare(value: Square) {
    // Unset previous tabbable square so that tabindex is changed to -1
    this._getBoardSquare(this.tabbableSquare).tabbable = false;
    this._getBoardSquare(value).tabbable = true;

    // Blur existing square before setting new one
    if (this.tabbableSquare !== value) {
      this._blurTabbableSquare();
    }
    this._tabbableSquare = value;
  }

  /**
   * Duration (in milliseconds) for all animations.
   */
  animationDurationMs: number;

  private _startMove(square: Square, positionPx?: { x: number; y: number }) {
    this._moveStartSquare = square;
    this._getBoardSquare(square).startMove(positionPx);
    this.tabbableSquare = square;
  }

  private _finishMove(to: Square, animate: boolean) {
    if (this._moveStartSquare) {
      const from = this._moveStartSquare;
      const piece = this._position[from];
      if (piece !== undefined) {
        const startingPosition = this._getStartingPositionForMove(from, to);
        this._getBoardSquare(from).clearPiece();
        this._getBoardSquare(to).setPiece(
          piece,
          // Animate transition only when piece is displaced to a specific location
          animate
            ? {
                type: "slide-in",
                from: startingPosition,
                durationMs: this.animationDurationMs,
              }
            : undefined
        );
        // Tabbable square always updates to target square
        this.tabbableSquare = to;
        this._position[to] = this._position[from];
        delete this._position[from];
      }
    }
    this._resetBoardStateAndMoves();
  }

  private _cancelMove(animate: boolean) {
    if (this._moveStartSquare) {
      this._getBoardSquare(this._moveStartSquare).finishMove(
        animate ? this.animationDurationMs : undefined
      );
      this._removeSecondaryPiece();
    }
    this._resetBoardStateAndMoves();
  }

  private _focusTabbableSquare() {
    if (this.tabbableSquare) {
      this._getBoardSquare(this.tabbableSquare).focus();
    }
  }

  private _blurTabbableSquare() {
    if (this.tabbableSquare) {
      // Mark blur as programmatic to ensure the blur handler
      // does not do side effects (canceling moves etc)
      this._doingProgrammaticBlur = true;
      this._getBoardSquare(this.tabbableSquare).blur();
      this._doingProgrammaticBlur = false;
    }
  }

  private _resetBoardStateAndMoves() {
    this._moveStartSquare = undefined;
    this._setBoardState({
      id: this.interactive ? "awaiting-input" : "default",
    });
  }

  private _showSecondaryPiece() {
    if (this._moveStartSquare) {
      this._getBoardSquare(this._moveStartSquare).toggleSecondaryPiece(true);
    }
  }

  private _removeSecondaryPiece() {
    if (this._moveStartSquare) {
      this._getBoardSquare(this._moveStartSquare).toggleSecondaryPiece(false);
    }
  }

  private _pieceOn(square: Square): boolean {
    return !!this._position[square];
  }

  private _getBoardSquare(square: Square) {
    return this._boardSquares[getVisualIndex(square, this.orientation)];
  }

  /**
   * Compute an explicit position to apply to a piece that is being moved
   * from `from` to `to`. This can either be the explicit piece position,
   * if already set, for that piece, or it is computed as the offset or
   * difference in rows and columns between the two squares.
   */
  private _getStartingPositionForMove(from: Square, to: Square) {
    const [fromRow, fromCol] = getVisualRowColumn(from, this.orientation);
    const [toRow, toCol] = getVisualRowColumn(to, this.orientation);
    return (
      this._getBoardSquare(from).explicitPiecePosition || {
        type: "squareOffset",
        deltaRows: fromRow - toRow,
        deltaCols: fromCol - toCol,
      }
    );
  }

  /**
   * When no tabbable square has been explicitly set (usually, when user has
   * not yet tabbed into or interacted with the board, we want to calculate
   * the tabbable square dynamically. It is either:
   * - the first occupied square from the player's orientation (i.e. from
   *   bottom left of board), or
   * - the bottom left square of the board.
   */
  private _refreshDefaultTabbableSquare() {
    const oldDefaultSquare = this._defaultTabbableSquare;
    let pieceFound = false;

    if (Object.keys(this._position).length > 0) {
      for (let row = 7; row >= 0 && !pieceFound; row--) {
        for (let col = 0; col <= 7 && !pieceFound; col++) {
          const square = getSquare(8 * row + col, this.orientation);
          if (this._pieceOn(square)) {
            this._defaultTabbableSquare = square;
            pieceFound = true;
          }
        }
      }
    }

    if (!pieceFound) {
      this._defaultTabbableSquare = getSquare(56, this.orientation);
    }

    // If tabbable square is set to default and has changed, then
    // update the two squares accordingly.
    if (
      this._tabbableSquare === undefined &&
      oldDefaultSquare !== this._defaultTabbableSquare
    ) {
      this._getBoardSquare(oldDefaultSquare).tabbable = false;
      this._getBoardSquare(this._defaultTabbableSquare).tabbable = true;
    }
  }

  private _setBoardState(state: BoardState) {
    this._boardState = state;
    this._updateContainerInteractionStateLabel();
  }

  private _handleMouseDown(
    this: Board,
    square: Square | undefined,
    e: MouseEvent
  ) {
    // We will control focus entirely ourselves
    e.preventDefault();

    switch (this._boardState.id) {
      case "awaiting-input":
        if (square && this._pieceOn(square)) {
          this._setBoardState({
            id: "touching-first-square",
            startSquare: square,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          });
          this._startMove(square);
          this._showSecondaryPiece();
          this._blurTabbableSquare();
        }
        break;
      case "awaiting-second-touch":
      case "moving-piece-kb":
        this._blurTabbableSquare();
        if (square && this._boardState.startSquare !== square) {
          this._finishMove(square, true);
        } else if (this._boardState.startSquare === square) {
          // Second mousedown on the same square *may* be a cancel, but could
          // also be a misclick/readjustment in order to begin dragging. Wait
          // till corresponding mouseup event in order to cancel.
          this._setBoardState({
            id: "canceling-second-touch",
            startSquare: square,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          });
          // Show secondary piece while mouse is down
          this._showSecondaryPiece();
        }
        break;
      case "dragging":
      case "canceling-second-touch":
      case "touching-first-square":
        // Noop: mouse is already down while dragging or touching first square
        break;
      case "default":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }
  }

  private _handleMouseUp(this: Board, square: Square | undefined) {
    switch (this._boardState.id) {
      case "touching-first-square":
        this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare,
        });
        this._removeSecondaryPiece();
        this._focusTabbableSquare();
        break;
      case "dragging":
        this._removeSecondaryPiece();
        this._blurTabbableSquare();
        if (square && this._boardState.startSquare !== square) {
          this._finishMove(square, false);
        } else {
          // Animate the snap back only if the piece left the board are (square undefined)
          this._cancelMove(!square);
        }
        break;
      case "canceling-second-touch":
        // User cancels by clicking on the same square.
        this._cancelMove(false);
        this._blurTabbableSquare();
        break;
      case "awaiting-input":
      case "awaiting-second-touch":
      case "moving-piece-kb":
        // Noop: mouse up only matters when there is an active
        // touch interaction
        break;
      case "default":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }
  }

  private _handleMouseMove(
    this: Board,
    square: Square | undefined,
    e: MouseEvent
  ) {
    switch (this._boardState.id) {
      case "canceling-second-touch":
      case "touching-first-square":
        {
          const delta = Math.sqrt(
            (e.clientX - this._boardState.touchStartX) ** 2 +
              (e.clientY - this._boardState.touchStartY) ** 2
          );
          const squareWidth = this._getBoardSquare(this.tabbableSquare).width;
          const threshold = Math.max(
            Board.DRAG_THRESHOLD_MIN_PIXELS,
            Board.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION * squareWidth
          );
          // Consider a "dragging" action to be when we have moved the mouse a sufficient
          // threshold, or we are now in a different square from where we started.
          if (
            (squareWidth !== 0 && delta > threshold) ||
            square !== this._boardState.startSquare
          ) {
            this._setBoardState({
              id: "dragging",
              startSquare: this._boardState.startSquare,
              x: e.clientX,
              y: e.clientY,
            });
            this._startMove(this._boardState.startSquare);
          }
        }
        break;
      case "dragging":
        if (this._moveStartSquare) {
          const position = { x: e.clientX, y: e.clientY };
          this._boardState = { ...this._boardState, ...position };
          this._getBoardSquare(this._moveStartSquare).updateMove(position);
        }
        break;
      case "awaiting-input":
      case "awaiting-second-touch":
      case "default":
      case "moving-piece-kb":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }
  }

  private _handleFocusIn(this: Board, square: Square | undefined) {
    if (square) {
      this._focused = true;
      if (this._tabbableSquare === undefined) {
        this._tabbableSquare = square;
      }
    }
  }

  private _handleFocusOut(
    this: Board,
    square: Square | undefined,
    e: FocusEvent
  ) {
    this._focused = false;

    if (!this._doingProgrammaticBlur) {
      switch (this._boardState.id) {
        case "awaiting-second-touch":
        case "moving-piece-kb":
          {
            const hasFocusInSquare =
              hasDataset(e.relatedTarget) &&
              "square" in e.relatedTarget.dataset;
            // If outgoing focus target has a square, and incoming does not,
            // then board lost focus and we can cancel ongoing moves.
            if (square && !hasFocusInSquare) {
              this._cancelMove(false);
            }
          }
          break;
        case "awaiting-input":
        case "canceling-second-touch":
        case "default":
        case "dragging": // noop: dragging continues even with focus moving around
        case "touching-first-square":
          break;
        // istanbul ignore next
        default:
          assertUnreachable(this._boardState);
      }
    }
  }

  private _handleKeyDown(
    this: Board,
    square: Square | undefined,
    e: KeyboardEvent
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      switch (this._boardState.id) {
        case "awaiting-input":
          // Ignore presses for squares that have no piece on them
          if (square && this._pieceOn(square)) {
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: square,
            });
            this._startMove(square);
          }
          break;
        case "moving-piece-kb":
        case "awaiting-second-touch":
          // Only move if enter was inside squares area and if start
          // and end square are not the same.
          if (square && this._boardState.startSquare !== square) {
            this._finishMove(square, true);
          } else {
            this._cancelMove(false);
          }
          break;
        case "dragging":
        case "touching-first-square":
        case "canceling-second-touch":
          // Noop: don't handle keypresses in active mouse states
          break;
        case "default":
          break;
        // istanbul ignore next
        default:
          assertUnreachable(this._boardState);
      }
    } else {
      const currentIdx = getVisualIndex(this.tabbableSquare, this.orientation);
      const currentRow = currentIdx >> 3;
      const currentCol = currentIdx & 0x7;
      let newIdx = currentIdx;
      let keyHandled = false;
      switch (e.key) {
        case "ArrowRight":
        case "Right":
          newIdx = 8 * currentRow + Math.min(7, currentCol + 1);
          keyHandled = true;
          break;
        case "ArrowLeft":
        case "Left":
          newIdx = 8 * currentRow + Math.max(0, currentCol - 1);
          keyHandled = true;
          break;
        case "ArrowDown":
        case "Down":
          newIdx = 8 * Math.min(7, currentRow + 1) + currentCol;
          keyHandled = true;
          break;
        case "ArrowUp":
        case "Up":
          newIdx = 8 * Math.max(0, currentRow - 1) + currentCol;
          keyHandled = true;
          break;
        case "Home":
          newIdx = e.ctrlKey ? 0 : 8 * currentRow;
          keyHandled = true;
          break;
        case "End":
          newIdx = e.ctrlKey ? 63 : 8 * currentRow + 7;
          keyHandled = true;
          break;
        case "PageUp":
          newIdx = currentCol;
          keyHandled = true;
          break;
        case "PageDown":
          newIdx = 56 + currentCol;
          keyHandled = true;
          break;
      }

      if (keyHandled) {
        // Prevent native browser scrolling via any of the
        // navigation keys since the focus below will auto-scroll
        e.preventDefault();
      }

      if (newIdx !== currentIdx) {
        this.tabbableSquare = getSquare(newIdx, this.orientation);
        this._focusTabbableSquare();

        // If we are currently in a non-keyboard friendly state, we should
        // still transition to one since we started keyboard navigation.
        switch (this._boardState.id) {
          case "awaiting-input":
          case "moving-piece-kb":
            break;
          case "awaiting-second-touch":
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: this._boardState.startSquare,
            });
            break;
          // istanbul ignore next
          case "touching-first-square": // istanbul ignore next
          case "canceling-second-touch":
            // Similar to canceling move, but don't blur focused square
            // since we just gave it focus through keyboard navigation
            // istanbul ignore next
            this._cancelMove(false);
            break;
          case "dragging":
            // Noop: continue with drag operation even if focus was moved around
            break;
          case "default":
            break;
          // istanbul ignore next
          default:
            assertUnreachable(this._boardState);
        }
      }
    }
  }

  /**
   * Sets (or removes) the `board-state` attribute on the container, which
   * facilitates CSS styling (pointer events, hover state) based on current
   * interaction state.
   */
  private _updateContainerInteractionStateLabel() {
    if (this._boardState.id !== "default") {
      this._table.dataset.boardState = this._boardState.id;
    } else {
      delete this._table.dataset["boardState"];
    }
  }

  /**
   * Convenience wrapper to make mouse, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  private _makeEventHandler<K extends MouseEvent | KeyboardEvent | FocusEvent>(
    callback: (this: Board, square: Square | undefined, e: K) => void
  ): (e: K) => void {
    const boundCallback = callback.bind(this);
    return (e: K) => {
      const target =
        e.composedPath().length > 0 ? e.composedPath()[0] : e.target;
      const square = hasDataset(target)
        ? target.dataset.square
        : /* istanbul ignore next */ undefined;
      boundCallback(keyIsSquare(square) ? square : undefined, e);
    };
  }

  private _slotChangeHandler: (e: Event) => void = (e) => {
    if (Board._isSlotElement(e.target) && keyIsSquare(e.target.name)) {
      this._getBoardSquare(e.target.name).hasContent =
        e.target.assignedElements().length > 0;
    }
  };

  private _transitionHandler: (e: TransitionEvent) => void = (e) => {
    // Delete transition-property style at the end of all transitions
    if (e.target && (e.target as HTMLElement).style !== undefined) {
      const style = (e.target as HTMLElement).style;
      style.removeProperty("transition-property");
    }
  };

  private static _isSlotElement(e: EventTarget | null): e is HTMLSlotElement {
    return !!e && (e as HTMLSlotElement).assignedElements !== undefined;
  }
}
