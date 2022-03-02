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
  Piece,
} from "../utils/chess";
import { makeHTMLElement } from "../utils/dom";
import { BoardState } from "./BoardState";
import { assertUnreachable } from "../utils/typing";
import { BoardSquare } from "./BoardSquare";

export class Board {
  private readonly _table: HTMLElement;
  private readonly _boardSquares: BoardSquare[];
  private readonly _dispatchEvent: <T>(e: CustomEvent<T>) => void;
  private readonly _shadowRef: ShadowRoot;

  private _orientation: Side;
  private _turn?: Side;
  private _interactive: boolean;
  private _position: Position;
  private _boardState: BoardState;
  private _tabbableSquare?: Square;
  private _defaultTabbableSquare: Square;

  /**
   * Certain move "finishing" logic is included in `pointerup` (e.g. drags). To
   * prevent re-handling this in the `click` handler, we prevent handling of click
   * events for a certain period after pointerup.
   */
  private _preventClickHandling?: boolean;

  // Event handlers
  private _pointerDownHandler: (e: PointerEvent) => void;
  private _pointerUpHandler: (e: PointerEvent) => void;
  private _pointerMoveHandler: (e: PointerEvent) => void;
  private _clickHandler: (e: MouseEvent) => void;
  private _focusInHandler: (e: FocusEvent) => void;
  private _keyDownHandler: (e: KeyboardEvent) => void;

  /**
   * Fraction of square width that pointer must be moved to be
   * considered a "drag" action.
   */
  private static DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION = 0.1;

  /**
   * Minimum number of pixels to enable dragging.
   */
  private static DRAG_THRESHOLD_MIN_PIXELS = 2;

  /**
   * Amount of time (in ms) to suppress click handling after a pointerup event.
   */
  private static POINTERUP_CLICK_PREVENT_DURATION_MS = 250;

  /**
   * Creates a set of elements representing chessboard squares, as well
   * as managing and displaying pieces rendered on the squares.
   */
  constructor(
    initValues: { orientation: Side; animationDurationMs: number },
    dispatchEvent: <T>(e: CustomEvent<T>) => void,
    shadowRef: ShadowRoot
  ) {
    this._boardSquares = new Array(64);
    this._orientation = initValues.orientation;
    this.animationDurationMs = initValues.animationDurationMs;
    this._interactive = false;
    this._position = {};
    this._boardState = { id: "default" };
    this._dispatchEvent = dispatchEvent;
    this._shadowRef = shadowRef;

    // Bottom left corner
    this._defaultTabbableSquare = getSquare(56, initValues.orientation);

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
        this._boardSquares[idx] = new BoardSquare(row, square);
      }
      this._table.appendChild(row);
    }
    this._getBoardSquare(this._defaultTabbableSquare).tabbable = true;

    this._pointerDownHandler = this._makeEventHandler(this._handlePointerDown);
    this._pointerUpHandler = this._makeEventHandler(this._handlePointerUp);
    this._pointerMoveHandler = this._makeEventHandler(this._handlePointerMove);
    this._clickHandler = this._makeEventHandler(this._handleClick);
    this._keyDownHandler = this._makeEventHandler(this._handleKeyDown);
    this._focusInHandler = this._makeEventHandler(this._handleFocusIn);

    this._table.addEventListener("pointerdown", this._pointerDownHandler);
    this._table.addEventListener("click", this._clickHandler);
    this._table.addEventListener("focusin", this._focusInHandler);
    this._table.addEventListener("keydown", this._keyDownHandler);
    this._table.addEventListener("slotchange", this._slotChangeHandler);
    this._table.addEventListener("transitionend", this._transitionHandler);
    this._table.addEventListener("transitioncancel", this._transitionHandler);
  }

  /**
   * Add event listeners that operate outside shadow DOM (pointer up and move).
   * These listeners should be unbound when the element is removed from the DOM.
   */
  addGlobalListeners() {
    document.addEventListener("pointerup", this._pointerUpHandler);
    document.addEventListener("pointermove", this._pointerMoveHandler);
  }

  /**
   * Removes global listeners for pointer up and move.
   */
  removeGlobalListeners() {
    document.removeEventListener("pointerup", this._pointerUpHandler);
    document.removeEventListener("pointermove", this._pointerMoveHandler);
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
        this._boardSquares[i].setPiece(piece, this._pieceMoveable(piece));
      } else {
        this._boardSquares[i].clearPiece();
      }
    }
    // Switch focused square, if any, on orientation change
    if (this._focusedSquare) {
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
    this._cancelMove(false);
    this._interactive = value;
    this._blurTabbableSquare();
    this._table.setAttribute("role", value ? "grid" : "table");
    this._boardSquares.forEach((s) => {
      s.interactive = value;
    });
    this._resetBoardStateAndMoves();
  }

  get turn(): Side | undefined {
    return this._turn;
  }

  /**
   * What side is allowed to move pieces. This may be undefined, in which
   * pieces from either side can be moved around.
   */
  set turn(value: Side | undefined) {
    this._cancelMove(false);
    this._turn = value;
    for (let idx = 0; idx < 64; idx++) {
      const square = getSquare(idx, this.orientation);
      const piece = this._position[square];
      this._boardSquares[idx].moveable = !piece || this._pieceMoveable(piece);
    }
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
        this._getBoardSquare(newSquare).setPiece(
          piece,
          this._pieceMoveable(piece),
          {
            type: "slide-in",
            from: startingPosition,
            durationMs: this.animationDurationMs,
          }
        );
      });

      diff.added.forEach(({ piece, square }) => {
        this._getBoardSquare(square).setPiece(
          piece,
          this._pieceMoveable(piece),
          {
            type: "fade-in",
            durationMs: this.animationDurationMs,
          }
        );
      });

      // Default tabbable square might change with position change
      this._refreshDefaultTabbableSquare();
    }
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
    if (this.tabbableSquare !== value) {
      // Unset previous tabbable square so that tabindex is changed to -1
      this._getBoardSquare(this.tabbableSquare).tabbable = false;
      this._getBoardSquare(value).tabbable = true;
      this._tabbableSquare = value;
    }
  }

  /**
   * Duration (in milliseconds) for all animations.
   */
  animationDurationMs: number;

  /**
   * Start a move on the board at `square`, optionally with specified targets
   * at `targetSquares`.
   */
  startMove(square: Square, targetSquares?: Square[]) {
    if (this._interactable(square)) {
      this._setBoardState({
        id: "awaiting-second-touch",
        startSquare: square,
      });
      this._startInteraction(square, targetSquares);
    }
  }

  /**
   * Cancels in-progress moves, if any.
   */
  cancelMove() {
    this._cancelMove(false);
  }

  private get _focusedSquare() {
    return Board._extractSquareData(this._shadowRef.activeElement);
  }

  private _startInteraction(square: Square, forceTargetSquares?: Square[]) {
    const piece = this._position[square];
    if (piece) {
      let targetsLimited = false;
      const targetSquares: Square[] = [];
      if (forceTargetSquares !== undefined) {
        targetsLimited = true;
        forceTargetSquares.forEach((s) => {
          if (keyIsSquare(s)) {
            targetSquares.push(s);
          }
        });
      } else {
        this._dispatchEvent(
          new CustomEvent("movestart", {
            bubbles: true,
            detail: {
              from: square,
              piece,
              setTargets: (squares: Square[]) => {
                targetsLimited = true;
                for (const s of squares) {
                  if (keyIsSquare(s)) {
                    targetSquares.push(s);
                  }
                }
              },
            },
          })
        );
      }

      this._getBoardSquare(square).startInteraction();
      this.tabbableSquare = square;

      this._boardSquares.forEach((s) => {
        if (s.label !== square) {
          s.moveTarget = !targetsLimited || targetSquares.includes(s.label);
          s.markedTarget = targetsLimited && s.moveTarget;
        }
      });
    }
  }

  private _finishMove(to: Square, animate: boolean) {
    if (this._boardState.startSquare) {
      const from = this._boardState.startSquare;
      const piece = this._position[from];
      if (piece !== undefined) {
        const endEvent = new CustomEvent("moveend", {
          bubbles: true,
          cancelable: true,
          detail: { from, to, piece },
        });

        this._dispatchEvent(endEvent);
        if (endEvent.defaultPrevented) {
          return false;
        }

        const startingPosition = this._getStartingPositionForMove(from, to);
        this._getBoardSquare(from).clearPiece();
        this._getBoardSquare(to).setPiece(
          piece,
          this._pieceMoveable(piece),
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

        const finishedEvent = new CustomEvent("movefinished", {
          bubbles: true,
          detail: { from, to, piece },
        });

        if (animate) {
          this._getBoardSquare(to).boardPiece?.animationFinished?.then(() => {
            this._dispatchEvent(finishedEvent);
          });
        } else {
          this._dispatchEvent(finishedEvent);
        }
      }
      this._resetBoardStateAndMoves();
      return true;
    }
    return false;
  }

  private _userCancelMove(animate: boolean) {
    if (this._boardState.startSquare) {
      const e = new CustomEvent("movecancel", {
        bubbles: true,
        cancelable: true,
        detail: {
          from: this._boardState.startSquare,
          piece: this._position[this._boardState.startSquare],
        },
      });

      this._dispatchEvent(e);
      if (!e.defaultPrevented) {
        this._cancelMove(animate);
        return true;
      }
    }
    return false;
  }

  private _cancelMove(animate: boolean) {
    if (this._boardState.startSquare) {
      const square = this._getBoardSquare(this._boardState.startSquare);
      square.cancelInteraction(animate ? this.animationDurationMs : undefined);
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
      this._getBoardSquare(this.tabbableSquare).blur();
    }
  }

  private _resetBoardStateAndMoves() {
    this._boardSquares.forEach((s) => {
      s.removeMoveState();
      s.markedTarget = false;
    });
    this._setBoardState({
      id: this.interactive ? "awaiting-input" : "default",
    });
  }

  private _pieceMoveable(piece: Piece): boolean {
    return !this.turn || piece.color === this.turn;
  }

  private _interactable(square: Square): boolean {
    const piece = this._position[square];
    return !!piece && this._pieceMoveable(piece);
  }

  private _isValidMove(from: Square, to: Square): boolean {
    return from !== to && this._getBoardSquare(to).moveTarget;
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
          if (this._position[square]) {
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
    const oldState = this._boardState;
    this._boardState = state;

    if (this._boardState.id !== oldState.id) {
      this._table.classList.toggle("dragging", this._isDragState());
    }

    if (this._boardState.highlightedSquare !== oldState.highlightedSquare) {
      if (oldState.highlightedSquare) {
        this._getBoardSquare(oldState.highlightedSquare).hover = false;
      }
      if (this._boardState.highlightedSquare) {
        this._getBoardSquare(this._boardState.highlightedSquare).hover = true;
      }
    }
  }

  private _handlePointerDown(
    this: Board,
    square: Square | undefined,
    e: PointerEvent
  ) {
    // We will control focus entirely ourselves
    e.preventDefault();

    // Primary clicks only
    if (e.button !== 0) {
      return;
    }

    switch (this._boardState.id) {
      case "awaiting-input":
        if (square && this._interactable(square)) {
          this._setBoardState({
            id: "touching-first-square",
            startSquare: square,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          });
          this._startInteraction(square);
          this._getBoardSquare(square).toggleSecondaryPiece(true);
        }
        break;
      case "awaiting-second-touch":
      case "moving-piece-kb":
        if (this._boardState.startSquare === square) {
          // Second pointerdown on the same square *may* be a cancel, but could
          // also be a misclick/readjustment in order to begin dragging. Wait
          // till corresponding pointerup event in order to cancel.
          this._setBoardState({
            id: "canceling-second-touch",
            startSquare: square,
            touchStartX: e.clientX,
            touchStartY: e.clientY,
          });
          // Show secondary piece while pointer is down
          this._getBoardSquare(square).toggleSecondaryPiece(true);
        } else if (square) {
          this._setBoardState({
            id: "touching-second-square",
            startSquare: this._boardState.startSquare,
          });
        }
        break;
      case "dragging":
      case "dragging-outside":
      case "canceling-second-touch":
      case "touching-first-square":
      case "touching-second-square":
        // Noop: pointer is already down while dragging or touching square
        break;
      case "default":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }
  }

  private _handlePointerUp(this: Board, square: Square | undefined) {
    let newFocusedSquare = square;
    switch (this._boardState.id) {
      case "touching-first-square":
        this._getBoardSquare(this._boardState.startSquare).toggleSecondaryPiece(
          false
        );
        this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare,
        });
        newFocusedSquare = this._boardState.startSquare;
        break;
      case "canceling-second-touch":
        // User cancels by clicking on the same square.
        if (!this._userCancelMove(false)) {
          this._setBoardState({
            id: "awaiting-second-touch",
            startSquare: this._boardState.startSquare,
          });
        }
        newFocusedSquare = this._boardState.startSquare;
        break;
      case "dragging":
      case "dragging-outside":
      case "touching-second-square":
        {
          this._getBoardSquare(
            this._boardState.startSquare
          ).toggleSecondaryPiece(false);
          let done = false;
          if (
            square &&
            this._isValidMove(this._boardState.startSquare, square)
          ) {
            done = this._finishMove(square, !this._isDragState());
            if (!done) {
              newFocusedSquare = this._boardState.startSquare;
            }
          } else {
            newFocusedSquare = this._boardState.startSquare;
            done = this._userCancelMove(
              square !== this._boardState.startSquare
            );
          }
          if (!done) {
            this._setBoardState({
              id: "awaiting-second-touch",
              startSquare: this._boardState.startSquare,
            });
            this._getBoardSquare(
              this._boardState.startSquare
            ).resetPiecePosition(this.animationDurationMs);
          }
        }
        break;
      case "awaiting-input":
      case "moving-piece-kb":
      case "awaiting-second-touch":
        // noop: Either we are in a non-mouse state or we are delegating to click
        break;
      case "default":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }

    // If board currently has focus, move focus to newly clicked square.
    if (this._focusedSquare && newFocusedSquare) {
      this.tabbableSquare = newFocusedSquare;
      this._focusTabbableSquare();
    }

    // Prevent click handling for a certain duration
    this._preventClickHandling = true;
    setTimeout(() => {
      this._preventClickHandling = false;
    }, Board.POINTERUP_CLICK_PREVENT_DURATION_MS);
  }

  private _handlePointerMove(
    this: Board,
    square: Square | undefined,
    e: PointerEvent
  ) {
    switch (this._boardState.id) {
      case "canceling-second-touch":
      case "touching-first-square":
        {
          const delta = Math.sqrt(
            (e.clientX - this._boardState.touchStartX) ** 2 +
              (e.clientY - this._boardState.touchStartY) ** 2
          );
          const squareWidth = this._getBoardSquare(
            this._boardState.startSquare
          ).width;
          const threshold = Math.max(
            Board.DRAG_THRESHOLD_MIN_PIXELS,
            Board.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION * squareWidth
          );
          // Consider a "dragging" action to be when we have moved the pointer a sufficient
          // threshold, or we are now in a different square from where we started.
          if (delta > threshold || square !== this._boardState.startSquare) {
            this._getBoardSquare(this._boardState.startSquare).displacePiece(
              e.clientX,
              e.clientY
            );
            if (square) {
              this._setBoardState({
                id: "dragging",
                startSquare: this._boardState.startSquare,
                highlightedSquare: this._isValidMove(
                  this._boardState.startSquare,
                  square
                )
                  ? square
                  : undefined,
              });
            } else {
              this._setBoardState({
                id: "dragging-outside",
                startSquare: this._boardState.startSquare,
              });
            }
          }
        }
        break;
      case "dragging":
      case "dragging-outside":
        this._getBoardSquare(this._boardState.startSquare).displacePiece(
          e.clientX,
          e.clientY
        );
        if (square && square !== this._boardState.highlightedSquare) {
          this._setBoardState({
            id: "dragging",
            startSquare: this._boardState.startSquare,
            highlightedSquare: this._isValidMove(
              this._boardState.startSquare,
              square
            )
              ? square
              : undefined,
          });
        } else if (!square && this._boardState.id !== "dragging-outside") {
          this._setBoardState({
            id: "dragging-outside",
            startSquare: this._boardState.startSquare,
          });
        }
        break;
      case "awaiting-input":
      case "awaiting-second-touch":
      case "default":
      case "moving-piece-kb":
      case "touching-second-square":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }
  }

  private _handleClick(this: Board, square: Square | undefined) {
    if (this._preventClickHandling) {
      return;
    }

    switch (this._boardState.id) {
      case "awaiting-input":
        if (square && this._interactable(square)) {
          this._setBoardState({
            id: "awaiting-second-touch",
            startSquare: square,
          });
          this._startInteraction(square);
        }
        break;
      case "awaiting-second-touch":
      case "moving-piece-kb":
        {
          const done =
            square && this._isValidMove(this._boardState.startSquare, square)
              ? this._finishMove(square, true)
              : this._userCancelMove(square !== this._boardState.startSquare);
          if (!done) {
            this._setBoardState({
              id: "awaiting-second-touch",
              startSquare: this._boardState.startSquare,
            });
            this._getBoardSquare(
              this._boardState.startSquare
            ).resetPiecePosition(this.animationDurationMs);
          }
        }
        break;
      case "touching-first-square":
      case "touching-second-square":
      case "canceling-second-touch":
      case "dragging":
      case "dragging-outside":
      case "default":
        break;
      // istanbul ignore next
      default:
        assertUnreachable(this._boardState);
    }

    // If board currently has focus, move focus to newly clicked square.
    if (this._focusedSquare && square) {
      this.tabbableSquare = square;
      this._focusTabbableSquare();
    }
  }

  private _handleFocusIn(this: Board, square: Square | undefined) {
    if (square) {
      if (
        // Some browsers (Safari) focus on board squares that are not tabbable
        // (tabindex = -1). If that happens, update tabbable square manually.
        square !== this.tabbableSquare ||
        // Assign tabbable square if none is explicitly assigned yet.
        this._tabbableSquare === undefined
      ) {
        this.tabbableSquare = square;
      }
    }
  }

  private _handleKeyDown(
    this: Board,
    square: Square | undefined,
    e: KeyboardEvent
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      switch (this._boardState.id) {
        case "awaiting-input":
          if (square && this._interactable(square)) {
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: square,
              highlightedSquare: undefined,
            });
            this._startInteraction(square);
          }
          break;
        case "moving-piece-kb":
        case "awaiting-second-touch":
          // Only move if enter was inside squares area and if start
          // and end square are not the same.
          if (
            square &&
            this._isValidMove(this._boardState.startSquare, square)
          ) {
            this._finishMove(square, true);
          } else {
            this._userCancelMove(false);
          }
          break;
        case "dragging":
        case "dragging-outside":
        case "touching-first-square":
        case "touching-second-square":
        case "canceling-second-touch":
          // Noop: don't handle keypresses in active pointer states
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
          case "moving-piece-kb":
          case "awaiting-second-touch":
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: this._boardState.startSquare,
              highlightedSquare:
                this._boardState.startSquare !== this.tabbableSquare
                  ? this._tabbableSquare
                  : undefined,
            });
            break;
          case "awaiting-input":
          case "touching-first-square":
          case "touching-second-square":
          case "canceling-second-touch":
          case "dragging":
          case "dragging-outside":
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
   * Convenience wrapper to make pointer, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  private _makeEventHandler<
    K extends PointerEvent | MouseEvent | KeyboardEvent | FocusEvent
  >(
    callback: (this: Board, square: Square | undefined, e: K) => void
  ): (e: K) => void {
    const boundCallback = callback.bind(this);
    return (e: K) => {
      // For mouse events, use client X and Y location to find target reliably.
      const square = Board._isMouseEvent(e)
        ? this._shadowRef
            .elementsFromPoint(e.clientX, e.clientY)
            .map((e) => Board._extractSquareData(e))
            .find((e) => !!e)
        : Board._extractSquareData(e.target);
      boundCallback(square, e);
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

  private _isDragState() {
    return ["dragging", "dragging-outside"].includes(this._boardState.id);
  }

  private static _extractSquareData(
    target: EventTarget | null
  ): Square | undefined {
    if (!!target && !!(target as HTMLElement).dataset) {
      const dataset = (target as HTMLElement).dataset;
      return keyIsSquare(dataset.square) ? dataset.square : undefined;
    }
    return undefined;
  }

  private static _isMouseEvent(e: Event): e is MouseEvent {
    return (e as MouseEvent).clientX !== undefined;
  }

  private static _isSlotElement(e: EventTarget | null): e is HTMLSlotElement {
    return !!e && (e as HTMLSlotElement).assignedElements !== undefined;
  }
}
