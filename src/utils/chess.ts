/**
 * Collection of 0x88-based methods to represent chessboard state.
 *
 * https://www.chessprogramming.org/0x88
 */

export const SQUARE_COLORS = ["light", "dark"] as const
export const SIDE_COLORS = ["white", "black"] as const
export const PIECE_TYPES = [
  "queen",
  "king",
  "knight",
  "bishop",
  "rook",
  "pawn",
] as const

export type SquareColor = typeof SQUARE_COLORS[number]
export type Side = typeof SIDE_COLORS[number]
export type PieceType = typeof PIECE_TYPES[number]

export interface Piece {
  pieceType: PieceType
  color: Side
}

// prettier-ignore
const SQUARES_MAP = {
  a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
  a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
  a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
  a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
  a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
  a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
  a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
  a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
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
 * Return square identifier for visual index in a grid, depending on
 * orientation. If `orientation` is "white", then a8 is on the top
 * left (0) and h8 is on the bottom right (63):
 *
 * a8 ...... .
 * .  ...... .
 * .  ...... h1
 *
 * otherwise h1 is on the top left:
 *
 * h1 ...... .
 * .  ...... .
 * .  ...... a8
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 */
export function getSquare(visualIndex: number, orientation: Side) {
  const idx = visualIndex + (visualIndex & ~0x7)
  return REVERSE_SQUARES_MAP[orientation === "white" ? idx : 0x77 - idx]
}

/**
 * Get the "visual" index for `square` depending on `orientation`.
 * If `orientation` is "white", then a8 is on the top left (0) and h8 is
 * on the bottom right (63):
 *
 * a8 ...... .
 * .  ...... .
 * .  ...... h1
 *
 * otherwise h1 is on the top left:
 *
 * h1 ...... .
 * .  ...... .
 * .  ...... a8
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 *
 * @param square square to convert to visual index.
 * @param orientation  what side is at the bottom ("white" = a1 on bottom left)
 * @returns a visual index for the square in question.
 */
export function getVisualIndex(square: Square, orientation: Side) {
  const idx = SQUARES_MAP[square]
  const orientedIdx = orientation === "white" ? idx : 0x77 - idx
  return (orientedIdx + (orientedIdx & 0x7)) >> 1
}

/**
 * https://www.chessprogramming.org/Color_of_a_Square#By_Anti-Diagonal_Index
 */
export function getSquareColor(square: Square): SquareColor {
  const idx0x88 = SQUARES_MAP[square]
  const idx = (idx0x88 + (idx0x88 & 0x7)) >> 1
  return ((idx * 9) & 8) === 0 ? "light" : "dark"
}

/**
 * Type guard to check if `key` (string) is a valid chess square.
 */
export function keyIsSquare(key: string | undefined): key is Square {
  return key !== undefined && key in SQUARES_MAP
}

/**
 * Deep equality check for two Piece objects.
 */
export function pieceEqual(a: Piece, b: Piece) {
  return a.color === b.color && a.pieceType === b.pieceType
}

/**
 * Type guard for string values that need to confirm to a `Side` definition.
 */
export function isSide(s: string | null): s is Side {
  return SIDE_COLORS.includes(s as Side)
}
