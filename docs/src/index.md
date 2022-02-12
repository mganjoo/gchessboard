---
layout: layout.njk
title: Home
---

## Empty chessboard

Once the element is imported, you can render it in a page simply by using
the `<g-chess-board>` tag:

{% chessboard %}
<g-chess-board></g-chess-board>
{% endchessboard %}

This renders an chess board with default bundled colors and styles, but with
no pieces on it. For a more interesting board, we will have to override some
additional attributes.

## Setting a custom position

We can place pieces onto the board by specifying a position. Like most online
chess libraries, gchessboard accepts a [Forsyth-Edwards Notation (FEN)](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string to specify a board position, using the
`fen` attribute.

{% chessboard %}
<g-chess-board
  fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR">
</g-chess-board>
{% endchessboard %}

This renders a board with the standard chess game start position. Because of
how common this position is, gchessboard accepts a value of `"start"` as an
alias for the starting position. Thus, the above board could also be produced with
the following code:

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

The above boards are static and do not allow any pieces to be moved by the user. They are
useful if we would like to simply display a chess position on a web page, such as in a blog post
describing a game or strategy.

To allow pieces to be moved, we can include the `interactive` attribute.

{% chessboard %}
<g-chess-board fen="start" interactive></g-chess-board>
{% endchessboard %}

This attribute makes the entire board interactive – _any_ piece can be moved around. gchessboard
supports three ways to move pieces:

- **dragging** pieces from one square to another,
- **clicking** a piece, and then clicking on another square to move the piece to that square, and
- using the **keyboard** to move after using <span class="keypress">Tab</span> to navigate into the
  board.

Keyboard-based moves are a unique feature of gchessboard. After pressing <span class="keypress">Tab</span>
to enter the board, you can use <span class="keypress">Up</span>, <span class="keypress">Down</span>, <span class="keypress">Left</span>, and <span class="keypress">Right</span> to move between squares, <span class="keypress">Enter</span>
