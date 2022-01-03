import { getSquare, getSquareColor, getVisualIndex } from "./chess"

describe("chess utilities", () => {
  it("getSquare()", () => {
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

  it("getVisualIndex()", () => {
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

  it("getSquareColor()", () => {
    expect(getSquareColor("c5")).toBe("dark")
    expect(getSquareColor("a6")).toBe("light")
    expect(getSquareColor("d3")).toBe("light")
    expect(getSquareColor("e7")).toBe("dark")
    expect(getSquareColor("h1")).toBe("light")
    expect(getSquareColor("f4")).toBe("dark")
  })
})
