import {
  GChessBoardElement,
  MoveStartEvent,
  MoveEndEvent,
  MoveFinishedEvent,
  MoveCancelEvent,
} from "./GChessBoardElement.js";
import {
  CustomPieceTypeMap,
  Piece,
  PieceType,
  Position,
  Side,
  Square,
} from "./utils/chess.js";
import { BoardArrow } from "./components/Arrows.js";
import { CoordinatesPlacement } from "./components/Coordinates.js";

export { GChessBoardElement };
export type {
  BoardArrow,
  CoordinatesPlacement,
  CustomPieceTypeMap,
  MoveStartEvent,
  MoveEndEvent,
  MoveFinishedEvent,
  MoveCancelEvent,
  Piece,
  PieceType,
  Position,
  Side,
  Square,
};

customElements.define("g-chess-board", GChessBoardElement);
