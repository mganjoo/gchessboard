import { isSide, getFen, getPosition, Position, Side } from "./utils/chess"
import { makeHTMLElement } from "./utils/dom"
import { Grid } from "./components/Grid"
import { InteractionEventHandler } from "./InteractionEventHandler"
import importedStyles from "./style.css?inline"
import { assertUnreachable } from "./utils/typing"

export class ChessxBoard extends HTMLElement {
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
      orientation: "white",
      interactive: false,
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
        {
          const interactive = newValue === null ? false : true
          this._grid.interactive = interactive
          this._eventsHandler.enabled = interactive
        }
        break
      case "orientation":
        {
          const orientation = this._parseSide(newValue)
          this._grid.orientation = orientation
        }
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
    return this._parseSide(this.getAttribute("orientation"))
  }

  set orientation(value: Side) {
    this.setAttribute("orientation", value)
  }

  /**
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  get interactive() {
    return this.hasAttribute("interactive")
  }

  set interactive(interactive: boolean) {
    if (interactive) {
      this.setAttribute("interactive", "")
    } else {
      this.removeAttribute("interactive")
    }
  }

  /**
   * Map representing the board position, where keys are square labels, and
   * values are `Piece` objects. Note that changes to position do not reflect
   * onto the "fen" attribute of the element.
   */
  get position() {
    return this._position
  }

  set position(value: Position) {
    this._position = { ...value }
    this._grid.position = this._position
  }

  /**
   * FEN string representing the board position. Note that changes to this property
   * change the board `position` property, but do not reflect onto the "fen" attribute
   * of the element.
   */
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

  private _parseSide(value: string | null): Side {
    return isSide(value) ? value : "white"
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chessx-board": ChessxBoard
  }
}
