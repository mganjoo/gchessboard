import { hasDataset, hasParentNode } from "./typing"

describe("hasDataset()", () => {
  it("passes on regular HTML element", () => {
    expect(hasDataset(document.createElement("div"))).toBeTruthy()
  })
  it("does not pass on root HTML document", () => {
    expect(hasDataset(document.documentElement.parentNode)).toBeFalsy()
  })
})

describe("hasParentNode()", () => {
  it("passes on regular HTML element", () => {
    const d = document.createElement("div")
    document.documentElement.appendChild(d)
    expect(hasParentNode(d)).toBeTruthy()
  })
  it("does not pass on root HTML document", () => {
    expect(hasParentNode(document.documentElement.parentNode)).toBeFalsy()
  })
})
