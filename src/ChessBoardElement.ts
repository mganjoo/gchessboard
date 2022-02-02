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
import importedStyles from "./style.css?inline";
import { assertUnreachable } from "./utils/typing";
import { makeHTMLElement } from "./utils/dom";
import {
  Coordinates,
  CoordinatesPlacement,
  isCoordinatesPlacement,
} from "./components/Coordinates";

/**
 * A component that displays a chess board, with optional interactivity. Allows
 * click, drag and keyboard-based moves.
 *
 * @fires movestart - Fired when the user initiates a move by clicking, dragging or
 *   keyboard. The event has a `detail` object with the `square` and `piece` values
 *   for the move.
 *
 *   It also has a function, `setTargets(squares)` that the caller
 *   can invoke with an array of square labels. This limits the set of targets
 *   that the piece can be moved to. Note that calling this function with an empty
 *   list will still allow the piece to be dragged around, but no square will accept
 *   the piece and thus it will always return to the starting square.
 *
 * @fires moveend - Fired after a move is completed (and animations are resolved).
 *   The event has a `detail` object with `from` and `to` set to the square labels
 *   of the move, and `piece` containing information about the piece that was moved.
 *
 * @cssprop [--dark-square-color=hsl(145deg 32% 44%)] - Color for dark square
 * @cssprop [--light-square-color=hsl(51deg 24% 84%)] - Color for light square
 *
 * @cssprop [--hover-dark-square-color=hsl(144deg 75% 44%)] - Square color when
 *   mouse or keyboard focus is hovering over a dark square
 * @cssprop [--hover-light-square-color=hsl(52deg 98% 70%)] - Square color when
 *   mouse or keyboard focus is hovering over a light square
 *
 * @cssprop [--active-dark-square-color=hsl(142deg 77% 43%)] - Color applied to
 *   dark square when it is involved in (starting point) of a move. By default
 *   this color is similar to, but slightly different from,
 *   `--hover-dark-square-color`.
 * @cssprop [--active-light-square-color=hsl(50deg 95% 64%)] - Color applied to
 *   light square when it is involved in (starting point) of a move.
 *
 * Color of outline when square is marked as start of move
 * @cssprop [--active-dark-outline-color=hsl(138deg 85% 53% / 95%)] - Color of
 *   **outline** applied to dark square when it is the starting point of a move.
 *   It is in addition to `--active-dark-square-color`, applied when the square
 *   is not focused.
 * @cssprop [--active-light-outline-color=hsl(66deg 97% 72% / 95%)] - Color of
 *   **outline** applied to light square when it is the starting point of a move.
 *   It is in addition to `--active-light-square-color`, applied when the square
 *   is not focused.
 * @cssprop [--move-target-dark-square-marker-color=hsl(144deg 64% 9% / 90%)] -
 *   Color of marker shown on dark square when it is an eligible move target
 * @cssprop [--move-target-light-square-marker-color=hsl(144deg 64% 9% / 90%)] -
 *   Color of marker shown on light square when it is an eligible move target
 * --move-target-marker-radius: 24%;
 * --move-target-marker-radius-occupied: 82%;
 *
 * @cssprop [--focus-outline-color=hsl(30deg 94% 55% / 90%)] - Color of outline
 *   of square when it has focus.
 * @cssprop [--focus-outline-blur-radius=3px] - Blur radius of focus outline.
 * @cssprop [--focus-outline-spread-radius=4px] - Spread radius of focus outline.
 *   Usage: `box-shadow: inset 0 0 var(--focus-outline-blur-radius) var(--focus-outline-spread-radius) var(--focus-outline-color);`
 *
 * @cssprop [--coords-font-size=0.7rem] - Font size of coord labels shown on board
 * @cssprop [--coords-font-family=sans-serif] - Font family of coord labels
 * @cssprop [--coords-outside-padding=4%] - When coords mode is `outside`, this
 *   property controls how much padding is applied to the border where coords are shown.
 *
 * @cssprop [--ghost-piece-opacity=0.35] - Opacity of ghost piece shown while dragging.
 *   Set to 0 to hide ghost piece altogether.
 * @cssprop [--piece-drag-z-index=9999] - z-index applied to piece while being dragged.
 * @cssprop [--piece-padding=3%] - padding applied around piece when placing in a square.
 *
 * @slot a1,a2,...,h8 - Slots for placing custom content (SVGs, text, or
 * any other annotation to show on the corresponding square).
 *
 * @csspart piece-<b|w>-<b|r|p|n|k|q> - CSS parts for each of the piece classes. The part
 *   name is of the form `piece-xy`, where `x` corresponds to the color of the piece --
 *   either `w` for white or `b` for black, and `y` is the piece type -- one of `p` (pawn),
 *   `r` (rook), `n` (knight), `b` (bishop), `k` (king), `q` (queen). Thus, `piece-wr`
 *   would be the CSS part corresponding to the white rook.
 *
 *   The CSS parts can be used to set custom CSS for the pieces (such as changing the image
 *   for a piece by changing the `background-image` property.
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
        this._fileCoords.placement = this.coordinates;
        this._rankCoords.placement = this.coordinates;
        break;
      case "orientation":
        this._board.orientation = this.orientation;
        this._fileCoords.orientation = this.orientation;
        this._rankCoords.orientation = this.orientation;
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
   * the bottom as viewed on the screen).
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
   * What side is allowed to move pieces. This may be `undefined` (or unset,
   * in the case of the equivalent element attribute), in which case pieces
   * from either side can be moved around.
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
   * move pieces etc. By default, this is false; i.e a board is only for display.
   *
   * @attr
   */
  get interactive() {
    return this._hasBooleanAttribute("interactive");
  }

  set interactive(interactive: boolean) {
    this._setBooleanAttribute("interactive", interactive);
  }

  /**
   * Map representing the board position, where keys are square labels, and
   * values are `Piece` objects. Note that changes to position do not reflect
   * onto the "fen" attribute of the element.
   */
  get position() {
    return this._board.position;
  }

  set position(value: Position) {
    this._board.position = { ...value };
  }

  /**
   * FEN string representing the board position. Note that changes to the `fen` property
   * change the board `position` property, but do **not** reflect onto the "fen" _attribute_
   * of the element. In other words, to get the latest FEN string for the board position,
   * use the `fen` property on the element.
   *
   * This property accepts the special string `"start"` as shorthand for the starting position
   * of a chess game. An empty string represents an empty board. Invalid FEN values are ignored
   * with an error.
   *
   * Note that a FEN string contains 6 components, separated by slashes, but only the first
   * component (the "piece placement" component) is used.
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
      // TODO: dispatch an ErrorEvent instead
      throw new Error(`Invalid FEN position: ${value}`);
    }
  }

  /**
   * How to display coordinates for squares. Could be `inside` the board (default),
   * `outside`, or `hidden`.
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
   * Allows attaching listeners for custom events on this element.
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
  ): void {
    super.addEventListener(type, listener, options);
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

declare global {
  interface HTMLElementTagNameMap {
    "g-chess-board": GChessBoardElement;
  }

  interface ChessBoardEventMap {
    movestart: CustomEvent<{
      square: Square;
      piece: Piece;
      setTargets: (squares: Square[]) => void;
    }>;
    moveend: CustomEvent<{
      from: Square;
      to: Square;
      piece: Piece;
    }>;
  }
}
