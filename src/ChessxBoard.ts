import { isSide, getFen, getPosition, Position, Side } from "./utils/chess";
import { Board } from "./components/Board";
import importedStyles from "./style.css?inline";
import { assertUnreachable } from "./utils/typing";
import { makeHTMLElement } from "./utils/dom";
import {
  Coordinates,
  CoordinatesPlacement,
  isCoordinatesPlacement,
} from "./components/Coordinates";

export class ChessxBoard extends HTMLElement {
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
      classes: ["wrapper", ChessxBoard._DEFAULT_COORDS_PLACEMENT],
    });
    this._shadow.appendChild(this._wrapper);

    this._board = new Board(
      {
        orientation: ChessxBoard._DEFAULT_SIDE,
        animationDurationMs: ChessxBoard._DEFAULT_ANIMATION_DURATION_MS,
      },
      (e) => this.dispatchEvent(e),
      this._shadow
    );
    this._wrapper.appendChild(this._board.element);

    this._fileCoords = new Coordinates({
      direction: "file",
      placement: ChessxBoard._DEFAULT_COORDS_PLACEMENT,
      orientation: ChessxBoard._DEFAULT_SIDE,
    });
    this._rankCoords = new Coordinates({
      direction: "rank",
      placement: ChessxBoard._DEFAULT_COORDS_PLACEMENT,
      orientation: ChessxBoard._DEFAULT_SIDE,
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
    name: typeof ChessxBoard.observedAttributes[number],
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
   */
  get orientation(): Side {
    return this._parseRestrictedStringAttributeWithDefault<Side>(
      "orientation",
      isSide,
      ChessxBoard._DEFAULT_SIDE
    );
  }

  set orientation(value: Side) {
    this.setAttribute("orientation", value);
  }

  /**
   * What side is allowed to move pieces. This may be undefined, in which
   * pieces from either side can be moved around.
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
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  get interactive() {
    return this.hasAttribute("interactive");
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
   * FEN string representing the board position. Note that changes to this property
   * change the board `position` property, but do not reflect onto the "fen" attribute
   * of the element.
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
   */
  get coordinates(): CoordinatesPlacement {
    return this._parseRestrictedStringAttributeWithDefault<CoordinatesPlacement>(
      "coordinates",
      isCoordinatesPlacement,
      ChessxBoard._DEFAULT_COORDS_PLACEMENT
    );
  }

  set coordinates(value: CoordinatesPlacement) {
    this.setAttribute("coordinates", value);
  }

  get animationDuration() {
    return this._parseNumberAttribute(
      "animation-duration",
      ChessxBoard._DEFAULT_ANIMATION_DURATION_MS
    );
  }

  set animationDuration(value: number) {
    this._setNumberAttribute("animation-duration", value);
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
    "chessx-board": ChessxBoard;
  }
}
