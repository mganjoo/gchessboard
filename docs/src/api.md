---
layout: markdown.njk
eleventyNavigation:
  key: API
  order: 2
title: API Reference
---

{%- from "partials.njk" import apiprop -%}

This page describes most attributes, fields, events, and CSS-related artifacts
that can be used to customize gchessboard.

## Attributes

Many aspects of the chessboard can be customized by simply setting HTML
attributes.

```html
<g-chess-board animation-duration="300"> </g-chess-board>
```

Each of the attributes described here also has a corresponding
**property** (with a camel-cased name) that is
accessible and modifiable via JavaScript.

```js
const board = document.getElementById("id-of-board");
board.animationDuration = 300;
```

<dl>
  {%- for attribute in attributes %} {{ apiprop(attribute) }} {%- endfor %}
</dl>

## Other properties

The following properties accept non-primitive values (objects), and do not
have a corresponding attribute.

<dl>
  {%- for property in additionalProperties %} {{ apiprop(property) }} {%- endfor %}
</dl>

## Methods

<dl>{%- for method in methods %} {{ apiprop(method) }} {%- endfor %}</dl>

## Events

gchessboard fires a variety of events in response to user input. You can
attach a listener to the `<g-chess-board>` object using
`addEventListener()`. Events fired are of type `CustomEvent`, and contain a
`detail` object with additional information about the user interaction.

<dl>{%- for event in events %} {{ apiprop(event) }} {%- endfor %}</dl>

## CSS properties

Use these properties to customize visual properties of the chessboard, such as
square background, outline colors, and markers for move target squares.

<dl>
  {%- for property in cssProperties %} {{ apiprop(property) }} {%- endfor %}
</dl>

## CSS parts

gchessboard provides a collection of CSS parts to customize the images used
for chess pieces on the board, as well as brush color, opacity, and other
styles associated with arrows drawn on the board.

<dl>{%- for part in cssParts %} {{ apiprop(part) }} {%- endfor %}</dl>

<!-- prettier-ignore-start -->

{% chessboard %}
<g-chess-board fen="start" id="custom-board">
</g-chess-board>
<script>
document.getElementById("custom-board").arrows = [
  // The brush name can later be referenced in styles
  { from: "d2", to: "d4", brush: "custom-arrow" },
];
</script>
<style>
  /* Style for (b)lack (q)ueen */
  #custom-board::part(piece-bq) {
    background-image: url("../images/crown.jpg");
  }
  /* Style for arrow with brush name "custom-arrow" */
  #custom-board::part(arrow-custom-arrow) {
    color: fuchsia;
  }
</style>
{% endchessboard %}
<!-- prettier-ignore-end -->

## Slots

gchessboard provides the ability to place arbitrary content on squares using
[named slots](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Slot).
Each square has a slot corresponding to its algebraic label (such as
**a1** or **g3**). Any nested element within `<g-chess-board>` with a `slot`
attribute set to a square label will have its content placed on the correct
square.

Slotted elements appear behind pieces by default, so they provide a simple
way to set a square background color using an empty `<div>` element with
full height.

<!-- prettier-ignore-start -->

{% chessboard %}
<g-chess-board fen="8/8/8/8/2R5/8/8/8" interactive>

  <div slot="e5">
    <svg viewBox="0 0 10 10" stroke="black" fill="none">
      <ellipse cx="5" cy="5" rx="4" ry="3" />
    </svg>
  </div>
  <div slot="c3">
    <svg viewBox="0 0 10 10" stroke="goldenrod" fill="none">
      <polygon points="1,5 4,2 8,7" />
    </svg>
  </div>
  <div slot="c4" style="background-color: firebrick; height: 100%;"></div>
</g-chess-board>
{% endchessboard %}
<!-- prettier-ignore-end -->
