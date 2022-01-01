import { makeHTMLElement, removeElement } from "./dom"

describe("dom utilities", () => {
  it("makeHTMLElement()", () => {
    const elem = makeHTMLElement("div", {
      attributes: { role: "grid" },
      data: { abc: "def" },
      classes: ["foo"],
    })
    expect(elem).toHaveAttribute("role", "grid")
    expect(elem).toHaveAttribute("data-abc", "def")
    expect(elem).toHaveClass("foo")
  })

  it("removeElement()", () => {
    const outer = document.createElement("div")
    const inner = document.createElement("a")
    outer.appendChild(inner)
    expect(outer).toContainElement(inner)
    removeElement(inner)
    expect(outer).not.toContainElement(inner)
  })
})
