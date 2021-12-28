import { Side } from "./common-types"
import { makeSvgElement, removeSvgElement } from "./svg-utils"

/**
 * Wrapper class for coordinate labels on chessboard.
 */
export class Labels {
  group: SVGGElement
  rankLabelElements: SVGTextElement[]
  fileLabelElements: SVGTextElement[]

  private xPaddingPct = 0.75
  private yPaddingPct = 1

  constructor(container: Element) {
    this.group = makeSvgElement("g", { classes: ["labels"] })
    this.rankLabelElements = new Array(8)
    this.fileLabelElements = new Array(8)

    // Rank labels: 1 ... 8
    for (let i = 0; i < 8; i++) {
      const elem = makeSvgElement("text", {
        attributes: {
          x: "0.5%",
          y: `${i * 12.5 + this.yPaddingPct}%`,
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
          x: `${(i + 1) * 12.5 - this.xPaddingPct}%`,
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

    container.appendChild(this.group)
  }

  /**
   * Redraw labels, based on `orientation` (which side is down).
   */
  draw(orientation: Side) {
    for (let i = 0; i < 8; i++) {
      this.rankLabelElements[i].textContent = `${
        orientation === "white" ? 8 - i : i + 1
      }`
      this.fileLabelElements[i].textContent = String.fromCharCode(
        "a".charCodeAt(0) + (orientation === "white" ? i : 7 - i)
      )
    }
  }

  cleanup() {
    removeSvgElement(this.group)
  }
}
