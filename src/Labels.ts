import { Side } from "./common-types"
import { makeSvgElement, removeSvgElement } from "./svg-utils"

const X_PADDING_PCT = 0.75
const Y_PADDING_PCT = 1

/**
 * Wrapper class for coordinate labels on chessboard.
 */
export class Labels {
  private group: SVGGElement
  private rankLabelElements: SVGTextElement[]
  private fileLabelElements: SVGTextElement[]
  private orientation: Side

  constructor(container: Element, orientation: Side) {
    this.group = makeSvgElement("g", { classes: ["labels"] })
    this.rankLabelElements = new Array(8)
    this.fileLabelElements = new Array(8)
    this.orientation = orientation

    // Rank labels: 1 ... 8
    for (let i = 0; i < 8; i++) {
      const elem = makeSvgElement("text", {
        attributes: {
          x: "0.5%",
          y: `${i * 12.5 + Y_PADDING_PCT}%`,
          width: "12.5%",
          height: "12.5%",
          "dominant-baseline": "hanging",
        },
        classes: [i % 2 == 0 ? "light" : "dark"],
      })
      this.rankLabelElements[i] = elem
      this.group.appendChild(elem)
    }

    // File labels: a ... h
    for (let i = 0; i < 8; i++) {
      const elem = makeSvgElement("text", {
        attributes: {
          x: `${(i + 1) * 12.5 - X_PADDING_PCT}%`,
          y: "99%",
          width: "12.5%",
          height: "12.5%",
          "text-anchor": "end",
        },
        classes: [i % 2 == 0 ? "dark" : "light"],
      })
      this.fileLabelElements[i] = elem
      this.group.appendChild(elem)
    }

    // Initial render
    this.draw()

    container.appendChild(this.group)
  }

  updateOrientationAndRedraw(orientation: Side) {
    this.orientation = orientation
    this.draw()
  }

  cleanup() {
    removeSvgElement(this.group)
  }

  /**
   * Redraw labels, based on `orientation` (which side is down).
   */
  private draw() {
    for (let i = 0; i < 8; i++) {
      this.rankLabelElements[i].textContent = `${
        this.orientation === "white" ? 8 - i : i + 1
      }`
      this.fileLabelElements[i].textContent = String.fromCharCode(
        "a".charCodeAt(0) + (this.orientation === "white" ? i : 7 - i)
      )
    }
  }
}
