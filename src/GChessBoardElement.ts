import {
  isSide,
  getFen,
  getPosition,
  Position,
  Side,
  Square,
  Piece,
} from "./utils/chess";
import { Board } from "./components/Board";
import importedStyles from "./style.css";
import { assertUnreachable } from "./utils/typing";
import { makeHTMLElement } from "./utils/dom";
import {
  Coordinates,
  CoordinatesPlacement,
  isCoordinatesPlacement,
} from "./components/Coordinates";
import { Arrows, BoardArrow } from "./components/Arrows";

/**
 * A component that displays a chess board, with optional interactivity. Allows
 * click, drag and keyboard-based moves.
 *
 * @fires movestart - Fired when the user initiates a move by clicking, dragging or
 *   via the keyboard.
 *
 *   The event has a `detail` object with the `from` and
 *   `piece` values for the move. It also has a function, `setTargets(squares)`,
 *   that the caller can invoke with an array of square labels. This limits the
 *   set of targets that the piece can be moved to. Note that calling this
 *   function with an empty list will still allow the piece to be dragged around,
 *   but no square will accept the piece and thus it will always return to the
 *   starting square.
 *
 * @fires moveend - Fired when user is completing a move. This move can be prevented
 *   from completing by calling `preventDefault()` on the event. If that is called,
 *   the move itself remains in progress. The event has a `detail` object with `from`
 *   and `to` set to the square labels of the move, and `piece` containing information
 *   about the piece that was moved.
 *
 * @fires movefinished - Fired after a move is completed _and_ animations are resolved.
 *   The event has a `detail` object with `from` and `to` set to the square labels
 *   of the move, and `piece` containing information about the piece that was moved.
 *
 *   The `movefinished` event is the best time to update board position in response to
 *   a move. For example, after a king is moved for castling, the rook can be subsequently
 *   moved by updating the board position in `movefinished` by setting the `position`
 *   property.
 *
 * @fires movecancel - Fired as a move is being canceled by the user. The event
 *   is *itself* cancelable, ie. a caller can call `preventDefault()` on the event
 *   to prevent the move from being canceled. Any pieces being dragged will be returned
 *   to the start square, but the move will remain in progress.
 *
 *   The event has a `detail` object with `from` set to the square label where
 *   the move was started, and `piece` containing information about the piece that was
 *   moved.
 *
 * @cssprop [--square-color-dark=hsl(145deg 32% 44%)] - Color for dark squares.
 * @cssprop [--square-color-light=hsl(51deg 24% 84%)] - Color for light squares.
 *
 * @cssprop [--square-color-dark-hover=hsl(144deg 75% 44%)] - Hover color
 *   for a dark square. Applied when mouse is hovering over an interactable square
 *   or a square has keyboard focus during a move.
 * @cssprop [--square-color-light-hover=hsl(52deg 98% 70%)] - Hover color
 *   for a dark square. Applied when mouse is hovering over an interactable square
 *   or a square has keyboard focus during a move.
 *
 * @cssprop [--square-color-dark-active=hsl(142deg 77% 43%)] - Color applied to
 *   dark square when it is involved in (the starting point) of a move. By default
 *   this color is similar to, but slightly different from, `--square-color-dark-hover`.
 * @cssprop [--square-color-light-active=hsl(50deg 95% 64%)] - Color applied to
 *   light square when it is involved in (the starting point) of a move. By default
 *   this color is similar to, but slightly different from, `--square-color-light-hover`.
 *
 * @cssprop [--outline-color-dark-active=hsl(138deg 85% 53% / 95%)] - Color of
 *   outline applied to dark square when it is the starting point of a move.
 *   It is applied in addition to `--square-color-dark-active`, and is visible
 *   when the square does not have focus.
 * @cssprop [--outline-color-light-active=hsl(66deg 97% 72% / 95%)] - Color of
 *   outline applied to light square when it is the starting point of a move.
 *   It is applied in addition to `--square-color-light-active`, and is visible
 *   when the square does not have focus.
 * @cssprop [--outline-color-focus=hsl(30deg 94% 55% / 90%)] - Color of outline applied to square when it has focus.
 *
 * @cssprop [--outer-gutter-width=4%] - When the `coordinates` property is `outside`,
 *   this CSS property controls the width of the gutter outside the board where coords are shown.
 * @cssprop [--inner-border-width=1px] - Width of the inside border drawn around the board.
 * @cssprop [--inner-border-color=var(--square-color-dark)] - Color of the inside border drawn
 *   around the board.
 *
 * @cssprop [--move-target-marker-color-dark-square=hsl(144deg 64% 9% / 90%)] -
 *   Color of marker shown on dark square when it is an eligible move target.
 * @cssprop [--move-target-marker-color-light-square=hsl(144deg 64% 9% / 90%)] -
 *   Color of marker shown on light square when it is an eligible move target.
 *
 * @cssprop [--move-target-marker-radius=24%] - Radius of marker on a move target
 *   square.
 * @cssprop [--move-target-marker-radius-occupied=82%] - Radius of marker on
 *   a move target square that is occupied (by a piece or custom content).
 *
 * @cssprop [--outline-blur-radius=3px] - Blur radius of all outlines applied to square.
 * @cssprop [--outline-spread-radius=4px] - Spread radius of all outlines applied to square.
 *
 * @cssprop [--coords-font-size=0.7rem] - Font size of coord labels shown on board.
 * @cssprop [--coords-font-family=sans-serif] - Font family of coord labels shown on board.
 * @cssprop [--coords-inside-coord-padding-left=0.5%] - Left padding applied to coordinates
 *   when shown inside the board. Percentage values are relative to the width of the board.
 * @cssprop [--coords-inside-coord-padding-right=0.5%] - Right padding applied to coordinates
 *   when shown inside the board. Percentage values are relative to the width of the board.
 *
 * @cssprop [--ghost-piece-opacity=0.35] - Opacity of ghost piece shown while dragging.
 *   Set to 0 to hide ghost piece altogether.
 * @cssprop [--piece-drag-z-index=9999] - Z-index applied to piece while being dragged.
 * @cssprop [--piece-drag-coarse-scale=2.4] - Amount to scale up a piece when doing a
 *   coarse (touch) drag. On mobile devices, pieces will be scaled up in size to
 *   make them easier to see.
 * @cssprop [--piece-padding=3%] - Padding applied to square when piece is placed in it.
 *
 * @cssprop [--arrow-color-primary=hsl(40deg 100% 50% / 80%)] - Color applied to arrow
 *   with brush `primary`.
 * @cssprop [--arrow-color-secondary=hsl(7deg 93% 61% / 80%)] - Color applied to arrow
 *   with brush `secondary`.
 *
 * @slot a1,a2,...,h8 - Slots that allow placement of custom content -- SVGs, text, or
 * any other annotation -- on the corresponding square.
 *
 * @csspart piece-<b|w><b|r|p|n|k|q> - CSS parts for each of the piece classes. The part
 *   name is of the form `piece-xy`, where `x` corresponds to the color of the piece --
 *   either `w` for white or `b` for black, and `y` is the piece type -- one of `p` (pawn),
 *   `r` (rook), `n` (knight), `b` (bishop), `k` (king), `q` (queen). Thus, `piece-wr`
 *   would be the CSS part corresponding to the white rook.
 *
 *   The CSS parts can be used to set custom CSS for the pieces (such as changing the image
 *   for a piece by changing the `background-image` property).
 *
 * @csspart arrow-<brush_name> - CSS parts for any arrow brushes configured using the
 *   `brush` field on an arrow specification (see the `arrows` property for more details).
 */
export class GChessBoardElement extends HTMLElement {
  static get observedAttributes() {
    return [
      "orientation",
      "turn",
      "interactive",
      "fen",
      "coordinates",
      "animation-duration",
    ] as const;
  }

  private _shadow: ShadowRoot;
  private _style: HTMLStyleElement;
  private _wrapper: HTMLDivElement;
  private _board: Board;
  private _fileCoords: Coordinates;
  private _rankCoords: Coordinates;
  private _arrows: Arrows;

  private static _DEFAULT_SIDE: Side = "white";
  private static _DEFAULT_ANIMATION_DURATION_MS = 200;
  private static _DEFAULT_COORDS_PLACEMENT: CoordinatesPlacement = "inside";

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });

    this._style = document.createElement("style");
    this._style.textContent = importedStyles;
    this._shadow.appendChild(this._style);

    this._wrapper = makeHTMLElement("div", {
      classes: ["wrapper", GChessBoardElement._DEFAULT_COORDS_PLACEMENT],
    });
    this._shadow.appendChild(this._wrapper);

    this._board = new Board(
      {
        orientation: GChessBoardElement._DEFAULT_SIDE,
        animationDurationMs: GChessBoardElement._DEFAULT_ANIMATION_DURATION_MS,
      },
      (e) => this.dispatchEvent(e),
      this._shadow
    );
    this._wrapper.appendChild(this._board.element);

    this._fileCoords = new Coordinates({
      direction: "file",
      placement: GChessBoardElement._DEFAULT_COORDS_PLACEMENT,
      orientation: GChessBoardElement._DEFAULT_SIDE,
    });
    this._rankCoords = new Coordinates({
      direction: "rank",
      placement: GChessBoardElement._DEFAULT_COORDS_PLACEMENT,
      orientation: GChessBoardElement._DEFAULT_SIDE,
    });
    this._wrapper.appendChild(this._fileCoords.element);
    this._wrapper.appendChild(this._rankCoords.element);

    this._arrows = new Arrows(GChessBoardElement._DEFAULT_SIDE);
    this._wrapper.appendChild(this._arrows.element);
  }

  connectedCallback() {
    this._board.addGlobalListeners();
  }

  disconnectedCallback() {
    this._board.removeGlobalListeners();
  }

  attributeChangedCallback(
    name: typeof GChessBoardElement.observedAttributes[number],
    _: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case "interactive":
        this._board.interactive = this.interactive;
        break;
      case "coordinates":
        this._wrapper.classList.toggle(
          "outside",
          this.coordinates === "outside"
        );
        this._wrapper.classList.toggle("inside", this.coordinates === "inside");
        break;
      case "orientation":
        this._board.orientation = this.orientation;
        this._fileCoords.orientation = this.orientation;
        this._rankCoords.orientation = this.orientation;
        this._arrows.orientation = this.orientation;
        break;
      case "turn":
        this._board.turn = this.turn;
        break;
      case "fen":
        if (newValue !== null) {
          this.fen = newValue;
        } else {
          this.position = {};
        }
        break;
      case "animation-duration":
        this._board.animationDurationMs = this.animationDuration;
        break;
      default:
        assertUnreachable(name);
    }
  }

  /**
   * What side's perspective to render squares from (what color appears on
   * the bottom as viewed on the screen). Either `"white"` or `"black"`.
   *
   * @attr [orientation=white]
   */
  get orientation(): Side {
    return this._parseRestrictedStringAttributeWithDefault<Side>(
      "orientation",
      isSide,
      GChessBoardElement._DEFAULT_SIDE
    );
  }

  set orientation(value: Side) {
    this.setAttribute("orientation", value);
  }

  /**
   * What side is allowed to move pieces. Either `"white`, `"black"`, or
   * unset. When unset, pieces from either side can be moved around.
   *
   * @attr
   */
  get turn(): Side | undefined {
    return this._parseRestrictedStringAttribute<Side>("turn", isSide);
  }

  set turn(value: Side | undefined) {
    if (value) {
      this.setAttribute("turn", value);
    } else {
      this.removeAttribute("turn");
    }
  }

  /**
   * Whether the squares are interactive, i.e. user can interact with squares,
   * move pieces etc. By default, this is false; i.e a board is only for displaying
   * a position.
   *
   * @attr [interactive=false]
   */
  get interactive() {
    return this._hasBooleanAttribute("interactive");
  }

  set interactive(interactive: boolean) {
    this._setBooleanAttribute("interactive", interactive);
  }

  /**
   * A map-like object representing the board position, where object keys are square
   * labels, and values are `Piece` objects. Note that changes to this property are
   * mirrored in the value of the `fen` property of the element, but **not** the
   * corresponding attribute. All changes to position are animated, using the duration
   * specified by the `animationDuration` property.
   *
   * Example:
   *
   * ```js
   * board.position = {
   *   a2: {
   *     pieceType: "king",
   *     color: "white"
   *   },
   *   g4: {
   *     pieceType: "knight",
   *     color: "black"
   *   },
   * };
   * ```
   */
  get position() {
    return this._board.position;
  }

  set position(value: Position) {
    this._board.position = { ...value };
  }

  /**
   * FEN string representing the board position. Note that changes to the corresponding
   * `fen` _property_ will **not** reflect onto the "fen" _attribute_ of the element.
   * In other words, to get the latest FEN string for the board position, use the `fen`
   * _property_.
   *
   * Accepts the special string `"start"` as shorthand for the starting position
   * of a chess game. An empty string represents an empty board. Invalid FEN values
   * are ignored with an error.
   *
   * Note that a FEN string normally contains 6 components, separated by slashes,
   * but only the first component (the "piece placement" component) is used by this
   * attribute.
   *
   * @attr
   */
  get fen() {
    return getFen(this._board.position);
  }

  set fen(value: string) {
    const position = getPosition(value);
    if (position !== undefined) {
      this.position = position;
    } else {
      throw new Error(`Invalid FEN position: ${value}`);
    }
  }

  /**
   * How to display coordinates for squares. Could be `"inside"` the board (default),
   * `"outside"`, or `"hidden"`.
   *
   * @attr [coordinates=inside]
   */
  get coordinates(): CoordinatesPlacement {
    return this._parseRestrictedStringAttributeWithDefault<CoordinatesPlacement>(
      "coordinates",
      isCoordinatesPlacement,
      GChessBoardElement._DEFAULT_COORDS_PLACEMENT
    );
  }

  set coordinates(value: CoordinatesPlacement) {
    this.setAttribute("coordinates", value);
  }

  /**
   * Duration, in milliseconds, of animation when adding/removing/moving pieces.
   *
   * @attr [animation-duration=200]
   */
  get animationDuration() {
    return this._parseNumberAttribute(
      "animation-duration",
      GChessBoardElement._DEFAULT_ANIMATION_DURATION_MS
    );
  }

  set animationDuration(value: number) {
    this._setNumberAttribute("animation-duration", value);
  }

  /**
   * Set of arrows to draw on the board. This is an array of objects specifying
   * arrow characteristics, with the following properties: (1) `from` and `to`
   * corresponding to the start and end squares for the arrow, (2) optional
   * `weight` for the line (values: `"light"`, `"normal"`, `"bold"`), and
   * (3) `brush`, which is a string that will be used to make a CSS part
   * where one can customize the color, opacity, and other styles of the
   * arrow. For example, a value for `brush` of `"foo"` will apply a
   * CSS part named `arrow-foo` to the arrow.
   *
   * Note: because the value of `brush` becomes part of a CSS part name, it
   * should be usable as a valid CSS identifier.
   *
   * In addition to allowing arbitrary part names, arrows support a few
   * out-of-the-box brush names, `primary` and `secondary`, which colors
   * defined with CSS custom properties `--arrow-color-primary` and
   * `--arrow-color-secondary`.
   *
   * Example:
   *
   * ```js
   * board.arrows = [
   *   { from: "e2", to: "e4" },
   *   {
   *     from: "g1",
   *     to: "f3",
   *     brush: "foo"
   *   },
   *   {
   *     from: "c7",
   *     to: "c5",
   *     brush: "secondary"
   *   },
   * ];
   */
  get arrows() {
    return this._arrows.arrows;
  }

  set arrows(arrows: BoardArrow[] | undefined) {
    this._arrows.arrows = arrows;
  }

  /**
   * Add listener for events on this element.
   */
  addEventListener<K extends keyof ChessBoardEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: GChessBoardElement, ev: ChessBoardEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);
  }

  /**
   * Remove listener for an event on this element.
   */
  removeEventListener<K extends keyof ChessBoardEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: ChessBoardEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);
  }

  /**
   * Start a move on the board at `square`, optionally with specified targets
   * at `targetSquares`.
   */
  startMove(square: Square, targetSquares?: Square[]) {
    this._board.startMove(square, targetSquares);
  }

  /**
   * Imperatively cancel any in-progress moves.
   */
  cancelMove() {
    this._board.cancelMove();
  }

  private _hasBooleanAttribute(name: string): boolean {
    return (
      this.hasAttribute(name) &&
      this.getAttribute(name)?.toLowerCase() !== "false"
    );
  }

  private _setBooleanAttribute(name: string, value: boolean) {
    if (value) {
      this.setAttribute(name, "");
    } else {
      this.removeAttribute(name);
    }
  }

  private _setNumberAttribute(name: string, value: number) {
    this.setAttribute(name, value.toString());
  }

  private _parseRestrictedStringAttribute<T extends string>(
    name: string,
    guard: (value: string | null) => value is T
  ): T | undefined {
    const value = this.getAttribute(name);
    return guard(value) ? value : undefined;
  }

  private _parseRestrictedStringAttributeWithDefault<T extends string>(
    name: string,
    guard: (value: string | null) => value is T,
    defaultValue: T
  ): T {
    const parsed = this._parseRestrictedStringAttribute(name, guard);
    return parsed !== undefined ? parsed : defaultValue;
  }

  private _parseNumberAttribute(name: string, defaultValue: number): number {
    const value = this.getAttribute(name);
    return value === null || Number.isNaN(Number(value))
      ? defaultValue
      : Number(value);
  }
}

export interface MoveStartEvent {
  from: Square;
  piece: Piece;
  setTargets: (squares: Square[]) => void;
}

export interface MoveEndEvent {
  from: Square;
  to: Square;
  piece: Piece;
}

export interface MoveFinishedEvent {
  from: Square;
  to: Square;
  piece: Piece;
}

export interface MoveCancelEvent {
  from: Square;
  piece: Piece;
}

declare global {
  interface HTMLElementTagNameMap {
    "g-chess-board": GChessBoardElement;
  }

  interface ChessBoardEventMap {
    movestart: CustomEvent<MoveStartEvent>;
    moveend: CustomEvent<MoveEndEvent>;
    movefinished: CustomEvent<MoveFinishedEvent>;
    movecancel: CustomEvent<MoveCancelEvent>;
  }
}
