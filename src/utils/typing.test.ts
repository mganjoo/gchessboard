import { hasDataset } from "./typing"

describe("hasDataset()", () => {
  it("passes on regular HTML element", () => {
    expect(hasDataset(document.createElement("div"))).toBeTruthy()
  })
  it("does not pass on root HTML document", () => {
    expect(hasDataset(document.documentElement.parentNode)).toBeFalsy()
  })
  it("does not pass if element is null", () => {
    expect(hasDataset(null)).toBeFalsy()
  })
})
