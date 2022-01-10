import { isSide, Piece, Side, Square } from "./utils/chess"
import { makeHTMLElement, removeElement } from "./utils/dom"
import { Grid } from "./components/Grid"
import { InteractionEventHandler } from "./InteractionEventHandler"
import importedStyles from "./style.css?inline"
import { assertUnreachable } from "./utils/typing"

export class ChessxBoard extends HTMLElement {
  private _orientation: Side = "white"
  private _interactive = false
  private _pieces: Partial<Record<Square, Piece>> = {}

  static readonly observedAttributes = ["orientation", "interactive"] as const

  // Private contained elements
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
      enabled: this.interactive,
    })
  }

  connectedCallback() {
    this.appendChild(this._style)
    this.appendChild(this._group)
  }

  disconnectedCallback() {
    removeElement(this._style)
    removeElement(this._group)
    this._eventsHandler.deactivate()
  }

  attributeChangedCallback(
    name: typeof ChessxBoard.observedAttributes[number],
    _: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case "interactive":
        this.interactive =
          newValue === null || newValue.toLowerCase() === "false" ? false : true
        break
      case "orientation":
        if (isSide(newValue)) {
          this.orientation = newValue
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
  get pieces() {
    return this._pieces
  }

  set pieces(value: Partial<Record<Square, Piece>>) {
    this._pieces = value
    this._grid.pieces = value
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chessx-board": ChessxBoard
  }
}
