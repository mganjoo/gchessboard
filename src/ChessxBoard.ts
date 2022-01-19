import { isSide, getFen, getPosition, Position, Side } from "./utils/chess"
import { makeHTMLElement } from "./utils/dom"
import { Grid } from "./components/Grid"
import { InteractionHandler } from "./components/InteractionHandler"
import importedStyles from "./style.css?inline"
import { assertUnreachable } from "./utils/typing"

export class ChessxBoard extends HTMLElement {
  private _position: Position = {}

  static get observedAttributes() {
    return [
      "orientation",
      "interactive",
      "fen",
      "hide-coords",
      "disable-animation",
    ] as const
  }

  // Private contained elements
  private _shadow: ShadowRoot
  private _style: HTMLStyleElement
  private _group: HTMLDivElement
  private _grid: Grid
  private _interactionHandler: InteractionHandler

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
      hideCoords: false,
    })
    this._interactionHandler = new InteractionHandler(this._group, this._grid, {
      enabled: false,
    })
    this._shadow = this.attachShadow({ mode: "open" })
  }

  connectedCallback() {
    this._shadow.appendChild(this._style)
    this._shadow.appendChild(this._group)
  }

  disconnectedCallback() {
    this._interactionHandler.deactivate()
    this._grid.destroy()
  }

  attributeChangedCallback(
    name: typeof ChessxBoard.observedAttributes[number],
    _: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case "interactive":
        {
          const interactive = this._parseBooleanAttribute(newValue)
          this._grid.interactive = interactive
          this._interactionHandler.enabled = interactive
        }
        break
      case "hide-coords":
        this._grid.hideCoords = this._parseBooleanAttribute(newValue)
        break
      case "orientation":
        this._grid.orientation = this._parseSideAttribute(newValue)
        break
      case "fen":
        if (newValue !== null) {
          this.fen = newValue
        } else {
          this.position = {}
        }
        break
      case "disable-animation":
        this._grid.disableAnimation = this._parseBooleanAttribute(newValue)
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
    return this._parseSideAttribute(this.getAttribute("orientation"))
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
    this._setBooleanAttribute("interactive", interactive)
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

  /**
   * Whether to hide coordinate labels for the board.
   */
  get hideCoords() {
    return this.hasAttribute("hide-coords")
  }

  set hideCoords(value: boolean) {
    this._setBooleanAttribute("hide-coords", value)
  }

  /**
   * Whether to disable all animations for transitions.
   */
  get disableAnimation() {
    return this.hasAttribute("disable-animation")
  }

  set disableAnimation(value: boolean) {
    this._setBooleanAttribute("disable-animation", value)
  }

  private _parseSideAttribute(value: string | null): Side {
    return isSide(value) ? value : "white"
  }

  private _parseBooleanAttribute(value: string | null): boolean {
    return value === null ? false : true
  }

  private _setBooleanAttribute(name: string, value: boolean) {
    if (value) {
      this.setAttribute(name, "")
    } else {
      this.removeAttribute(name)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chessx-board": ChessxBoard
  }
}
