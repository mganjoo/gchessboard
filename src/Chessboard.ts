import { Piece, Side, Square } from "./utils/chess"
import { makeHTMLElement, removeElement } from "./utils/dom"
import { Squares } from "./Squares"
import { InteractionEventHandler } from "./InteractionEventHandler"
import "./styles.css"

export interface ChessboardConfig {
  /**
   * What side's perspective to render squares from (what color appears on bottom).
   */
  orientation: Side
  /**
   * Whether the squares are interactive. This decides whether to apply attributes
   * like ARIA labels and roles.
   */
  interactive?: boolean
  /**
   * Map of square -> piece to initialize with. Since the Squares object manages
   * the pieces layer as well, all pieces management occurs via `SquaresConfig`.
   */
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private group: HTMLDivElement
  private squares: Squares
  private eventsHandler: InteractionEventHandler
  private _orientation: Side
  private _interactive: boolean

  /**
   * Creates a Chessboard UI element and appends it to `container`.
   *
   * @param container HTML element that will contain chessboard (e.g. <div>).
   *                  Rendered chessboard will be appended to this container.
   * @param config Configuration for chessboard (see type definition for details)
   */
  constructor(container: Element, config?: ChessboardConfig) {
    const { orientation, interactive, pieces } = config || {}
    this._orientation = orientation || "white"
    this._interactive = interactive || true

    this.group = makeHTMLElement("div", {
      attributes: { role: "grid" },
      classes: ["chessboard"],
    })
    this.squares = new Squares(this.group, {
      orientation: this.orientation,
      interactive: this.interactive,
      pieces,
    })
    this.eventsHandler = new InteractionEventHandler(this.group, this.squares, {
      interactive: this.interactive,
    })

    container.appendChild(this.group)
  }

  cleanup() {
    this.squares.cleanup()
    this.eventsHandler.cleanup()
    removeElement(this.group)
  }

  get orientation() {
    return this._orientation
  }

  set orientation(orientation: Side) {
    this._orientation = orientation
    this.squares.orientation = orientation
  }

  get interactive() {
    return this._interactive
  }

  set interactive(interactive: boolean) {
    this._interactive = interactive
    this.squares.interactive = interactive
    this.eventsHandler.interactive = interactive
  }
}
