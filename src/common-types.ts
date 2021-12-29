/**
 * Collection of 0x88-based methods to represent chessboard state.
 *
 * https://www.chessprogramming.org/0x88
 */

export const SQUARE_COLORS = ["light", "dark"] as const
export type SquareColor = typeof SQUARE_COLORS[number]

export const SIDE_COLORS = ["white", "black"] as const
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
 * Get sequential index (0-63) for `square`. a1 corresponds to index 0 and
 * h8 corresponds to 63 (if a1 is at the bottom).
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 */
export function getSequentialIdx(square: Square, orientation: Side) {
  const idx0x88 = SQUARES_MAP[square]
  const unorientedIdx = (idx0x88 + (idx0x88 & 0x7)) >> 1
  return orientation === "white" ? unorientedIdx : 63 - unorientedIdx
}

/**
 * Return square identifier for sequential index `idx`.
 */
export function getSquare(idx: number, orientation: Side) {
  const i = orientation === "white" ? idx : 63 - idx
  return REVERSE_SQUARES_MAP[i + (i & ~7)]
}

/**
 * Get rank (row) and file (col) index corresponding to `square`.
 *
 * @param square square to return rank and file for.
 * @returns the [rank, file] coordinates for the square.
 */
export function getRankFile(square: Square) {
  const idx = SQUARES_MAP[square]
  return [idx >> 4, idx & 0x7]
}

/**
 * Get "visual" row and column for square corresponding to sequential index
 * `idx`.
 */
export function getVisualRowColumnFromIdx(idx: number) {
  return [7 - (idx >> 3), idx & 0x7]
}

/**
 * Get the "visual" row and column for `square` depending on `orientation`.
 * If `orientation` is "white", then a1 is on the bottom left, otherwise h8 is
 * on the bottom left.
 * @param square square to convert to visual row and column.
 * @param orientation  what side is at the bottom ("white" = a1 on bottom left)
 * @returns a tuple for [row, column].
 */
export function getVisualRowColumn(square: Square, orientation: Side) {
  const idx = getSequentialIdx(square, orientation)
  return getVisualRowColumnFromIdx(idx)
}

/**
 * Returns the color of `square`.
 *
 * https://www.chessprogramming.org/Color_of_a_Square#By_Anti-Diagonal_Index
 *
 * @param square
 * @returns color of the square.
 */
export function getSquareColor(square: Square): SquareColor {
  // Can simply default to "white" orientation since the color
  // for a square is same no matter what orientation
  return ((getSequentialIdx(square, "white") * 9) & 8) === 0 ? "dark" : "light"
}

/**
 * Get color that is opposite to `color`.
 */
export function getOppositeColor(color: SquareColor): SquareColor {
  return SQUARE_COLORS[1 - SQUARE_COLORS.indexOf(color)]
}

export function keyIsSquare(key: string | undefined): key is Square {
  return key !== undefined && key in SQUARES_MAP
}
