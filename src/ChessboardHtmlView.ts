import { getSequentialIdx, getSquareColor, Square, SQUARES } from "./ChessLogic"
import "./styles.css"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

export class ChessboardHtmlView {
  private _svg: SVGElement
  private _squareElements: SVGRectElement[]

  constructor(container: HTMLElement) {
    this._svg = this._makeElement("svg", {
      attributes: {
        viewbox: "0 0 100 100",
        width: "100%",
        height: "100%",
      },
      classes: ["chessboard"],
    })
    const boardGroup = this._makeElement("g", {
      classes: ["board"],
    })

    this._squareElements = new Array(64)
    for (let i = 0; i < 64; i++) {
      const square = this._makeElement("rect", {
        attributes: {
          x: `${(i % 8) * 12.5}%`,
          y: `${Math.floor(i / 8) * 12.5}%`,
          width: "12.5%",
          height: "12.5%",
        },
        classes: [getSquareColor(SQUARES[i])],
      })
      boardGroup.appendChild(square)
    }

    this._svg.appendChild(boardGroup)
    container.appendChild(this._svg)
  }

  private _makeElement<K extends keyof SVGElementTagNameMap>(
    tag: K,
    options: { attributes?: Record<string, string>; classes?: string[] }
  ) {
    const e = document.createElementNS(SVG_NAMESPACE, tag)
    for (const key in options.attributes) {
      e.setAttribute(key, options.attributes[key])
    }
    e.classList.add(...(options.classes || []))
    return e
  }
}
