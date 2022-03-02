/**
 * Collection of 0x88-based methods to represent chessboard state.
 *
 * https://www.chessprogramming.org/0x88
 */
const SIDE_COLORS = ["white", "black"];
// prettier-ignore
const SQUARES_MAP = {
    a8: 0, b8: 1, c8: 2, d8: 3, e8: 4, f8: 5, g8: 6, h8: 7,
    a7: 16, b7: 17, c7: 18, d7: 19, e7: 20, f7: 21, g7: 22, h7: 23,
    a6: 32, b6: 33, c6: 34, d6: 35, e6: 36, f6: 37, g6: 38, h6: 39,
    a5: 48, b5: 49, c5: 50, d5: 51, e5: 52, f5: 53, g5: 54, h5: 55,
    a4: 64, b4: 65, c4: 66, d4: 67, e4: 68, f4: 69, g4: 70, h4: 71,
    a3: 80, b3: 81, c3: 82, d3: 83, e3: 84, f3: 85, g3: 86, h3: 87,
    a2: 96, b2: 97, c2: 98, d2: 99, e2: 100, f2: 101, g2: 102, h2: 103,
    a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
};
const SQUARES = Object.keys(SQUARES_MAP);
// prettier-ignore
const SQUARE_DISTANCE_TABLE = [
    14, 13, 12, 11, 10, 9, 8, 7, 8, 9, 10, 11, 12, 13, 14, 0,
    13, 12, 11, 10, 9, 8, 7, 6, 7, 8, 9, 10, 11, 12, 13, 0,
    12, 11, 10, 9, 8, 7, 6, 5, 6, 7, 8, 9, 10, 11, 12, 0,
    11, 10, 9, 8, 7, 6, 5, 4, 5, 6, 7, 8, 9, 10, 11, 0,
    10, 9, 8, 7, 6, 5, 4, 3, 4, 5, 6, 7, 8, 9, 10, 0,
    9, 8, 7, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 8, 9, 0,
    8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 0,
    7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 0,
    8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 0,
    9, 8, 7, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 8, 9, 0,
    10, 9, 8, 7, 6, 5, 4, 3, 4, 5, 6, 7, 8, 9, 10, 0,
    11, 10, 9, 8, 7, 6, 5, 4, 5, 6, 7, 8, 9, 10, 11, 0,
    12, 11, 10, 9, 8, 7, 6, 5, 6, 7, 8, 9, 10, 11, 12, 0,
    13, 12, 11, 10, 9, 8, 7, 6, 7, 8, 9, 10, 11, 12, 13, 0,
    14, 13, 12, 11, 10, 9, 8, 7, 8, 9, 10, 11, 12, 13, 14, 0,
];
const REVERSE_SQUARES_MAP = SQUARES.reduce((acc, key) => {
    acc[SQUARES_MAP[key]] = key;
    return acc;
}, {});
const FEN_PIECE_TYPE_MAP = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king",
};
const REVERSE_FEN_PIECE_TYPE_MAP = Object.keys(FEN_PIECE_TYPE_MAP).reduce((acc, key) => {
    acc[FEN_PIECE_TYPE_MAP[key]] = key;
    return acc;
}, {});
/**
 * Parse a FEN string and return an object that maps squares to pieces.
 *
 * Also accepts the special string "initial" or "start" to represent
 * standard game starting position.
 *
 * Note that only the first part of the FEN string (piece placement) is
 * parsed; any additional components are ignored.
 *
 * @param fen the FEN string
 * @returns an object where key is of type Square (string) and value is
 *          of type Piece
 */
function getPosition(fen) {
    if (fen === "initial" || fen === "start") {
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    }
    const parts = fen.split(" ");
    const ranks = parts[0].split("/");
    if (ranks.length !== 8) {
        return undefined;
    }
    const position = {};
    for (let i = 0; i < 8; i++) {
        const rank = 8 - i;
        let fileOffset = 0;
        for (let j = 0; j < ranks[i].length; j++) {
            const pieceLetter = ranks[i][j].toLowerCase();
            if (pieceLetter in FEN_PIECE_TYPE_MAP) {
                const square = (String.fromCharCode(97 + fileOffset) + rank);
                position[square] = {
                    pieceType: FEN_PIECE_TYPE_MAP[pieceLetter],
                    color: pieceLetter === ranks[i][j] ? "black" : "white",
                };
                fileOffset += 1;
            }
            else {
                const emptySpaces = parseInt(ranks[i][j]);
                if (isNaN(emptySpaces) || emptySpaces === 0 || emptySpaces > 8) {
                    return undefined;
                }
                else {
                    fileOffset += emptySpaces;
                }
            }
        }
        if (fileOffset !== 8) {
            return undefined;
        }
    }
    return position;
}
/**
 * Get FEN string corresponding to Position object. Note that this only returns
 * the first (piece placement) component of the FEN string.
 */
function getFen(position) {
    const rankSpecs = [];
    for (let i = 0; i < 8; i++) {
        let rankSpec = "";
        let gap = 0;
        for (let j = 0; j < 8; j++) {
            const square = REVERSE_SQUARES_MAP[16 * i + j];
            const piece = position[square];
            if (piece !== undefined) {
                const pieceStr = REVERSE_FEN_PIECE_TYPE_MAP[piece.pieceType];
                if (gap > 0) {
                    rankSpec += gap;
                }
                rankSpec += piece.color === "white" ? pieceStr.toUpperCase() : pieceStr;
                gap = 0;
            }
            else {
                gap += 1;
            }
        }
        if (gap > 0) {
            rankSpec += gap;
        }
        rankSpecs.push(rankSpec);
    }
    return rankSpecs.join("/");
}
/**
 * Return square identifier for visual index in a grid, depending on
 * orientation. If `orientation` is "white", then a8 is on the top
 * left (0) and h8 is on the bottom right (63):
 *
 * a8 ...... .
 * .  ...... .
 * .  ...... h1
 *
 * otherwise h1 is on the top left:
 *
 * h1 ...... .
 * .  ...... .
 * .  ...... a8
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 */
function getSquare(visualIndex, orientation) {
    const idx = visualIndex + (visualIndex & ~0x7);
    return REVERSE_SQUARES_MAP[orientation === "black" ? 0x77 - idx : idx];
}
/**
 * Get the "visual" index for `square` depending on `orientation`.
 * If `orientation` is "white", then a8 is on the top left (0) and h8 is
 * on the bottom right (63):
 *
 * a8 ...... .
 * .  ...... .
 * .  ...... h1
 *
 * otherwise h1 is on the top left:
 *
 * h1 ...... .
 * .  ...... .
 * .  ...... a8
 *
 * https://www.chessprogramming.org/0x88#Coordinate_Transformation
 *
 * @param square square to convert to visual index.
 * @param orientation  what side is at the bottom ("white" = a1 on bottom left)
 * @returns a visual index for the square in question.
 */
function getVisualIndex(square, orientation) {
    const idx = SQUARES_MAP[square];
    const orientedIdx = orientation === "black" ? 0x77 - idx : idx;
    return (orientedIdx + (orientedIdx & 0x7)) >> 1;
}
/**
 * Like `getVisualIndex`, but returns a row and column combination.
 *
 * @param square square to convert to visual row and column.
 * @param orientation  what side is at the bottom ("white" = a1 on bottom left)
 * @returns an array containing [row, column] for the square in question.
 */
function getVisualRowColumn(square, orientation) {
    const idx = getVisualIndex(square, orientation);
    return [idx >> 3, idx & 0x7];
}
/**
 * https://www.chessprogramming.org/Color_of_a_Square#By_Anti-Diagonal_Index
 */
function getSquareColor(square) {
    const idx0x88 = SQUARES_MAP[square];
    const idx = (idx0x88 + (idx0x88 & 0x7)) >> 1;
    return ((idx * 9) & 8) === 0 ? "light" : "dark";
}
/**
 * Type guard to check if `key` (string) is a valid chess square.
 */
function keyIsSquare(key) {
    return key !== undefined && key in SQUARES_MAP;
}
/**
 * Deep equality check for two Piece objects.
 */
function pieceEqual(a, b) {
    return ((a === undefined && b === undefined) ||
        (a !== undefined &&
            b !== undefined &&
            a.color === b.color &&
            a.pieceType === b.pieceType));
}
/**
 * Type guard for string values that need to conform to a `Side` definition.
 */
function isSide(s) {
    return SIDE_COLORS.includes(s);
}
/**
 * Deep equality check for Position objects.
 */
function positionsEqual(a, b) {
    return SQUARES.every((square) => pieceEqual(a[square], b[square]));
}
function calcPositionDiff(oldPosition, newPosition) {
    // Limit old and new positions only to squares that are different
    const oldPositionLimited = { ...oldPosition };
    const newPositionLimited = { ...newPosition };
    Object.keys(newPosition).forEach((k) => {
        const square = k;
        if (pieceEqual(newPosition[square], oldPosition[square])) {
            delete oldPositionLimited[square];
            delete newPositionLimited[square];
        }
    });
    const added = [];
    const removed = [];
    const moved = [];
    Object.entries(newPositionLimited).forEach(([k, newPiece]) => {
        const newSquare = k;
        let minDistance = 15;
        let closestSquare;
        Object.entries(oldPositionLimited).forEach(([l, oldPiece]) => {
            const oldSquare = l;
            if (pieceEqual(newPiece, oldPiece)) {
                const distance = squareDistance(newSquare, oldSquare);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestSquare = oldSquare;
                }
            }
        });
        if (closestSquare !== undefined) {
            moved.push({ piece: newPiece, oldSquare: closestSquare, newSquare });
            delete oldPositionLimited[closestSquare];
            delete newPositionLimited[newSquare];
        }
    });
    Object.entries(newPositionLimited).forEach(([k, piece]) => {
        added.push({ piece, square: k });
    });
    Object.entries(oldPositionLimited).forEach(([k, piece]) => {
        removed.push({ piece, square: k });
    });
    return { added, removed, moved };
}
function squareDistance(a, b) {
    return SQUARE_DISTANCE_TABLE[SQUARES_MAP[a] - SQUARES_MAP[b] + 0x77];
}

/**
 * Convenience functions for creating and removing DOM elements.
 */
/**
 * Make HTML element, with optional `attributes`, `data` key/values and `classes`
 * specified through `options.
 */
function makeHTMLElement(tag, options) {
    return addOptionsToElement(document.createElement(tag), options);
}
/**
 * Make SVG element, with optional `attributes`, `data` key/values and `classes`
 * specified through `options.
 */
function makeSVGElement(tag, options) {
    return addOptionsToElement(document.createElementNS("http://www.w3.org/2000/svg", tag), options);
}
function addOptionsToElement(e, options) {
    if (options !== undefined) {
        for (const key in options.attributes) {
            e.setAttribute(key, options.attributes[key]);
        }
        for (const key in options.data) {
            e.dataset[key] = options.data[key];
        }
        if (options.classes) {
            e.classList.add(...options.classes);
        }
    }
    return e;
}

/**
 * Wrapper for Typescript `never` type to be used in exhaustive type checks.
 */
// istanbul ignore next
function assertUnreachable(x) {
    throw new Error(`Unreachable code reached with value ${x}`);
}

/**
 * Visual representation of a chessboard piece.
 */
class BoardPiece {
    constructor(container, config) {
        Object.defineProperty(this, "piece", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "animationFinished", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_element", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_parentElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_explicitPosition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.piece = config.piece;
        this._parentElement = container;
        this._element = makeHTMLElement("span", {
            attributes: {
                role: "presentation",
                "aria-hidden": "true",
                part: `piece-${BoardPiece.PIECE_CLASS_MAP[this.piece.color][this.piece.pieceType]}`,
            },
            classes: [
                "piece",
                BoardPiece.PIECE_CLASS_MAP[this.piece.color][this.piece.pieceType],
            ],
        });
        if (config.animation !== undefined) {
            this._setAnimation(config.animation);
        }
        if (config.secondary) {
            this._element.classList.add("secondary");
        }
        container.appendChild(this._element);
    }
    /**
     * Remove piece for square it is contained on, along with any animation
     * listeners.
     */
    remove(animationDurationMs) {
        if (animationDurationMs) {
            this._setAnimation({ type: "fade-out", durationMs: animationDurationMs });
        }
        else {
            this._parentElement.removeChild(this._element);
        }
    }
    /**
     * Set explicit offset for piece relative to default location in square.
     */
    setExplicitPosition(explicitPosition) {
        this._explicitPosition = explicitPosition;
        const coords = this._getTranslateValues(explicitPosition);
        if (coords) {
            this._element.style.transform = `translate(${coords.x}, ${coords.y})`;
        }
    }
    /**
     * Reset any explicit position set on the piece. If `transition` is true, then
     * the change is accompanied with a transition.
     */
    resetPosition(animateDurationMs) {
        if (animateDurationMs && this._explicitPosition) {
            this._setAnimation({
                type: "slide-in",
                from: this._explicitPosition,
                durationMs: animateDurationMs,
            });
        }
        this._element.style.removeProperty("transform");
        this._explicitPosition = undefined;
    }
    /**
     * Return explicit position of piece on square, if any.
     */
    get explicitPosition() {
        return this._explicitPosition;
    }
    /**
     * Finish any animations, if in progress.
     */
    finishAnimations() {
        this._element.getAnimations().forEach((a) => {
            a.finish();
        });
    }
    _getTranslateValues(explicitPosition) {
        if (explicitPosition.type === "coordinates") {
            const squareDims = this._parentElement.getBoundingClientRect();
            const deltaX = explicitPosition.x - squareDims.left - squareDims.width / 2;
            const deltaY = explicitPosition.y - squareDims.top - squareDims.height / 2;
            if (deltaX !== 0 || deltaY !== 0) {
                return { x: `${deltaX}px`, y: `${deltaY}px` };
            }
        }
        else {
            if (explicitPosition.deltaCols !== 0 ||
                explicitPosition.deltaRows !== 0) {
                return {
                    x: `${explicitPosition.deltaCols * 100}%`,
                    y: `${explicitPosition.deltaRows * 100}%`,
                };
            }
        }
        return undefined;
    }
    _setAnimation(animationSpec) {
        let keyframes;
        let onfinish;
        // Always have exactly one animation running at a time.
        this.finishAnimations();
        switch (animationSpec.type) {
            case "slide-in":
                {
                    const coords = this._getTranslateValues(animationSpec.from);
                    if (coords) {
                        keyframes = [
                            { transform: `translate(${coords.x}, ${coords.y})` },
                            { transform: "none" },
                        ];
                        this._element.classList.add("moving");
                    }
                    onfinish = () => {
                        this._element.classList.remove("moving");
                    };
                }
                break;
            case "fade-in":
                keyframes = [{ opacity: 0 }, { opacity: 1 }];
                break;
            case "fade-out":
                {
                    keyframes = [{ opacity: 1 }, { opacity: 0 }];
                    const elementCopy = this._element;
                    onfinish = () => {
                        this._parentElement.removeChild(elementCopy);
                    };
                }
                break;
            default:
                assertUnreachable(animationSpec);
        }
        if (keyframes !== undefined &&
            typeof this._element.animate === "function") {
            const animation = this._element.animate(keyframes, {
                duration: Math.max(0, animationSpec.durationMs),
            });
            this.animationFinished = new Promise((resolve) => {
                animation.onfinish = () => {
                    if (onfinish !== undefined) {
                        onfinish();
                    }
                    this.animationFinished = undefined;
                    resolve();
                };
            });
        }
        else if (onfinish !== undefined) {
            onfinish();
        }
    }
}
/**
 * Map of piece to background image CSS class name.
 */
Object.defineProperty(BoardPiece, "PIECE_CLASS_MAP", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        white: {
            queen: "wq",
            king: "wk",
            knight: "wn",
            pawn: "wp",
            bishop: "wb",
            rook: "wr",
        },
        black: {
            queen: "bq",
            king: "bk",
            knight: "bn",
            pawn: "bp",
            bishop: "bb",
            rook: "br",
        },
    }
});

/**
 * Visual representation of a chessboard square, along with attributes
 * that aid in interactivity (ARIA role, labels etc).
 */
class BoardSquare {
    constructor(container, label) {
        Object.defineProperty(this, "_tdElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_contentElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_slotWrapper", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_slotElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_label", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_interactive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_tabbable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_moveable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_boardPiece", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_secondaryBoardPiece", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_hasContent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_hover", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_markedTarget", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_moveState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._tdElement = makeHTMLElement("td", { attributes: { role: "cell" } });
        this._label = label;
        this._contentElement = makeHTMLElement("div", { classes: ["content"] });
        this._slotWrapper = makeHTMLElement("div", {
            classes: ["slot"],
            attributes: { role: "presentation" },
        });
        this._slotElement = document.createElement("slot");
        this._slotWrapper.appendChild(this._slotElement);
        this._contentElement.appendChild(this._slotWrapper);
        this._updateLabelVisuals();
        this._tdElement.appendChild(this._contentElement);
        container.appendChild(this._tdElement);
    }
    /**
     * Label associated with the square (depends on orientation of square
     * on the board).
     */
    get label() {
        return this._label;
    }
    set label(value) {
        this._label = value;
        this._updateLabelVisuals();
    }
    /**
     * Whether the square is used in an interactive grid. Decides whether
     * the square should get visual attributes like tabindex, labels etc.
     */
    get interactive() {
        return this._interactive;
    }
    set interactive(value) {
        this._interactive = value;
        this._moveState = undefined;
        // Aria roles
        this._tdElement.setAttribute("role", value ? "gridcell" : "cell");
        if (value) {
            this._contentElement.setAttribute("role", "button");
        }
        else {
            this._contentElement.removeAttribute("role");
        }
        this._updateTabIndex();
        this._updateMoveStateVisuals();
        this._updateLabelVisuals();
    }
    /**
     * Whether this square can be tabbed to by the user (tabindex = 0). By default,
     * all chessboard squares are focusable but not user-tabbable (tabindex = -1).
     */
    get tabbable() {
        return this._tabbable;
    }
    set tabbable(value) {
        this._tabbable = value;
        this._updateTabIndex();
    }
    /**
     * Whether this square should be marked as containing any slotted content.
     */
    get hasContent() {
        return !!this._hasContent;
    }
    set hasContent(value) {
        this._hasContent = value;
        this._contentElement.classList.toggle("has-content", value);
    }
    /**
     * Whether the piece on this square is moveable through user interaction.
     * To be set to true, a piece must actually exist on the square.
     */
    get moveable() {
        return this._moveable;
    }
    set moveable(value) {
        if (!value || this._boardPiece) {
            this._moveable = value;
            this._updateMoveStateVisuals();
            this._updateLabelVisuals();
        }
    }
    /**
     * Whether this square is a valid move target. These are highlighted
     * when move is in progress, indicating squares that we can move to.
     */
    get moveTarget() {
        return this._moveState === "move-target";
    }
    set moveTarget(value) {
        this._moveState = value ? "move-target" : "move-nontarget";
        this._updateMoveStateVisuals();
        this._updateLabelVisuals();
    }
    removeMoveState() {
        this._moveState = undefined;
        this._updateMoveStateVisuals();
        this._updateLabelVisuals();
    }
    /**
     * Whether this square is currently a "hover" target: the equivalent of a
     * :hover pseudoclass while mousing over a target square, but for drag
     * and keyboard moves.
     */
    get hover() {
        return this._hover;
    }
    set hover(value) {
        this._hover = value;
        this._contentElement.classList.toggle("hover", value);
    }
    /**
     * Whether this square is currently a marked destination of a move. This
     * is usually shown with a marker or other indicator on the square.
     */
    get markedTarget() {
        return this._markedTarget;
    }
    set markedTarget(value) {
        this._markedTarget = value;
        this._contentElement.classList.toggle("marked-target", value);
    }
    /**
     * Rendered width of element (in integer), used in making drag threshold calculations.
     */
    get width() {
        return this._contentElement.clientWidth;
    }
    /**
     * Get explicit position of primary piece, if set.
     */
    get explicitPiecePosition() {
        return this._boardPiece?.explicitPosition;
    }
    /**
     * Focus element associated with square.
     */
    focus() {
        this._contentElement.focus();
    }
    /**
     * Blur element associated with square.
     */
    blur() {
        this._contentElement.blur();
    }
    /**
     * Return BoardPiece on this square, if it exists.
     */
    get boardPiece() {
        return this._boardPiece;
    }
    /**
     * Set primary piece associated with the square. This piece is rendered either
     * directly onto the square (default) or optionally, animating in from an
     * explicit position `animateFromPosition`.
     *
     * If the piece being set is the same as the one already present on the
     * square, and the new piece is not animating in from anywhere, this will
     * be a no-op since the position of the two pieces would otherwise be exactly
     * the same.
     */
    setPiece(piece, moveable, animation) {
        if (!pieceEqual(this._boardPiece?.piece, piece) || animation) {
            this.clearPiece(animation?.durationMs);
            this._boardPiece = new BoardPiece(this._contentElement, {
                piece,
                animation,
            });
            this.moveable = moveable;
            this._updateSquareAfterPieceChange();
        }
    }
    clearPiece(animationDurationMs) {
        if (this._boardPiece !== undefined) {
            this.moveable = false;
            this._boardPiece.remove(animationDurationMs);
            this._boardPiece = undefined;
            this._updateSquareAfterPieceChange();
        }
    }
    /**
     * Optionally, squares may have a secondary piece, such as a ghost piece shown
     * while dragging. The secondary piece is always shown *behind* the primary
     * piece in the DOM.
     */
    toggleSecondaryPiece(show) {
        if (show && !this._secondaryBoardPiece && this._boardPiece) {
            this._secondaryBoardPiece = new BoardPiece(this._contentElement, {
                piece: this._boardPiece.piece,
                secondary: true,
            });
        }
        if (!show) {
            if (this._secondaryBoardPiece !== undefined) {
                this._secondaryBoardPiece.remove();
            }
            this._secondaryBoardPiece = undefined;
        }
    }
    /**
     * Mark this square as being interacted with.
     */
    startInteraction() {
        if (this._boardPiece !== undefined && this.moveable) {
            this._moveState = "move-start";
            this._updateMoveStateVisuals();
            this._updateLabelVisuals();
            this._boardPiece.finishAnimations();
        }
    }
    /**
     * Set piece to explicit pixel location. Ignore if square has no piece.
     */
    displacePiece(x, y) {
        this._boardPiece?.setExplicitPosition({ type: "coordinates", x, y });
    }
    /**
     * Set piece back to original location. Ignore if square has no piece.
     */
    resetPiecePosition(animateDurationMs) {
        this._boardPiece?.resetPosition(animateDurationMs);
    }
    /**
     * Cancel ongoing interaction and reset position.
     */
    cancelInteraction(animateDurationMs) {
        this._moveState = undefined;
        this._updateMoveStateVisuals();
        this._updateLabelVisuals();
        this.resetPiecePosition(animateDurationMs);
    }
    _updateLabelVisuals() {
        this._contentElement.dataset.square = this.label;
        this._contentElement.dataset.squareColor = getSquareColor(this.label);
        const labelParts = [
            this._boardPiece
                ? `${this.label}, ${this._boardPiece.piece.color} ${this._boardPiece.piece.pieceType}`
                : `${this.label}`,
        ];
        if (this._moveState === "move-start") {
            labelParts.push("start of move");
        }
        if (this._moveState === "move-target") {
            labelParts.push("target square");
        }
        this._contentElement.setAttribute("aria-label", labelParts.join(", "));
        this._slotElement.name = this.label;
    }
    _updateTabIndex() {
        if (this.interactive) {
            this._contentElement.tabIndex = this.tabbable ? 0 : -1;
        }
        else {
            this._contentElement.removeAttribute("tabindex");
        }
    }
    _updateMoveStateVisuals() {
        this._updateInteractiveCssClass("moveable", this.moveable && !this._moveState);
        this._updateInteractiveCssClass("move-start", this._moveState === "move-start");
        this._updateInteractiveCssClass("move-target", this._moveState === "move-target");
        this._contentElement.setAttribute("aria-disabled", (!this._moveState && !this.moveable).toString());
    }
    _updateInteractiveCssClass(name, value) {
        this._contentElement.classList.toggle(name, this.interactive && value);
    }
    _updateSquareAfterPieceChange() {
        this._contentElement.classList.toggle("has-piece", !!this._boardPiece);
        // Always cancel ongoing interactions when piece changes
        this._moveState = undefined;
        this._updateMoveStateVisuals();
        // Ensure secondary piece is toggled off if piece is changed
        this.toggleSecondaryPiece(false);
        // Update label
        this._updateLabelVisuals();
    }
}

class Board {
    /**
     * Creates a set of elements representing chessboard squares, as well
     * as managing and displaying pieces rendered on the squares.
     */
    constructor(initValues, dispatchEvent, shadowRef) {
        Object.defineProperty(this, "_table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_boardSquares", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_dispatchEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_shadowRef", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_orientation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_turn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_interactive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_position", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_boardState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_tabbableSquare", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_defaultTabbableSquare", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Certain move "finishing" logic is included in `pointerup` (e.g. drags). To
         * prevent re-handling this in the `click` handler, we prevent handling of click
         * events for a certain period after pointerup.
         */
        Object.defineProperty(this, "_preventClickHandling", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Event handlers
        Object.defineProperty(this, "_pointerDownHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_pointerUpHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_pointerMoveHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_clickHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_focusInHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_keyDownHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * Duration (in milliseconds) for all animations.
         */
        Object.defineProperty(this, "animationDurationMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_slotChangeHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                if (Board._isSlotElement(e.target) && keyIsSquare(e.target.name)) {
                    this._getBoardSquare(e.target.name).hasContent =
                        e.target.assignedElements().length > 0;
                }
            }
        });
        Object.defineProperty(this, "_transitionHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                // Delete transition-property style at the end of all transitions
                if (e.target && e.target.style !== undefined) {
                    const style = e.target.style;
                    style.removeProperty("transition-property");
                }
            }
        });
        this._boardSquares = new Array(64);
        this._orientation = initValues.orientation;
        this.animationDurationMs = initValues.animationDurationMs;
        this._interactive = false;
        this._position = {};
        this._boardState = { id: "default" };
        this._dispatchEvent = dispatchEvent;
        this._shadowRef = shadowRef;
        // Bottom left corner
        this._defaultTabbableSquare = getSquare(56, initValues.orientation);
        this._table = makeHTMLElement("table", {
            attributes: {
                role: "table",
                "aria-label": "Chess board",
            },
            classes: ["board"],
        });
        for (let i = 0; i < 8; i++) {
            const row = makeHTMLElement("tr", {
                attributes: { role: "row" },
            });
            for (let j = 0; j < 8; j++) {
                const idx = 8 * i + j;
                const square = getSquare(idx, this.orientation);
                this._boardSquares[idx] = new BoardSquare(row, square);
            }
            this._table.appendChild(row);
        }
        this._getBoardSquare(this._defaultTabbableSquare).tabbable = true;
        this._pointerDownHandler = this._makeEventHandler(this._handlePointerDown);
        this._pointerUpHandler = this._makeEventHandler(this._handlePointerUp);
        this._pointerMoveHandler = this._makeEventHandler(this._handlePointerMove);
        this._clickHandler = this._makeEventHandler(this._handleClick);
        this._keyDownHandler = this._makeEventHandler(this._handleKeyDown);
        this._focusInHandler = this._makeEventHandler(this._handleFocusIn);
        this._table.addEventListener("pointerdown", this._pointerDownHandler);
        this._table.addEventListener("click", this._clickHandler);
        this._table.addEventListener("focusin", this._focusInHandler);
        this._table.addEventListener("keydown", this._keyDownHandler);
        this._table.addEventListener("slotchange", this._slotChangeHandler);
        this._table.addEventListener("transitionend", this._transitionHandler);
        this._table.addEventListener("transitioncancel", this._transitionHandler);
    }
    /**
     * Add event listeners that operate outside shadow DOM (pointer up and move).
     * These listeners should be unbound when the element is removed from the DOM.
     */
    addGlobalListeners() {
        document.addEventListener("pointerup", this._pointerUpHandler);
        document.addEventListener("pointermove", this._pointerMoveHandler);
    }
    /**
     * Removes global listeners for pointer up and move.
     */
    removeGlobalListeners() {
        document.removeEventListener("pointerup", this._pointerUpHandler);
        document.removeEventListener("pointermove", this._pointerMoveHandler);
    }
    /**
     * HTML element associated with board.
     */
    get element() {
        return this._table;
    }
    /**
     * What side's perspective to render squares from (what color appears on
     * the bottom as viewed on the screen).
     */
    get orientation() {
        return this._orientation;
    }
    set orientation(value) {
        this._cancelMove(false);
        this._orientation = value;
        this._refreshDefaultTabbableSquare();
        for (let i = 0; i < 64; i++) {
            const square = getSquare(i, value);
            const piece = this._position[square];
            this._boardSquares[i].label = square;
            this._boardSquares[i].tabbable = this.tabbableSquare === square;
            if (piece) {
                this._boardSquares[i].setPiece(piece, this._pieceMoveable(piece));
            }
            else {
                this._boardSquares[i].clearPiece();
            }
        }
        // Switch focused square, if any, on orientation change
        if (this._focusedSquare) {
            this._focusTabbableSquare();
        }
    }
    /**
     * Whether the grid is interactive. This determines the roles and attributes,
     * like tabindex, associated with the grid.
     */
    get interactive() {
        return this._interactive;
    }
    set interactive(value) {
        this._cancelMove(false);
        this._interactive = value;
        this._blurTabbableSquare();
        this._table.setAttribute("role", value ? "grid" : "table");
        this._boardSquares.forEach((s) => {
            s.interactive = value;
        });
        this._resetBoardStateAndMoves();
    }
    get turn() {
        return this._turn;
    }
    /**
     * What side is allowed to move pieces. This may be undefined, in which
     * pieces from either side can be moved around.
     */
    set turn(value) {
        this._cancelMove(false);
        this._turn = value;
        for (let idx = 0; idx < 64; idx++) {
            const square = getSquare(idx, this.orientation);
            const piece = this._position[square];
            this._boardSquares[idx].moveable = !piece || this._pieceMoveable(piece);
        }
    }
    /**
     * Current `Position` object of board.
     */
    get position() {
        return this._position;
    }
    set position(value) {
        if (!positionsEqual(this._position, value)) {
            this._cancelMove(false);
            const diff = calcPositionDiff(this._position, value);
            this._position = { ...value };
            diff.moved.forEach(({ oldSquare }) => {
                // Remove all copies of moved piece from starting squares, without animation
                this._getBoardSquare(oldSquare).clearPiece();
            });
            diff.removed.forEach(({ square }) => {
                this._getBoardSquare(square).clearPiece(this.animationDurationMs);
            });
            diff.moved.forEach(({ piece, oldSquare, newSquare }) => {
                // Render moved piece at location of old square, and animate in to new square
                const startingPosition = this._getStartingPositionForMove(oldSquare, newSquare);
                this._getBoardSquare(newSquare).setPiece(piece, this._pieceMoveable(piece), {
                    type: "slide-in",
                    from: startingPosition,
                    durationMs: this.animationDurationMs,
                });
            });
            diff.added.forEach(({ piece, square }) => {
                this._getBoardSquare(square).setPiece(piece, this._pieceMoveable(piece), {
                    type: "fade-in",
                    durationMs: this.animationDurationMs,
                });
            });
            // Default tabbable square might change with position change
            this._refreshDefaultTabbableSquare();
        }
    }
    /**
     * Square that is considered "tabbable", if any. Keyboard navigation
     * on the board uses a roving tabindex, which means that only one square is
     * "tabbable" at a time (the rest are navigable using up and down keys on
     * the keyboard).
     */
    get tabbableSquare() {
        return this._tabbableSquare || this._defaultTabbableSquare;
    }
    set tabbableSquare(value) {
        if (this.tabbableSquare !== value) {
            // Unset previous tabbable square so that tabindex is changed to -1
            this._getBoardSquare(this.tabbableSquare).tabbable = false;
            this._getBoardSquare(value).tabbable = true;
            this._tabbableSquare = value;
        }
    }
    /**
     * Start a move on the board at `square`, optionally with specified targets
     * at `targetSquares`.
     */
    startMove(square, targetSquares) {
        if (this._interactable(square)) {
            this._setBoardState({
                id: "awaiting-second-touch",
                startSquare: square,
            });
            this._startInteraction(square, targetSquares);
        }
    }
    /**
     * Cancels in-progress moves, if any.
     */
    cancelMove() {
        this._cancelMove(false);
    }
    get _focusedSquare() {
        return Board._extractSquareData(this._shadowRef.activeElement);
    }
    _startInteraction(square, forceTargetSquares) {
        const piece = this._position[square];
        if (piece) {
            let targetsLimited = false;
            const targetSquares = [];
            if (forceTargetSquares !== undefined) {
                targetsLimited = true;
                forceTargetSquares.forEach((s) => {
                    if (keyIsSquare(s)) {
                        targetSquares.push(s);
                    }
                });
            }
            else {
                this._dispatchEvent(new CustomEvent("movestart", {
                    bubbles: true,
                    detail: {
                        from: square,
                        piece,
                        setTargets: (squares) => {
                            targetsLimited = true;
                            for (const s of squares) {
                                if (keyIsSquare(s)) {
                                    targetSquares.push(s);
                                }
                            }
                        },
                    },
                }));
            }
            this._getBoardSquare(square).startInteraction();
            this.tabbableSquare = square;
            this._boardSquares.forEach((s) => {
                if (s.label !== square) {
                    s.moveTarget = !targetsLimited || targetSquares.includes(s.label);
                    s.markedTarget = targetsLimited && s.moveTarget;
                }
            });
        }
    }
    _finishMove(to, animate) {
        if (this._boardState.startSquare) {
            const from = this._boardState.startSquare;
            const piece = this._position[from];
            if (piece !== undefined) {
                const endEvent = new CustomEvent("moveend", {
                    bubbles: true,
                    cancelable: true,
                    detail: { from, to, piece },
                });
                this._dispatchEvent(endEvent);
                if (endEvent.defaultPrevented) {
                    return false;
                }
                const startingPosition = this._getStartingPositionForMove(from, to);
                this._getBoardSquare(from).clearPiece();
                this._getBoardSquare(to).setPiece(piece, this._pieceMoveable(piece), 
                // Animate transition only when piece is displaced to a specific location
                animate
                    ? {
                        type: "slide-in",
                        from: startingPosition,
                        durationMs: this.animationDurationMs,
                    }
                    : undefined);
                // Tabbable square always updates to target square
                this.tabbableSquare = to;
                this._position[to] = this._position[from];
                delete this._position[from];
                const finishedEvent = new CustomEvent("movefinished", {
                    bubbles: true,
                    detail: { from, to, piece },
                });
                if (animate) {
                    this._getBoardSquare(to).boardPiece?.animationFinished?.then(() => {
                        this._dispatchEvent(finishedEvent);
                    });
                }
                else {
                    this._dispatchEvent(finishedEvent);
                }
            }
            this._resetBoardStateAndMoves();
            return true;
        }
        return false;
    }
    _userCancelMove(animate) {
        if (this._boardState.startSquare) {
            const e = new CustomEvent("movecancel", {
                bubbles: true,
                cancelable: true,
                detail: {
                    from: this._boardState.startSquare,
                    piece: this._position[this._boardState.startSquare],
                },
            });
            this._dispatchEvent(e);
            if (!e.defaultPrevented) {
                this._cancelMove(animate);
                return true;
            }
        }
        return false;
    }
    _cancelMove(animate) {
        if (this._boardState.startSquare) {
            const square = this._getBoardSquare(this._boardState.startSquare);
            square.cancelInteraction(animate ? this.animationDurationMs : undefined);
        }
        this._resetBoardStateAndMoves();
    }
    _focusTabbableSquare() {
        if (this.tabbableSquare) {
            this._getBoardSquare(this.tabbableSquare).focus();
        }
    }
    _blurTabbableSquare() {
        if (this.tabbableSquare) {
            this._getBoardSquare(this.tabbableSquare).blur();
        }
    }
    _resetBoardStateAndMoves() {
        this._boardSquares.forEach((s) => {
            s.removeMoveState();
            s.markedTarget = false;
        });
        this._setBoardState({
            id: this.interactive ? "awaiting-input" : "default",
        });
    }
    _pieceMoveable(piece) {
        return !this.turn || piece.color === this.turn;
    }
    _interactable(square) {
        const piece = this._position[square];
        return !!piece && this._pieceMoveable(piece);
    }
    _isValidMove(from, to) {
        return from !== to && this._getBoardSquare(to).moveTarget;
    }
    _getBoardSquare(square) {
        return this._boardSquares[getVisualIndex(square, this.orientation)];
    }
    /**
     * Compute an explicit position to apply to a piece that is being moved
     * from `from` to `to`. This can either be the explicit piece position,
     * if already set, for that piece, or it is computed as the offset or
     * difference in rows and columns between the two squares.
     */
    _getStartingPositionForMove(from, to) {
        const [fromRow, fromCol] = getVisualRowColumn(from, this.orientation);
        const [toRow, toCol] = getVisualRowColumn(to, this.orientation);
        return (this._getBoardSquare(from).explicitPiecePosition || {
            type: "squareOffset",
            deltaRows: fromRow - toRow,
            deltaCols: fromCol - toCol,
        });
    }
    /**
     * When no tabbable square has been explicitly set (usually, when user has
     * not yet tabbed into or interacted with the board, we want to calculate
     * the tabbable square dynamically. It is either:
     * - the first occupied square from the player's orientation (i.e. from
     *   bottom left of board), or
     * - the bottom left square of the board.
     */
    _refreshDefaultTabbableSquare() {
        const oldDefaultSquare = this._defaultTabbableSquare;
        let pieceFound = false;
        if (Object.keys(this._position).length > 0) {
            for (let row = 7; row >= 0 && !pieceFound; row--) {
                for (let col = 0; col <= 7 && !pieceFound; col++) {
                    const square = getSquare(8 * row + col, this.orientation);
                    if (this._position[square]) {
                        this._defaultTabbableSquare = square;
                        pieceFound = true;
                    }
                }
            }
        }
        if (!pieceFound) {
            this._defaultTabbableSquare = getSquare(56, this.orientation);
        }
        // If tabbable square is set to default and has changed, then
        // update the two squares accordingly.
        if (this._tabbableSquare === undefined &&
            oldDefaultSquare !== this._defaultTabbableSquare) {
            this._getBoardSquare(oldDefaultSquare).tabbable = false;
            this._getBoardSquare(this._defaultTabbableSquare).tabbable = true;
        }
    }
    _setBoardState(state) {
        const oldState = this._boardState;
        this._boardState = state;
        if (this._boardState.id !== oldState.id) {
            this._table.classList.toggle("dragging", this._isDragState());
        }
        if (this._boardState.highlightedSquare !== oldState.highlightedSquare) {
            if (oldState.highlightedSquare) {
                this._getBoardSquare(oldState.highlightedSquare).hover = false;
            }
            if (this._boardState.highlightedSquare) {
                this._getBoardSquare(this._boardState.highlightedSquare).hover = true;
            }
        }
    }
    _handlePointerDown(square, e) {
        // We will control focus entirely ourselves
        e.preventDefault();
        // Primary clicks only
        if (e.button !== 0) {
            return;
        }
        switch (this._boardState.id) {
            case "awaiting-input":
                if (square && this._interactable(square)) {
                    this._setBoardState({
                        id: "touching-first-square",
                        startSquare: square,
                        touchStartX: e.clientX,
                        touchStartY: e.clientY,
                    });
                    this._startInteraction(square);
                    this._getBoardSquare(square).toggleSecondaryPiece(true);
                }
                break;
            case "awaiting-second-touch":
            case "moving-piece-kb":
                if (this._boardState.startSquare === square) {
                    // Second pointerdown on the same square *may* be a cancel, but could
                    // also be a misclick/readjustment in order to begin dragging. Wait
                    // till corresponding pointerup event in order to cancel.
                    this._setBoardState({
                        id: "canceling-second-touch",
                        startSquare: square,
                        touchStartX: e.clientX,
                        touchStartY: e.clientY,
                    });
                    // Show secondary piece while pointer is down
                    this._getBoardSquare(square).toggleSecondaryPiece(true);
                }
                else if (square) {
                    this._setBoardState({
                        id: "touching-second-square",
                        startSquare: this._boardState.startSquare,
                    });
                }
                break;
            case "dragging":
            case "dragging-outside":
            case "canceling-second-touch":
            case "touching-first-square":
            case "touching-second-square":
                // Noop: pointer is already down while dragging or touching square
                break;
            case "default":
                break;
            // istanbul ignore next
            default:
                assertUnreachable(this._boardState);
        }
    }
    _handlePointerUp(square) {
        let newFocusedSquare = square;
        switch (this._boardState.id) {
            case "touching-first-square":
                this._getBoardSquare(this._boardState.startSquare).toggleSecondaryPiece(false);
                this._setBoardState({
                    id: "awaiting-second-touch",
                    startSquare: this._boardState.startSquare,
                });
                newFocusedSquare = this._boardState.startSquare;
                break;
            case "canceling-second-touch":
                // User cancels by clicking on the same square.
                if (!this._userCancelMove(false)) {
                    this._setBoardState({
                        id: "awaiting-second-touch",
                        startSquare: this._boardState.startSquare,
                    });
                }
                newFocusedSquare = this._boardState.startSquare;
                break;
            case "dragging":
            case "dragging-outside":
            case "touching-second-square":
                {
                    this._getBoardSquare(this._boardState.startSquare).toggleSecondaryPiece(false);
                    let done = false;
                    if (square &&
                        this._isValidMove(this._boardState.startSquare, square)) {
                        done = this._finishMove(square, !this._isDragState());
                        if (!done) {
                            newFocusedSquare = this._boardState.startSquare;
                        }
                    }
                    else {
                        newFocusedSquare = this._boardState.startSquare;
                        done = this._userCancelMove(square !== this._boardState.startSquare);
                    }
                    if (!done) {
                        this._setBoardState({
                            id: "awaiting-second-touch",
                            startSquare: this._boardState.startSquare,
                        });
                        this._getBoardSquare(this._boardState.startSquare).resetPiecePosition(this.animationDurationMs);
                    }
                }
                break;
            case "awaiting-input":
            case "moving-piece-kb":
            case "awaiting-second-touch":
                // noop: Either we are in a non-mouse state or we are delegating to click
                break;
            case "default":
                break;
            // istanbul ignore next
            default:
                assertUnreachable(this._boardState);
        }
        // If board currently has focus, move focus to newly clicked square.
        if (this._focusedSquare && newFocusedSquare) {
            this.tabbableSquare = newFocusedSquare;
            this._focusTabbableSquare();
        }
        // Prevent click handling for a certain duration
        this._preventClickHandling = true;
        setTimeout(() => {
            this._preventClickHandling = false;
        }, Board.POINTERUP_CLICK_PREVENT_DURATION_MS);
    }
    _handlePointerMove(square, e) {
        switch (this._boardState.id) {
            case "canceling-second-touch":
            case "touching-first-square":
                {
                    const delta = Math.sqrt((e.clientX - this._boardState.touchStartX) ** 2 +
                        (e.clientY - this._boardState.touchStartY) ** 2);
                    const squareWidth = this._getBoardSquare(this._boardState.startSquare).width;
                    const threshold = Math.max(Board.DRAG_THRESHOLD_MIN_PIXELS, Board.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION * squareWidth);
                    // Consider a "dragging" action to be when we have moved the pointer a sufficient
                    // threshold, or we are now in a different square from where we started.
                    if (delta > threshold || square !== this._boardState.startSquare) {
                        this._getBoardSquare(this._boardState.startSquare).displacePiece(e.clientX, e.clientY);
                        if (square) {
                            this._setBoardState({
                                id: "dragging",
                                startSquare: this._boardState.startSquare,
                                highlightedSquare: this._isValidMove(this._boardState.startSquare, square)
                                    ? square
                                    : undefined,
                            });
                        }
                        else {
                            this._setBoardState({
                                id: "dragging-outside",
                                startSquare: this._boardState.startSquare,
                            });
                        }
                    }
                }
                break;
            case "dragging":
            case "dragging-outside":
                this._getBoardSquare(this._boardState.startSquare).displacePiece(e.clientX, e.clientY);
                if (square && square !== this._boardState.highlightedSquare) {
                    this._setBoardState({
                        id: "dragging",
                        startSquare: this._boardState.startSquare,
                        highlightedSquare: this._isValidMove(this._boardState.startSquare, square)
                            ? square
                            : undefined,
                    });
                }
                else if (!square && this._boardState.id !== "dragging-outside") {
                    this._setBoardState({
                        id: "dragging-outside",
                        startSquare: this._boardState.startSquare,
                    });
                }
                break;
            case "awaiting-input":
            case "awaiting-second-touch":
            case "default":
            case "moving-piece-kb":
            case "touching-second-square":
                break;
            // istanbul ignore next
            default:
                assertUnreachable(this._boardState);
        }
    }
    _handleClick(square) {
        if (this._preventClickHandling) {
            return;
        }
        switch (this._boardState.id) {
            case "awaiting-input":
                if (square && this._interactable(square)) {
                    this._setBoardState({
                        id: "awaiting-second-touch",
                        startSquare: square,
                    });
                    this._startInteraction(square);
                }
                break;
            case "awaiting-second-touch":
            case "moving-piece-kb":
                {
                    const done = square && this._isValidMove(this._boardState.startSquare, square)
                        ? this._finishMove(square, true)
                        : this._userCancelMove(square !== this._boardState.startSquare);
                    if (!done) {
                        this._setBoardState({
                            id: "awaiting-second-touch",
                            startSquare: this._boardState.startSquare,
                        });
                        this._getBoardSquare(this._boardState.startSquare).resetPiecePosition(this.animationDurationMs);
                    }
                }
                break;
            case "touching-first-square":
            case "touching-second-square":
            case "canceling-second-touch":
            case "dragging":
            case "dragging-outside":
            case "default":
                break;
            // istanbul ignore next
            default:
                assertUnreachable(this._boardState);
        }
        // If board currently has focus, move focus to newly clicked square.
        if (this._focusedSquare && square) {
            this.tabbableSquare = square;
            this._focusTabbableSquare();
        }
    }
    _handleFocusIn(square) {
        if (square) {
            if (
            // Some browsers (Safari) focus on board squares that are not tabbable
            // (tabindex = -1). If that happens, update tabbable square manually.
            square !== this.tabbableSquare ||
                // Assign tabbable square if none is explicitly assigned yet.
                this._tabbableSquare === undefined) {
                this.tabbableSquare = square;
            }
        }
    }
    _handleKeyDown(square, e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            switch (this._boardState.id) {
                case "awaiting-input":
                    if (square && this._interactable(square)) {
                        this._setBoardState({
                            id: "moving-piece-kb",
                            startSquare: square,
                            highlightedSquare: undefined,
                        });
                        this._startInteraction(square);
                    }
                    break;
                case "moving-piece-kb":
                case "awaiting-second-touch":
                    // Only move if enter was inside squares area and if start
                    // and end square are not the same.
                    if (square &&
                        this._isValidMove(this._boardState.startSquare, square)) {
                        this._finishMove(square, true);
                    }
                    else {
                        this._userCancelMove(false);
                    }
                    break;
                case "dragging":
                case "dragging-outside":
                case "touching-first-square":
                case "touching-second-square":
                case "canceling-second-touch":
                    // Noop: don't handle keypresses in active pointer states
                    break;
                case "default":
                    break;
                // istanbul ignore next
                default:
                    assertUnreachable(this._boardState);
            }
        }
        else {
            const currentIdx = getVisualIndex(this.tabbableSquare, this.orientation);
            const currentRow = currentIdx >> 3;
            const currentCol = currentIdx & 0x7;
            let newIdx = currentIdx;
            let keyHandled = false;
            switch (e.key) {
                case "ArrowRight":
                case "Right":
                    newIdx = 8 * currentRow + Math.min(7, currentCol + 1);
                    keyHandled = true;
                    break;
                case "ArrowLeft":
                case "Left":
                    newIdx = 8 * currentRow + Math.max(0, currentCol - 1);
                    keyHandled = true;
                    break;
                case "ArrowDown":
                case "Down":
                    newIdx = 8 * Math.min(7, currentRow + 1) + currentCol;
                    keyHandled = true;
                    break;
                case "ArrowUp":
                case "Up":
                    newIdx = 8 * Math.max(0, currentRow - 1) + currentCol;
                    keyHandled = true;
                    break;
                case "Home":
                    newIdx = e.ctrlKey ? 0 : 8 * currentRow;
                    keyHandled = true;
                    break;
                case "End":
                    newIdx = e.ctrlKey ? 63 : 8 * currentRow + 7;
                    keyHandled = true;
                    break;
                case "PageUp":
                    newIdx = currentCol;
                    keyHandled = true;
                    break;
                case "PageDown":
                    newIdx = 56 + currentCol;
                    keyHandled = true;
                    break;
            }
            if (keyHandled) {
                // Prevent native browser scrolling via any of the
                // navigation keys since the focus below will auto-scroll
                e.preventDefault();
            }
            if (newIdx !== currentIdx) {
                this.tabbableSquare = getSquare(newIdx, this.orientation);
                this._focusTabbableSquare();
                // If we are currently in a non-keyboard friendly state, we should
                // still transition to one since we started keyboard navigation.
                switch (this._boardState.id) {
                    case "moving-piece-kb":
                    case "awaiting-second-touch":
                        this._setBoardState({
                            id: "moving-piece-kb",
                            startSquare: this._boardState.startSquare,
                            highlightedSquare: this._boardState.startSquare !== this.tabbableSquare
                                ? this._tabbableSquare
                                : undefined,
                        });
                        break;
                    case "awaiting-input":
                    case "touching-first-square":
                    case "touching-second-square":
                    case "canceling-second-touch":
                    case "dragging":
                    case "dragging-outside":
                        break;
                    case "default":
                        break;
                    // istanbul ignore next
                    default:
                        assertUnreachable(this._boardState);
                }
            }
        }
    }
    /**
     * Convenience wrapper to make pointer, blur, or keyboard event handler for
     * square elements. Attempts to extract square label from the element in
     * question, then passes square label and current event to `callback`.
     */
    _makeEventHandler(callback) {
        const boundCallback = callback.bind(this);
        return (e) => {
            // For mouse events, use client X and Y location to find target reliably.
            const square = Board._isMouseEvent(e)
                ? this._shadowRef
                    .elementsFromPoint(e.clientX, e.clientY)
                    .map((e) => Board._extractSquareData(e))
                    .find((e) => !!e)
                : Board._extractSquareData(e.target);
            boundCallback(square, e);
        };
    }
    _isDragState() {
        return ["dragging", "dragging-outside"].includes(this._boardState.id);
    }
    static _extractSquareData(target) {
        if (!!target && !!target.dataset) {
            const dataset = target.dataset;
            return keyIsSquare(dataset.square) ? dataset.square : undefined;
        }
        return undefined;
    }
    static _isMouseEvent(e) {
        return e.clientX !== undefined;
    }
    static _isSlotElement(e) {
        return !!e && e.assignedElements !== undefined;
    }
}
/**
 * Fraction of square width that pointer must be moved to be
 * considered a "drag" action.
 */
Object.defineProperty(Board, "DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 0.1
});
/**
 * Minimum number of pixels to enable dragging.
 */
Object.defineProperty(Board, "DRAG_THRESHOLD_MIN_PIXELS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 2
});
/**
 * Amount of time (in ms) to suppress click handling after a pointerup event.
 */
Object.defineProperty(Board, "POINTERUP_CLICK_PREVENT_DURATION_MS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 250
});

var css_248z = ":host{--square-color-dark:#4c946a;--square-color-light:#e0ddcc;--square-color-dark-hover:#1cc45f;--square-color-light-hover:#fde968;--square-color-dark-active:#19c257;--square-color-light-active:#fadd4c;--outline-color-dark-active:rgba(33,237,94,.95);--outline-color-light-active:hsla(66,97%,72%,.95);--outline-color-focus:rgba(248,140,32,.9);--outline-blur-radius:3px;--outline-spread-radius:4px;--coords-font-size:0.7rem;--coords-font-family:sans-serif;--outer-gutter-width:4%;--inner-border-width:1px;--coords-inside-coord-padding-left:0.5%;--coords-inside-coord-padding-right:0.5%;--move-target-marker-color-dark-square:rgba(8,38,20,.9);--move-target-marker-color-light-square:rgba(8,38,20,.9);--move-target-marker-radius:24%;--move-target-marker-radius-occupied:82%;--ghost-piece-opacity:0.35;--piece-drag-z-index:9999;--piece-padding:3%;--arrow-color-primary:rgba(255,170,0,.8);--arrow-color-secondary:rgba(248,85,63,.8);display:block}:host([hidden]){display:none}.board{border:var(--inner-border-width) solid var(--inner-border-color,var(--square-color-dark));border-collapse:collapse;box-sizing:border-box;table-layout:fixed;touch-action:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;width:100%}.board>tr>td{padding:12.5% 0 0;position:relative}[data-square]{background-color:var(--p-square-color);bottom:0;color:var(--p-label-color);font-family:var(--coords-font-family);font-size:var(--coords-font-size);height:100%;left:0;position:absolute;right:0;top:0;width:100%}[data-square]:focus{box-shadow:inset 0 0 var(--outline-blur-radius) var(--outline-spread-radius) var(--outline-color-focus);outline:none}[data-square].marked-target{background:radial-gradient(var(--p-move-target-marker-color) var(--move-target-marker-radius),var(--p-square-color) calc(var(--move-target-marker-radius) + 1px))}[data-square].has-content.marked-target,[data-square].has-piece.marked-target{background:radial-gradient(var(--p-square-color) var(--move-target-marker-radius-occupied),var(--p-move-target-marker-color) calc(var(--move-target-marker-radius-occupied) + 1px))}[data-square].move-start{--p-square-color:var(--p-square-color-active)}[data-square].move-start:not(:focus){box-shadow:inset 0 0 var(--outline-blur-radius) var(--outline-spread-radius) var(--p-outline-color-active)}@media (hover:hover){[data-square]:is(.moveable,.move-target):hover{--p-square-color:var(--p-square-color-hover)}}[data-square].hover{--p-square-color:var(--p-square-color-hover)}table:not(.dragging) [data-square]:is(.moveable,.move-start,.move-target){cursor:pointer}table.dragging{cursor:-webkit-grab;cursor:grab}.wrapper{position:relative}.coords{display:none;font-family:var(--coords-font-family);font-size:var(--coords-font-size);pointer-events:none;position:absolute;touch-action:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.coord{box-sizing:border-box;display:flex}.coords.file>.coord{width:12.5%}.coords.rank{flex-direction:column}.coords.rank>.coord{height:12.5%}.wrapper.outside{background-color:var(--square-color-light);padding:var(--outer-gutter-width)}.wrapper.outside>.coords{color:var(--square-color-dark);display:flex}.wrapper.outside>.coords>.coord{align-items:center;justify-content:center}.wrapper.outside>.coords.file{bottom:0;height:var(--outer-gutter-width);left:var(--outer-gutter-width);right:var(--outer-gutter-width);width:calc(100% - var(--outer-gutter-width)*2)}.wrapper.outside>.coords.rank{bottom:var(--outer-gutter-width);height:calc(100% - var(--outer-gutter-width)*2);left:0;top:var(--outer-gutter-width);width:var(--outer-gutter-width)}.wrapper.inside>.coords{bottom:0;display:flex;height:100%;left:0;right:0;top:0;width:100%}.wrapper.inside>.coords>.coord.light{color:var(--square-color-dark)}.wrapper.inside>.coords>.coord.dark{color:var(--square-color-light)}.wrapper.inside>.coords.file>.coord{align-items:flex-end;justify-content:flex-end;padding-right:var(--coords-inside-coord-padding-right)}.wrapper.inside>.coords.rank>.coord{padding-left:var(--coords-inside-coord-padding-left)}[data-square-color=dark]{--p-square-color:var(--square-color-dark);--p-label-color:var(--square-color-light);--p-square-color-hover:var(--square-color-dark-hover);--p-move-target-marker-color:var(--move-target-marker-color-dark-square);--p-square-color-active:var(--square-color-dark-active);--p-outline-color-active:var(--outline-color-dark-active)}[data-square-color=light]{--p-square-color:var(--square-color-light);--p-label-color:var(--square-color-dark);--p-square-color-hover:var(--square-color-light-hover);--p-move-target-marker-color:var(--move-target-marker-color-light-square);--p-square-color-active:var(--square-color-light-active);--p-outline-color-active:var(--outline-color-light-active)}[data-square] .piece,[data-square] .slot{bottom:0;height:100%;left:0;pointer-events:none;position:absolute;right:0;top:0;width:100%}[data-square] .piece{background-origin:content-box;background-repeat:no-repeat;background-size:cover;box-sizing:border-box;padding:var(--piece-padding);z-index:10}[data-square] .piece.moving{z-index:15}[data-square] .piece.secondary{opacity:var(--ghost-piece-opacity);z-index:5}[data-square].move-start .piece:not(.secondary){z-index:var(--piece-drag-z-index)}.bb{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cg style='fill:%23000;stroke:%23000;stroke-linecap:butt'%3E%3Cpath d='M9 36.6c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3E%3Cpath d='M15 32.6c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3E%3Cpath d='M25 8.6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3E%3C/g%3E%3Cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' style='fill:none;stroke:%23fff;stroke-linejoin:miter' transform='translate(0 .6)'/%3E%3C/g%3E%3C/svg%3E\")}.bk{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cpath d='M22.5 11.63V6' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3E%3Cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' style='fill:%23000;fill-opacity:1;stroke-linecap:butt;stroke-linejoin:miter'/%3E%3Cpath d='M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7' style='fill:%23000;stroke:%23000'/%3E%3Cpath d='M20 8h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3E%3Cpath d='M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5v2.1-2.1C20 18 10.85 14 6.97 19.85 4.5 25.5 13 29.5 13 29.5' style='fill:none;stroke:%23fff'/%3E%3Cpath d='M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0' style='fill:none;stroke:%23fff'/%3E%3C/g%3E%3C/svg%3E\")}.bn{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3E%3Cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3E%3Cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z' style='fill:%23fff;stroke:%23fff' transform='translate(0 .3)'/%3E%3Cpath d='M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z' transform='rotate(30 13.94 15.65)' style='fill:%23fff;stroke:%23fff'/%3E%3Cpath d='m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z' style='fill:%23fff;stroke:none' transform='translate(0 .3)' stroke='none'/%3E%3C/g%3E%3C/svg%3E\")}.bp{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' style='opacity:1;fill:%23000;fill-opacity:1;fill-rule:nonzero;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3E%3C/svg%3E\")}.bq{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='fill:%23000;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round'%3E%3Cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z' style='stroke-linecap:butt;fill:%23000'/%3E%3Cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z'/%3E%3Cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0'/%3E%3Ccircle cx='6' cy='12' r='2'/%3E%3Ccircle cx='14' cy='9' r='2'/%3E%3Ccircle cx='22.5' cy='8' r='2'/%3E%3Ccircle cx='31' cy='9' r='2'/%3E%3Ccircle cx='39' cy='12' r='2'/%3E%3Cpath d='M11 38.5a35 35 1 0 0 23 0' style='fill:none;stroke:%23000;stroke-linecap:butt'/%3E%3Cpath d='M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0' style='fill:none;stroke:%23fff'/%3E%3C/g%3E%3C/svg%3E\")}.br{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='opacity:1;fill:%23000;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cpath d='M9 39h27v-3H9v3zm3.5-7 1.5-2.5h17l1.5 2.5h-20zm-.5 4v-4h21v4H12z' style='stroke-linecap:butt' transform='translate(0 .3)'/%3E%3Cpath d='M14 29.5v-13h17v13H14z' style='stroke-linecap:butt;stroke-linejoin:miter' transform='translate(0 .3)'/%3E%3Cpath d='M14 16.5 11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z' style='stroke-linecap:butt' transform='translate(0 .3)'/%3E%3Cpath d='M12 35.5h21m-20-4h19m-18-2h17m-17-13h17M11 14h23' style='fill:none;stroke:%23fff;stroke-width:1;stroke-linejoin:miter' transform='translate(0 .3)'/%3E%3C/g%3E%3C/svg%3E\")}.wb{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1' transform='translate(0 .6)'%3E%26gt;%3Cg style='fill:%23fff;stroke:%23000;stroke-linecap:butt'%3E%3Cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3E%3Cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3E%3Cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3E%3C/g%3E%3Cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3E%3C/g%3E%3C/svg%3E\")}.wk{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cpath d='M22.5 11.63V6M20 8h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3E%3Cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' style='fill:%23fff;stroke:%23000;stroke-linecap:butt;stroke-linejoin:miter'/%3E%3Cpath d='M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7' style='fill:%23fff;stroke:%23000'/%3E%3Cpath d='M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0' style='fill:none;stroke:%23000'/%3E%3C/g%3E%3C/svg%3E\")}.wn{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' style='fill:%23fff;stroke:%23000' transform='translate(0 .3)'/%3E%3Cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' style='fill:%23fff;stroke:%23000' transform='translate(0 .3)'/%3E%3Cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3E%3Cpath d='M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z' transform='rotate(30 13.94 15.65)' style='fill:%23000;stroke:%23000'/%3E%3C/g%3E%3C/svg%3E\")}.wp{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' style='opacity:1;fill:%23fff;fill-opacity:1;fill-rule:nonzero;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3E%3C/svg%3E\")}.wq{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='fill:%23fff;stroke:%23000;stroke-width:1.5;stroke-linejoin:round'%3E%3Cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z'/%3E%3Cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z'/%3E%3Cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0' style='fill:none'/%3E%3Ccircle cx='6' cy='12' r='2'/%3E%3Ccircle cx='14' cy='9' r='2'/%3E%3Ccircle cx='22.5' cy='8' r='2'/%3E%3Ccircle cx='31' cy='9' r='2'/%3E%3Ccircle cx='39' cy='12' r='2'/%3E%3C/g%3E%3C/svg%3E\")}.wr{background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3E%3Cg style='opacity:1;fill:%23fff;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3E%3Cpath d='M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22V9h4v2h5V9h5v2h5V9h4v5' style='stroke-linecap:butt' transform='translate(0 .3)'/%3E%3Cpath d='m34 14.3-3 3H14l-3-3'/%3E%3Cpath d='M31 17v12.5H14V17' style='stroke-linecap:butt;stroke-linejoin:miter' transform='translate(0 .3)'/%3E%3Cpath d='m31 29.8 1.5 2.5h-20l1.5-2.5'/%3E%3Cpath d='M11 14h23' style='fill:none;stroke:%23000;stroke-linejoin:miter' transform='translate(0 .3)'/%3E%3C/g%3E%3C/svg%3E\")}.arrows{border:var(--inner-border-width) solid transparent;bottom:0;box-sizing:border-box;height:100%;left:0;pointer-events:none;position:absolute;right:0;top:0;touch-action:none;width:100%;z-index:20}.arrow-primary{color:var(--arrow-color-primary)}.arrow-secondary{color:var(--arrow-color-secondary)}";

const COORDINATES_PLACEMENTS = ["inside", "outside", "hidden"];
class Coordinates {
    constructor(props) {
        Object.defineProperty(this, "element", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_coordElements", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_orientation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_direction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
    get orientation() {
        return this._orientation;
    }
    set orientation(value) {
        this._orientation = value;
        this._updateCoordsText();
    }
    _updateCoordsText() {
        for (let i = 0; i < 8; i++) {
            if (this._direction === "file") {
                this._coordElements[i].textContent = String.fromCharCode("a".charCodeAt(0) + (this.orientation === "white" ? i : 7 - i));
            }
            else {
                this._coordElements[i].textContent = `${this.orientation === "white" ? 8 - i : i + 1}`;
            }
        }
    }
}
/**
 * Type guard for string values that need to conform to a
 * `CoordinatesPlacement` definition.
 */
function isCoordinatesPlacement(value) {
    return COORDINATES_PLACEMENTS.includes(value);
}

class Arrows {
    constructor(orientation) {
        Object.defineProperty(this, "element", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_defs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_group", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_orientation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_arrows", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_arrowElements", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "_markerElements", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
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
    set arrows(arrows) {
        const validArrows = arrows?.filter((a) => a.from !== a.to);
        // Update brushes
        const brushes = validArrows
            ? new Set(validArrows.map((a) => Arrows._escapedBrushName(a.brush)))
            : new Set();
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
    set orientation(value) {
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
    _makeArrow(arrow) {
        const strokeWidth = Arrows._getSvgStrokeWidth(arrow.weight || Arrows._DEFAULT_ARROW_WEIGHT);
        const fromRowCol = getVisualRowColumn(arrow.from, this.orientation);
        const toRowCol = getVisualRowColumn(arrow.to, this.orientation);
        const coords = {
            x1: fromRowCol[1] * 10 + 5,
            y1: fromRowCol[0] * 10 + 5,
            x2: toRowCol[1] * 10 + 5,
            y2: toRowCol[0] * 10 + 5,
        };
        const endOffset = Arrows._computeXYProjections(strokeWidth * Arrows._ARROW_LENGTH, coords);
        const startOffset = Arrows._computeXYProjections(Arrows._ARROW_START_MARGIN, coords);
        const escapedBrushName = Arrows._escapedBrushName(arrow.brush || Arrows._DEFAULT_BRUSH_NAME);
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
    static _makeMarker(escapedBrushName) {
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
                points: `0,0 ${Arrows._ARROW_LENGTH},${Arrows._ARROW_WIDTH / 2} 0,${Arrows._ARROW_WIDTH}`,
                part: className,
            },
            classes: [className],
        });
        marker.appendChild(polygon);
        return marker;
    }
    static _getSvgStrokeWidth(weight) {
        switch (weight) {
            case "bold":
                return 2.5;
            case "light":
                return 1;
            case "normal":
            default:
                return 1.8;
        }
    }
    static _escapedBrushName(brush) {
        return CSS.escape(brush || Arrows._DEFAULT_BRUSH_NAME);
    }
    static _makeArrowHeadId(escapedBrushName) {
        return `arrowhead-${escapedBrushName}`;
    }
    static _makeArrowClass(escapedBrushName) {
        return `arrow-${escapedBrushName}`;
    }
    static _computeXYProjections(length, arrow) {
        const angle = Math.atan2(arrow.y2 - arrow.y1, arrow.x2 - arrow.x1);
        return { x: length * Math.cos(angle), y: length * Math.sin(angle) };
    }
    static _arrowHash(arrow) {
        return `${arrow.from}_${arrow.to}_${arrow.brush || Arrows._DEFAULT_BRUSH_NAME}_${arrow.weight || Arrows._DEFAULT_ARROW_WEIGHT}`;
    }
}
/**
 * Length of arrow from base to tip, in terms of line "stroke width" units.
 */
Object.defineProperty(Arrows, "_ARROW_LENGTH", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 2.4
});
/**
 * Width of arrow base, in terms of line "stroke width" units.
 */
Object.defineProperty(Arrows, "_ARROW_WIDTH", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 2
});
/**
 * Margin applied at start of line, along direction of arrow. In CSS viewport units.
 */
Object.defineProperty(Arrows, "_ARROW_START_MARGIN", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 2.7
});
/**
 * Default brush name when none is specified for an arrow.
 */
Object.defineProperty(Arrows, "_DEFAULT_BRUSH_NAME", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "primary"
});
/**
 * Default arrow weight when none is specified.
 */
Object.defineProperty(Arrows, "_DEFAULT_ARROW_WEIGHT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "normal"
});

/**
 * A component that displays a chess board, with optional interactivity. Allows
 * click, drag and keyboard-based moves.
 *
 * @fires movestart - Fired when the user initiates a move by clicking, dragging or
 *   via the keyboard.
 *
 *   The event has a `detail` object with the `from` and
 *   `piece` values for the move. It also has a function, `setTargets(squares)`,
 *   that the caller can invoke with an array of square labels. This limits the
 *   set of targets that the piece can be moved to. Note that calling this
 *   function with an empty list will still allow the piece to be dragged around,
 *   but no square will accept the piece and thus it will always return to the
 *   starting square.
 *
 * @fires moveend - Fired when user is completing a move. This move can be prevented
 *   from completing by calling `preventDefault()` on the event. If that is called,
 *   the move itself remains in progress. The event has a `detail` object with `from`
 *   and `to` set to the square labels of the move, and `piece` containing information
 *   about the piece that was moved.
 *
 * @fires movefinished - Fired after a move is completed _and_ animations are resolved.
 *   The event has a `detail` object with `from` and `to` set to the square labels
 *   of the move, and `piece` containing information about the piece that was moved.
 *
 *   The `movefinished` event is the best time to update board position in response to
 *   a move. For example, after a king is moved for castling, the rook can be subsequently
 *   moved by updating the board position in `movefinished` by setting the `position`
 *   property.
 *
 * @fires movecancel - Fired as a move is being canceled by the user. The event
 *   is *itself* cancelable, ie. a caller can call `preventDefault()` on the event
 *   to prevent the move from being canceled. Any pieces being dragged will be returned
 *   to the start square, but the move will remain in progress.
 *
 *   The event has a `detail` object with `from` set to the square label where
 *   the move was started, and `piece` containing information about the piece that was
 *   moved.
 *
 * @cssprop [--square-color-dark=hsl(145deg 32% 44%)] - Color for dark squares.
 * @cssprop [--square-color-light=hsl(51deg 24% 84%)] - Color for light squares.
 *
 * @cssprop [--square-color-dark-hover=hsl(144deg 75% 44%)] - Hover color
 *   for a dark square. Applied when mouse is hovering over an interactable square
 *   or a square has keyboard focus during a move.
 * @cssprop [--square-color-light-hover=hsl(52deg 98% 70%)] - Hover color
 *   for a dark square. Applied when mouse is hovering over an interactable square
 *   or a square has keyboard focus during a move.
 *
 * @cssprop [--square-color-dark-active=hsl(142deg 77% 43%)] - Color applied to
 *   dark square when it is involved in (the starting point) of a move. By default
 *   this color is similar to, but slightly different from, `--square-color-dark-hover`.
 * @cssprop [--square-color-light-active=hsl(50deg 95% 64%)] - Color applied to
 *   light square when it is involved in (the starting point) of a move. By default
 *   this color is similar to, but slightly different from, `--square-color-light-hover`.
 *
 * @cssprop [--outline-color-dark-active=hsl(138deg 85% 53% / 95%)] - Color of
 *   outline applied to dark square when it is the starting point of a move.
 *   It is applied in addition to `--square-color-dark-active`, and is visible
 *   when the square does not have focus.
 * @cssprop [--outline-color-light-active=hsl(66deg 97% 72% / 95%)] - Color of
 *   outline applied to light square when it is the starting point of a move.
 *   It is applied in addition to `--square-color-light-active`, and is visible
 *   when the square does not have focus.
 * @cssprop [--outline-color-focus=hsl(30deg 94% 55% / 90%)] - Color of outline applied to square when it has focus.
 *
 * @cssprop [--outer-gutter-width=4%] - When the `coordinates` property is `outside`,
 *   this CSS property controls the width of the gutter outside the board where coords are shown.
 * @cssprop [--inner-border-width=1px] - Width of the inside border drawn around the board.
 * @cssprop [--inner-border-color=var(--square-color-dark)] - Color of the inside border drawn
 *   around the board.
 *
 * @cssprop [--move-target-marker-color-dark-square=hsl(144deg 64% 9% / 90%)] -
 *   Color of marker shown on dark square when it is an eligible move target.
 * @cssprop [--move-target-marker-color-light-square=hsl(144deg 64% 9% / 90%)] -
 *   Color of marker shown on light square when it is an eligible move target.
 *
 * @cssprop [--move-target-marker-radius=24%] - Radius of marker on a move target
 *   square.
 * @cssprop [--move-target-marker-radius-occupied=82%] - Radius of marker on
 *   a move target square that is occupied (by a piece or custom content).
 *
 * @cssprop [--outline-blur-radius=3px] - Blur radius of all outlines applied to square.
 * @cssprop [--outline-spread-radius=4px] - Spread radius of all outlines applied to square.
 *
 * @cssprop [--coords-font-size=0.7rem] - Font size of coord labels shown on board.
 * @cssprop [--coords-font-family=sans-serif] - Font family of coord labels shown on board.
 * @cssprop [--coords-inside-coord-padding-left=0.5%] - Left padding applied to coordinates
 *   when shown inside the board. Percentage values are relative to the width of the board.
 * @cssprop [--coords-inside-coord-padding-right=0.5%] - Right padding applied to coordinates
 *   when shown inside the board. Percentage values are relative to the width of the board.
 *
 * @cssprop [--ghost-piece-opacity=0.35] - Opacity of ghost piece shown while dragging.
 *   Set to 0 to hide ghost piece altogether.
 * @cssprop [--piece-drag-z-index=9999] - Z-index applied to piece while being dragged.
 * @cssprop [--piece-padding=3%] - Padding applied to square when piece is placed in it.
 *
 * @cssprop [--arrow-color-primary=hsl(40deg 100% 50% / 80%)] - Color applied to arrow
 *   with brush `primary`.
 * @cssprop [--arrow-color-secondary=hsl(7deg 93% 61% / 80%)] - Color applied to arrow
 *   with brush `secondary`.
 *
 * @slot a1,a2,...,h8 - Slots that allow placement of custom content -- SVGs, text, or
 * any other annotation -- on the corresponding square.
 *
 * @csspart piece-<b|w><b|r|p|n|k|q> - CSS parts for each of the piece classes. The part
 *   name is of the form `piece-xy`, where `x` corresponds to the color of the piece --
 *   either `w` for white or `b` for black, and `y` is the piece type -- one of `p` (pawn),
 *   `r` (rook), `n` (knight), `b` (bishop), `k` (king), `q` (queen). Thus, `piece-wr`
 *   would be the CSS part corresponding to the white rook.
 *
 *   The CSS parts can be used to set custom CSS for the pieces (such as changing the image
 *   for a piece by changing the `background-image` property).
 *
 * @csspart arrow-<brush_name> - CSS parts for any arrow brushes configured using the
 *   `brush` field on an arrow specification (see the `arrows` property for more details).
 */
class GChessBoardElement extends HTMLElement {
    constructor() {
        super();
        Object.defineProperty(this, "_shadow", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_style", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_wrapper", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_board", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_fileCoords", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_rankCoords", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_arrows", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._shadow = this.attachShadow({ mode: "open" });
        this._style = document.createElement("style");
        this._style.textContent = css_248z;
        this._shadow.appendChild(this._style);
        this._wrapper = makeHTMLElement("div", {
            classes: ["wrapper", GChessBoardElement._DEFAULT_COORDS_PLACEMENT],
        });
        this._shadow.appendChild(this._wrapper);
        this._board = new Board({
            orientation: GChessBoardElement._DEFAULT_SIDE,
            animationDurationMs: GChessBoardElement._DEFAULT_ANIMATION_DURATION_MS,
        }, (e) => this.dispatchEvent(e), this._shadow);
        this._wrapper.appendChild(this._board.element);
        this._fileCoords = new Coordinates({
            direction: "file",
            placement: GChessBoardElement._DEFAULT_COORDS_PLACEMENT,
            orientation: GChessBoardElement._DEFAULT_SIDE,
        });
        this._rankCoords = new Coordinates({
            direction: "rank",
            placement: GChessBoardElement._DEFAULT_COORDS_PLACEMENT,
            orientation: GChessBoardElement._DEFAULT_SIDE,
        });
        this._wrapper.appendChild(this._fileCoords.element);
        this._wrapper.appendChild(this._rankCoords.element);
        this._arrows = new Arrows(GChessBoardElement._DEFAULT_SIDE);
        this._wrapper.appendChild(this._arrows.element);
    }
    static get observedAttributes() {
        return [
            "orientation",
            "turn",
            "interactive",
            "fen",
            "coordinates",
            "animation-duration",
        ];
    }
    connectedCallback() {
        this._board.addGlobalListeners();
    }
    disconnectedCallback() {
        this._board.removeGlobalListeners();
    }
    attributeChangedCallback(name, _, newValue) {
        switch (name) {
            case "interactive":
                this._board.interactive = this.interactive;
                break;
            case "coordinates":
                this._wrapper.classList.toggle("outside", this.coordinates === "outside");
                this._wrapper.classList.toggle("inside", this.coordinates === "inside");
                break;
            case "orientation":
                this._board.orientation = this.orientation;
                this._fileCoords.orientation = this.orientation;
                this._rankCoords.orientation = this.orientation;
                this._arrows.orientation = this.orientation;
                break;
            case "turn":
                this._board.turn = this.turn;
                break;
            case "fen":
                if (newValue !== null) {
                    this.fen = newValue;
                }
                else {
                    this.position = {};
                }
                break;
            case "animation-duration":
                this._board.animationDurationMs = this.animationDuration;
                break;
            default:
                assertUnreachable(name);
        }
    }
    /**
     * What side's perspective to render squares from (what color appears on
     * the bottom as viewed on the screen). Either `"white"` or `"black"`.
     *
     * @attr [orientation=white]
     */
    get orientation() {
        return this._parseRestrictedStringAttributeWithDefault("orientation", isSide, GChessBoardElement._DEFAULT_SIDE);
    }
    set orientation(value) {
        this.setAttribute("orientation", value);
    }
    /**
     * What side is allowed to move pieces. Either `"white`, `"black"`, or
     * unset. When unset, pieces from either side can be moved around.
     *
     * @attr
     */
    get turn() {
        return this._parseRestrictedStringAttribute("turn", isSide);
    }
    set turn(value) {
        if (value) {
            this.setAttribute("turn", value);
        }
        else {
            this.removeAttribute("turn");
        }
    }
    /**
     * Whether the squares are interactive, i.e. user can interact with squares,
     * move pieces etc. By default, this is false; i.e a board is only for displaying
     * a position.
     *
     * @attr [interactive=false]
     */
    get interactive() {
        return this._hasBooleanAttribute("interactive");
    }
    set interactive(interactive) {
        this._setBooleanAttribute("interactive", interactive);
    }
    /**
     * A map-like object representing the board position, where object keys are square
     * labels, and values are `Piece` objects. Note that changes to this property are
     * mirrored in the value of the `fen` property of the element, but **not** the
     * corresponding attribute. All changes to position are animated, using the duration
     * specified by the `animationDuration` property.
     *
     * Example:
     *
     * ```js
     * board.position = {
     *   a2: {
     *     pieceType: "king",
     *     color: "white"
     *   },
     *   g4: {
     *     pieceType: "knight",
     *     color: "black"
     *   },
     * };
     * ```
     */
    get position() {
        return this._board.position;
    }
    set position(value) {
        this._board.position = { ...value };
    }
    /**
     * FEN string representing the board position. Note that changes to the corresponding
     * `fen` _property_ will **not** reflect onto the "fen" _attribute_ of the element.
     * In other words, to get the latest FEN string for the board position, use the `fen`
     * _property_.
     *
     * Accepts the special string `"start"` as shorthand for the starting position
     * of a chess game. An empty string represents an empty board. Invalid FEN values
     * are ignored with an error.
     *
     * Note that a FEN string normally contains 6 components, separated by slashes,
     * but only the first component (the "piece placement" component) is used by this
     * attribute.
     *
     * @attr
     */
    get fen() {
        return getFen(this._board.position);
    }
    set fen(value) {
        const position = getPosition(value);
        if (position !== undefined) {
            this.position = position;
        }
        else {
            throw new Error(`Invalid FEN position: ${value}`);
        }
    }
    /**
     * How to display coordinates for squares. Could be `"inside"` the board (default),
     * `"outside"`, or `"hidden"`.
     *
     * @attr [coordinates=inside]
     */
    get coordinates() {
        return this._parseRestrictedStringAttributeWithDefault("coordinates", isCoordinatesPlacement, GChessBoardElement._DEFAULT_COORDS_PLACEMENT);
    }
    set coordinates(value) {
        this.setAttribute("coordinates", value);
    }
    /**
     * Duration, in milliseconds, of animation when adding/removing/moving pieces.
     *
     * @attr [animation-duration=200]
     */
    get animationDuration() {
        return this._parseNumberAttribute("animation-duration", GChessBoardElement._DEFAULT_ANIMATION_DURATION_MS);
    }
    set animationDuration(value) {
        this._setNumberAttribute("animation-duration", value);
    }
    /**
     * Set of arrows to draw on the board. This is an array of objects specifying
     * arrow characteristics, with the following properties: (1) `from` and `to`
     * corresponding to the start and end squares for the arrow, (2) optional
     * `weight` for the line (values: `"light"`, `"normal"`, `"bold"`), and
     * (3) `brush`, which is a string that will be used to make a CSS part
     * where one can customize the color, opacity, and other styles of the
     * arrow. For example, a value for `brush` of `"foo"` will apply a
     * CSS part named `arrow-foo` to the arrow.
     *
     * Note: because the value of `brush` becomes part of a CSS part name, it
     * should be usable as a valid CSS identifier.
     *
     * In addition to allowing arbitrary part names, arrows support a few
     * out-of-the-box brush names, `primary` and `secondary`, which colors
     * defined with CSS custom properties `--arrow-color-primary` and
     * `--arrow-color-secondary`.
     *
     * Example:
     *
     * ```js
     * board.arrows = [
     *   { from: "e2", to: "e4" },
     *   {
     *     from: "g1",
     *     to: "f3",
     *     brush: "foo"
     *   },
     *   {
     *     from: "c7",
     *     to: "c5",
     *     brush: "secondary"
     *   },
     * ];
     */
    get arrows() {
        return this._arrows.arrows;
    }
    set arrows(arrows) {
        this._arrows.arrows = arrows;
    }
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
        super.removeEventListener(type, listener, options);
    }
    /**
     * Start a move on the board at `square`, optionally with specified targets
     * at `targetSquares`.
     */
    startMove(square, targetSquares) {
        this._board.startMove(square, targetSquares);
    }
    /**
     * Imperatively cancel any in-progress moves.
     */
    cancelMove() {
        this._board.cancelMove();
    }
    _hasBooleanAttribute(name) {
        return (this.hasAttribute(name) &&
            this.getAttribute(name)?.toLowerCase() !== "false");
    }
    _setBooleanAttribute(name, value) {
        if (value) {
            this.setAttribute(name, "");
        }
        else {
            this.removeAttribute(name);
        }
    }
    _setNumberAttribute(name, value) {
        this.setAttribute(name, value.toString());
    }
    _parseRestrictedStringAttribute(name, guard) {
        const value = this.getAttribute(name);
        return guard(value) ? value : undefined;
    }
    _parseRestrictedStringAttributeWithDefault(name, guard, defaultValue) {
        const parsed = this._parseRestrictedStringAttribute(name, guard);
        return parsed !== undefined ? parsed : defaultValue;
    }
    _parseNumberAttribute(name, defaultValue) {
        const value = this.getAttribute(name);
        return value === null || Number.isNaN(Number(value))
            ? defaultValue
            : Number(value);
    }
}
Object.defineProperty(GChessBoardElement, "_DEFAULT_SIDE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "white"
});
Object.defineProperty(GChessBoardElement, "_DEFAULT_ANIMATION_DURATION_MS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: 200
});
Object.defineProperty(GChessBoardElement, "_DEFAULT_COORDS_PLACEMENT", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: "inside"
});

customElements.define("g-chess-board", GChessBoardElement);

export { GChessBoardElement };
//# sourceMappingURL=index.es.js.map
