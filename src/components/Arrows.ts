import { getVisualRowColumn, Side, Square } from "../utils/chess";
import { makeSVGElement } from "../utils/dom";

type BoardArrowWeight = "normal" | "light" | "bold";

export type BoardArrow = {
  from: Square;
  to: Square;
  weight?: BoardArrowWeight;
  brush?: string;
};

export class Arrows {
  element: SVGElement;
  private _defs: SVGDefsElement;
  private _group: SVGGElement;
  private _orientation: Side;
  private _arrows?: BoardArrow[];
  private _arrowElements: Map<string, SVGLineElement> = new Map();
  private _markerElements: Map<string, SVGMarkerElement> = new Map();

  /**
   * Length of arrow from base to tip, in terms of line "stroke width" units.
   */
  private static _ARROW_LENGTH = 3.2;

  /**
   * Width of arrow base, in terms of line "stroke width" units.
   */
  private static _ARROW_WIDTH = 2.8;

  /**
   * Margin applied at start of line, along direction of arrow. In CSS viewport units.
   */
  private static _ARROW_START_MARGIN = 4;

  /**
   * Default brush name when none is specified for an arrow.
   */
  private static _DEFAULT_BRUSH_NAME = "primary";

  /**
   * Default arrow weight when none is specified.
   */
  private static _DEFAULT_ARROW_WEIGHT: BoardArrowWeight = "normal";

  constructor(orientation: Side) {
    this.element = makeSVGElement("svg", {
      attributes: {
        viewBox: "0 0 80 80",
      },
      classes: ["arrows"],
    });
    this._orientation = orientation;

    this._defs = makeSVGElement("defs");
    this.element.appendChild(this._defs);

    this._group = makeSVGElement("g");
    this.element.appendChild(this._group);
  }

  get arrows() {
    return this._arrows;
  }

  set arrows(arrows: BoardArrow[] | undefined) {
    const validArrows = arrows?.filter((a) => a.from !== a.to);
    // Update brushes
    const brushes = validArrows
      ? new Set(validArrows.map((a) => Arrows._escapedBrushName(a.brush)))
      : new Set<string>();
    const oldBrushes = new Set(this._markerElements.keys());
    oldBrushes.forEach((key) => {
      if (!brushes.has(key)) {
        const marker = this._markerElements.get(key);
        if (marker) {
          this._defs.removeChild(marker);
          this._markerElements.delete(key);
        }
      }
    });
    brushes.forEach((key) => {
      if (!oldBrushes.has(key)) {
        const marker = Arrows._makeMarker(key);
        this._defs.appendChild(marker);
        this._markerElements.set(key, marker);
      }
    });

    // Update arrows
    const oldHashes = new Set(this._arrowElements.keys());
    const newHashes = validArrows
      ? new Set(validArrows.map((arrow) => Arrows._arrowHash(arrow)))
      : new Set();

    oldHashes.forEach((hash) => {
      if (!newHashes.has(hash)) {
        const element = this._arrowElements.get(hash);
        if (element) {
          this._group.removeChild(element);
          this._arrowElements.delete(hash);
        }
      }
    });

    validArrows?.forEach((arrow) => {
      const hash = Arrows._arrowHash(arrow);
      if (!this._arrowElements.has(hash)) {
        const element = this._makeArrow(arrow);
        this._arrowElements.set(hash, element);
        this._group.appendChild(element);
      }
    });
    this._arrows = validArrows ? [...validArrows] : undefined;
  }

  /**
   * Orientation of the board; this determines direction to draw arrows.
   */
  get orientation() {
    return this._orientation;
  }

  set orientation(value: Side) {
    if (value !== this._orientation) {
      this._orientation = value;
      this._arrows?.forEach((arrow) => {
        const hash = Arrows._arrowHash(arrow);
        const element = this._arrowElements.get(hash);
        if (element) {
          this._group.removeChild(element);
        }
        const newElement = this._makeArrow(arrow);
        this._group.appendChild(newElement);
        this._arrowElements.set(hash, newElement);
      });
    }
  }

  private _makeArrow(arrow: BoardArrow) {
    const strokeWidth = Arrows._getSvgStrokeWidth(
      arrow.weight || Arrows._DEFAULT_ARROW_WEIGHT
    );
    const fromRowCol = getVisualRowColumn(arrow.from, this.orientation);
    const toRowCol = getVisualRowColumn(arrow.to, this.orientation);
    const coords = {
      x1: fromRowCol[1] * 10 + 5,
      y1: fromRowCol[0] * 10 + 5,
      x2: toRowCol[1] * 10 + 5,
      y2: toRowCol[0] * 10 + 5,
    };

    const endOffset = Arrows._computeXYProjections(
      strokeWidth * Arrows._ARROW_LENGTH,
      coords
    );
    const startOffset = Arrows._computeXYProjections(
      Arrows._ARROW_START_MARGIN,
      coords
    );
    const escapedBrushName = Arrows._escapedBrushName(
      arrow.brush || Arrows._DEFAULT_BRUSH_NAME
    );
    const className = Arrows._makeArrowClass(escapedBrushName);
    const line = makeSVGElement("line", {
      attributes: {
        x1: `${coords.x1 + startOffset.x}`,
        y1: `${coords.y1 + startOffset.y}`,
        x2: `${coords.x2 - endOffset.x}`,
        y2: `${coords.y2 - endOffset.y}`,
        stroke: "currentColor",
        "stroke-width": `${strokeWidth}`,
        "marker-end": `url(#${Arrows._makeArrowHeadId(escapedBrushName)})`,
        part: className,
      },
      classes: [className],
    });
    return line;
  }

  private static _makeMarker(escapedBrushName: string) {
    const marker = makeSVGElement("marker", {
      attributes: {
        id: Arrows._makeArrowHeadId(escapedBrushName),
        refX: "0",
        refY: `${Arrows._ARROW_WIDTH / 2}`,
        orient: "auto",
        markerWidth: `${Arrows._ARROW_LENGTH}`,
        markerHeight: `${Arrows._ARROW_WIDTH}`,
      },
    });
    const className = Arrows._makeArrowClass(escapedBrushName);
    const polygon = makeSVGElement("polygon", {
      attributes: {
        fill: "currentColor",
        points: `0,0 ${Arrows._ARROW_LENGTH},${Arrows._ARROW_WIDTH / 2} 0,${
          Arrows._ARROW_WIDTH
        }`,
        part: className,
      },
      classes: [className],
    });
    marker.appendChild(polygon);
    return marker;
  }

  private static _getSvgStrokeWidth(weight: BoardArrowWeight): number {
    switch (weight) {
      case "bold":
        return 3;
      case "light":
        return 1;
      case "normal":
      default:
        return 2;
    }
  }

  private static _escapedBrushName(brush?: string) {
    return CSS.escape(brush || Arrows._DEFAULT_BRUSH_NAME);
  }

  private static _makeArrowHeadId(escapedBrushName: string) {
    return `arrowhead-${escapedBrushName}`;
  }

  private static _makeArrowClass(escapedBrushName: string) {
    return `arrow-${escapedBrushName}`;
  }

  private static _computeXYProjections(
    length: number,
    arrow: { x1: number; y1: number; x2: number; y2: number }
  ) {
    const angle = Math.atan2(arrow.y2 - arrow.y1, arrow.x2 - arrow.x1);
    return { x: length * Math.cos(angle), y: length * Math.sin(angle) };
  }

  private static _arrowHash(arrow: BoardArrow) {
    return `${arrow.from}_${arrow.to}_${
      arrow.brush || Arrows._DEFAULT_BRUSH_NAME
    }_${arrow.weight || Arrows._DEFAULT_ARROW_WEIGHT}`;
  }
}
