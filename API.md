# g-chess-board

A component that displays a chess board, with optional interactivity. Allows
click, drag and keyboard-based moves.

## Properties

| Property            | Attribute            | Type                                             | Default  | Description                                      |
|---------------------|----------------------|--------------------------------------------------|----------|--------------------------------------------------|
| `animationDuration` | `animation-duration` | `number`                                         | 200      | Duration, in milliseconds, of animation when adding/removing/moving pieces. |
| `coordinates`       | `coordinates`        | `"inside" \| "outside" \| "hidden"`              | "inside" | How to display coordinates for squares. Could be `inside` the board (default),<br />`outside`, or `hidden`. |
| `fen`               | `fen`                | `string`                                         |          | FEN string representing the board position. Note that changes to the `fen` property<br />change the board `position` property, but do **not** reflect onto the "fen" _attribute_<br />of the element. In other words, to get the latest FEN string for the board position,<br />use the `fen` property on the element.<br /><br />This property accepts the special string `"start"` as shorthand for the starting position<br />of a chess game. An empty string represents an empty board. Invalid FEN values are ignored<br />with an error.<br /><br />Note that a FEN string contains 6 components, separated by slashes, but only the first<br />component (the "piece placement" component) is used. |
| `interactive`       | `interactive`        | `boolean`                                        |          | Whether the squares are interactive, i.e. user can interact with squares,<br />move pieces etc. By default, this is false; i.e a board is only for display. |
| `orientation`       | `orientation`        | `"white" \| "black"`                             | "white"  | What side's perspective to render squares from (what color appears on<br />the bottom as viewed on the screen). |
| `position`          |                      | `Partial<Record<"a8" \| "b8" \| "c8" \| "d8" \| "e8" \| "f8" \| "g8" \| "h8" \| "a7" \| "b7" \| "c7" \| "d7" \| "e7" \| "f7" \| "g7" \| "h7" \| "a6" \| "b6" \| "c6" \| "d6" \| "e6" \| "f6" \| "g6" \| "h6" \| "a5" \| "b5" \| "c5" \| ... 36 more ... \| "h1", Piece>>` |          | Map representing the board position, where keys are square labels, and<br />values are `Piece` objects. Note that changes to position do not reflect<br />onto the "fen" attribute of the element. |
| `turn`              | `turn`               | `"white" \| "black" \| undefined`                |          | What side is allowed to move pieces. This may be `undefined` (or unset,<br />in the case of the equivalent element attribute), in which case pieces<br />from either side can be moved around. |

## Methods

| Method             | Type                                             | Description                                      |
|--------------------|--------------------------------------------------|--------------------------------------------------|
| `addEventListener` | `<K extends "movestart" \| "moveend" \| "movecancel">(type: K, listener: (this: GChessBoardElement, ev: ChessBoardEventMap[K]): any, options?: boolean \| AddEventListenerOptions \| undefined) => void` | Allows attaching listeners for custom events on this element. |

## Events

| Event        | Description                                      |
|--------------|--------------------------------------------------|
| `movecancel` | Fired as a move is being canceled by the user. The event<br />is *itself* cancelable, ie. a caller can call `preventDefault()` on the event<br />to prevent the move from being canceled. Any pieces being dragged will be returned<br />to the start square, but the move will remain in progress.<br /><br />The event has a `detail` object` with `from` set to the square label where<br />the move was started, and `piece` containing information about the piece that was<br />moved. |
| `moveend`    | Fired after a move is completed and animations are resolved.<br />The event has a `detail` object with `from` and `to` set to the square labels<br />of the move, and `piece` containing information about the piece that was moved. |
| `movestart`  | Fired when the user initiates a move by clicking, dragging or<br />via the keyboard.<br /><br />The event has a `detail` object with the `square` and<br />`piece` values for the move. It also has a function, `setTargets(squares)`,<br />that the caller can invoke with an array of square labels. This limits the<br />set of targets that the piece can be moved to. Note that calling this<br />function with an empty list will still allow the piece to be dragged around,<br />but no square will accept the piece and thus it will always return to the<br />starting square. |

## Slots

| Name           | Description                                      |
|----------------|--------------------------------------------------|
| `a1,a2,...,h8` | Slots that allow placement of custom content -- SVGs, text, or<br />any other annotation -- on the corresponding square. |

## CSS Shadow Parts

| Part                              | Description                                      |
|-----------------------------------|--------------------------------------------------|
| `piece-<b\|w>-<b\|r\|p\|n\|k\|q>` | CSS parts for each of the piece classes. The part<br />name is of the form `piece-xy`, where `x` corresponds to the color of the piece --<br />either `w` for white or `b` for black, and `y` is the piece type -- one of `p` (pawn),<br />`r` (rook), `n` (knight), `b` (bishop), `k` (king), `q` (queen). Thus, `piece-wr`<br />would be the CSS part corresponding to the white rook.<br /><br />The CSS parts can be used to set custom CSS for the pieces (such as changing the image<br />for a piece by changing the `background-image` property). |

## CSS Custom Properties

| Property                                  | Default                     | Description                                      |
|-------------------------------------------|-----------------------------|--------------------------------------------------|
| `--coords-font-family`                    | "sans-serif"                | Font family of coord labels shown on board.      |
| `--coords-font-size`                      | "0.7rem"                    | Font size of coord labels shown on board.        |
| `--coords-inside-coord-padding-left`      | "0.5%"                      | Left padding applied to coordinates<br />when shown inside the board. Percentage values are relative to the width of the board. |
| `--coords-inside-coord-padding-right`     | "0.5%"                      | Right padding applied to coordinates<br />when shown inside the board. Percentage values are relative to the width of the board. |
| `--coords-outside-gutter-width`           | "4%"                        | When the `coordinates` property is `outside`,<br />this CSS property controls the width of the gutter outside the board where coords are shown. |
| `--ghost-piece-opacity`                   | 0.35                        | Opacity of ghost piece shown while dragging.<br />Set to 0 to hide ghost piece altogether. |
| `--move-target-marker-color-dark-square`  | "hsl(144deg 64% 9% / 90%)"  | Color of marker shown on dark square when it is an eligible move target. |
| `--move-target-marker-color-light-square` | "hsl(144deg 64% 9% / 90%)"  | Color of marker shown on light square when it is an eligible move target. |
| `--move-target-marker-radius`             | "24%"                       | Radius of marker on a move target<br />square.   |
| `--move-target-marker-radius-occupied`    | "82%"                       | Radius of marker on<br />a move target square that is occupied (by a piece or custom content). |
| `--outline-blur-radius`                   | "3px"                       | Blur radius of all outlines applied to square.   |
| `--outline-color-dark-active`             | "hsl(138deg 85% 53% / 95%)" | Color of<br />outline applied to dark square when it is the starting point of a move.<br />It is applied in addition to `--square-color-dark-active`, and is visible<br />when the square does not have focus. |
| `--outline-color-focus`                   | "hsl(30deg 94% 55% / 90%)"  | Color of outline applied to square when it has focus. |
| `--outline-color-light-active`            | "hsl(66deg 97% 72% / 95%)"  | Color of<br />outline applied to light square when it is the starting point of a move.<br />It is applied in addition to `--square-color-light-active`, and is visible<br />when the square does not have focus. |
| `--outline-spread-radius`                 | "4px"                       | Spread radius of all outlines applied to square. |
| `--piece-drag-z-index`                    | 9999                        | Z-index applied to piece while being dragged.    |
| `--piece-padding`                         | "3%"                        | Padding applied to square when piece is placed in it. |
| `--square-color-dark`                     | "hsl(145deg 32% 44%)"       | Color for dark squares.                          |
| `--square-color-dark-active`              | "hsl(142deg 77% 43%)"       | Color applied to<br />dark square when it is involved in (the starting point) of a move. By default<br />this color is similar to, but slightly different from, `--square-color-dark-hover`. |
| `--square-color-dark-highlight`           | "hsl(144deg 75% 44%)"       | Highlight color<br />for a dark square. Applied when mouse is hovering over an interactable square<br />or a square has keyboard focus during a move. |
| `--square-color-light`                    | "hsl(51deg 24% 84%)"        | Color for light squares.                         |
| `--square-color-light-active`             | "hsl(50deg 95% 64%)"        | Color applied to<br />light square when it is involved in (the starting point) of a move. By default<br />this color is similar to, but slightly different from, `--square-color-light-hover`. |
| `--square-color-light-highlight`          | "hsl(52deg 98% 70%)"        | Highlight color<br />for a dark square. Applied when mouse is hovering over an interactable square<br />or a square has keyboard focus during a move. |
