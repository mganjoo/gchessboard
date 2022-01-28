import { Side } from "../utils/chess";
import { makeSvgElement } from "../utils/dom";

const COORDINATES_PLACEMENTS = ["inside", "outside", "hidden"] as const;
export type CoordinatesPlacement = typeof COORDINATES_PLACEMENTS[number];
type CoordinatesDirection = "file" | "rank";

export class Coordinates {
  element: SVGSVGElement;
  private _coordElements: SVGTextElement[];
  private readonly _direction: CoordinatesDirection;
  private _placement: CoordinatesPlacement;
  private _orientation: Side;

  private static _COORDS_PADDING_PCT_X = 0.75;
  private static _COORDS_PADDING_PCT_Y = 1;

  constructor(props: {
    direction: CoordinatesDirection;
    placement: CoordinatesPlacement;
    orientation: Side;
  }) {
    this.element = makeSvgElement("svg", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true",
        viewbox: "0 0 100 100",
      },
      classes: ["coords", props.direction],
    });
    this._direction = props.direction;
    this._placement = props.placement;
    this._orientation = props.orientation;

    this._coordElements = new Array(8);
    const evenSquareColor = props.direction === "file" ? "dark" : "light";
    const oddSquareColor = props.direction === "file" ? "light" : "dark";
    for (let i = 0; i < 8; i++) {
      const color = i % 2 === 0 ? evenSquareColor : oddSquareColor;
      const textElement = makeSvgElement("text", { classes: [color] });
      this._coordElements[i] = textElement;
      this.element.appendChild(textElement);
    }

    this._updatePlacementAttributes();
    this._updateCoordsText();
  }

  /**
   * Placement of coordinates. Values include `inside` or `outside` the board,
   * or `hidden` to completely hide coordinates.
   */
  get placement(): CoordinatesPlacement {
    return this._placement;
  }

  set placement(value: CoordinatesPlacement) {
    this._placement = value;
    this._updatePlacementAttributes();
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

  private _updatePlacementAttributes() {
    for (let i = 0; i < 8; i++) {
      if (this.placement === "outside") {
        this._coordElements[i].setAttribute(
          "x",
          this._direction === "file" ? `${6.25 + i * 12.5}%` : `50%`
        );
        this._coordElements[i].setAttribute(
          "y",
          this._direction === "file" ? `50%` : `${6.25 + i * 12.5}%`
        );
        this._coordElements[i].setAttribute("dominant-baseline", "middle");
        this._coordElements[i].setAttribute("text-anchor", "middle");
      } else if (this.placement === "inside") {
        this._coordElements[i].setAttribute(
          "x",
          this._direction === "file"
            ? `${(i + 1) * 12.5 - Coordinates._COORDS_PADDING_PCT_X}%`
            : `${Coordinates._COORDS_PADDING_PCT_X}%`
        );
        this._coordElements[i].setAttribute(
          "y",
          this._direction === "file"
            ? `${100 - Coordinates._COORDS_PADDING_PCT_Y}%`
            : `${i * 12.5 + Coordinates._COORDS_PADDING_PCT_Y}%`
        );
        this._coordElements[i].setAttribute(
          "dominant-baseline",
          this._direction === "file" ? "auto" : "hanging"
        );
        this._coordElements[i].setAttribute(
          "text-anchor",
          this._direction === "file" ? "end" : "start"
        );
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
