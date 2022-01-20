import { isSide, getFen, getPosition, Position, Side } from "./utils/chess"
import { Board } from "./components/Board"
import importedStyles from "./style.css?inline"
import { assertUnreachable } from "./utils/typing"

export class ChessxBoard extends HTMLElement {
  static get observedAttributes() {
    return ["orientation", "interactive", "fen", "hide-coords"] as const
  }

  private _shadow: ShadowRoot
  private _style: HTMLStyleElement
  private _board: Board
  private _position: Position = {}

  constructor() {
    super()
    this._shadow = this.attachShadow({ mode: "open" })

    this._style = document.createElement("style")
    this._style.textContent = importedStyles
    this._shadow.appendChild(this._style)

    this._board = new Board()
    this._shadow.appendChild(this._board.element)
  }

  disconnectedCallback() {
    this._board.destroy()
  }

  attributeChangedCallback(
    name: typeof ChessxBoard.observedAttributes[number],
    _: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case "interactive":
        this._board.interactive = this._parseBooleanAttribute(newValue)
        break
      case "hide-coords":
        this._board.hideCoords = this._parseBooleanAttribute(newValue)
        break
      case "orientation":
        this._board.orientation = this._parseSideAttribute(newValue)
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
    this._board.position = this._position
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
      // TODO: dispatch an ErrorEvent instead
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
