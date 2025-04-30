var $ = Object.defineProperty;
var G = (o, t, e) => t in o ? $(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var a = (o, t, e) => G(o, typeof t != "symbol" ? t + "" : t, e);
class X {
  constructor(t, e) {
    a(this, "C");
    a(this, "n");
    a(this, "originalRows");
    a(this, "originalCols");
    a(this, "marked");
    a(this, "rowCovered");
    a(this, "colCovered");
    a(this, "Z0Row", 0);
    a(this, "Z0Col", 0);
    const i = t.reduce(
      (r, s) => Math.max(r, s.length),
      0
    );
    this.n = Math.max(t.length, i), this.originalRows = t.length, this.originalCols = i, this.C = [];
    for (let r = 0; r < this.n; r++) {
      const s = t[r] === void 0 ? [] : t[r].slice();
      for (; s.length < this.n; )
        s.push(e || 0);
      this.C.push(s);
    }
    this.marked = this._makeMatrix(this.n, 0), this.rowCovered = Array(this.n).fill(!1), this.colCovered = Array(this.n).fill(!1);
  }
  /**
   * Compute the indices for the lowest-cost pairings between rows and columns
   * in the database. Returns a list of (row, column) tuples that can be used
   * to traverse the matrix.
   *
   * **WARNING**: This code handles square and rectangular matrices.
   * It does *not* handle irregular matrices.
   */
  compute() {
    let t = 1;
    const e = {
      1: this._step1,
      2: this._step2,
      3: this._step3,
      4: this._step4,
      5: this._step5,
      6: this._step6
    };
    for (; t < 7; )
      t = e[t].apply(this);
    const i = [];
    for (let r = 0; r < this.originalRows; r++)
      for (let s = 0; s < this.originalCols; s++)
        this.marked[r][s] == 1 && i.push([r, s]);
    return i;
  }
  /**
   * Create an n×n matrix, populating it with the specific value.
   */
  _makeMatrix(t, e) {
    const i = [];
    for (let r = 0; r < t; r++) {
      const s = [];
      for (let n = 0; n < t; n++)
        s.push(e);
      i.push(s);
    }
    return i;
  }
  /**
   * Produce at least one zero in each row by subtracting the smallest
   * element of each row from every element in a row. Go to Step 2.
   */
  _step1() {
    for (let t = 0; t < this.n; t++) {
      const e = Math.min(...this.C[t]);
      for (let i = 0; i < this.n; i++)
        this.C[t][i] -= e;
    }
    return 2;
  }
  /**
   * Assign as many tasks as possible:
   * 1. Find a zero in the matrix, and star it. Temporarily mark row and column.
   * 2. Find the next zero that is not in an already marked row and column.
   * 3. Repeat 1.
   * Go to Step 3.
   */
  _step2() {
    for (let t = 0; t < this.n; t++)
      for (let e = 0; e < this.n; e++)
        if (this.C[t][e] === 0 && !this.rowCovered[t] && !this.colCovered[e]) {
          this.marked[t][e] = 1, this.rowCovered[t] = !0, this.colCovered[e] = !0;
          break;
        }
    return this._clearCovers(), 3;
  }
  /**
   * Cover each column containing an assignment (starred zero). If K columns
   * are covered, the starred zeros describe a complete set of unique
   * assignments. In this case, go to DONE, otherwise, go to Step 4.
   */
  _step3() {
    let t = 0;
    for (let e = 0; e < this.n; e++)
      for (let i = 0; i < this.n; i++)
        this.marked[e][i] === 1 && !this.colCovered[i] && (this.colCovered[i] = !0, t++);
    return t >= this.n ? 7 : 4;
  }
  /**
   * Find an uncovered zero and prime it. If there is no starred zero
   * on that row, go to Step 6. If there is a starred zero on that row,
   * cover the row, and uncover the column containing the starred
   * zero. Continue doing this, until we find an uncovered zero with no
   * starred zero on the same row. Go to Step 5.
   */
  _step4() {
    let t = -1;
    for (; ; ) {
      const [e, i] = this._findFirstUncoveredZero();
      if (e < 0)
        return 6;
      if (this.marked[e][i] = 2, t = this._findStarInRow(e), t >= 0)
        this.rowCovered[e] = !0, this.colCovered[t] = !1;
      else
        return this.Z0Row = e, this.Z0Col = i, 5;
    }
  }
  /**
   * Construct a series of alternating primed and starred zeros as
   * follows. Let Z0 represent the uncovered primed zero found in Step 4.
   * Let Z1 denote the starred zero in the column of Z0 (if any).
   * Let Z2 denote the primed zero in the row of Z1 (there will always
   * be one). Continue until the series terminates at a primed zero
   * that has no starred zero in its column. Unstar each starred zero
   * of the series, star each primed zero of the series, erase all
   * primes and uncover every line in the matrix. Return to Step 3
   */
  _step5() {
    let t = 0;
    const e = [[this.Z0Row, this.Z0Col]];
    for (; ; ) {
      const i = this._findStarInCol(e[t][1]);
      if (i < 0)
        break;
      e.push([i, e[t][1]]), t++;
      const r = this._findPrimeInRow(e[t][0]);
      e.push([e[t][0], r]), t++;
    }
    for (let i = 0; i <= t; i++) {
      const [r, s] = e[i];
      this.marked[r][s] = this.marked[r][s] == 1 ? 0 : 1;
    }
    return this._clearCovers(), this._erasePrimes(), 3;
  }
  /**
   * From the uncovered elements, find the smallest element.
   * Add that value to every element of each covered row, and subtract it
   * from every element of each uncovered column. Return to Step 4 without
   * altering any stars, primes, or covered lines.
   */
  _step6() {
    const t = this._findSmallestUncovered();
    for (let e = 0; e < this.n; e++)
      for (let i = 0; i < this.n; i++)
        this.rowCovered[e] && (this.C[e][i] += t), this.colCovered[i] || (this.C[e][i] -= t);
    return 4;
  }
  /**
   * Clear all covered matrix cells.
   */
  _clearCovers() {
    for (let t = 0; t < this.n; t++)
      this.rowCovered[t] = !1, this.colCovered[t] = !1;
  }
  /**
   * Erase all prime markings.
   */
  _erasePrimes() {
    for (let t = 0; t < this.n; t++)
      for (let e = 0; e < this.n; e++)
        this.marked[t][e] === 2 && (this.marked[t][e] = 0);
  }
  /**
   * Find the first uncovered element with value 0. If none found, return [-1, -1].
   */
  _findFirstUncoveredZero() {
    for (let t = 0; t < this.n; t++)
      for (let e = 0; e < this.n; e++)
        if (this.C[t][e] === 0 && !this.rowCovered[t] && !this.colCovered[e])
          return [t, e];
    return [-1, -1];
  }
  /**
   * Find the first starred element in the specified row. Returns
   * the column index, or -1 if no starred element was found.
   */
  _findStarInRow(t) {
    for (let e = 0; e < this.n; e++)
      if (this.marked[t][e] == 1)
        return e;
    return -1;
  }
  /**
   * Find the first starred element in the specified column. Returns
   * the row index, or -1 if no starred element was found.
   */
  _findStarInCol(t) {
    for (let e = 0; e < this.n; e++)
      if (this.marked[e][t] == 1)
        return e;
    return -1;
  }
  /**
   * Find the first prime element in the specified row. Returns the column
   * index, or -1 if no prime element was found.
   */
  _findPrimeInRow(t) {
    for (let e = 0; e < this.n; e++)
      if (this.marked[t][e] == 2)
        return e;
    return -1;
  }
  /**
   * Find the smallest uncovered value in the matrix.
   */
  _findSmallestUncovered() {
    let t = Number.MAX_SAFE_INTEGER;
    for (let e = 0; e < this.n; e++)
      for (let i = 0; i < this.n; i++)
        !this.rowCovered[e] && !this.colCovered[i] && t > this.C[e][i] && (t = this.C[e][i]);
    return t;
  }
}
function Y(o, t) {
  return new X(o, t).compute();
}
const R = ["white", "black"], O = [
  "queen",
  "king",
  "knight",
  "bishop",
  "rook",
  "pawn"
], q = {
  a8: 0,
  b8: 1,
  c8: 2,
  d8: 3,
  e8: 4,
  f8: 5,
  g8: 6,
  h8: 7,
  a7: 16,
  b7: 17,
  c7: 18,
  d7: 19,
  e7: 20,
  f7: 21,
  g7: 22,
  h7: 23,
  a6: 32,
  b6: 33,
  c6: 34,
  d6: 35,
  e6: 36,
  f6: 37,
  g6: 38,
  h6: 39,
  a5: 48,
  b5: 49,
  c5: 50,
  d5: 51,
  e5: 52,
  f5: 53,
  g5: 54,
  h5: 55,
  a4: 64,
  b4: 65,
  c4: 66,
  d4: 67,
  e4: 68,
  f4: 69,
  g4: 70,
  h4: 71,
  a3: 80,
  b3: 81,
  c3: 82,
  d3: 83,
  e3: 84,
  f3: 85,
  g3: 86,
  h3: 87,
  a2: 96,
  b2: 97,
  c2: 98,
  d2: 99,
  e2: 100,
  f2: 101,
  g2: 102,
  h2: 103,
  a1: 112,
  b1: 113,
  c1: 114,
  d1: 115,
  e1: 116,
  f1: 117,
  g1: 118,
  h1: 119
}, z = Object.keys(q), Z = [
  14,
  13,
  12,
  11,
  10,
  9,
  8,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  0,
  13,
  12,
  11,
  10,
  9,
  8,
  7,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  0,
  12,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  0,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  0,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  0,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  0,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  0,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  0,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  0,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  0,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  0,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  0,
  12,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  0,
  13,
  12,
  11,
  10,
  9,
  8,
  7,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  0,
  14,
  13,
  12,
  11,
  10,
  9,
  8,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  0
], V = z.reduce(
  (o, t) => (o[q[t]] = t, o),
  {}
), A = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king"
}, K = Object.keys(
  A
).reduce(
  (o, t) => (o[A[t]] = t, o),
  {}
);
function Q(o) {
  (o === "initial" || o === "start") && (o = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  const e = o.split(" ")[0].split("/");
  if (e.length !== 8)
    return;
  const i = {};
  for (let r = 0; r < 8; r++) {
    const s = 8 - r;
    let n = 0;
    for (let l = 0; l < e[r].length; l++) {
      const h = e[r][l].toLowerCase();
      if (h in A) {
        const d = String.fromCharCode(97 + n) + s;
        i[d] = {
          pieceType: A[h],
          color: h === e[r][l] ? "black" : "white"
        }, n += 1;
      } else {
        const d = parseInt(e[r][l]);
        if (isNaN(d) || d === 0 || d > 8)
          return;
        n += d;
      }
    }
    if (n !== 8)
      return;
  }
  return i;
}
function J(o) {
  const t = [];
  for (let e = 0; e < 8; e++) {
    let i = "", r = 0;
    for (let s = 0; s < 8; s++) {
      const n = V[16 * e + s], l = o[n];
      if (l !== void 0) {
        const h = K[l.pieceType];
        r > 0 && (i += r), i += l.color === "white" ? h.toUpperCase() : h, r = 0;
      } else
        r += 1;
    }
    r > 0 && (i += r), t.push(i);
  }
  return t.join("/");
}
function k(o, t) {
  const e = o + (o & -8);
  return V[t === "black" ? 119 - e : e];
}
function D(o, t) {
  const e = q[o], i = t === "black" ? 119 - e : e;
  return i + (i & 7) >> 1;
}
function P(o, t) {
  const e = D(o, t);
  return [e >> 3, e & 7];
}
function tt(o) {
  const t = q[o];
  return ((t + (t & 7) >> 1) * 9 & 8) === 0 ? "light" : "dark";
}
function C(o) {
  return o !== void 0 && o in q;
}
function B(o, t) {
  return o === void 0 && t === void 0 || o !== void 0 && t !== void 0 && o.color === t.color && o.pieceType === t.pieceType;
}
function U(o) {
  return R.includes(o);
}
function et(o, t) {
  return z.every((e) => B(o[e], t[e]));
}
function it(o, t) {
  const e = { ...o }, i = { ...t };
  Object.keys(t).forEach((v) => {
    const p = v;
    B(t[p], o[p]) && (delete e[p], delete i[p]);
  });
  const r = [], s = [], n = [];
  function l(v) {
    const p = {};
    for (const m of R) {
      p[m] = {};
      for (const g of O)
        p[m][g] = { squares: [], piece: { color: m, pieceType: g } };
    }
    return Object.entries(v).forEach(([m, g]) => {
      p[g.color][g.pieceType].squares.push(m);
    }), p;
  }
  const h = l(e), d = l(i);
  for (const v of O)
    for (const p of R) {
      const m = { pieceType: v, color: p }, g = [...h[p][v].squares], y = [...d[p][v].squares], N = [];
      for (let u = 0; u < g.length; u++) {
        const M = [];
        for (let x = 0; x < y.length; x++)
          M.push(rt(g[u], y[x]));
        N.push(M);
      }
      const F = Y(N, 15);
      for (const [u, M] of F || [])
        n.push({
          piece: m,
          oldSquare: g[u],
          newSquare: y[M]
        }), delete g[u], delete y[M];
      g.filter((u) => u !== void 0).forEach((u) => {
        s.push({ piece: m, square: u });
      }), y.filter((u) => u !== void 0).forEach((u) => {
        r.push({ piece: m, square: u });
      });
    }
  return { added: r, removed: s, moved: n };
}
function rt(o, t) {
  return Z[q[o] - q[t] + 119];
}
function f(o, t) {
  return W(document.createElement(o), t);
}
function E(o, t) {
  return W(
    document.createElementNS("http://www.w3.org/2000/svg", o),
    t
  );
}
function W(o, t) {
  if (t !== void 0) {
    for (const e in t.attributes)
      o.setAttribute(e, t.attributes[e]);
    for (const e in t.data)
      o.dataset[e] = t.data[e];
    t.classes && o.classList.add(...t.classes);
  }
  return o;
}
function S(o) {
  throw new Error(`Unreachable code reached with value ${o}`);
}
const w = class w {
  constructor(t, e) {
    a(this, "piece");
    a(this, "animationFinished");
    a(this, "_element");
    a(this, "_parentElement");
    a(this, "_explicitPosition");
    this.piece = e.piece, this._parentElement = t, this._element = f("span", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true",
        part: `piece-${w.PIECE_CLASS_MAP[this.piece.color][this.piece.pieceType]}`
      },
      classes: [
        "piece",
        w.PIECE_CLASS_MAP[this.piece.color][this.piece.pieceType]
      ]
    }), e.animation !== void 0 && this._setAnimation(e.animation), e.secondary && this._element.classList.add("secondary"), t.appendChild(this._element);
  }
  /**
   * Remove piece for square it is contained on, along with any animation
   * listeners.
   */
  remove(t) {
    t ? this._setAnimation({ type: "fade-out", durationMs: t }) : this._parentElement.removeChild(this._element);
  }
  /**
   * Set explicit offset for piece relative to default location in square.
   */
  setExplicitPosition(t) {
    this._explicitPosition = t;
    const e = this._getTranslateValues(t);
    e && (this._element.style.transform = `translate(${e.x}, ${e.y})`);
    const i = getComputedStyle(this._element).getPropertyValue(
      w.PIECE_DRAG_SCALE_PROP
    );
    i && (this._element.style.transform += ` scale(${i})`);
  }
  /**
   * Reset any explicit position set on the piece. If `transition` is true, then
   * the change is accompanied with a transition.
   */
  resetPosition(t) {
    t && this._explicitPosition && this._setAnimation({
      type: "slide-in",
      from: this._explicitPosition,
      durationMs: t
    }), this._element.style.removeProperty("transform"), this._explicitPosition = void 0;
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
    this._element.getAnimations().forEach((t) => {
      t.finish();
    });
  }
  _getTranslateValues(t) {
    if (t.type === "coordinates") {
      const e = this._parentElement.getBoundingClientRect(), i = t.x - e.left - e.width / 2, r = t.y - e.top - 3 * e.height / 4;
      if (i !== 0 || r !== 0)
        return { x: `${i}px`, y: `${r}px` };
    } else if (t.deltaCols !== 0 || t.deltaRows !== 0)
      return {
        x: `${t.deltaCols * 100}%`,
        y: `${t.deltaRows * 100}%`
      };
  }
  _setAnimation(t) {
    let e, i;
    switch (this.finishAnimations(), t.type) {
      case "slide-in":
        {
          const r = this._getTranslateValues(t.from);
          r && (e = [
            { transform: `translate(${r.x}, ${r.y})` },
            { transform: "none" }
          ], this._element.classList.add("moving")), i = () => {
            this._element.classList.remove("moving");
          };
        }
        break;
      case "fade-in":
        e = [{ opacity: 0 }, { opacity: 1 }];
        break;
      case "fade-out":
        {
          e = [{ opacity: 1 }, { opacity: 0 }];
          const r = this._element;
          i = () => {
            this._parentElement.removeChild(r);
          };
        }
        break;
      default:
        S(t);
    }
    if (e !== void 0 && typeof this._element.animate == "function") {
      const r = this._element.animate(e, {
        duration: Math.max(0, t.durationMs)
      });
      this.animationFinished = new Promise((s) => {
        r.onfinish = () => {
          i !== void 0 && i(), this.animationFinished = void 0, s();
        };
      });
    } else i !== void 0 && i();
  }
};
/**
 * Map of piece to background image CSS class name.
 */
a(w, "PIECE_CLASS_MAP", {
  white: {
    queen: "wq",
    king: "wk",
    knight: "wn",
    pawn: "wp",
    bishop: "wb",
    rook: "wr"
  },
  black: {
    queen: "bq",
    king: "bk",
    knight: "bn",
    pawn: "bp",
    bishop: "bb",
    rook: "br"
  }
}), /**
 * CSS custom property for scale applied to piece while draggging.
 * This is overridden per input method within CSS styles.
 */
a(w, "PIECE_DRAG_SCALE_PROP", "--p-piece-drag-scale");
let T = w;
class at {
  constructor(t, e) {
    a(this, "_tdElement");
    a(this, "_contentElement");
    a(this, "_slotWrapper");
    a(this, "_slotElement");
    a(this, "_label");
    a(this, "_interactive", !1);
    a(this, "_tabbable", !1);
    a(this, "_moveable", !1);
    a(this, "_boardPiece");
    a(this, "_secondaryBoardPiece");
    a(this, "_hasContent");
    a(this, "_hover", !1);
    a(this, "_markedTarget", !1);
    a(this, "_moveState");
    this._tdElement = f("td", { attributes: { role: "cell" } }), this._label = e, this._contentElement = f("div", { classes: ["content"] }), this._slotWrapper = f("div", {
      classes: ["slot"],
      attributes: { role: "presentation" }
    }), this._slotElement = document.createElement("slot"), this._slotWrapper.appendChild(this._slotElement), this._contentElement.appendChild(this._slotWrapper), this._updateLabelVisuals(), this._tdElement.appendChild(this._contentElement), t.appendChild(this._tdElement);
  }
  /**
   * Label associated with the square (depends on orientation of square
   * on the board).
   */
  get label() {
    return this._label;
  }
  set label(t) {
    this._label = t, this._updateLabelVisuals();
  }
  /**
   * Whether the square is used in an interactive grid. Decides whether
   * the square should get visual attributes like tabindex, labels etc.
   */
  get interactive() {
    return this._interactive;
  }
  set interactive(t) {
    this._interactive = t, this._moveState = void 0, this._tdElement.setAttribute("role", t ? "gridcell" : "cell"), t ? this._contentElement.setAttribute("role", "button") : this._contentElement.removeAttribute("role"), this._updateTabIndex(), this._updateMoveStateVisuals(), this._updateLabelVisuals();
  }
  /**
   * Whether this square can be tabbed to by the user (tabindex = 0). By default,
   * all chessboard squares are focusable but not user-tabbable (tabindex = -1).
   */
  get tabbable() {
    return this._tabbable;
  }
  set tabbable(t) {
    this._tabbable = t, this._updateTabIndex();
  }
  /**
   * Whether this square should be marked as containing any slotted content.
   */
  get hasContent() {
    return !!this._hasContent;
  }
  set hasContent(t) {
    this._hasContent = t, this._contentElement.classList.toggle("has-content", t);
  }
  /**
   * Whether the piece on this square is moveable through user interaction.
   * To be set to true, a piece must actually exist on the square.
   */
  get moveable() {
    return this._moveable;
  }
  set moveable(t) {
    (!t || this._boardPiece) && (this._moveable = t, this._updateMoveStateVisuals(), this._updateLabelVisuals());
  }
  /**
   * Whether this square is a valid move target. These are highlighted
   * when move is in progress, indicating squares that we can move to.
   */
  get moveTarget() {
    return this._moveState === "move-target";
  }
  set moveTarget(t) {
    this._moveState = t ? "move-target" : "move-nontarget", this._updateMoveStateVisuals(), this._updateLabelVisuals();
  }
  removeMoveState() {
    this._moveState = void 0, this._updateMoveStateVisuals(), this._updateLabelVisuals();
  }
  /**
   * Whether this square is currently a "hover" target: the equivalent of a
   * :hover pseudoclass while mousing over a target square, but for drag
   * and keyboard moves.
   */
  get hover() {
    return this._hover;
  }
  set hover(t) {
    this._hover = t, this._contentElement.classList.toggle("hover", t);
  }
  /**
   * Whether this square is currently a marked destination of a move. This
   * is usually shown with a marker or other indicator on the square.
   */
  get markedTarget() {
    return this._markedTarget;
  }
  set markedTarget(t) {
    this._markedTarget = t, this._contentElement.classList.toggle("marked-target", t);
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
    var t;
    return (t = this._boardPiece) == null ? void 0 : t.explicitPosition;
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
  setPiece(t, e, i) {
    var r;
    (!B((r = this._boardPiece) == null ? void 0 : r.piece, t) || i) && (this.clearPiece(i == null ? void 0 : i.durationMs), this._boardPiece = new T(this._contentElement, {
      piece: t,
      animation: i
    }), this.moveable = e, this._updateSquareAfterPieceChange());
  }
  clearPiece(t) {
    this._boardPiece !== void 0 && (this.moveable = !1, this._boardPiece.remove(t), this._boardPiece = void 0, this._updateSquareAfterPieceChange());
  }
  /**
   * Optionally, squares may have a secondary piece, such as a ghost piece shown
   * while dragging. The secondary piece is always shown *behind* the primary
   * piece in the DOM.
   */
  toggleSecondaryPiece(t) {
    t && !this._secondaryBoardPiece && this._boardPiece && (this._secondaryBoardPiece = new T(this._contentElement, {
      piece: this._boardPiece.piece,
      secondary: !0
    })), t || (this._secondaryBoardPiece !== void 0 && this._secondaryBoardPiece.remove(), this._secondaryBoardPiece = void 0);
  }
  /**
   * Mark this square as being interacted with.
   */
  startInteraction() {
    this._boardPiece !== void 0 && this.moveable && (this._moveState = "move-start", this._updateMoveStateVisuals(), this._updateLabelVisuals(), this._boardPiece.finishAnimations());
  }
  /**
   * Set piece to explicit pixel location. Ignore if square has no piece.
   */
  displacePiece(t, e) {
    var i;
    (i = this._boardPiece) == null || i.setExplicitPosition({ type: "coordinates", x: t, y: e });
  }
  /**
   * Set piece back to original location. Ignore if square has no piece.
   */
  resetPiecePosition(t) {
    var e;
    (e = this._boardPiece) == null || e.resetPosition(t);
  }
  /**
   * Cancel ongoing interaction and reset position.
   */
  cancelInteraction(t) {
    this._moveState = void 0, this._updateMoveStateVisuals(), this._updateLabelVisuals(), this.resetPiecePosition(t);
  }
  _updateLabelVisuals() {
    this._contentElement.dataset.square = this.label, this._contentElement.dataset.squareColor = tt(this.label);
    const t = [
      this._boardPiece ? `${this.label}, ${this._boardPiece.piece.color} ${this._boardPiece.piece.pieceType}` : `${this.label}`
    ];
    this._moveState === "move-start" && t.push("start of move"), this._moveState === "move-target" && t.push("target square"), this._contentElement.setAttribute("aria-label", t.join(", ")), this._slotElement.name = this.label;
  }
  _updateTabIndex() {
    this.interactive ? this._contentElement.tabIndex = this.tabbable ? 0 : -1 : this._contentElement.removeAttribute("tabindex");
  }
  _updateMoveStateVisuals() {
    this._updateInteractiveCssClass(
      "moveable",
      this.moveable && !this._moveState
    ), this._updateInteractiveCssClass(
      "move-start",
      this._moveState === "move-start"
    ), this._updateInteractiveCssClass(
      "move-target",
      this._moveState === "move-target"
    ), this._contentElement.setAttribute(
      "aria-disabled",
      (!this._moveState && !this.moveable).toString()
    );
  }
  _updateInteractiveCssClass(t, e) {
    this._contentElement.classList.toggle(t, this.interactive && e);
  }
  _updateSquareAfterPieceChange() {
    this._contentElement.classList.toggle("has-piece", !!this._boardPiece), this._moveState = void 0, this._updateMoveStateVisuals(), this.toggleSecondaryPiece(!1), this._updateLabelVisuals();
  }
}
const b = class b {
  /**
   * Creates a set of elements representing chessboard squares, as well
   * as managing and displaying pieces rendered on the squares.
   */
  constructor(t, e, i) {
    a(this, "_table");
    a(this, "_boardSquares");
    a(this, "_dispatchEvent");
    a(this, "_shadowRef");
    a(this, "_orientation");
    a(this, "_turn");
    a(this, "_interactive");
    a(this, "_position");
    a(this, "_boardState");
    a(this, "_tabbableSquare");
    a(this, "_defaultTabbableSquare");
    /**
     * Certain move "finishing" logic is included in `pointerup` (e.g. drags). To
     * prevent re-handling this in the `click` handler, we prevent handling of click
     * events for a certain period after pointerup.
     */
    a(this, "_preventClickHandling");
    // Event handlers
    a(this, "_pointerDownHandler");
    a(this, "_pointerUpHandler");
    a(this, "_pointerMoveHandler");
    a(this, "_clickHandler");
    a(this, "_focusInHandler");
    a(this, "_keyDownHandler");
    /**
     * Duration (in milliseconds) for all animations.
     */
    a(this, "animationDurationMs");
    a(this, "_slotChangeHandler", (t) => {
      b._isSlotElement(t.target) && C(t.target.name) && (this._getBoardSquare(t.target.name).hasContent = t.target.assignedElements().length > 0);
    });
    a(this, "_transitionHandler", (t) => {
      t.target && t.target.style !== void 0 && t.target.style.removeProperty("transition-property");
    });
    this._boardSquares = new Array(64), this._orientation = t.orientation, this.animationDurationMs = t.animationDurationMs, this._interactive = !1, this._position = {}, this._boardState = { id: "default" }, this._dispatchEvent = e, this._shadowRef = i, this._defaultTabbableSquare = k(56, t.orientation), this._table = f("table", {
      attributes: {
        role: "table",
        "aria-label": "Chess board"
      },
      classes: ["board"]
    });
    for (let r = 0; r < 8; r++) {
      const s = f("tr", {
        attributes: { role: "row" }
      });
      for (let n = 0; n < 8; n++) {
        const l = 8 * r + n, h = k(l, this.orientation);
        this._boardSquares[l] = new at(s, h);
      }
      this._table.appendChild(s);
    }
    this._getBoardSquare(this._defaultTabbableSquare).tabbable = !0, this._pointerDownHandler = this._makeEventHandler(this._handlePointerDown), this._pointerUpHandler = this._makeEventHandler(this._handlePointerUp), this._pointerMoveHandler = this._makeEventHandler(this._handlePointerMove), this._clickHandler = this._makeEventHandler(this._handleClick), this._keyDownHandler = this._makeEventHandler(this._handleKeyDown), this._focusInHandler = this._makeEventHandler(this._handleFocusIn), this._table.addEventListener("pointerdown", this._pointerDownHandler), this._table.addEventListener("click", this._clickHandler), this._table.addEventListener("focusin", this._focusInHandler), this._table.addEventListener("keydown", this._keyDownHandler), this._table.addEventListener("slotchange", this._slotChangeHandler), this._table.addEventListener("transitionend", this._transitionHandler), this._table.addEventListener("transitioncancel", this._transitionHandler);
  }
  /**
   * Add event listeners that operate outside shadow DOM (pointer up and move).
   * These listeners should be unbound when the element is removed from the DOM.
   */
  addGlobalListeners() {
    document.addEventListener("pointerup", this._pointerUpHandler), document.addEventListener("pointermove", this._pointerMoveHandler);
  }
  /**
   * Removes global listeners for pointer up and move.
   */
  removeGlobalListeners() {
    document.removeEventListener("pointerup", this._pointerUpHandler), document.removeEventListener("pointermove", this._pointerMoveHandler);
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
  set orientation(t) {
    this._cancelMove(!1), this._orientation = t, this._refreshDefaultTabbableSquare();
    for (let e = 0; e < 64; e++) {
      const i = k(e, t), r = this._position[i];
      this._boardSquares[e].label = i, this._boardSquares[e].tabbable = this.tabbableSquare === i, r ? this._boardSquares[e].setPiece(r, this._pieceMoveable(r)) : this._boardSquares[e].clearPiece();
    }
    this._focusedSquare && this._focusTabbableSquare();
  }
  /**
   * Whether the grid is interactive. This determines the roles and attributes,
   * like tabindex, associated with the grid.
   */
  get interactive() {
    return this._interactive;
  }
  set interactive(t) {
    this._cancelMove(!1), this._interactive = t, this._blurTabbableSquare(), this._table.setAttribute("role", t ? "grid" : "table"), this._boardSquares.forEach((e) => {
      e.interactive = t;
    }), this._resetBoardStateAndMoves();
  }
  get turn() {
    return this._turn;
  }
  /**
   * What side is allowed to move pieces. This may be undefined, in which
   * pieces from either side can be moved around.
   */
  set turn(t) {
    this._cancelMove(!1), this._turn = t;
    for (let e = 0; e < 64; e++) {
      const i = k(e, this.orientation), r = this._position[i];
      this._boardSquares[e].moveable = !r || this._pieceMoveable(r);
    }
  }
  /**
   * Current `Position` object of board.
   */
  get position() {
    return this._position;
  }
  set position(t) {
    if (!et(this._position, t)) {
      this._cancelMove(!1);
      const e = it(this._position, t);
      this._position = { ...t }, e.moved.forEach(({ oldSquare: i }) => {
        this._getBoardSquare(i).clearPiece();
      }), e.removed.forEach(({ square: i }) => {
        this._getBoardSquare(i).clearPiece(this.animationDurationMs);
      }), e.moved.forEach(({ piece: i, oldSquare: r, newSquare: s }) => {
        const n = this._getStartingPositionForMove(
          r,
          s
        );
        this._getBoardSquare(s).setPiece(
          i,
          this._pieceMoveable(i),
          {
            type: "slide-in",
            from: n,
            durationMs: this.animationDurationMs
          }
        );
      }), e.added.forEach(({ piece: i, square: r }) => {
        this._getBoardSquare(r).setPiece(
          i,
          this._pieceMoveable(i),
          {
            type: "fade-in",
            durationMs: this.animationDurationMs
          }
        );
      }), this._refreshDefaultTabbableSquare();
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
  set tabbableSquare(t) {
    this.tabbableSquare !== t && (this._getBoardSquare(this.tabbableSquare).tabbable = !1, this._getBoardSquare(t).tabbable = !0, this._tabbableSquare = t);
  }
  /**
   * Start a move on the board at `square`, optionally with specified targets
   * at `targetSquares`.
   */
  startMove(t, e) {
    this._interactable(t) && (this._setBoardState({
      id: "awaiting-second-touch",
      startSquare: t
    }), this._startInteraction(t, e));
  }
  /**
   * Cancels in-progress moves, if any.
   */
  cancelMove() {
    this._cancelMove(!1);
  }
  get _focusedSquare() {
    return b._extractSquareData(this._shadowRef.activeElement);
  }
  _startInteraction(t, e) {
    const i = this._position[t];
    if (i) {
      let r = !1;
      const s = [];
      e !== void 0 ? (r = !0, e.forEach((n) => {
        C(n) && s.push(n);
      })) : this._dispatchEvent(
        new CustomEvent("movestart", {
          bubbles: !0,
          detail: {
            from: t,
            piece: i,
            setTargets: (n) => {
              r = !0;
              for (const l of n)
                C(l) && s.push(l);
            }
          }
        })
      ), this._getBoardSquare(t).startInteraction(), this.tabbableSquare = t, this._boardSquares.forEach((n) => {
        n.label !== t && (n.moveTarget = !r || s.includes(n.label), n.markedTarget = r && n.moveTarget);
      });
    }
  }
  _finishMove(t, e) {
    var i, r;
    if (this._boardState.startSquare) {
      const s = this._boardState.startSquare, n = this._position[s];
      if (n !== void 0) {
        const l = new CustomEvent("moveend", {
          bubbles: !0,
          cancelable: !0,
          detail: { from: s, to: t, piece: n }
        });
        if (this._dispatchEvent(l), l.defaultPrevented)
          return !1;
        const h = this._getStartingPositionForMove(s, t);
        this._getBoardSquare(s).clearPiece(), this._getBoardSquare(t).setPiece(
          n,
          this._pieceMoveable(n),
          // Animate transition only when piece is displaced to a specific location
          e ? {
            type: "slide-in",
            from: h,
            durationMs: this.animationDurationMs
          } : void 0
        ), this.tabbableSquare = t, this._position[t] = this._position[s], delete this._position[s];
        const d = new CustomEvent("movefinished", {
          bubbles: !0,
          detail: { from: s, to: t, piece: n }
        });
        e ? (r = (i = this._getBoardSquare(t).boardPiece) == null ? void 0 : i.animationFinished) == null || r.then(() => {
          this._dispatchEvent(d);
        }) : this._dispatchEvent(d);
      }
      return this._resetBoardStateAndMoves(), !0;
    }
    return !1;
  }
  _userCancelMove(t) {
    if (this._boardState.startSquare) {
      const e = new CustomEvent("movecancel", {
        bubbles: !0,
        cancelable: !0,
        detail: {
          from: this._boardState.startSquare,
          piece: this._position[this._boardState.startSquare]
        }
      });
      if (this._dispatchEvent(e), !e.defaultPrevented)
        return this._cancelMove(t), !0;
    }
    return !1;
  }
  _cancelMove(t) {
    this._boardState.startSquare && this._getBoardSquare(this._boardState.startSquare).cancelInteraction(t ? this.animationDurationMs : void 0), this._resetBoardStateAndMoves();
  }
  _focusTabbableSquare() {
    this.tabbableSquare && this._getBoardSquare(this.tabbableSquare).focus();
  }
  _blurTabbableSquare() {
    this.tabbableSquare && this._getBoardSquare(this.tabbableSquare).blur();
  }
  _resetBoardStateAndMoves() {
    this._boardSquares.forEach((t) => {
      t.removeMoveState(), t.markedTarget = !1;
    }), this._setBoardState({
      id: this.interactive ? "awaiting-input" : "default"
    });
  }
  _pieceMoveable(t) {
    return !this.turn || t.color === this.turn;
  }
  _interactable(t) {
    const e = this._position[t];
    return !!e && this._pieceMoveable(e);
  }
  _isValidMove(t, e) {
    return t !== e && this._getBoardSquare(e).moveTarget;
  }
  _getBoardSquare(t) {
    return this._boardSquares[D(t, this.orientation)];
  }
  /**
   * Compute an explicit position to apply to a piece that is being moved
   * from `from` to `to`. This can either be the explicit piece position,
   * if already set, for that piece, or it is computed as the offset or
   * difference in rows and columns between the two squares.
   */
  _getStartingPositionForMove(t, e) {
    const [i, r] = P(t, this.orientation), [s, n] = P(e, this.orientation);
    return this._getBoardSquare(t).explicitPiecePosition || {
      type: "squareOffset",
      deltaRows: i - s,
      deltaCols: r - n
    };
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
    const t = this._defaultTabbableSquare;
    let e = !1;
    if (Object.keys(this._position).length > 0)
      for (let i = 7; i >= 0 && !e; i--)
        for (let r = 0; r <= 7 && !e; r++) {
          const s = k(8 * i + r, this.orientation);
          this._position[s] && (this._defaultTabbableSquare = s, e = !0);
        }
    e || (this._defaultTabbableSquare = k(56, this.orientation)), this._tabbableSquare === void 0 && t !== this._defaultTabbableSquare && (this._getBoardSquare(t).tabbable = !1, this._getBoardSquare(this._defaultTabbableSquare).tabbable = !0);
  }
  _setBoardState(t) {
    const e = this._boardState;
    this._boardState = t, this._boardState.id !== e.id && this._table.classList.toggle("dragging", this._isDragState()), this._boardState.highlightedSquare !== e.highlightedSquare && (e.highlightedSquare && (this._getBoardSquare(e.highlightedSquare).hover = !1), this._boardState.highlightedSquare && (this._getBoardSquare(this._boardState.highlightedSquare).hover = !0));
  }
  _handlePointerDown(t, e) {
    if (e.preventDefault(), e.button === 0)
      switch (this._boardState.id) {
        case "awaiting-input":
          t && this._interactable(t) && (this._setBoardState({
            id: "touching-first-square",
            startSquare: t,
            touchStartX: e.clientX,
            touchStartY: e.clientY
          }), this._startInteraction(t), this._getBoardSquare(t).toggleSecondaryPiece(!0));
          break;
        case "awaiting-second-touch":
        case "moving-piece-kb":
          this._boardState.startSquare === t ? (this._setBoardState({
            id: "canceling-second-touch",
            startSquare: t,
            touchStartX: e.clientX,
            touchStartY: e.clientY
          }), this._getBoardSquare(t).toggleSecondaryPiece(!0)) : t && this._setBoardState({
            id: "touching-second-square",
            startSquare: this._boardState.startSquare
          });
          break;
        case "dragging":
        case "dragging-outside":
        case "canceling-second-touch":
        case "touching-first-square":
        case "touching-second-square":
          break;
        case "default":
          break;
        // istanbul ignore next
        default:
          S(this._boardState);
      }
  }
  _handlePointerUp(t) {
    let e = t;
    switch (this._boardState.id) {
      case "touching-first-square":
        this._getBoardSquare(this._boardState.startSquare).toggleSecondaryPiece(
          !1
        ), this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare
        }), e = this._boardState.startSquare;
        break;
      case "canceling-second-touch":
        this._userCancelMove(!1) || this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare
        }), e = this._boardState.startSquare;
        break;
      case "dragging":
      case "dragging-outside":
      case "touching-second-square":
        {
          this._getBoardSquare(
            this._boardState.startSquare
          ).toggleSecondaryPiece(!1);
          let i = !1;
          t && this._isValidMove(this._boardState.startSquare, t) ? (i = this._finishMove(t, !this._isDragState()), i || (e = this._boardState.startSquare)) : (e = this._boardState.startSquare, i = this._userCancelMove(
            t !== this._boardState.startSquare
          )), i || (this._setBoardState({
            id: "awaiting-second-touch",
            startSquare: this._boardState.startSquare
          }), this._getBoardSquare(
            this._boardState.startSquare
          ).resetPiecePosition(this.animationDurationMs));
        }
        break;
      case "awaiting-input":
      case "moving-piece-kb":
      case "awaiting-second-touch":
        break;
      case "default":
        break;
      // istanbul ignore next
      default:
        S(this._boardState);
    }
    this._focusedSquare && e && (this.tabbableSquare = e, this._focusTabbableSquare()), this._preventClickHandling = !0, setTimeout(() => {
      this._preventClickHandling = !1;
    }, b.POINTERUP_CLICK_PREVENT_DURATION_MS);
  }
  _handlePointerMove(t, e) {
    switch (this._boardState.id) {
      case "canceling-second-touch":
      case "touching-first-square":
        {
          const i = Math.sqrt(
            (e.clientX - this._boardState.touchStartX) ** 2 + (e.clientY - this._boardState.touchStartY) ** 2
          ), r = this._getBoardSquare(
            this._boardState.startSquare
          ).width, s = Math.max(
            b.DRAG_THRESHOLD_MIN_PIXELS,
            b.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION * r
          );
          (i > s || t !== this._boardState.startSquare) && (this._getBoardSquare(this._boardState.startSquare).displacePiece(
            e.clientX,
            e.clientY
          ), t ? this._setBoardState({
            id: "dragging",
            startSquare: this._boardState.startSquare,
            highlightedSquare: this._isValidMove(
              this._boardState.startSquare,
              t
            ) ? t : void 0
          }) : this._setBoardState({
            id: "dragging-outside",
            startSquare: this._boardState.startSquare
          }));
        }
        break;
      case "dragging":
      case "dragging-outside":
        this._getBoardSquare(this._boardState.startSquare).displacePiece(
          e.clientX,
          e.clientY
        ), t && t !== this._boardState.highlightedSquare ? this._setBoardState({
          id: "dragging",
          startSquare: this._boardState.startSquare,
          highlightedSquare: this._isValidMove(
            this._boardState.startSquare,
            t
          ) ? t : void 0
        }) : !t && this._boardState.id !== "dragging-outside" && this._setBoardState({
          id: "dragging-outside",
          startSquare: this._boardState.startSquare
        });
        break;
      case "awaiting-input":
      case "awaiting-second-touch":
      case "default":
      case "moving-piece-kb":
      case "touching-second-square":
        break;
      // istanbul ignore next
      default:
        S(this._boardState);
    }
  }
  _handleClick(t) {
    if (!this._preventClickHandling) {
      switch (this._boardState.id) {
        case "awaiting-input":
          t && this._interactable(t) && (this._setBoardState({
            id: "awaiting-second-touch",
            startSquare: t
          }), this._startInteraction(t));
          break;
        case "awaiting-second-touch":
        case "moving-piece-kb":
          (t && this._isValidMove(this._boardState.startSquare, t) ? this._finishMove(t, !0) : this._userCancelMove(t !== this._boardState.startSquare)) || (this._setBoardState({
            id: "awaiting-second-touch",
            startSquare: this._boardState.startSquare
          }), this._getBoardSquare(
            this._boardState.startSquare
          ).resetPiecePosition(this.animationDurationMs));
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
          S(this._boardState);
      }
      this._focusedSquare && t && (this.tabbableSquare = t, this._focusTabbableSquare());
    }
  }
  _handleFocusIn(t) {
    t && // Some browsers (Safari) focus on board squares that are not tabbable
    // (tabindex = -1). If that happens, update tabbable square manually.
    (t !== this.tabbableSquare || // Assign tabbable square if none is explicitly assigned yet.
    this._tabbableSquare === void 0) && (this.tabbableSquare = t);
  }
  _handleKeyDown(t, e) {
    if (e.key === "Enter" || e.key === " ")
      switch (e.preventDefault(), this._boardState.id) {
        case "awaiting-input":
          t && this._interactable(t) && (this._setBoardState({
            id: "moving-piece-kb",
            startSquare: t,
            highlightedSquare: void 0
          }), this._startInteraction(t));
          break;
        case "moving-piece-kb":
        case "awaiting-second-touch":
          t && this._isValidMove(this._boardState.startSquare, t) ? this._finishMove(t, !0) : this._userCancelMove(!1);
          break;
        case "dragging":
        case "dragging-outside":
        case "touching-first-square":
        case "touching-second-square":
        case "canceling-second-touch":
          break;
        case "default":
          break;
        // istanbul ignore next
        default:
          S(this._boardState);
      }
    else {
      const i = D(this.tabbableSquare, this.orientation), r = i >> 3, s = i & 7;
      let n = i, l = !1;
      switch (e.key) {
        case "ArrowRight":
        case "Right":
          n = 8 * r + Math.min(7, s + 1), l = !0;
          break;
        case "ArrowLeft":
        case "Left":
          n = 8 * r + Math.max(0, s - 1), l = !0;
          break;
        case "ArrowDown":
        case "Down":
          n = 8 * Math.min(7, r + 1) + s, l = !0;
          break;
        case "ArrowUp":
        case "Up":
          n = 8 * Math.max(0, r - 1) + s, l = !0;
          break;
        case "Home":
          n = e.ctrlKey ? 0 : 8 * r, l = !0;
          break;
        case "End":
          n = e.ctrlKey ? 63 : 8 * r + 7, l = !0;
          break;
        case "PageUp":
          n = s, l = !0;
          break;
        case "PageDown":
          n = 56 + s, l = !0;
          break;
      }
      if (l && e.preventDefault(), n !== i)
        switch (this.tabbableSquare = k(n, this.orientation), this._focusTabbableSquare(), this._boardState.id) {
          case "moving-piece-kb":
          case "awaiting-second-touch":
            this._setBoardState({
              id: "moving-piece-kb",
              startSquare: this._boardState.startSquare,
              highlightedSquare: this._boardState.startSquare !== this.tabbableSquare ? this._tabbableSquare : void 0
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
            S(this._boardState);
        }
    }
  }
  /**
   * Convenience wrapper to make pointer, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  _makeEventHandler(t) {
    const e = t.bind(this);
    return (i) => {
      const r = b._isMouseEvent(i) ? this._shadowRef.elementsFromPoint(i.clientX, i.clientY).map((s) => b._extractSquareData(s)).find((s) => !!s) : b._extractSquareData(i.target);
      e(r, i);
    };
  }
  _isDragState() {
    return ["dragging", "dragging-outside"].includes(this._boardState.id);
  }
  static _extractSquareData(t) {
    if (t && t.dataset) {
      const e = t.dataset;
      return C(e.square) ? e.square : void 0;
    }
  }
  static _isMouseEvent(t) {
    return t.clientX !== void 0;
  }
  static _isSlotElement(t) {
    return !!t && t.assignedElements !== void 0;
  }
};
/**
 * Fraction of square width that pointer must be moved to be
 * considered a "drag" action.
 */
a(b, "DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION", 0.1), /**
 * Minimum number of pixels to enable dragging.
 */
a(b, "DRAG_THRESHOLD_MIN_PIXELS", 2), /**
 * Amount of time (in ms) to suppress click handling after a pointerup event.
 */
a(b, "POINTERUP_CLICK_PREVENT_DURATION_MS", 250);
let L = b;
const st = `:host{--square-color-dark: hsl(145deg 32% 44%);--square-color-light: hsl(51deg 24% 84%);--square-color-dark-hover: hsl(144deg 75% 44%);--square-color-light-hover: hsl(52deg 98% 70%);--square-color-dark-active: hsl(142deg 77% 43%);--square-color-light-active: hsl(50deg 95% 64%);--outline-color-dark-active: hsl(138deg 85% 53% / 95%);--outline-color-light-active: hsl(66deg 97% 72% / 95%);--outline-color-focus: hsl(30deg 94% 55% / 90%);--outline-blur-radius: 3px;--outline-spread-radius: 4px;--coords-font-size: .7rem;--coords-font-family: sans-serif;--outer-gutter-width: 4%;--inner-border-width: 1px;--coords-inside-coord-padding-left: .5%;--coords-inside-coord-padding-right: .5%;--move-target-marker-color-dark-square: hsl(144deg 64% 9% / 90%);--move-target-marker-color-light-square: hsl(144deg 64% 9% / 90%);--move-target-marker-radius: 24%;--move-target-marker-radius-occupied: 82%;--ghost-piece-opacity: .35;--piece-drag-z-index: 9999;--piece-drag-coarse-scale: 2.4;--piece-padding: 3%;--arrow-color-primary: hsl(40deg 100% 50% / 80%);--arrow-color-secondary: hsl(7deg 93% 61% / 80%);display:block}:host([hidden]){display:none}.board{width:100%;box-sizing:border-box;border:var(--inner-border-width) solid var(--inner-border-color, var(--square-color-dark));border-collapse:collapse;table-layout:fixed;-webkit-user-select:none;-moz-user-select:none;user-select:none}.board>tr>td{position:relative;padding:12.5% 0 0}[data-square]{position:absolute;width:100%;height:100%;background-color:var(--p-square-color);color:var(--p-label-color);font-family:var(--coords-font-family);font-size:var(--coords-font-size);top:0;right:0;bottom:0;left:0}[data-square]:focus{box-shadow:inset 0 0 var(--outline-blur-radius) var(--outline-spread-radius) var(--outline-color-focus);outline:none}[data-square].marked-target{background:radial-gradient(var(--p-move-target-marker-color) var(--move-target-marker-radius),var(--p-square-color) calc(var(--move-target-marker-radius) + 1px))}[data-square].moveable{touch-action:none}[data-square].has-piece.marked-target,[data-square].has-content.marked-target{background:radial-gradient(var(--p-square-color) var(--move-target-marker-radius-occupied),var(--p-move-target-marker-color) calc(var(--move-target-marker-radius-occupied) + 1px))}[data-square].move-start{--p-square-color: var(--p-square-color-active)}[data-square].move-start:not(:focus){box-shadow:inset 0 0 var(--outline-blur-radius) var(--outline-spread-radius) var(--p-outline-color-active)}@media (hover: hover){[data-square]:is(.moveable,.move-target):hover{--p-square-color: var(--p-square-color-hover)}}[data-square].hover{--p-square-color: var(--p-square-color-hover)}table:not(.dragging) [data-square]:is(.moveable,.move-start,.move-target){cursor:pointer}table.dragging{cursor:grab}.wrapper,.board-arrows-wrapper{position:relative}.coords{position:absolute;display:none;font-family:var(--coords-font-family);font-size:var(--coords-font-size);pointer-events:none;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.coord{display:flex;box-sizing:border-box}.coords.file>.coord{width:12.5%}.coords.rank{flex-direction:column}.coords.rank>.coord{height:12.5%}.wrapper.outside{padding:var(--outer-gutter-width);background-color:var(--square-color-light)}.wrapper.outside>.coords{display:flex;color:var(--square-color-dark)}.wrapper.outside>.coords>.coord{align-items:center;justify-content:center}.wrapper.outside>.coords.file{right:var(--outer-gutter-width);bottom:0;left:var(--outer-gutter-width);width:calc(100% - 2 * var(--outer-gutter-width));height:var(--outer-gutter-width)}.wrapper.outside>.coords.rank{top:var(--outer-gutter-width);bottom:var(--outer-gutter-width);left:0;width:var(--outer-gutter-width);height:calc(100% - 2 * var(--outer-gutter-width))}.wrapper.inside>.coords{display:flex;width:100%;height:100%;top:0;right:0;bottom:0;left:0}.wrapper.inside>.coords>.coord.light{color:var(--square-color-dark)}.wrapper.inside>.coords>.coord.dark{color:var(--square-color-light)}.wrapper.inside>.coords.file>.coord{align-items:flex-end;justify-content:flex-end;padding-right:var(--coords-inside-coord-padding-right)}.wrapper.inside>.coords.rank>.coord{padding-left:var(--coords-inside-coord-padding-left)}[data-square-color=dark]{--p-square-color: var(--square-color-dark);--p-label-color: var(--square-color-light);--p-square-color-hover: var(--square-color-dark-hover);--p-move-target-marker-color: var(--move-target-marker-color-dark-square);--p-square-color-active: var(--square-color-dark-active);--p-outline-color-active: var(--outline-color-dark-active)}[data-square-color=light]{--p-square-color: var(--square-color-light);--p-label-color: var(--square-color-dark);--p-square-color-hover: var(--square-color-light-hover);--p-move-target-marker-color: var(--move-target-marker-color-light-square);--p-square-color-active: var(--square-color-light-active);--p-outline-color-active: var(--outline-color-light-active)}[data-square] .piece,[data-square] .slot{position:absolute;width:100%;height:100%;top:0;right:0;bottom:0;left:0;pointer-events:none}[data-square] .piece{z-index:10;box-sizing:border-box;padding:var(--piece-padding);background-origin:content-box;background-repeat:no-repeat;background-size:cover}[data-square] .piece.moving{z-index:15}[data-square] .piece.secondary{z-index:5;opacity:var(--ghost-piece-opacity)}[data-square].move-start .piece:not(.secondary){z-index:var(--piece-drag-z-index)}@media (pointer: coarse){[data-square] .piece{--p-piece-drag-scale: var(--piece-drag-coarse-scale)}}.bb{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cg style='fill:%23000;stroke:%23000;stroke-linecap:butt'%3e%3cpath d='M9 36.6c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3e%3cpath d='M15 32.6c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3e%3cpath d='M25 8.6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3e%3c/g%3e%3cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' style='fill:none;stroke:%23fff;stroke-linejoin:miter' transform='translate(0 .6)'/%3e%3c/g%3e%3c/svg%3e")}.bk{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22.5 11.63V6' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' style='fill:%23000;fill-opacity:1;stroke-linecap:butt;stroke-linejoin:miter'/%3e%3cpath d='M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7' style='fill:%23000;stroke:%23000'/%3e%3cpath d='M20 8h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3cpath d='M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5v2.1-2.1C20 18 10.85 14 6.97 19.85 4.5 25.5 13 29.5 13 29.5' style='fill:none;stroke:%23fff'/%3e%3cpath d='M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0' style='fill:none;stroke:%23fff'/%3e%3c/g%3e%3c/svg%3e")}.bn{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z' style='fill:%23fff;stroke:%23fff' transform='translate(0 .3)'/%3e%3cpath d='M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z' transform='rotate(30 13.94 15.65)' style='fill:%23fff;stroke:%23fff'/%3e%3cpath d='m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z' style='fill:%23fff;stroke:none' stroke='none' transform='translate(0 .3)'/%3e%3c/g%3e%3c/svg%3e")}.bp{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' style='opacity:1;fill:%23000;fill-opacity:1;fill-rule:nonzero;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3e%3c/svg%3e")}.bq{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:%23000;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round'%3e%3cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z' style='stroke-linecap:butt;fill:%23000'/%3e%3cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z'/%3e%3cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0'/%3e%3ccircle cx='6' cy='12' r='2'/%3e%3ccircle cx='14' cy='9' r='2'/%3e%3ccircle cx='22.5' cy='8' r='2'/%3e%3ccircle cx='31' cy='9' r='2'/%3e%3ccircle cx='39' cy='12' r='2'/%3e%3cpath d='M11 38.5a35 35 1 0 0 23 0' style='fill:none;stroke:%23000;stroke-linecap:butt'/%3e%3cg style='fill:none;stroke:%23fff'%3e%3cpath d='M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")}.br{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:%23000;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z' style='stroke-linecap:butt' transform='translate(0 .3)'/%3e%3cpath d='M14 29.5v-13h17v13H14z' style='stroke-linecap:butt;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3cpath d='M14 16.5 11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z' style='stroke-linecap:butt' transform='translate(0 .3)'/%3e%3cpath d='M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23' style='fill:none;stroke:%23fff;stroke-width:1;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3c/g%3e%3c/svg%3e")}.wb{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1' transform='translate(0 .6)'%3e%26gt;%3cg style='fill:%23fff;stroke:%23000;stroke-linecap:butt'%3e%3cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3e%3cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3e%3cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3e%3c/g%3e%3cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3c/g%3e%3c/svg%3e")}.wk{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22.5 11.63V6M20 8h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' style='fill:%23fff;stroke:%23000;stroke-linecap:butt;stroke-linejoin:miter'/%3e%3cpath d='M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7' style='fill:%23fff;stroke:%23000'/%3e%3cpath d='M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0' style='fill:none;stroke:%23000'/%3e%3c/g%3e%3c/svg%3e")}.wn{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' style='fill:%23fff;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' style='fill:%23fff;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z' transform='rotate(30 13.94 15.65)' style='fill:%23000;stroke:%23000'/%3e%3c/g%3e%3c/svg%3e")}.wp{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' style='opacity:1;fill:%23fff;fill-opacity:1;fill-rule:nonzero;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3e%3c/svg%3e")}.wq{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:%23fff;stroke:%23000;stroke-width:1.5;stroke-linejoin:round'%3e%3cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z'/%3e%3cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z'/%3e%3cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0' style='fill:none'/%3e%3ccircle cx='6' cy='12' r='2'/%3e%3ccircle cx='14' cy='9' r='2'/%3e%3ccircle cx='22.5' cy='8' r='2'/%3e%3ccircle cx='31' cy='9' r='2'/%3e%3ccircle cx='39' cy='12' r='2'/%3e%3c/g%3e%3c/svg%3e")}.wr{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:%23fff;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5' style='stroke-linecap:butt' transform='translate(0 .3)'/%3e%3cpath d='m34 14.3-3 3H14l-3-3'/%3e%3cpath d='M31 17v12.5H14V17' style='stroke-linecap:butt;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3cpath d='m31 29.8 1.5 2.5h-20l1.5-2.5'/%3e%3cpath d='M11 14h23' style='fill:none;stroke:%23000;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3c/g%3e%3c/svg%3e")}.arrows{position:absolute;z-index:20;width:100%;height:100%;box-sizing:border-box;border:var(--inner-border-width) solid transparent;top:0;right:0;bottom:0;left:0;pointer-events:none;touch-action:none}.arrow-primary{color:var(--arrow-color-primary)}.arrow-secondary{color:var(--arrow-color-secondary)}`, ot = ["inside", "outside", "hidden"];
class j {
  constructor(t) {
    a(this, "element");
    a(this, "_coordElements");
    a(this, "_orientation");
    a(this, "_direction");
    this.element = f("div", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true"
      },
      classes: ["coords", t.direction]
    }), this._direction = t.direction, this._orientation = t.orientation, this._coordElements = new Array(8);
    const e = t.direction === "file" ? "dark" : "light", i = t.direction === "file" ? "light" : "dark";
    for (let r = 0; r < 8; r++) {
      const s = r % 2 === 0 ? e : i, n = f("div", { classes: ["coord", s] });
      this._coordElements[r] = n, this.element.appendChild(n);
    }
    this._updateCoordsText();
  }
  /**
   * Orientation of the board; this determines labels for ranks and files.
   */
  get orientation() {
    return this._orientation;
  }
  set orientation(t) {
    this._orientation = t, this._updateCoordsText();
  }
  _updateCoordsText() {
    for (let t = 0; t < 8; t++)
      this._direction === "file" ? this._coordElements[t].textContent = String.fromCharCode(
        97 + (this.orientation === "white" ? t : 7 - t)
      ) : this._coordElements[t].textContent = `${this.orientation === "white" ? 8 - t : t + 1}`;
  }
}
function nt(o) {
  return ot.includes(o);
}
const c = class c {
  constructor(t) {
    a(this, "element");
    a(this, "_defs");
    a(this, "_group");
    a(this, "_orientation");
    a(this, "_arrows");
    a(this, "_arrowElements", /* @__PURE__ */ new Map());
    a(this, "_markerElements", /* @__PURE__ */ new Map());
    this.element = E("svg", {
      attributes: {
        viewBox: "0 0 80 80"
      },
      classes: ["arrows"]
    }), this._orientation = t, this._defs = E("defs"), this.element.appendChild(this._defs), this._group = E("g"), this.element.appendChild(this._group);
  }
  get arrows() {
    return this._arrows;
  }
  set arrows(t) {
    const e = t == null ? void 0 : t.filter((l) => l.from !== l.to), i = e ? new Set(e.map((l) => c._escapedBrushName(l.brush))) : /* @__PURE__ */ new Set(), r = new Set(this._markerElements.keys());
    r.forEach((l) => {
      if (!i.has(l)) {
        const h = this._markerElements.get(l);
        h && (this._defs.removeChild(h), this._markerElements.delete(l));
      }
    }), i.forEach((l) => {
      if (!r.has(l)) {
        const h = c._makeMarker(l);
        this._defs.appendChild(h), this._markerElements.set(l, h);
      }
    });
    const s = new Set(this._arrowElements.keys()), n = e ? new Set(e.map((l) => c._arrowHash(l))) : /* @__PURE__ */ new Set();
    s.forEach((l) => {
      if (!n.has(l)) {
        const h = this._arrowElements.get(l);
        h && (this._group.removeChild(h), this._arrowElements.delete(l));
      }
    }), e == null || e.forEach((l) => {
      const h = c._arrowHash(l);
      if (!this._arrowElements.has(h)) {
        const d = this._makeArrow(l);
        this._arrowElements.set(h, d), this._group.appendChild(d);
      }
    }), this._arrows = e ? [...e] : void 0;
  }
  /**
   * Orientation of the board; this determines direction to draw arrows.
   */
  get orientation() {
    return this._orientation;
  }
  set orientation(t) {
    var e;
    t !== this._orientation && (this._orientation = t, (e = this._arrows) == null || e.forEach((i) => {
      const r = c._arrowHash(i), s = this._arrowElements.get(r);
      s && this._group.removeChild(s);
      const n = this._makeArrow(i);
      this._group.appendChild(n), this._arrowElements.set(r, n);
    }));
  }
  _makeArrow(t) {
    const e = c._getSvgStrokeWidth(
      t.weight || c._DEFAULT_ARROW_WEIGHT
    ), i = P(t.from, this.orientation), r = P(t.to, this.orientation), s = {
      x1: i[1] * 10 + 5,
      y1: i[0] * 10 + 5,
      x2: r[1] * 10 + 5,
      y2: r[0] * 10 + 5
    }, n = c._computeXYProjections(
      e * c._ARROW_LENGTH,
      s
    ), l = c._computeXYProjections(
      c._ARROW_START_MARGIN,
      s
    ), h = c._escapedBrushName(
      t.brush || c._DEFAULT_BRUSH_NAME
    ), d = c._makeArrowClass(h);
    return E("line", {
      attributes: {
        x1: `${s.x1 + l.x}`,
        y1: `${s.y1 + l.y}`,
        x2: `${s.x2 - n.x}`,
        y2: `${s.y2 - n.y}`,
        stroke: "currentColor",
        "stroke-width": `${e}`,
        "marker-end": `url(#${c._makeArrowHeadId(h)})`,
        part: d
      },
      classes: [d]
    });
  }
  static _makeMarker(t) {
    const e = E("marker", {
      attributes: {
        id: c._makeArrowHeadId(t),
        refX: "0",
        refY: `${c._ARROW_WIDTH / 2}`,
        orient: "auto",
        markerWidth: `${c._ARROW_LENGTH}`,
        markerHeight: `${c._ARROW_WIDTH}`
      }
    }), i = c._makeArrowClass(t), r = E("polygon", {
      attributes: {
        fill: "currentColor",
        points: `0,0 ${c._ARROW_LENGTH},${c._ARROW_WIDTH / 2} 0,${c._ARROW_WIDTH}`,
        part: i
      },
      classes: [i]
    });
    return e.appendChild(r), e;
  }
  static _getSvgStrokeWidth(t) {
    switch (t) {
      case "bold":
        return 2.5;
      case "light":
        return 1;
      case "normal":
      default:
        return 1.8;
    }
  }
  static _escapedBrushName(t) {
    return CSS.escape(t || c._DEFAULT_BRUSH_NAME);
  }
  static _makeArrowHeadId(t) {
    return `arrowhead-${t}`;
  }
  static _makeArrowClass(t) {
    return `arrow-${t}`;
  }
  static _computeXYProjections(t, e) {
    const i = Math.atan2(e.y2 - e.y1, e.x2 - e.x1);
    return { x: t * Math.cos(i), y: t * Math.sin(i) };
  }
  static _arrowHash(t) {
    return `${t.from}_${t.to}_${t.brush || c._DEFAULT_BRUSH_NAME}_${t.weight || c._DEFAULT_ARROW_WEIGHT}`;
  }
};
/**
 * Length of arrow from base to tip, in terms of line "stroke width" units.
 */
a(c, "_ARROW_LENGTH", 2.4), /**
 * Width of arrow base, in terms of line "stroke width" units.
 */
a(c, "_ARROW_WIDTH", 2), /**
 * Margin applied at start of line, along direction of arrow. In CSS viewport units.
 */
a(c, "_ARROW_START_MARGIN", 2.7), /**
 * Default brush name when none is specified for an arrow.
 */
a(c, "_DEFAULT_BRUSH_NAME", "primary"), /**
 * Default arrow weight when none is specified.
 */
a(c, "_DEFAULT_ARROW_WEIGHT", "normal");
let I = c;
const _ = class _ extends HTMLElement {
  constructor() {
    super();
    a(this, "_shadow");
    a(this, "_style");
    a(this, "_wrapper");
    a(this, "_boardArrowsWrapper");
    a(this, "_board");
    a(this, "_fileCoords");
    a(this, "_rankCoords");
    a(this, "_arrows");
    this._shadow = this.attachShadow({ mode: "open" }), this._style = document.createElement("style"), this._style.textContent = st, this._shadow.appendChild(this._style), this._wrapper = f("div", {
      classes: ["wrapper", _._DEFAULT_COORDS_PLACEMENT]
    }), this._shadow.appendChild(this._wrapper), this._boardArrowsWrapper = f("div", {
      classes: ["board-arrows-wrapper"]
    }), this._wrapper.appendChild(this._boardArrowsWrapper), this._board = new L(
      {
        orientation: _._DEFAULT_SIDE,
        animationDurationMs: _._DEFAULT_ANIMATION_DURATION_MS
      },
      (e) => this.dispatchEvent(e),
      this._shadow
    ), this._boardArrowsWrapper.appendChild(this._board.element), this._fileCoords = new j({
      direction: "file",
      orientation: _._DEFAULT_SIDE
    }), this._rankCoords = new j({
      direction: "rank",
      orientation: _._DEFAULT_SIDE
    }), this._wrapper.appendChild(this._fileCoords.element), this._wrapper.appendChild(this._rankCoords.element), this._arrows = new I(_._DEFAULT_SIDE), this._boardArrowsWrapper.appendChild(this._arrows.element);
  }
  static get observedAttributes() {
    return [
      "orientation",
      "turn",
      "interactive",
      "fen",
      "coordinates",
      "animation-duration"
    ];
  }
  connectedCallback() {
    this._board.addGlobalListeners();
  }
  disconnectedCallback() {
    this._board.removeGlobalListeners();
  }
  attributeChangedCallback(e, i, r) {
    switch (e) {
      case "interactive":
        this._board.interactive = this.interactive;
        break;
      case "coordinates":
        this._wrapper.classList.toggle(
          "outside",
          this.coordinates === "outside"
        ), this._wrapper.classList.toggle("inside", this.coordinates === "inside");
        break;
      case "orientation":
        this._board.orientation = this.orientation, this._fileCoords.orientation = this.orientation, this._rankCoords.orientation = this.orientation, this._arrows.orientation = this.orientation;
        break;
      case "turn":
        this._board.turn = this.turn;
        break;
      case "fen":
        r !== null ? this.fen = r : this.position = {};
        break;
      case "animation-duration":
        this._board.animationDurationMs = this.animationDuration;
        break;
      default:
        S(e);
    }
  }
  /**
   * What side's perspective to render squares from (what color appears on
   * the bottom as viewed on the screen). Either `"white"` or `"black"`.
   *
   * @attr [orientation=white]
   */
  get orientation() {
    return this._parseRestrictedStringAttributeWithDefault(
      "orientation",
      U,
      _._DEFAULT_SIDE
    );
  }
  set orientation(e) {
    this.setAttribute("orientation", e);
  }
  /**
   * What side is allowed to move pieces. Either `"white`, `"black"`, or
   * unset. When unset, pieces from either side can be moved around.
   *
   * @attr
   */
  get turn() {
    return this._parseRestrictedStringAttribute("turn", U);
  }
  set turn(e) {
    e ? this.setAttribute("turn", e) : this.removeAttribute("turn");
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
  set interactive(e) {
    this._setBooleanAttribute("interactive", e);
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
  set position(e) {
    this._board.position = { ...e };
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
    return J(this._board.position);
  }
  set fen(e) {
    const i = Q(e);
    if (i !== void 0)
      this.position = i;
    else
      throw new Error(`Invalid FEN position: ${e}`);
  }
  /**
   * How to display coordinates for squares. Could be `"inside"` the board (default),
   * `"outside"`, or `"hidden"`.
   *
   * @attr [coordinates=inside]
   */
  get coordinates() {
    return this._parseRestrictedStringAttributeWithDefault(
      "coordinates",
      nt,
      _._DEFAULT_COORDS_PLACEMENT
    );
  }
  set coordinates(e) {
    this.setAttribute("coordinates", e);
  }
  /**
   * Duration, in milliseconds, of animation when adding/removing/moving pieces.
   *
   * @attr [animation-duration=200]
   */
  get animationDuration() {
    return this._parseNumberAttribute(
      "animation-duration",
      _._DEFAULT_ANIMATION_DURATION_MS
    );
  }
  set animationDuration(e) {
    this._setNumberAttribute("animation-duration", e);
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
  set arrows(e) {
    this._arrows.arrows = e;
  }
  addEventListener(e, i, r) {
    super.addEventListener(e, i, r);
  }
  removeEventListener(e, i, r) {
    super.removeEventListener(e, i, r);
  }
  /**
   * Start a move on the board at `square`, optionally with specified targets
   * at `targetSquares`.
   */
  startMove(e, i) {
    this._board.startMove(e, i);
  }
  /**
   * Imperatively cancel any in-progress moves.
   */
  cancelMove() {
    this._board.cancelMove();
  }
  _hasBooleanAttribute(e) {
    var i;
    return this.hasAttribute(e) && ((i = this.getAttribute(e)) == null ? void 0 : i.toLowerCase()) !== "false";
  }
  _setBooleanAttribute(e, i) {
    i ? this.setAttribute(e, "") : this.removeAttribute(e);
  }
  _setNumberAttribute(e, i) {
    this.setAttribute(e, i.toString());
  }
  _parseRestrictedStringAttribute(e, i) {
    const r = this.getAttribute(e);
    return i(r) ? r : void 0;
  }
  _parseRestrictedStringAttributeWithDefault(e, i, r) {
    const s = this._parseRestrictedStringAttribute(e, i);
    return s !== void 0 ? s : r;
  }
  _parseNumberAttribute(e, i) {
    const r = this.getAttribute(e);
    return r === null || Number.isNaN(Number(r)) ? i : Number(r);
  }
};
a(_, "_DEFAULT_SIDE", "white"), a(_, "_DEFAULT_ANIMATION_DURATION_MS", 200), a(_, "_DEFAULT_COORDS_PLACEMENT", "inside");
let H = _;
customElements.define("g-chess-board", H);
export {
  H as GChessBoardElement
};
//# sourceMappingURL=index.es.js.map
