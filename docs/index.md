---
layout: layout.njk
title: Home
---

## Empty chessboard

Once the element is imported, you can render it in a page simply by using
the `<g-chess-board>` tag:

```html
<g-chess-board></g-chess-board>
```

<g-chess-board></g-chess-board>

This renders an chess board with default bundled colors and styles, but with
no pieces on it. For a more interesting board, we will have to override some
additional attributes.

## Setting a custom position

We can place pieces onto the board by specifying a position. Like most online
chess libraries, gchessboard accepts a [Forsyth-Edwards Notation (FEN)](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) string to specify a board position, using the
`fen` attribute.

```html
<g-chess-board
  fen="rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"
>
</g-chess-board>
```

<g-chess-board
  fen="rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2">
</g-chess-board>
