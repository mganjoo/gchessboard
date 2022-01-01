import { getSquare, getSquareColor, getVisualRowColumn } from "./chess"

describe("chess utilities", () => {
  it("getSquare()", () => {
    expect(getSquare(0, 0, "white")).toBe("a8")
    expect(getSquare(0, 7, "white")).toBe("h8")
    expect(getSquare(7, 0, "white")).toBe("a1")
    expect(getSquare(7, 7, "white")).toBe("h1")
    expect(getSquare(0, 0, "black")).toBe("h1")
    expect(getSquare(0, 7, "black")).toBe("a1")
    expect(getSquare(7, 0, "black")).toBe("h8")
    expect(getSquare(7, 7, "black")).toBe("a8")
    expect(getSquare(4, 2, "white")).toBe("c4")
    expect(getSquare(6, 5, "black")).toBe("c7")
    expect(getSquare(3, 1, "white")).toBe("b5")
    expect(getSquare(2, 2, "black")).toBe("f3")
  })

  it("getVisualRowColumn()", () => {
    expect(getVisualRowColumn("a8", "white")).toEqual([0, 0])
    expect(getVisualRowColumn("h8", "white")).toEqual([0, 7])
    expect(getVisualRowColumn("a1", "white")).toEqual([7, 0])
    expect(getVisualRowColumn("h1", "white")).toEqual([7, 7])
    expect(getVisualRowColumn("h1", "black")).toEqual([0, 0])
    expect(getVisualRowColumn("a1", "black")).toEqual([0, 7])
    expect(getVisualRowColumn("h8", "black")).toEqual([7, 0])
    expect(getVisualRowColumn("a8", "black")).toEqual([7, 7])
    expect(getVisualRowColumn("c4", "white")).toEqual([4, 2])
    expect(getVisualRowColumn("c7", "black")).toEqual([6, 5])
    expect(getVisualRowColumn("b5", "white")).toEqual([3, 1])
    expect(getVisualRowColumn("f3", "black")).toEqual([2, 2])
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
