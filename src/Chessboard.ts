import "./styles.css"
import { Labels } from "./Labels"
import { makeSvgElement, removeSvgElement } from "./svg-utils"
import { Squares } from "./Squares"
import { Piece, Side, Square } from "./common-types"

export interface ChessboardConfig {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private svg: SVGSVGElement
  private squares: Squares
  private labels: Labels
  private _orientation: Side

  /**
   * Creates a Chessboard UI element and appends it to `container`.
   *
   * @param container HTML element that will contain chessboard (e.g. <div>).
   *                  Rendered chessboard will be appended to this container.
   * @param config Configuration for chessboard (see type definition for details)
   */
  constructor(container: HTMLElement, config: ChessboardConfig) {
    this._orientation = config.orientation || "white"

    // Build SVG container for chessboard
    this.svg = makeSvgElement("svg", {
      attributes: {
        viewbox: "0 0 100 100",
        width: "100%",
        height: "100%",
      },
      classes: ["chessboard"],
    })

    this.squares = new Squares(this.svg, config.pieces)
    this.labels = new Labels(this.svg)

    // Manual trigger of initial re-paint and redraw
    this.repaintBoard()

    container.appendChild(this.svg)
  }

  get orientation() {
    return this._orientation
  }

  set orientation(o: Side) {
    this._orientation = o
    this.repaintBoard()
  }

  /**
   * Remove chessboard from DOM, and de-register all event handlers.
   */
  cleanup() {
    this.squares.cleanup()
    this.labels.cleanup()
    removeSvgElement(this.svg)
  }

  private repaintBoard() {
    this.squares.draw(this.orientation)
    this.labels.draw(this.orientation)
  }
}
