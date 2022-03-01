# [gchessboard](https://mganjoo.github.io/gchessboard/)

`gchessboard` is an accessible, customizable and dependency-free chess board web component that can be easily embedded into both vanilla JS and framework-based web applications.

Features:

- **Accessible**: Supports multiple input modes: **click**, **drag**, and **keyboard** interaction, as well as rudimentary screenreader support.

- **Customizable**: Almost all styles can be styled using CSS custom properties. This includes piece sets, which can be changed via CSS from the included SVG set. Squares can also show custom content (such as SVGs) using web component [slots](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot).

Read more documentation on [the website](https://mganjoo.github.io/gchessboard/).

<img src="https://raw.githubusercontent.com/mganjoo/gchessboard/main/screenshots/example-basic.png" alt="Preview of basic board UI using the gchessboard library" width="350" />
<img src="https://raw.githubusercontent.com/mganjoo/gchessboard/main/screenshots/example-svg.png" alt="Preview of board UI using the gchessboard library, with custom SVGs shown on squares" width="350" />

## Installing

`gchessboard` is packaged as a [Web Component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) and should be usable directly in most modern browsers. It bundles its own (configurable) styles, inline assets (for chess pieces), and code.

### In HTML (using unpkg)

```html
<script type="module" src="https://unpkg.com/gchessboard"></script>
```

### As a module import

First, install from NPM:

```sh
npm install gchessboard
```

Then, in application JS:

```js
import "gchessboard";
```

## Basic usage

```html
<g-chess-board></g-chess-board>
```

The above example will simply render an empty board. Realistically, though, you would want to use it with some additional attributes set:

```html
<g-chess-board fen="start" interactive></g-chess-board>
```

The above example sets up a board with the standard chess game start position, and enables interaction
using click, drag, and keyboard (by tabbing into the board).

## Tutorial and Advanced Examples

- View the [tutorial](https://mganjoo.github.io/gchessboard/tutorial/) to learn how to use the library and integrate it with chess logic.
- View an example of a computer playing random moves in response to player input, see [this Pen](https://codepen.io/mganjoo/full/PoObVbx).
- The development page ([index.html](index.html)) for this library
  also includes some advanced setup, including the use of custom slots, event handling, and changing
  various properties and attributes of the board.

More examples coming soon!

## Customizing

More details on properties and attributes of the element, events fired, and various customizable CSS properties are available in [the API documentation](https://mganjoo.github.io/gchessboard/api/).

## Attribution

Chess piece SVG images included in this library were adapted from
[Category:SVG chess pieces](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces)
on Wikmedia, with slight optimizations using [SVGO](https://www.npmjs.com/package/svgo).

Original images created by [User:Cburnett](https://commons.wikimedia.org/wiki/User:Cburnett) -
Own work, licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.en).

## Acknowledgements

Some other excellent chessboard libraries that this project is inspired by:

- [shaack/cm-chessboard](https://github.com/shaack/cm-chessboard): An ES6 chessboard library, using SVG for rendering. Allows customizing styles and colors of board using CSS.
- [justinfagnani/chessboard-element](https://github.com/justinfagnani/chessboard-element): A web components-based port of the popular [chessboardjs](https://github.com/oakmac/chessboardjs/) library. Uses web component idioms like `CustomEvent` for various lifecycle events in a move interaction (move start, end, etc).
