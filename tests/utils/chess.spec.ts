import { test, expect } from "@playwright/test"
import {
  getFen,
  getPosition,
  getSquare,
  getSquareColor,
  getVisualIndex,
} from "../../src/utils/chess"

test.describe("chess utilities", () => {
  test("getSquare()", () => {
    expect(getSquare(0, "white")).toBe("a8")
    expect(getSquare(7, "white")).toBe("h8")
    expect(getSquare(56, "white")).toBe("a1")
    expect(getSquare(63, "white")).toBe("h1")
    expect(getSquare(0, "black")).toBe("h1")
    expect(getSquare(7, "black")).toBe("a1")
    expect(getSquare(56, "black")).toBe("h8")
    expect(getSquare(63, "black")).toBe("a8")
    expect(getSquare(34, "white")).toBe("c4")
    expect(getSquare(53, "black")).toBe("c7")
    expect(getSquare(25, "white")).toBe("b5")
    expect(getSquare(18, "black")).toBe("f3")
  })

  test("getVisualIndex()", () => {
    expect(getVisualIndex("a8", "white")).toEqual(0)
    expect(getVisualIndex("h8", "white")).toEqual(7)
    expect(getVisualIndex("a1", "white")).toEqual(56)
    expect(getVisualIndex("h1", "white")).toEqual(63)
    expect(getVisualIndex("h1", "black")).toEqual(0)
    expect(getVisualIndex("a1", "black")).toEqual(7)
    expect(getVisualIndex("h8", "black")).toEqual(56)
    expect(getVisualIndex("a8", "black")).toEqual(63)
    expect(getVisualIndex("c4", "white")).toEqual(34)
    expect(getVisualIndex("c7", "black")).toEqual(53)
    expect(getVisualIndex("b5", "white")).toEqual(25)
    expect(getVisualIndex("f3", "black")).toEqual(18)
    expect(getVisualIndex("d6", "white")).toEqual(19)
  })

  test("getSquareColor()", () => {
    expect(getSquareColor("c5")).toBe("dark")
    expect(getSquareColor("a6")).toBe("light")
    expect(getSquareColor("d3")).toBe("light")
    expect(getSquareColor("e7")).toBe("dark")
    expect(getSquareColor("h1")).toBe("light")
    expect(getSquareColor("f4")).toBe("dark")
  })

  test("getPosition()", () => {
    expect(getPosition("8/5p2/8/2b2k2/2P4P/4rPP1/R5K1/8 w - - 1 2")).toEqual({
      a2: { pieceType: "rook", color: "white" },
      g2: { pieceType: "king", color: "white" },
      e3: { pieceType: "rook", color: "black" },
      f3: { pieceType: "pawn", color: "white" },
      g3: { pieceType: "pawn", color: "white" },
      c4: { pieceType: "pawn", color: "white" },
      h4: { pieceType: "pawn", color: "white" },
      c5: { pieceType: "bishop", color: "black" },
      f5: { pieceType: "king", color: "black" },
      f7: { pieceType: "pawn", color: "black" },
    })

    expect(
      getPosition("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    ).toEqual({
      a1: { color: "white", pieceType: "rook" },
      b1: { color: "white", pieceType: "knight" },
      c1: { color: "white", pieceType: "bishop" },
      d1: { color: "white", pieceType: "queen" },
      e1: { color: "white", pieceType: "king" },
      f1: { color: "white", pieceType: "bishop" },
      g1: { color: "white", pieceType: "knight" },
      h1: { color: "white", pieceType: "rook" },
      a2: { color: "white", pieceType: "pawn" },
      b2: { color: "white", pieceType: "pawn" },
      c2: { color: "white", pieceType: "pawn" },
      d2: { color: "white", pieceType: "pawn" },
      e2: { color: "white", pieceType: "pawn" },
      f2: { color: "white", pieceType: "pawn" },
      g2: { color: "white", pieceType: "pawn" },
      h2: { color: "white", pieceType: "pawn" },
      a8: { color: "black", pieceType: "rook" },
      b8: { color: "black", pieceType: "knight" },
      c8: { color: "black", pieceType: "bishop" },
      d8: { color: "black", pieceType: "queen" },
      e8: { color: "black", pieceType: "king" },
      f8: { color: "black", pieceType: "bishop" },
      g8: { color: "black", pieceType: "knight" },
      h8: { color: "black", pieceType: "rook" },
      a7: { color: "black", pieceType: "pawn" },
      b7: { color: "black", pieceType: "pawn" },
      c7: { color: "black", pieceType: "pawn" },
      d7: { color: "black", pieceType: "pawn" },
      e7: { color: "black", pieceType: "pawn" },
      f7: { color: "black", pieceType: "pawn" },
      g7: { color: "black", pieceType: "pawn" },
      h7: { color: "black", pieceType: "pawn" },
    })

    expect(
      getPosition("r3r1k1/1bqn1p1p/ppnpp1p1/6P1/P2NPP2/2N4R/1PP2QBP/5R1K")
    ).toEqual({
      f1: { color: "white", pieceType: "rook" },
      h1: { color: "white", pieceType: "king" },
      b2: { color: "white", pieceType: "pawn" },
      c2: { color: "white", pieceType: "pawn" },
      f2: { color: "white", pieceType: "queen" },
      g2: { color: "white", pieceType: "bishop" },
      h2: { color: "white", pieceType: "pawn" },
      c3: { color: "white", pieceType: "knight" },
      h3: { color: "white", pieceType: "rook" },
      a4: { color: "white", pieceType: "pawn" },
      d4: { color: "white", pieceType: "knight" },
      e4: { color: "white", pieceType: "pawn" },
      f4: { color: "white", pieceType: "pawn" },
      g5: { color: "white", pieceType: "pawn" },
      a6: { color: "black", pieceType: "pawn" },
      b6: { color: "black", pieceType: "pawn" },
      c6: { color: "black", pieceType: "knight" },
      d6: { color: "black", pieceType: "pawn" },
      e6: { color: "black", pieceType: "pawn" },
      g6: { color: "black", pieceType: "pawn" },
      b7: { color: "black", pieceType: "bishop" },
      c7: { color: "black", pieceType: "queen" },
      d7: { color: "black", pieceType: "knight" },
      f7: { color: "black", pieceType: "pawn" },
      h7: { color: "black", pieceType: "pawn" },
      a8: { color: "black", pieceType: "rook" },
      e8: { color: "black", pieceType: "rook" },
      g8: { color: "black", pieceType: "king" },
    })
  })

  test.only("getFen()", () => {
    expect(
      getFen({
        a2: { pieceType: "rook", color: "white" },
        g2: { pieceType: "king", color: "white" },
        e3: { pieceType: "rook", color: "black" },
        f3: { pieceType: "pawn", color: "white" },
        g3: { pieceType: "pawn", color: "white" },
        c4: { pieceType: "pawn", color: "white" },
        h4: { pieceType: "pawn", color: "white" },
        c5: { pieceType: "bishop", color: "black" },
        f5: { pieceType: "king", color: "black" },
        f7: { pieceType: "pawn", color: "black" },
      })
    ).toEqual("8/5p2/8/2b2k2/2P4P/4rPP1/R5K1/8")

    expect(
      getFen({
        a1: { color: "white", pieceType: "rook" },
        b1: { color: "white", pieceType: "knight" },
        c1: { color: "white", pieceType: "bishop" },
        d1: { color: "white", pieceType: "queen" },
        e1: { color: "white", pieceType: "king" },
        f1: { color: "white", pieceType: "bishop" },
        g1: { color: "white", pieceType: "knight" },
        h1: { color: "white", pieceType: "rook" },
        a2: { color: "white", pieceType: "pawn" },
        b2: { color: "white", pieceType: "pawn" },
        c2: { color: "white", pieceType: "pawn" },
        d2: { color: "white", pieceType: "pawn" },
        e2: { color: "white", pieceType: "pawn" },
        f2: { color: "white", pieceType: "pawn" },
        g2: { color: "white", pieceType: "pawn" },
        h2: { color: "white", pieceType: "pawn" },
        a8: { color: "black", pieceType: "rook" },
        b8: { color: "black", pieceType: "knight" },
        c8: { color: "black", pieceType: "bishop" },
        d8: { color: "black", pieceType: "queen" },
        e8: { color: "black", pieceType: "king" },
        f8: { color: "black", pieceType: "bishop" },
        g8: { color: "black", pieceType: "knight" },
        h8: { color: "black", pieceType: "rook" },
        a7: { color: "black", pieceType: "pawn" },
        b7: { color: "black", pieceType: "pawn" },
        c7: { color: "black", pieceType: "pawn" },
        d7: { color: "black", pieceType: "pawn" },
        e7: { color: "black", pieceType: "pawn" },
        f7: { color: "black", pieceType: "pawn" },
        g7: { color: "black", pieceType: "pawn" },
        h7: { color: "black", pieceType: "pawn" },
      })
    ).toEqual("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")

    expect(
      getFen({
        f1: { color: "white", pieceType: "rook" },
        h1: { color: "white", pieceType: "king" },
        b2: { color: "white", pieceType: "pawn" },
        c2: { color: "white", pieceType: "pawn" },
        f2: { color: "white", pieceType: "queen" },
        g2: { color: "white", pieceType: "bishop" },
        h2: { color: "white", pieceType: "pawn" },
        c3: { color: "white", pieceType: "knight" },
        h3: { color: "white", pieceType: "rook" },
        a4: { color: "white", pieceType: "pawn" },
        d4: { color: "white", pieceType: "knight" },
        e4: { color: "white", pieceType: "pawn" },
        f4: { color: "white", pieceType: "pawn" },
        g5: { color: "white", pieceType: "pawn" },
        a6: { color: "black", pieceType: "pawn" },
        b6: { color: "black", pieceType: "pawn" },
        c6: { color: "black", pieceType: "knight" },
        d6: { color: "black", pieceType: "pawn" },
        e6: { color: "black", pieceType: "pawn" },
        g6: { color: "black", pieceType: "pawn" },
        b7: { color: "black", pieceType: "bishop" },
        c7: { color: "black", pieceType: "queen" },
        d7: { color: "black", pieceType: "knight" },
        f7: { color: "black", pieceType: "pawn" },
        h7: { color: "black", pieceType: "pawn" },
        a8: { color: "black", pieceType: "rook" },
        e8: { color: "black", pieceType: "rook" },
        g8: { color: "black", pieceType: "king" },
      })
    ).toEqual("r3r1k1/1bqn1p1p/ppnpp1p1/6P1/P2NPP2/2N4R/1PP2QBP/5R1K")
  })
})
