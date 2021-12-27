import { Side, Square } from "./ChessLogic"

export type PieceType = "queen" | "king" | "knight" | "bishop" | "pawn"

export interface Piece {
  pieceType: PieceType
  color: Side
}

export interface ChessboardState {
  orientation?: Side
  pieces?: Partial<Record<Square, Piece>>
}
