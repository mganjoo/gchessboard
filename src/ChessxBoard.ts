import { isSide, getFen, getPosition, Position, Side } from "./utils/chess"
import { makeHTMLElement } from "./utils/dom"
import { Grid } from "./components/Grid"
import { InteractionEventHandler } from "./InteractionEventHandler"
import importedStyles from "./style.css?inline"
import { assertUnreachable } from "./utils/typing"

export class ChessxBoard extends HTMLElement {
  private _orientation: Side = "white"
  private _interactive = false
  private _position: Position = {}

  static readonly observedAttributes = [
    "orientation",
    "interactive",
    "fen",
  ] as const

  // Private contained elements
  private _shadow: ShadowRoot
  private _style: HTMLStyleElement
  private _group: HTMLDivElement
  private _grid: Grid
  private _eventsHandler: InteractionEventHandler

  constructor() {
    super()
    this._style = document.createElement("style")
    this._style.textContent = importedStyles
    this._group = makeHTMLElement("div", {
      classes: ["chessboard"],
    })
    this._grid = new Grid(this._group, {
      orientation: this._orientation,
      interactive: this._interactive,
    })
    this._eventsHandler = new InteractionEventHandler(this._group, this._grid, {
      enabled: false,
    })
    this._shadow = this.attachShadow({ mode: "open" })
  }

  connectedCallback() {
    this._shadow.appendChild(this._style)
    this._shadow.appendChild(this._group)
  }

  disconnectedCallback() {
    this._eventsHandler.deactivate()
  }

  attributeChangedCallback(
    name: typeof ChessxBoard.observedAttributes[number],
    _: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case "interactive":
        this.interactive = newValue === null ? false : true
        break
      case "orientation":
        this.orientation = isSide(newValue) ? newValue : "white"
        break
      case "fen":
        if (newValue !== null) {
          this.fen = newValue
        } else {
          this.position = {}
        }
        break
      default:
        assertUnreachable(name)
    }
  }

  /**
   * What side's perspective to render squares from (what color appears on
   * the bottom as viewed on the screen).
   */
  get orientation(): Side {
    return this._orientation
  }

  set orientation(value: Side) {
    this._orientation = value
    this._grid.orientation = value
  }

  /**
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  get interactive() {
    return this._interactive
  }

  set interactive(interactive: boolean) {
    this._interactive = interactive
    this._grid.interactive = interactive
    this._eventsHandler.enabled = interactive
  }

  /**
   * Map representing the board position, where keys are square labels, and
   * values are `Piece` objects.
   */
  get position() {
    return this._position
  }

  set position(value: Position) {
    this._position = value
    this._grid.position = value
  }

  get fen() {
    return getFen(this._position)
  }

  set fen(value: string) {
    const position = getPosition(value)
    if (position !== undefined) {
      this.position = position
    } else {
      throw new Error(`Invalid FEN position: ${value}`)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chessx-board": ChessxBoard
  }
}
