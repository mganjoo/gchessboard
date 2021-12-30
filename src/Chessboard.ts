import "./styles.css"
import { Squares } from "./Squares"
import { Piece, Side, Square } from "./utils-chess"

export interface ChessboardConfig {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}

export class Chessboard {
  private squares: Squares

  /**
   * Creates a Chessboard UI element and appends it to `container`.
   *
   * @param container HTML element that will contain chessboard (e.g. <div>).
   *                  Rendered chessboard will be appended to this container.
   * @param config Configuration for chessboard (see type definition for details)
   */
  constructor(container: HTMLElement, config: ChessboardConfig) {
    this.squares = new Squares(
      container,
      config.orientation || "white",
      config.pieces
    )
  }

  /**
   * Remove chessboard from DOM, and de-register all event handlers.
   */
  cleanup() {
    this.squares.cleanup()
  }
}
