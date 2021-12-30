/**
 * Collection of 0x88-based methods to represent chessboard state.
 *
 * https://www.chessprogramming.org/0x88
 */

const SQUARE_COLORS = ["light", "dark"] as const
const SIDE_COLORS = ["white", "black"] as const

export type SquareColor = typeof SQUARE_COLORS[number]
export type Side = typeof SIDE_COLORS[number]
export type PieceType = "queen" | "king" | "knight" | "bishop" | "rook" | "pawn"

export interface Piece {
  pieceType: PieceType
  color: Side
}

// prettier-ignore
const SQUARES_MAP = {
  a8: 112, b8: 113, c8: 114, d8: 115, e8: 116, f8: 117, g8: 118, h8: 119,
  a7:  96, b7:  97, c7:  98, d7:  99, e7: 100, f7: 101, g7: 102, h7: 103,
  a6:  80, b6:  81, c6:  82, d6:  83, e6:  84, f6:  85, g6:  86, h6:  87,
  a5:  64, b5:  65, c5:  66, d5:  67, e5:  68, f5:  69, g5:  70, h5:  71,
  a4:  48, b4:  49, c4:  50, d4:  51, e4:  52, f4:  53, g4:  54, h4:  55,
  a3:  32, b3:  33, c3:  34, d3:  35, e3:  36, f3:  37, g3:  38, h3:  39,
  a2:  16, b2:  17, c2:  18, d2:  19, e2:  20, f2:  21, g2:  22, h2:  23,
  a1:   0, b1:   1, c1:   2, d1:   3, e1:   4, f1:   5, g1:   6, h1:   7,
}
export type Square = keyof typeof SQUARES_MAP

const REVERSE_SQUARES_MAP = (Object.keys(SQUARES_MAP) as Square[]).reduce(
  (acc, key) => {
    acc[SQUARES_MAP[key]] = key
    return acc
  },
  {} as Record<number, Square>
)

/**
 * Return square identifier for visual `row` and `column` in a grid,
 * depending on orientation.
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 */
export function getSquare(row: number, column: number, orientation: Side) {
  const idx = 16 * (7 - row) + column
  return REVERSE_SQUARES_MAP[orientation === "white" ? idx : 0x77 - idx]
}

/**
 * Get the "visual" row and column for `square` depending on `orientation`.
 * If `orientation` is "white", then a1 is on the bottom left (7, 0) and h8
 * is on the top right (0, 7):
 *
 * .  ...... h8
 * .  ...... .
 * a1 ...... .
 *
 * otherwise h8 is on the bottom left:
 * .  ...... a1
 * .  ...... .
 * h8 ...... .
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 *
 * @param square square to convert to visual row and column.
 * @param orientation  what side is at the bottom ("white" = a1 on bottom left)
 * @returns a tuple for [row, column].
 */
export function getVisualRowColumn(square: Square, orientation: Side) {
  const idx = SQUARES_MAP[square]
  const orientedIdx = orientation === "white" ? idx : 0x77 - idx
  return [7 - (orientedIdx >> 4), orientedIdx & 0x7]
}

/**
 * https://www.chessprogramming.org/Color_of_a_Square#By_Anti-Diagonal_Index
 */
export function getSquareColor(square: Square): SquareColor {
  const idx0x88 = SQUARES_MAP[square]
  const idx = (idx0x88 + (idx0x88 & 0x7)) >> 1
  return ((idx * 9) & 8) === 0 ? "dark" : "light"
}

export function getOppositeSquareColor(color: SquareColor): SquareColor {
  return SQUARE_COLORS[1 - SQUARE_COLORS.indexOf(color)]
}

export function getOppositeSide(color: Side) {
  return SIDE_COLORS[1 - SIDE_COLORS.indexOf(color)]
}

/**
 * Type guard to check if `key` (string) is a valid chess square.
 */
export function keyIsSquare(key: string | undefined): key is Square {
  return key !== undefined && key in SQUARES_MAP
}
