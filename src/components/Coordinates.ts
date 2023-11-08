import { Side } from "../utils/chess.js";
import { makeHTMLElement } from "../utils/dom.js";

const COORDINATES_PLACEMENTS = ["inside", "outside", "hidden"] as const;
export type CoordinatesPlacement = (typeof COORDINATES_PLACEMENTS)[number];
type CoordinatesDirection = "file" | "rank";

export class Coordinates {
  element: HTMLDivElement;
  private _coordElements: HTMLDivElement[];
  private _orientation: Side;
  private readonly _direction: CoordinatesDirection;

  constructor(props: {
    direction: CoordinatesDirection;
    placement: CoordinatesPlacement;
    orientation: Side;
  }) {
    this.element = makeHTMLElement("div", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true",
      },
      classes: ["coords", props.direction],
    });
    this._direction = props.direction;
    this._orientation = props.orientation;

    this._coordElements = new Array(8);
    const evenSquareColor = props.direction === "file" ? "dark" : "light";
    const oddSquareColor = props.direction === "file" ? "light" : "dark";
    for (let i = 0; i < 8; i++) {
      const color = i % 2 === 0 ? evenSquareColor : oddSquareColor;
      const textElement = makeHTMLElement("div", { classes: ["coord", color] });
      this._coordElements[i] = textElement;
      this.element.appendChild(textElement);
    }

    this._updateCoordsText();
  }

  /**
   * Orientation of the board; this determines labels for ranks and files.
   */
  get orientation(): Side {
    return this._orientation;
  }

  set orientation(value: Side) {
    this._orientation = value;
    this._updateCoordsText();
  }

  private _updateCoordsText() {
    for (let i = 0; i < 8; i++) {
      if (this._direction === "file") {
        this._coordElements[i].textContent = String.fromCharCode(
          "a".charCodeAt(0) + (this.orientation === "white" ? i : 7 - i)
        );
      } else {
        this._coordElements[i].textContent = `${
          this.orientation === "white" ? 8 - i : i + 1
        }`;
      }
    }
  }
}

/**
 * Type guard for string values that need to conform to a
 * `CoordinatesPlacement` definition.
 */
export function isCoordinatesPlacement(
  value: string | null
): value is CoordinatesPlacement {
  return COORDINATES_PLACEMENTS.includes(value as CoordinatesPlacement);
}
