import { ChessxBoard } from "./ChessxBoard"

export { ChessxBoard }

if (customElements.get("chessx-board") === undefined) {
  customElements.define("chessx-board", ChessxBoard)
}
