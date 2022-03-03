import {
  GChessBoardElement,
  MoveStartEvent,
  MoveEndEvent,
  MoveFinishedEvent,
  MoveCancelEvent,
} from "./GChessBoardElement";
import { Piece, PieceType, Position, Side, Square } from "./utils/chess";
import { BoardArrow } from "./components/Arrows";
import { CoordinatesPlacement } from "./components/Coordinates";

export { GChessBoardElement };
export type {
  BoardArrow,
  CoordinatesPlacement,
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
