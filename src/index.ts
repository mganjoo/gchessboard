import { ChessBoard } from "./ChessBoard";

export { ChessBoard as ChessBoard };

if (customElements.get("g-chess-board") === undefined) {
  customElements.define("g-chess-board", ChessBoard);
}
