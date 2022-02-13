---
layout: layout.njk
title: Home
eleventyNavigation:
  key: Tutorial
  order: 1
---

# Tutorial

In this tutorial, we will render a chess board component on the page that can
be used to play a two-player game of chess, with each side taking turns.

First, we will install the library and import it into a page. There are two
ways to do this.

### As an NPM package

```bash
npm install gchessboard
```

```js
import "gchessboard";
```

### Via a `<script>` tag

```html
<script type="module" src="https://unpkg.com/gchessboard">
```

## Empty chessboard

Once the element is imported, we can render it in a page simply by using the
`<g-chess-board>` tag:

{% chessboard %}
<g-chess-board></g-chess-board>
{% endchessboard %}

This renders an chess board with default bundled colors and styles, but with no
pieces on it. For a more interesting board, we will have to override some
additional attributes.

## Adding pieces

We can place pieces onto the board by specifying a position. Like most online
chess libraries, gchessboard accepts a
[Forsyth-Edwards Notation (FEN)](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
string to specify a board position, using the `fen` attribute.

{% chessboard %}
<g-chess-board
  fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR">
</g-chess-board>
{% endchessboard %}

This renders a board with the standard chess game start position. Because of how
common this position is, gchessboard accepts a value of `"start"` as an alias
for the starting position. Thus, the above board could also be produced with the
following code:

```html
<g-chess-board fen="start"></g-chess-board>
```

<div class="box-tip">
  A FEN string usually has six space-separated components, but only the first
  (the "placement" attribute) is relevant for determining piece positions. gchessboard
  will ignore any other components if a full FEN string is passed in. Thus, we could
  have also passed in a full string of "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  and the position would have been rendered correctly.
</div>

## Adding interactivity

The above boards are static and do not allow any pieces to be moved by the user.
They are useful if we would like to simply display a chess position on a web
page, such as in a blog post describing a game or strategy.

To allow pieces to be moved, we can include the `interactive` attribute.

{% chessboard %}
<g-chess-board fen="start" interactive></g-chess-board>
{% endchessboard %}

This attribute makes the entire board interactive – _any_ piece can be moved
around. gchessboard supports three ways to move pieces:

- **dragging** pieces from one square to another;
- **clicking** or **touching** a piece, and then clicking on another square to
  move the piece to that square; and
- using the **keyboard** to move after using <span class="keypress">Tab</span>
  to navigate into the board.

### Using the keyboard to move

Keyboard-based moves are a unique feature of gchessboard. The library has been
designed to fit the
[ARIA grid design pattern](https://www.w3.org/TR/wai-aria-practices/examples/grid/LayoutGrids.html),
which specifies how to handle directional navigation in a two-dimensional container.

Keyboard navigation is enabled when the board has focus. The board is placed
in the natural [tab order](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
of the page; thus you can navigate to it by using <span class="keypress">Tab</span>
and <span class="keypress">Shift</span> + <span class="keypress">Tab</span>. Once
the board has focus, you can press <span class="keypress">Up</span>,
<span class="keypress">Down</span>, <span class="keypress">Left</span>, and
<span class="keypress">Right</span> to move between squares. Pressing
<span class="keypress">Enter</span> or <span class="keypress">Space</span> is
equivalent to clicking on the square.

You can also use <span class="keypress">Home</span> and
<span class="keypress">End</span> to move to the start and end of a rank (row),
<span class="keypress">PgUp</span> and <span class="keypress">PgDown</span>
to move to the start and end of a file (column), and
<span class="keypress">Ctrl</span> + <span class="keypress">Home</span> and
<span class="keypress">Ctrl</span> + <span class="keypress">End</span> to move
to the top-left and bottom-right of the board, respectively.

## Adding chess logic

gchessboard is _just_ a board; it has no notion of the rules of chess or how
the pieces are allowed to move between squares. To make the component behave
more like a chess board, gchessboard provides additional attributes, as well
as custom DOM events, that allow you to restrict the set of pieces that can
be moved and the squares they can be moved to.

You will usually need to combine the board component with chess logic and state
management provided by your own code or an external library. While gchessboard
maintains its own representation of the position of the board – especially after
a piece is moved – this state should be considered "temporary". Instead, the
position of the board should be updated using the `fen` attribute or the `position`
property after every move. We will make use of **events** to react to user moves
and update state.

For this section of the tutorial, we will use the excellent
[chess.js](https://github.com/jhlywa/chess.js/) library to keep update and keep
track of the state of the game.

### Restricting which side can move with the `turn` attribute

We can use the `turn` attribute to restrict which side is allowed to move.

```html
<g-chess-board fen="start" interactive turn="white"> </g-chess-board>
```

With this change, only the white pieces can be moved. Internally, this also
removes hover and pointer styles from the black pieces, and sets `aria-disabled`
attribute on them so that screen readers do not treat them as clickable.

### Update game state with move lifecycle events

Next, we will restrict where a piece is allowed to move to once a move is
started, and update the game state after the move has ended. For this, we can
leverage three events:

- `movestart`: This event is fired as a move is being started by the user.
  The event has a `detail` object containing information about the move. It
  also provides a function `setTargets(squares)`, which accepts an array of
  square labels. When called, this function sets the set of target squares
  that a piece is allowed to move to.

- `moveend`: this is fired just as a piece is being moved to a new square. The
  event is **cancelable**, which means the move can be prevented from finishing
  by calling `preventDefault()` on the event. When this happens, the piece moves
  back to the starting square of the move, continuing to await input. This is the
  best place to update the external game state.

- `movefinished`: this is fired after a move is complete and all animations have
  resolved. This is the best place to update the position of the board (in case
  additional pieces need to be moved, such as with castling). We can also use
  this event to change the value of the `turn` attribute.

We can use a combination of these three events to create a fully working
chess game, with each side taking turns to move!

{% chessboard %}
<g-chess-board
  id="chessful-board" fen="start" interactive turn="white">
</g-chess-board>
{% endchessboard %}

<!-- prettier-ignore-start -->
{% chessboardjs %}
import { Chess } from "https://cdn.skypack.dev/chess.js";

const board = document.getElementById("chessful-board");
const game = new Chess();

board.addEventListener("movestart", (e) => {
  console.log(`Move started: ${e.detail.from}, ${e.detail.piece.color} ${e.detail.piece.pieceType}`);
  e.detail.setTargets(
    // This produces a list like ["e3", "e5"]
    game.moves({ square: e.detail.from, verbose: true }).map((m) => m.to)
  );
});

board.addEventListener("moveend", (e) => {
  console.log(`Move ending: ${e.detail.from} -> ${e.detail.to}, ${
    e.detail.piece.color
  } ${e.detail.piece.pieceType}`);
  const move = game.move({
    from: e.detail.from,
    to: e.detail.to,
    // Promote to queen for convenience (normally you would prompt user)
    promotion: "q"
  });
  if (move === null) {
    e.preventDefault();
  }
});

board.addEventListener("movefinished", (e) => {
  board.fen = game.fen();
  board.turn = game.turn() === "w" ? "white" : "black";
});
{% endchessboardjs %}
<!-- prettier-ignore-end -->

And that's it! You can edit and run [the full example](https://codesandbox.io/s/gchessboard-tutorial-iyr7o?file=/src/index.js).

More material around style, layout, and animation customization to come soon.
