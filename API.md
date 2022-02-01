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
| `addEventListener` | `<K extends "movestart" \| "moveend">(type: K, listener: (this: GChessBoardElement, ev: ChessBoardEventMap[K]): any, options?: boolean \| AddEventListenerOptions \| undefined) => void` | Allows attaching listeners for custom events on this element. |

## Events

| Event       | Description                                      |
|-------------|--------------------------------------------------|
| `moveend`   | Fired after a move is completed (and animations are resolved).<br />The event has a `detail` object with `from` and `to` set to the square labels<br />of the move, and `piece` containing information about the piece that was moved. |
| `movestart` | Fired when the user initiates a move by clicking, dragging or<br />keyboard. The event has a `detail` object with the `square` and `piece` values<br />for the move.<br /><br />It also has a function, `setTargets(squares)` that the caller<br />can invoke with an array of square labels. This limits the set of targets<br />that the piece can be moved to. Note that calling this function with an empty<br />list will still allow the piece to be dragged around, but no square will accept<br />the piece and thus it will always return to the starting square. |

## Slots

| Name           | Description                                      |
|----------------|--------------------------------------------------|
| `a1,a2,...,h8` | slots for placing custom content (SVGs, text, or<br />any other annotation to show on the corresponding square). |

## CSS Custom Properties

| Property                                  | Default                     | Description                                      |
|-------------------------------------------|-----------------------------|--------------------------------------------------|
| `--active-dark-outline-color`             | "hsl(138deg 85% 53% / 95%)" | Color of<br />**outline** applied to dark square when it is the starting point of a move.<br />It is in addition to `--active-dark-square-color`, applied when the square<br />is not focused. |
| `--active-dark-square-color`              | "hsl(142deg 77% 43%)"       | Color applied to<br />dark square when it is involved in (starting point) of a move. By default<br />this color is similar to, but slightly different from,<br />`--hover-dark-square-color`. |
| `--active-light-outline-color`            | "hsl(66deg 97% 72% / 95%)"  | Color of<br />**outline** applied to light square when it is the starting point of a move.<br />It is in addition to `--active-light-square-color`, applied when the square<br />is not focused. |
| `--active-light-square-color`             | "hsl(50deg 95% 64%)"        | Color applied to<br />light square when it is involved in (starting point) of a move.<br /><br />Color of outline when square is marked as start of move |
| `--coords-font-family`                    | "sans-serif"                | Font family of coord labels                      |
| `--coords-font-size`                      | "0.7rem"                    | Font size of coord labels shown on board         |
| `--coords-outside-padding`                | "4%"                        | When coords mode is `outside`, this<br />property controls how much padding is applied to the border where coords are shown. |
| `--dark-square-color`                     | "hsl(145deg 32% 44%)"       | Color for dark square                            |
| `--focus-outline-blur-radius`             | "3px"                       | Blur radius of focus outline.                    |
| `--focus-outline-color`                   | "hsl(30deg 94% 55% / 90%)"  | Color of outline<br />of square when it has focus. |
| `--focus-outline-spread-radius`           | "4px"                       | Spread radius of focus outline.<br />Usage: `box-shadow: inset 0 0 var(--focus-outline-blur-radius) var(--focus-outline-spread-radius) var(--focus-outline-color);` |
| `--ghost-piece-opacity`                   | 0.35                        | Opacity of ghost piece shown while dragging.<br />Set to 0 to hide ghost piece altogether. |
| `--hover-dark-square-color`               | "hsl(144deg 75% 44%)"       | Square color when<br />mouse or keyboard focus is hovering over a dark square |
| `--hover-light-square-color`              | "hsl(52deg 98% 70%)"        | Square color when<br />mouse or keyboard focus is hovering over a light square |
| `--light-square-color`                    | "hsl(51deg 24% 84%)"        | Color for light square                           |
| `--move-target-dark-square-marker-color`  | "hsl(144deg 64% 9% / 90%)"  | Color of marker shown on dark square when it is an eligible move target |
| `--move-target-light-square-marker-color` | "hsl(144deg 64% 9% / 90%)"  | Color of marker shown on light square when it is an eligible move target<br />--move-target-marker-radius: 24%;<br />--move-target-marker-radius-occupied: 82%; |
| `--piece-drag-z-index`                    | 9999                        | z-index applied to piece while being dragged.    |
