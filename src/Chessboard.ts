import "./styles.css"

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
export const SQUARES = Object.keys(SQUARES_MAP) as Square[]

// https://www.chessprogramming.org/Color_of_a_Square#By_Anti-Diagonal_Index
const isLight = (sequentialIdx: number) => ((sequentialIdx * 9) & 8) == 0

// https://www.chessprogramming.org/0x88#Coordinate_Transformation
const getSequentialIdx = (square: Square) =>
  (SQUARES_MAP[square] + (SQUARES_MAP[square] & 0x7)) >> 1
export class Chessboard {
  private _boardElement: HTMLDivElement
  private _squareElements: HTMLDivElement[]
  private _highlightSquare: Square | undefined

  get highlightSquare(): Square | undefined {
    return this._highlightSquare
  }

  set highlightSquare(square: Square | undefined) {
    this._highlightSquare = square
    if (square) {
      this.updateContent(square)
    }
  }

  constructor(container: HTMLElement, highlightSquare?: Square) {
    this._squareElements = new Array(64)

    this._boardElement = document.createElement("div")
    this._boardElement.classList.add("board")

    this.highlightSquare = highlightSquare

    for (let i = 0; i < 64; i++) {
      const square = document.createElement("div")
      square.dataset.square = SQUARES[i]
      square.textContent = SQUARES[i]

      const squareClass = isLight(i) ? "light" : "dark"
      square.classList.add(squareClass)

      this._squareElements[i] = square
      this._boardElement.appendChild(square)
    }

    container.appendChild(this._boardElement)
  }

  private updateContent(square: Square) {
    this._squareElements[getSequentialIdx(square)].dataset.selected = "true"
  }
}
