var K = Object.defineProperty;
var Q = (o, e, t) => e in o ? K(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var s = (o, e, t) => Q(o, typeof e != "symbol" ? e + "" : e, t);
class J {
  constructor(e, t) {
    s(this, "C");
    s(this, "n");
    s(this, "originalRows");
    s(this, "originalCols");
    s(this, "marked");
    s(this, "rowCovered");
    s(this, "colCovered");
    s(this, "Z0Row", 0);
    s(this, "Z0Col", 0);
    const i = e.reduce(
      (r, a) => Math.max(r, a.length),
      0
    );
    this.n = Math.max(e.length, i), this.originalRows = e.length, this.originalCols = i, this.C = [];
    for (let r = 0; r < this.n; r++) {
      const a = e[r] === void 0 ? [] : e[r].slice();
      for (; a.length < this.n; )
        a.push(t || 0);
      this.C.push(a);
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
    let e = 1;
    const t = {
      1: this._step1,
      2: this._step2,
      3: this._step3,
      4: this._step4,
      5: this._step5,
      6: this._step6
    };
    for (; e < 7; )
      e = t[e].apply(this);
    const i = [];
    for (let r = 0; r < this.originalRows; r++)
      for (let a = 0; a < this.originalCols; a++)
        this.marked[r][a] == 1 && i.push([r, a]);
    return i;
  }
  /**
   * Create an n×n matrix, populating it with the specific value.
   */
  _makeMatrix(e, t) {
    const i = [];
    for (let r = 0; r < e; r++) {
      const a = [];
      for (let n = 0; n < e; n++)
        a.push(t);
      i.push(a);
    }
    return i;
  }
  /**
   * Produce at least one zero in each row by subtracting the smallest
   * element of each row from every element in a row. Go to Step 2.
   */
  _step1() {
    for (let e = 0; e < this.n; e++) {
      const t = Math.min(...this.C[e]);
      for (let i = 0; i < this.n; i++)
        this.C[e][i] -= t;
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
    for (let e = 0; e < this.n; e++)
      for (let t = 0; t < this.n; t++)
        if (this.C[e][t] === 0 && !this.rowCovered[e] && !this.colCovered[t]) {
          this.marked[e][t] = 1, this.rowCovered[e] = !0, this.colCovered[t] = !0;
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
    let e = 0;
    for (let t = 0; t < this.n; t++)
      for (let i = 0; i < this.n; i++)
        this.marked[t][i] === 1 && !this.colCovered[i] && (this.colCovered[i] = !0, e++);
    return e >= this.n ? 7 : 4;
  }
  /**
   * Find an uncovered zero and prime it. If there is no starred zero
   * on that row, go to Step 6. If there is a starred zero on that row,
   * cover the row, and uncover the column containing the starred
   * zero. Continue doing this, until we find an uncovered zero with no
   * starred zero on the same row. Go to Step 5.
   */
  _step4() {
    let e = -1;
    for (; ; ) {
      const [t, i] = this._findFirstUncoveredZero();
      if (t < 0)
        return 6;
      if (this.marked[t][i] = 2, e = this._findStarInRow(t), e >= 0)
        this.rowCovered[t] = !0, this.colCovered[e] = !1;
      else
        return this.Z0Row = t, this.Z0Col = i, 5;
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
    let e = 0;
    const t = [[this.Z0Row, this.Z0Col]];
    for (; ; ) {
      const i = this._findStarInCol(t[e][1]);
      if (i < 0)
        break;
      t.push([i, t[e][1]]), e++;
      const r = this._findPrimeInRow(t[e][0]);
      t.push([t[e][0], r]), e++;
    }
    for (let i = 0; i <= e; i++) {
      const [r, a] = t[i];
      this.marked[r][a] = this.marked[r][a] == 1 ? 0 : 1;
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
    const e = this._findSmallestUncovered();
    for (let t = 0; t < this.n; t++)
      for (let i = 0; i < this.n; i++)
        this.rowCovered[t] && (this.C[t][i] += e), this.colCovered[i] || (this.C[t][i] -= e);
    return 4;
  }
  /**
   * Clear all covered matrix cells.
   */
  _clearCovers() {
    for (let e = 0; e < this.n; e++)
      this.rowCovered[e] = !1, this.colCovered[e] = !1;
  }
  /**
   * Erase all prime markings.
   */
  _erasePrimes() {
    for (let e = 0; e < this.n; e++)
      for (let t = 0; t < this.n; t++)
        this.marked[e][t] === 2 && (this.marked[e][t] = 0);
  }
  /**
   * Find the first uncovered element with value 0. If none found, return [-1, -1].
   */
  _findFirstUncoveredZero() {
    for (let e = 0; e < this.n; e++)
      for (let t = 0; t < this.n; t++)
        if (this.C[e][t] === 0 && !this.rowCovered[e] && !this.colCovered[t])
          return [e, t];
    return [-1, -1];
  }
  /**
   * Find the first starred element in the specified row. Returns
   * the column index, or -1 if no starred element was found.
   */
  _findStarInRow(e) {
    for (let t = 0; t < this.n; t++)
      if (this.marked[e][t] == 1)
        return t;
    return -1;
  }
  /**
   * Find the first starred element in the specified column. Returns
   * the row index, or -1 if no starred element was found.
   */
  _findStarInCol(e) {
    for (let t = 0; t < this.n; t++)
      if (this.marked[t][e] == 1)
        return t;
    return -1;
  }
  /**
   * Find the first prime element in the specified row. Returns the column
   * index, or -1 if no prime element was found.
   */
  _findPrimeInRow(e) {
    for (let t = 0; t < this.n; t++)
      if (this.marked[e][t] == 2)
        return t;
    return -1;
  }
  /**
   * Find the smallest uncovered value in the matrix.
   */
  _findSmallestUncovered() {
    let e = Number.MAX_SAFE_INTEGER;
    for (let t = 0; t < this.n; t++)
      for (let i = 0; i < this.n; i++)
        !this.rowCovered[t] && !this.colCovered[i] && e > this.C[t][i] && (e = this.C[t][i]);
    return e;
  }
}
function ee(o, e) {
  return new J(o, e).compute();
}
const T = ["white", "black"], E = {
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
}, W = Object.keys(E), te = [
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
], G = W.reduce(
  (o, e) => (o[E[e]] = e, o),
  {}
), P = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king"
}, X = Object.keys(
  P
).reduce(
  (o, e) => (o[P[e]] = e, o),
  {}
);
function F(o, e) {
  (o === "initial" || o === "start") && (o = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  const i = o.split(" ")[0].split("/");
  if (i.length !== 8)
    return { ok: !1, error: "invalid" };
  let r = !1;
  const a = {};
  for (let n = 0; n < 8; n++) {
    const c = 8 - n;
    let d = 0;
    for (let h = 0; h < i[n].length; h++) {
      const u = i[n][h].toLowerCase();
      if (u in P) {
        const m = String.fromCharCode(97 + d) + c;
        a[m] = {
          pieceType: P[u],
          color: u === i[n][h] ? "black" : "white"
        }, d += 1;
      } else if (e && u in e) {
        const m = String.fromCharCode(97 + d) + c;
        a[m] = {
          pieceType: e[u],
          color: u === i[n][h] ? "black" : "white"
        }, d += 1;
      } else if (/^[a-z]$/.test(u))
        r = !0, d += 1;
      else {
        const m = parseInt(i[n][h]);
        if (isNaN(m) || m === 0 || m > 8)
          return { ok: !1, error: "invalid" };
        d += m;
      }
    }
    if (d !== 8)
      return { ok: !1, error: "invalid" };
  }
  return r ? { ok: !1, error: "unknown-pieces" } : { ok: !0, position: a };
}
function z(o, e) {
  const t = {};
  if (e)
    for (const [r, a] of Object.entries(e))
      t[a] = r;
  const i = [];
  for (let r = 0; r < 8; r++) {
    let a = "", n = 0;
    for (let c = 0; c < 8; c++) {
      const d = G[16 * r + c], h = o[d];
      if (h !== void 0) {
        let u = X[h.pieceType];
        if (u || (u = t[h.pieceType]), !u)
          throw new Error(
            `No FEN letter mapping for piece type: ${h.pieceType}`
          );
        n > 0 && (a += n), a += h.color === "white" ? u.toUpperCase() : u, n = 0;
      } else
        n += 1;
    }
    n > 0 && (a += n), i.push(a);
  }
  return i.join("/");
}
function y(o, e) {
  const t = o + (o & -8);
  return G[e === "black" ? 119 - t : t];
}
function L(o, e) {
  const t = E[o], i = e === "black" ? 119 - t : t;
  return i + (i & 7) >> 1;
}
function x(o, e) {
  const t = L(o, e);
  return [t >> 3, t & 7];
}
function ie(o) {
  const e = E[o];
  return ((e + (e & 7) >> 1) * 9 & 8) === 0 ? "light" : "dark";
}
function A(o) {
  return o !== void 0 && o in E;
}
function O(o, e) {
  return o === void 0 && e === void 0 || o !== void 0 && e !== void 0 && o.color === e.color && o.pieceType === e.pieceType;
}
function $(o) {
  return T.includes(o);
}
function re(o, e) {
  return W.every((t) => O(o[t], e[t]));
}
function ae(o, e) {
  var m, j;
  const t = { ...o }, i = { ...e };
  Object.keys(e).forEach((v) => {
    const _ = v;
    O(e[_], o[_]) && (delete t[_], delete i[_]);
  });
  const r = [], a = [], n = [];
  function c(v) {
    const _ = {};
    for (const w of T)
      _[w] = {};
    return Object.entries(v).forEach(([w, p]) => {
      _[p.color][p.pieceType] || (_[p.color][p.pieceType] = {
        squares: [],
        piece: { color: p.color, pieceType: p.pieceType }
      }), _[p.color][p.pieceType].squares.push(w);
    }), _;
  }
  const d = c(t), h = c(i), u = /* @__PURE__ */ new Set();
  for (const v of T) {
    for (const _ of Object.keys(d[v]))
      u.add(_);
    for (const _ of Object.keys(h[v]))
      u.add(_);
  }
  for (const v of u)
    for (const _ of T) {
      const w = { pieceType: v, color: _ }, p = [
        ...((m = d[_][v]) == null ? void 0 : m.squares) ?? []
      ], M = [
        ...((j = h[_][v]) == null ? void 0 : j.squares) ?? []
      ], U = [];
      for (let f = 0; f < p.length; f++) {
        const C = [];
        for (let I = 0; I < M.length; I++)
          C.push(ce(p[f], M[I]));
        U.push(C);
      }
      const Z = ee(U, 15);
      for (const [f, C] of Z || [])
        n.push({
          piece: w,
          oldSquare: p[f],
          newSquare: M[C]
        }), delete p[f], delete M[C];
      p.filter((f) => f !== void 0).forEach((f) => {
        a.push({ piece: w, square: f });
      }), M.filter((f) => f !== void 0).forEach((f) => {
        r.push({ piece: w, square: f });
      });
    }
  return { added: r, removed: a, moved: n };
}
const se = new Set(Object.keys(P));
function oe(o) {
  const e = /* @__PURE__ */ new Set();
  for (const t of Object.keys(o)) {
    if (!/^[a-z]$/.test(t))
      throw new Error(
        `Invalid custom piece type key "${t}": must be a single lowercase letter a-z`
      );
    if (se.has(t))
      throw new Error(
        `Custom piece type key "${t}" conflicts with standard FEN piece letter`
      );
    const i = o[t];
    if (e.has(i))
      throw new Error(
        `Duplicate custom piece type name "${i}": each custom piece type must map to a unique name`
      );
    e.add(i);
  }
}
function ne(o, e) {
  const t = o.color === "white" ? "w" : "b", i = X[o.pieceType];
  if (i)
    return `${t}${i}`;
  if (e) {
    for (const [r, a] of Object.entries(e))
      if (a === o.pieceType)
        return `${t}${r}`;
  }
}
function ce(o, e) {
  return te[E[o] - E[e] + 119];
}
function S(o, e) {
  return Y(document.createElement(o), e);
}
function q(o, e) {
  return Y(
    document.createElementNS("http://www.w3.org/2000/svg", o),
    e
  );
}
function Y(o, e) {
  if (e !== void 0) {
    for (const t in e.attributes)
      o.setAttribute(t, e.attributes[t]);
    for (const t in e.data)
      o.dataset[t] = e.data[t];
    e.classes && o.classList.add(...e.classes);
  }
  return o;
}
function k(o) {
  throw new Error(`Unreachable code reached with value ${o}`);
}
const D = class D {
  constructor(e, t) {
    s(this, "piece");
    s(this, "animationFinished");
    s(this, "_element");
    s(this, "_parentElement");
    s(this, "_explicitPosition");
    this.piece = t.piece, this._parentElement = e, this._element = S("span", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true",
        part: `piece-${t.partIdentifier}`
      },
      classes: ["piece", t.partIdentifier]
    }), t.animation !== void 0 && this._setAnimation(t.animation), t.secondary && this._element.classList.add("secondary"), e.appendChild(this._element);
  }
  /**
   * Remove piece for square it is contained on, along with any animation
   * listeners.
   */
  remove(e) {
    e ? this._setAnimation({ type: "fade-out", durationMs: e }) : this._parentElement.removeChild(this._element);
  }
  /**
   * Set explicit offset for piece relative to default location in square.
   */
  setExplicitPosition(e) {
    this._explicitPosition = e;
    const t = this._getTranslateValues(e);
    t && (this._element.style.transform = `translate(${t.x}, ${t.y})`);
    const i = getComputedStyle(this._element).getPropertyValue(
      D.PIECE_DRAG_SCALE_PROP
    );
    i && (this._element.style.transform += ` scale(${i})`);
  }
  /**
   * Reset any explicit position set on the piece. If `transition` is true, then
   * the change is accompanied with a transition.
   */
  resetPosition(e) {
    e && this._explicitPosition && this._setAnimation({
      type: "slide-in",
      from: this._explicitPosition,
      durationMs: e
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
    this._element.getAnimations().forEach((e) => {
      e.finish();
    });
  }
  _getTranslateValues(e) {
    if (e.type === "coordinates") {
      const t = this._parentElement.getBoundingClientRect(), i = e.x - t.left - t.width / 2, r = e.y - t.top - 3 * t.height / 4;
      if (i !== 0 || r !== 0)
        return { x: `${i}px`, y: `${r}px` };
    } else if (e.deltaCols !== 0 || e.deltaRows !== 0)
      return {
        x: `${e.deltaCols * 100}%`,
        y: `${e.deltaRows * 100}%`
      };
  }
  _setAnimation(e) {
    let t, i;
    switch (this.finishAnimations(), e.type) {
      case "slide-in":
        {
          const r = this._getTranslateValues(e.from);
          r && (t = [
            { transform: `translate(${r.x}, ${r.y})` },
            { transform: "none" }
          ], this._element.classList.add("moving")), i = () => {
            this._element.classList.remove("moving");
          };
        }
        break;
      case "fade-in":
        t = [{ opacity: 0 }, { opacity: 1 }];
        break;
      case "fade-out":
        {
          t = [{ opacity: 1 }, { opacity: 0 }];
          const r = this._element;
          i = () => {
            this._parentElement.removeChild(r);
          };
        }
        break;
      default:
        k(e);
    }
    if (t !== void 0 && typeof this._element.animate == "function") {
      const r = this._element.animate(t, {
        duration: Math.max(0, e.durationMs)
      });
      this.animationFinished = new Promise((a) => {
        r.onfinish = () => {
          i !== void 0 && i(), this.animationFinished = void 0, a();
        };
      });
    } else i !== void 0 && i();
  }
};
/**
 * CSS custom property for scale applied to piece while draggging.
 * This is overridden per input method within CSS styles.
 */
s(D, "PIECE_DRAG_SCALE_PROP", "--p-piece-drag-scale");
let R = D;
class le {
  constructor(e, t) {
    s(this, "_tdElement");
    s(this, "_contentElement");
    s(this, "_slotWrapper");
    s(this, "_slotElement");
    s(this, "_label");
    s(this, "_interactive", !1);
    s(this, "_tabbable", !1);
    s(this, "_moveable", !1);
    s(this, "_boardPiece");
    s(this, "_piecePartIdentifier");
    s(this, "_secondaryBoardPiece");
    s(this, "_hasContent");
    s(this, "_hover", !1);
    s(this, "_markedTarget", !1);
    s(this, "_moveState");
    this._tdElement = S("td", { attributes: { role: "cell" } }), this._label = t, this._contentElement = S("div", { classes: ["content"] }), this._slotWrapper = S("div", {
      classes: ["slot"],
      attributes: { role: "presentation" }
    }), this._slotElement = document.createElement("slot"), this._slotWrapper.appendChild(this._slotElement), this._contentElement.appendChild(this._slotWrapper), this._updateLabelVisuals(), this._tdElement.appendChild(this._contentElement), e.appendChild(this._tdElement);
  }
  /**
   * Label associated with the square (depends on orientation of square
   * on the board).
   */
  get label() {
    return this._label;
  }
  set label(e) {
    this._label = e, this._updateLabelVisuals();
  }
  /**
   * Whether the square is used in an interactive grid. Decides whether
   * the square should get visual attributes like tabindex, labels etc.
   */
  get interactive() {
    return this._interactive;
  }
  set interactive(e) {
    this._interactive = e, this._moveState = void 0, this._tdElement.setAttribute("role", e ? "gridcell" : "cell"), e ? this._contentElement.setAttribute("role", "button") : this._contentElement.removeAttribute("role"), this._updateTabIndex(), this._updateMoveStateVisuals(), this._updateLabelVisuals();
  }
  /**
   * Whether this square can be tabbed to by the user (tabindex = 0). By default,
   * all chessboard squares are focusable but not user-tabbable (tabindex = -1).
   */
  get tabbable() {
    return this._tabbable;
  }
  set tabbable(e) {
    this._tabbable = e, this._updateTabIndex();
  }
  /**
   * Whether this square should be marked as containing any slotted content.
   */
  get hasContent() {
    return !!this._hasContent;
  }
  set hasContent(e) {
    this._hasContent = e, this._contentElement.classList.toggle("has-content", e);
  }
  /**
   * Whether the piece on this square is moveable through user interaction.
   * To be set to true, a piece must actually exist on the square.
   */
  get moveable() {
    return this._moveable;
  }
  set moveable(e) {
    (!e || this._boardPiece) && (this._moveable = e, this._updateMoveStateVisuals(), this._updateLabelVisuals());
  }
  /**
   * Whether this square is a valid move target. These are highlighted
   * when move is in progress, indicating squares that we can move to.
   */
  get moveTarget() {
    return this._moveState === "move-target";
  }
  set moveTarget(e) {
    this._moveState = e ? "move-target" : "move-nontarget", this._updateMoveStateVisuals(), this._updateLabelVisuals();
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
  set hover(e) {
    this._hover = e, this._contentElement.classList.toggle("hover", e);
  }
  /**
   * Whether this square is currently a marked destination of a move. This
   * is usually shown with a marker or other indicator on the square.
   */
  get markedTarget() {
    return this._markedTarget;
  }
  set markedTarget(e) {
    this._markedTarget = e, this._contentElement.classList.toggle("marked-target", e);
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
    var e;
    return (e = this._boardPiece) == null ? void 0 : e.explicitPosition;
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
  setPiece(e, t, i, r) {
    var a;
    (!O((a = this._boardPiece) == null ? void 0 : a.piece, e) || this._piecePartIdentifier !== i || r) && (this.clearPiece(r == null ? void 0 : r.durationMs), this._piecePartIdentifier = i, this._boardPiece = new R(this._contentElement, {
      piece: e,
      partIdentifier: i,
      animation: r
    }), this.moveable = t, this._updateSquareAfterPieceChange());
  }
  clearPiece(e) {
    this._boardPiece !== void 0 && (this.moveable = !1, this._boardPiece.remove(e), this._boardPiece = void 0, this._piecePartIdentifier = void 0, this._updateSquareAfterPieceChange());
  }
  /**
   * Optionally, squares may have a secondary piece, such as a ghost piece shown
   * while dragging. The secondary piece is always shown *behind* the primary
   * piece in the DOM.
   */
  toggleSecondaryPiece(e) {
    e && !this._secondaryBoardPiece && this._boardPiece && this._piecePartIdentifier && (this._secondaryBoardPiece = new R(this._contentElement, {
      piece: this._boardPiece.piece,
      partIdentifier: this._piecePartIdentifier,
      secondary: !0
    })), e || (this._secondaryBoardPiece !== void 0 && this._secondaryBoardPiece.remove(), this._secondaryBoardPiece = void 0);
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
  displacePiece(e, t) {
    var i;
    (i = this._boardPiece) == null || i.setExplicitPosition({ type: "coordinates", x: e, y: t });
  }
  /**
   * Set piece back to original location. Ignore if square has no piece.
   */
  resetPiecePosition(e) {
    var t;
    (t = this._boardPiece) == null || t.resetPosition(e);
  }
  /**
   * Cancel ongoing interaction and reset position.
   */
  cancelInteraction(e) {
    this._moveState = void 0, this._updateMoveStateVisuals(), this._updateLabelVisuals(), this.resetPiecePosition(e);
  }
  _updateLabelVisuals() {
    this._contentElement.dataset.square = this.label, this._contentElement.dataset.squareColor = ie(this.label);
    const e = [
      this._boardPiece ? `${this.label}, ${this._boardPiece.piece.color} ${this._boardPiece.piece.pieceType}` : `${this.label}`
    ];
    this._moveState === "move-start" && e.push("start of move"), this._moveState === "move-target" && e.push("target square"), this._contentElement.setAttribute("aria-label", e.join(", ")), this._slotElement.name = this.label;
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
  _updateInteractiveCssClass(e, t) {
    this._contentElement.classList.toggle(e, this.interactive && t);
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
  constructor(e, t, i) {
    s(this, "_table");
    s(this, "_boardSquares");
    s(this, "_dispatchEvent");
    s(this, "_shadowRef");
    s(this, "_orientation");
    s(this, "_turn");
    s(this, "_interactive");
    s(this, "_position");
    s(this, "_customPieceTypes");
    s(this, "_boardState");
    s(this, "_tabbableSquare");
    s(this, "_defaultTabbableSquare");
    /**
     * Certain move "finishing" logic is included in `pointerup` (e.g. drags). To
     * prevent re-handling this in the `click` handler, we prevent handling of click
     * events for a certain period after pointerup.
     */
    s(this, "_preventClickHandling");
    // Event handlers
    s(this, "_pointerDownHandler");
    s(this, "_pointerUpHandler");
    s(this, "_pointerMoveHandler");
    s(this, "_clickHandler");
    s(this, "_focusInHandler");
    s(this, "_keyDownHandler");
    /**
     * Duration (in milliseconds) for all animations.
     */
    s(this, "animationDurationMs");
    s(this, "_slotChangeHandler", (e) => {
      b._isSlotElement(e.target) && A(e.target.name) && (this._getBoardSquare(e.target.name).hasContent = e.target.assignedElements().length > 0);
    });
    s(this, "_transitionHandler", (e) => {
      e.target && e.target.style !== void 0 && e.target.style.removeProperty("transition-property");
    });
    this._boardSquares = new Array(64), this._orientation = e.orientation, this.animationDurationMs = e.animationDurationMs, this._interactive = !1, this._position = {}, this._boardState = { id: "default" }, this._dispatchEvent = t, this._shadowRef = i, this._defaultTabbableSquare = y(56, e.orientation), this._table = S("table", {
      attributes: {
        role: "table",
        "aria-label": "Chess board"
      },
      classes: ["board"]
    });
    for (let r = 0; r < 8; r++) {
      const a = S("tr", {
        attributes: { role: "row" }
      });
      for (let n = 0; n < 8; n++) {
        const c = 8 * r + n, d = y(c, this.orientation);
        this._boardSquares[c] = new le(a, d);
      }
      this._table.appendChild(a);
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
  set orientation(e) {
    this._cancelMove(!1), this._orientation = e, this._refreshDefaultTabbableSquare(), this._renderPosition(), this._focusedSquare && this._focusTabbableSquare();
  }
  /**
   * Whether the grid is interactive. This determines the roles and attributes,
   * like tabindex, associated with the grid.
   */
  get interactive() {
    return this._interactive;
  }
  set interactive(e) {
    this._cancelMove(!1), this._interactive = e, this._blurTabbableSquare(), this._table.setAttribute("role", e ? "grid" : "table"), this._boardSquares.forEach((t) => {
      t.interactive = e;
    }), this._resetBoardStateAndMoves();
  }
  get turn() {
    return this._turn;
  }
  /**
   * What side is allowed to move pieces. This may be undefined, in which
   * pieces from either side can be moved around.
   */
  set turn(e) {
    this._cancelMove(!1), this._turn = e;
    for (let t = 0; t < 64; t++) {
      const i = y(t, this.orientation), r = this._position[i];
      this._boardSquares[t].moveable = !r || this._pieceMoveable(r);
    }
  }
  /**
   * Current `Position` object of board.
   */
  get position() {
    return this._position;
  }
  set position(e) {
    if (!re(this._position, e)) {
      this._cancelMove(!1);
      const t = ae(this._position, e);
      this._position = { ...e }, t.moved.forEach(({ oldSquare: i }) => {
        this._getBoardSquare(i).clearPiece();
      }), t.removed.forEach(({ square: i }) => {
        this._getBoardSquare(i).clearPiece(this.animationDurationMs);
      }), t.moved.forEach(({ piece: i, oldSquare: r, newSquare: a }) => {
        const n = this._getStartingPositionForMove(
          r,
          a
        );
        this._getBoardSquare(a).setPiece(
          i,
          this._pieceMoveable(i),
          this._piecePartIdentifier(i),
          {
            type: "slide-in",
            from: n,
            durationMs: this.animationDurationMs
          }
        );
      }), t.added.forEach(({ piece: i, square: r }) => {
        this._getBoardSquare(r).setPiece(
          i,
          this._pieceMoveable(i),
          this._piecePartIdentifier(i),
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
  set tabbableSquare(e) {
    this.tabbableSquare !== e && (this._getBoardSquare(this.tabbableSquare).tabbable = !1, this._getBoardSquare(e).tabbable = !0, this._tabbableSquare = e);
  }
  get customPieceTypes() {
    return this._customPieceTypes;
  }
  set customPieceTypes(e) {
    this._cancelMove(!1), this._customPieceTypes = e, this._renderPosition();
  }
  /**
   * Start a move on the board at `square`, optionally with specified targets
   * at `targetSquares`.
   */
  startMove(e, t) {
    this._interactable(e) && (this._setBoardState({
      id: "awaiting-second-touch",
      startSquare: e
    }), this._startInteraction(e, t));
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
  _startInteraction(e, t) {
    const i = this._position[e];
    if (i) {
      let r = !1;
      const a = [];
      t !== void 0 ? (r = !0, t.forEach((n) => {
        A(n) && a.push(n);
      })) : this._dispatchEvent(
        new CustomEvent("movestart", {
          bubbles: !0,
          detail: {
            from: e,
            piece: i,
            setTargets: (n) => {
              r = !0;
              for (const c of n)
                A(c) && a.push(c);
            }
          }
        })
      ), this._getBoardSquare(e).startInteraction(), this.tabbableSquare = e, this._boardSquares.forEach((n) => {
        n.label !== e && (n.moveTarget = !r || a.includes(n.label), n.markedTarget = r && n.moveTarget);
      });
    }
  }
  _finishMove(e, t) {
    var i, r;
    if (this._boardState.startSquare) {
      const a = this._boardState.startSquare, n = this._position[a];
      if (n !== void 0) {
        const c = new CustomEvent("moveend", {
          bubbles: !0,
          cancelable: !0,
          detail: { from: a, to: e, piece: n }
        });
        if (this._dispatchEvent(c), c.defaultPrevented)
          return !1;
        const d = this._getStartingPositionForMove(a, e);
        this._getBoardSquare(a).clearPiece(), this._getBoardSquare(e).setPiece(
          n,
          this._pieceMoveable(n),
          this._piecePartIdentifier(n),
          // Animate transition only when piece is displaced to a specific location
          t ? {
            type: "slide-in",
            from: d,
            durationMs: this.animationDurationMs
          } : void 0
        ), this.tabbableSquare = e, this._position[e] = this._position[a], delete this._position[a];
        const h = new CustomEvent("movefinished", {
          bubbles: !0,
          detail: { from: a, to: e, piece: n }
        });
        t ? (r = (i = this._getBoardSquare(e).boardPiece) == null ? void 0 : i.animationFinished) == null || r.then(() => {
          this._dispatchEvent(h);
        }) : this._dispatchEvent(h);
      }
      return this._resetBoardStateAndMoves(), !0;
    }
    return !1;
  }
  _userCancelMove(e) {
    if (this._boardState.startSquare) {
      const t = new CustomEvent("movecancel", {
        bubbles: !0,
        cancelable: !0,
        detail: {
          from: this._boardState.startSquare,
          piece: this._position[this._boardState.startSquare]
        }
      });
      if (this._dispatchEvent(t), !t.defaultPrevented)
        return this._cancelMove(e), !0;
    }
    return !1;
  }
  _cancelMove(e) {
    this._boardState.startSquare && this._getBoardSquare(this._boardState.startSquare).cancelInteraction(e ? this.animationDurationMs : void 0), this._resetBoardStateAndMoves();
  }
  _focusTabbableSquare() {
    this.tabbableSquare && this._getBoardSquare(this.tabbableSquare).focus();
  }
  _blurTabbableSquare() {
    this.tabbableSquare && this._getBoardSquare(this.tabbableSquare).blur();
  }
  _resetBoardStateAndMoves() {
    this._boardSquares.forEach((e) => {
      e.removeMoveState(), e.markedTarget = !1;
    }), this._setBoardState({
      id: this.interactive ? "awaiting-input" : "default"
    });
  }
  _piecePartIdentifier(e) {
    const t = ne(e, this._customPieceTypes);
    if (!t)
      throw new Error(
        `No part identifier mapping for piece type: ${e.pieceType}`
      );
    return t;
  }
  _pieceMoveable(e) {
    return !this.turn || e.color === this.turn;
  }
  _renderPosition() {
    for (let e = 0; e < 64; e++) {
      const t = y(e, this.orientation), i = this._position[t];
      this._boardSquares[e].label = t, this._boardSquares[e].tabbable = this.tabbableSquare === t, i ? this._boardSquares[e].setPiece(
        i,
        this._pieceMoveable(i),
        this._piecePartIdentifier(i)
      ) : this._boardSquares[e].clearPiece();
    }
  }
  _interactable(e) {
    const t = this._position[e];
    return !!t && this._pieceMoveable(t);
  }
  _isValidMove(e, t) {
    return e !== t && this._getBoardSquare(t).moveTarget;
  }
  _getBoardSquare(e) {
    return this._boardSquares[L(e, this.orientation)];
  }
  /**
   * Compute an explicit position to apply to a piece that is being moved
   * from `from` to `to`. This can either be the explicit piece position,
   * if already set, for that piece, or it is computed as the offset or
   * difference in rows and columns between the two squares.
   */
  _getStartingPositionForMove(e, t) {
    const [i, r] = x(e, this.orientation), [a, n] = x(t, this.orientation);
    return this._getBoardSquare(e).explicitPiecePosition || {
      type: "squareOffset",
      deltaRows: i - a,
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
    const e = this._defaultTabbableSquare;
    let t = !1;
    if (Object.keys(this._position).length > 0)
      for (let i = 7; i >= 0 && !t; i--)
        for (let r = 0; r <= 7 && !t; r++) {
          const a = y(8 * i + r, this.orientation);
          this._position[a] && (this._defaultTabbableSquare = a, t = !0);
        }
    t || (this._defaultTabbableSquare = y(56, this.orientation)), this._tabbableSquare === void 0 && e !== this._defaultTabbableSquare && (this._getBoardSquare(e).tabbable = !1, this._getBoardSquare(this._defaultTabbableSquare).tabbable = !0);
  }
  _setBoardState(e) {
    const t = this._boardState;
    this._boardState = e, this._boardState.id !== t.id && this._table.classList.toggle("dragging", this._isDragState()), this._boardState.highlightedSquare !== t.highlightedSquare && (t.highlightedSquare && (this._getBoardSquare(t.highlightedSquare).hover = !1), this._boardState.highlightedSquare && (this._getBoardSquare(this._boardState.highlightedSquare).hover = !0));
  }
  _handlePointerDown(e, t) {
    if (t.preventDefault(), t.button === 0)
      switch (this._boardState.id) {
        case "awaiting-input":
          e && this._interactable(e) && (this._setBoardState({
            id: "touching-first-square",
            startSquare: e,
            touchStartX: t.clientX,
            touchStartY: t.clientY
          }), this._startInteraction(e), this._getBoardSquare(e).toggleSecondaryPiece(!0));
          break;
        case "awaiting-second-touch":
        case "moving-piece-kb":
          this._boardState.startSquare === e ? (this._setBoardState({
            id: "canceling-second-touch",
            startSquare: e,
            touchStartX: t.clientX,
            touchStartY: t.clientY
          }), this._getBoardSquare(e).toggleSecondaryPiece(!0)) : e && this._setBoardState({
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
          k(this._boardState);
      }
  }
  _handlePointerUp(e) {
    let t = e;
    switch (this._boardState.id) {
      case "touching-first-square":
        this._getBoardSquare(this._boardState.startSquare).toggleSecondaryPiece(
          !1
        ), this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare
        }), t = this._boardState.startSquare;
        break;
      case "canceling-second-touch":
        this._userCancelMove(!1) || this._setBoardState({
          id: "awaiting-second-touch",
          startSquare: this._boardState.startSquare
        }), t = this._boardState.startSquare;
        break;
      case "dragging":
      case "dragging-outside":
      case "touching-second-square":
        {
          this._getBoardSquare(
            this._boardState.startSquare
          ).toggleSecondaryPiece(!1);
          let i = !1;
          e && this._isValidMove(this._boardState.startSquare, e) ? (i = this._finishMove(e, !this._isDragState()), i || (t = this._boardState.startSquare)) : (t = this._boardState.startSquare, i = this._userCancelMove(
            e !== this._boardState.startSquare
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
        k(this._boardState);
    }
    this._focusedSquare && t && (this.tabbableSquare = t, this._focusTabbableSquare()), this._preventClickHandling = !0, setTimeout(() => {
      this._preventClickHandling = !1;
    }, b.POINTERUP_CLICK_PREVENT_DURATION_MS);
  }
  _handlePointerMove(e, t) {
    switch (this._boardState.id) {
      case "canceling-second-touch":
      case "touching-first-square":
        {
          const i = Math.sqrt(
            (t.clientX - this._boardState.touchStartX) ** 2 + (t.clientY - this._boardState.touchStartY) ** 2
          ), r = this._getBoardSquare(
            this._boardState.startSquare
          ).width, a = Math.max(
            b.DRAG_THRESHOLD_MIN_PIXELS,
            b.DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION * r
          );
          (i > a || e !== this._boardState.startSquare) && (this._getBoardSquare(this._boardState.startSquare).displacePiece(
            t.clientX,
            t.clientY
          ), e ? this._setBoardState({
            id: "dragging",
            startSquare: this._boardState.startSquare,
            highlightedSquare: this._isValidMove(
              this._boardState.startSquare,
              e
            ) ? e : void 0
          }) : this._setBoardState({
            id: "dragging-outside",
            startSquare: this._boardState.startSquare
          }));
        }
        break;
      case "dragging":
      case "dragging-outside":
        this._getBoardSquare(this._boardState.startSquare).displacePiece(
          t.clientX,
          t.clientY
        ), e && e !== this._boardState.highlightedSquare ? this._setBoardState({
          id: "dragging",
          startSquare: this._boardState.startSquare,
          highlightedSquare: this._isValidMove(
            this._boardState.startSquare,
            e
          ) ? e : void 0
        }) : !e && this._boardState.id !== "dragging-outside" && this._setBoardState({
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
        k(this._boardState);
    }
  }
  _handleClick(e) {
    if (!this._preventClickHandling) {
      switch (this._boardState.id) {
        case "awaiting-input":
          e && this._interactable(e) && (this._setBoardState({
            id: "awaiting-second-touch",
            startSquare: e
          }), this._startInteraction(e));
          break;
        case "awaiting-second-touch":
        case "moving-piece-kb":
          (e && this._isValidMove(this._boardState.startSquare, e) ? this._finishMove(e, !0) : this._userCancelMove(e !== this._boardState.startSquare)) || (this._setBoardState({
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
          k(this._boardState);
      }
      this._focusedSquare && e && (this.tabbableSquare = e, this._focusTabbableSquare());
    }
  }
  _handleFocusIn(e) {
    e && // Some browsers (Safari) focus on board squares that are not tabbable
    // (tabindex = -1). If that happens, update tabbable square manually.
    (e !== this.tabbableSquare || // Assign tabbable square if none is explicitly assigned yet.
    this._tabbableSquare === void 0) && (this.tabbableSquare = e);
  }
  _handleKeyDown(e, t) {
    if (t.key === "Enter" || t.key === " ")
      switch (t.preventDefault(), this._boardState.id) {
        case "awaiting-input":
          e && this._interactable(e) && (this._setBoardState({
            id: "moving-piece-kb",
            startSquare: e,
            highlightedSquare: void 0
          }), this._startInteraction(e));
          break;
        case "moving-piece-kb":
        case "awaiting-second-touch":
          e && this._isValidMove(this._boardState.startSquare, e) ? this._finishMove(e, !0) : this._userCancelMove(!1);
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
          k(this._boardState);
      }
    else {
      const i = L(this.tabbableSquare, this.orientation), r = i >> 3, a = i & 7;
      let n = i, c = !1;
      switch (t.key) {
        case "ArrowRight":
        case "Right":
          n = 8 * r + Math.min(7, a + 1), c = !0;
          break;
        case "ArrowLeft":
        case "Left":
          n = 8 * r + Math.max(0, a - 1), c = !0;
          break;
        case "ArrowDown":
        case "Down":
          n = 8 * Math.min(7, r + 1) + a, c = !0;
          break;
        case "ArrowUp":
        case "Up":
          n = 8 * Math.max(0, r - 1) + a, c = !0;
          break;
        case "Home":
          n = t.ctrlKey ? 0 : 8 * r, c = !0;
          break;
        case "End":
          n = t.ctrlKey ? 63 : 8 * r + 7, c = !0;
          break;
        case "PageUp":
          n = a, c = !0;
          break;
        case "PageDown":
          n = 56 + a, c = !0;
          break;
      }
      if (c && t.preventDefault(), n !== i)
        switch (this.tabbableSquare = y(n, this.orientation), this._focusTabbableSquare(), this._boardState.id) {
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
            k(this._boardState);
        }
    }
  }
  /**
   * Convenience wrapper to make pointer, blur, or keyboard event handler for
   * square elements. Attempts to extract square label from the element in
   * question, then passes square label and current event to `callback`.
   */
  _makeEventHandler(e) {
    const t = e.bind(this);
    return (i) => {
      const r = b._isMouseEvent(i) ? this._shadowRef.elementsFromPoint(i.clientX, i.clientY).map((a) => b._extractSquareData(a)).find((a) => !!a) : b._extractSquareData(i.target);
      t(r, i);
    };
  }
  _isDragState() {
    return ["dragging", "dragging-outside"].includes(this._boardState.id);
  }
  static _extractSquareData(e) {
    if (e && e.dataset) {
      const t = e.dataset;
      return A(t.square) ? t.square : void 0;
    }
  }
  static _isMouseEvent(e) {
    return e.clientX !== void 0;
  }
  static _isSlotElement(e) {
    return !!e && e.assignedElements !== void 0;
  }
};
/**
 * Fraction of square width that pointer must be moved to be
 * considered a "drag" action.
 */
s(b, "DRAG_THRESHOLD_SQUARE_WIDTH_FRACTION", 0.1), /**
 * Minimum number of pixels to enable dragging.
 */
s(b, "DRAG_THRESHOLD_MIN_PIXELS", 2), /**
 * Amount of time (in ms) to suppress click handling after a pointerup event.
 */
s(b, "POINTERUP_CLICK_PREVENT_DURATION_MS", 250);
let H = b;
const de = `:host{--square-color-dark: hsl(145deg 32% 44%);--square-color-light: hsl(51deg 24% 84%);--square-color-dark-hover: hsl(144deg 75% 44%);--square-color-light-hover: hsl(52deg 98% 70%);--square-color-dark-active: hsl(142deg 77% 43%);--square-color-light-active: hsl(50deg 95% 64%);--outline-color-dark-active: hsl(138deg 85% 53% / 95%);--outline-color-light-active: hsl(66deg 97% 72% / 95%);--outline-color-focus: hsl(30deg 94% 55% / 90%);--outline-blur-radius: 3px;--outline-spread-radius: 4px;--coords-font-size: .7rem;--coords-font-family: sans-serif;--outer-gutter-width: 4%;--inner-border-width: 1px;--coords-inside-coord-padding-left: .5%;--coords-inside-coord-padding-right: .5%;--move-target-marker-color-dark-square: hsl(144deg 64% 9% / 90%);--move-target-marker-color-light-square: hsl(144deg 64% 9% / 90%);--move-target-marker-radius: 24%;--move-target-marker-radius-occupied: 82%;--ghost-piece-opacity: .35;--piece-drag-z-index: 9999;--piece-drag-coarse-scale: 2.4;--piece-padding: 3%;--arrow-color-primary: hsl(40deg 100% 50% / 80%);--arrow-color-secondary: hsl(7deg 93% 61% / 80%);display:block}:host([hidden]){display:none}.board{width:100%;box-sizing:border-box;border:var(--inner-border-width) solid var(--inner-border-color, var(--square-color-dark));border-collapse:collapse;table-layout:fixed;-webkit-user-select:none;-moz-user-select:none;user-select:none}.board>tr>td{position:relative;padding:12.5% 0 0}[data-square]{position:absolute;width:100%;height:100%;background-color:var(--p-square-color);color:var(--p-label-color);font-family:var(--coords-font-family);font-size:var(--coords-font-size);top:0;right:0;bottom:0;left:0}[data-square]:focus{box-shadow:inset 0 0 var(--outline-blur-radius) var(--outline-spread-radius) var(--outline-color-focus);outline:none}[data-square].marked-target{background:radial-gradient(var(--p-move-target-marker-color) var(--move-target-marker-radius),var(--p-square-color) calc(var(--move-target-marker-radius) + 1px))}[data-square].moveable{touch-action:none}[data-square].has-piece.marked-target,[data-square].has-content.marked-target{background:radial-gradient(var(--p-square-color) var(--move-target-marker-radius-occupied),var(--p-move-target-marker-color) calc(var(--move-target-marker-radius-occupied) + 1px))}[data-square].move-start{--p-square-color: var(--p-square-color-active)}[data-square].move-start:not(:focus){box-shadow:inset 0 0 var(--outline-blur-radius) var(--outline-spread-radius) var(--p-outline-color-active)}@media (hover: hover){[data-square]:is(.moveable,.move-target):hover{--p-square-color: var(--p-square-color-hover)}}[data-square].hover{--p-square-color: var(--p-square-color-hover)}table:not(.dragging) [data-square]:is(.moveable,.move-start,.move-target){cursor:pointer}table.dragging{cursor:grab}.wrapper,.board-arrows-wrapper{position:relative}.coords{position:absolute;display:none;font-family:var(--coords-font-family);font-size:var(--coords-font-size);pointer-events:none;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.coord{display:flex;box-sizing:border-box}.coords.file>.coord{width:12.5%}.coords.rank{flex-direction:column}.coords.rank>.coord{height:12.5%}.wrapper.outside{padding:var(--outer-gutter-width);background-color:var(--square-color-light)}.wrapper.outside>.coords{display:flex;color:var(--square-color-dark)}.wrapper.outside>.coords>.coord{align-items:center;justify-content:center}.wrapper.outside>.coords.file{right:var(--outer-gutter-width);bottom:0;left:var(--outer-gutter-width);width:calc(100% - 2 * var(--outer-gutter-width));height:var(--outer-gutter-width)}.wrapper.outside>.coords.rank{top:var(--outer-gutter-width);bottom:var(--outer-gutter-width);left:0;width:var(--outer-gutter-width);height:calc(100% - 2 * var(--outer-gutter-width))}.wrapper.inside>.coords{display:flex;width:100%;height:100%;top:0;right:0;bottom:0;left:0}.wrapper.inside>.coords>.coord.light{color:var(--square-color-dark)}.wrapper.inside>.coords>.coord.dark{color:var(--square-color-light)}.wrapper.inside>.coords.file>.coord{align-items:flex-end;justify-content:flex-end;padding-right:var(--coords-inside-coord-padding-right)}.wrapper.inside>.coords.rank>.coord{padding-left:var(--coords-inside-coord-padding-left)}[data-square-color=dark]{--p-square-color: var(--square-color-dark);--p-label-color: var(--square-color-light);--p-square-color-hover: var(--square-color-dark-hover);--p-move-target-marker-color: var(--move-target-marker-color-dark-square);--p-square-color-active: var(--square-color-dark-active);--p-outline-color-active: var(--outline-color-dark-active)}[data-square-color=light]{--p-square-color: var(--square-color-light);--p-label-color: var(--square-color-dark);--p-square-color-hover: var(--square-color-light-hover);--p-move-target-marker-color: var(--move-target-marker-color-light-square);--p-square-color-active: var(--square-color-light-active);--p-outline-color-active: var(--outline-color-light-active)}[data-square] .piece,[data-square] .slot{position:absolute;width:100%;height:100%;top:0;right:0;bottom:0;left:0;pointer-events:none}[data-square] .piece{z-index:10;box-sizing:border-box;padding:var(--piece-padding);background-origin:content-box;background-repeat:no-repeat;background-size:cover}[data-square] .piece.moving{z-index:15}[data-square] .piece.secondary{z-index:5;opacity:var(--ghost-piece-opacity)}[data-square].move-start .piece:not(.secondary){z-index:var(--piece-drag-z-index)}@media (pointer: coarse){[data-square] .piece{--p-piece-drag-scale: var(--piece-drag-coarse-scale)}}.bb{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cg style='fill:%23000;stroke:%23000;stroke-linecap:butt'%3e%3cpath d='M9 36.6c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3e%3cpath d='M15 32.6c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3e%3cpath d='M25 8.6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3e%3c/g%3e%3cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' style='fill:none;stroke:%23fff;stroke-linejoin:miter' transform='translate(0 .6)'/%3e%3c/g%3e%3c/svg%3e")}.bk{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22.5 11.63V6' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' style='fill:%23000;fill-opacity:1;stroke-linecap:butt;stroke-linejoin:miter'/%3e%3cpath d='M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7' style='fill:%23000;stroke:%23000'/%3e%3cpath d='M20 8h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3cpath d='M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5v2.1-2.1C20 18 10.85 14 6.97 19.85 4.5 25.5 13 29.5 13 29.5' style='fill:none;stroke:%23fff'/%3e%3cpath d='M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0' style='fill:none;stroke:%23fff'/%3e%3c/g%3e%3c/svg%3e")}.bn{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z' style='fill:%23fff;stroke:%23fff' transform='translate(0 .3)'/%3e%3cpath d='M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z' transform='rotate(30 13.94 15.65)' style='fill:%23fff;stroke:%23fff'/%3e%3cpath d='m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z' style='fill:%23fff;stroke:none' stroke='none' transform='translate(0 .3)'/%3e%3c/g%3e%3c/svg%3e")}.bp{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' style='opacity:1;fill:%23000;fill-opacity:1;fill-rule:nonzero;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3e%3c/svg%3e")}.bq{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:%23000;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round'%3e%3cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z' style='stroke-linecap:butt;fill:%23000'/%3e%3cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z'/%3e%3cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0'/%3e%3ccircle cx='6' cy='12' r='2'/%3e%3ccircle cx='14' cy='9' r='2'/%3e%3ccircle cx='22.5' cy='8' r='2'/%3e%3ccircle cx='31' cy='9' r='2'/%3e%3ccircle cx='39' cy='12' r='2'/%3e%3cpath d='M11 38.5a35 35 1 0 0 23 0' style='fill:none;stroke:%23000;stroke-linecap:butt'/%3e%3cg style='fill:none;stroke:%23fff'%3e%3cpath d='M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")}.br{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:%23000;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z' style='stroke-linecap:butt' transform='translate(0 .3)'/%3e%3cpath d='M14 29.5v-13h17v13H14z' style='stroke-linecap:butt;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3cpath d='M14 16.5 11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z' style='stroke-linecap:butt' transform='translate(0 .3)'/%3e%3cpath d='M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23' style='fill:none;stroke:%23fff;stroke-width:1;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3c/g%3e%3c/svg%3e")}.wb{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1' transform='translate(0 .6)'%3e%26gt;%3cg style='fill:%23fff;stroke:%23000;stroke-linecap:butt'%3e%3cpath d='M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z'/%3e%3cpath d='M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z'/%3e%3cpath d='M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z'/%3e%3c/g%3e%3cpath d='M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3c/g%3e%3c/svg%3e")}.wk{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22.5 11.63V6M20 8h5' style='fill:none;stroke:%23000;stroke-linejoin:miter'/%3e%3cpath d='M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5' style='fill:%23fff;stroke:%23000;stroke-linecap:butt;stroke-linejoin:miter'/%3e%3cpath d='M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7' style='fill:%23fff;stroke:%23000'/%3e%3cpath d='M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0' style='fill:none;stroke:%23000'/%3e%3c/g%3e%3c/svg%3e")}.wn{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21' style='fill:%23fff;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3' style='fill:%23fff;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z' style='fill:%23000;stroke:%23000' transform='translate(0 .3)'/%3e%3cpath d='M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z' transform='rotate(30 13.94 15.65)' style='fill:%23000;stroke:%23000'/%3e%3c/g%3e%3c/svg%3e")}.wp{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cpath d='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z' style='opacity:1;fill:%23fff;fill-opacity:1;fill-rule:nonzero;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'/%3e%3c/svg%3e")}.wq{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='fill:%23fff;stroke:%23000;stroke-width:1.5;stroke-linejoin:round'%3e%3cpath d='M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z'/%3e%3cpath d='M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z'/%3e%3cpath d='M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0' style='fill:none'/%3e%3ccircle cx='6' cy='12' r='2'/%3e%3ccircle cx='14' cy='9' r='2'/%3e%3ccircle cx='22.5' cy='8' r='2'/%3e%3ccircle cx='31' cy='9' r='2'/%3e%3ccircle cx='39' cy='12' r='2'/%3e%3c/g%3e%3c/svg%3e")}.wr{background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='45' height='45'%3e%3cg style='opacity:1;fill:%23fff;fill-opacity:1;fill-rule:evenodd;stroke:%23000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1'%3e%3cpath d='M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5' style='stroke-linecap:butt' transform='translate(0 .3)'/%3e%3cpath d='m34 14.3-3 3H14l-3-3'/%3e%3cpath d='M31 17v12.5H14V17' style='stroke-linecap:butt;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3cpath d='m31 29.8 1.5 2.5h-20l1.5-2.5'/%3e%3cpath d='M11 14h23' style='fill:none;stroke:%23000;stroke-linejoin:miter' transform='translate(0 .3)'/%3e%3c/g%3e%3c/svg%3e")}.arrows{position:absolute;z-index:20;width:100%;height:100%;box-sizing:border-box;border:var(--inner-border-width) solid transparent;top:0;right:0;bottom:0;left:0;pointer-events:none;touch-action:none}.arrow-primary{color:var(--arrow-color-primary)}.arrow-secondary{color:var(--arrow-color-secondary)}`, he = ["inside", "outside", "hidden"];
class V {
  constructor(e) {
    s(this, "element");
    s(this, "_coordElements");
    s(this, "_orientation");
    s(this, "_direction");
    this.element = S("div", {
      attributes: {
        role: "presentation",
        "aria-hidden": "true"
      },
      classes: ["coords", e.direction]
    }), this._direction = e.direction, this._orientation = e.orientation, this._coordElements = new Array(8);
    const t = e.direction === "file" ? "dark" : "light", i = e.direction === "file" ? "light" : "dark";
    for (let r = 0; r < 8; r++) {
      const a = r % 2 === 0 ? t : i, n = S("div", { classes: ["coord", a] });
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
  set orientation(e) {
    this._orientation = e, this._updateCoordsText();
  }
  _updateCoordsText() {
    for (let e = 0; e < 8; e++)
      this._direction === "file" ? this._coordElements[e].textContent = String.fromCharCode(
        97 + (this.orientation === "white" ? e : 7 - e)
      ) : this._coordElements[e].textContent = `${this.orientation === "white" ? 8 - e : e + 1}`;
  }
}
function ue(o) {
  return he.includes(o);
}
const l = class l {
  constructor(e) {
    s(this, "element");
    s(this, "_defs");
    s(this, "_group");
    s(this, "_orientation");
    s(this, "_arrows");
    s(this, "_arrowElements", /* @__PURE__ */ new Map());
    s(this, "_markerElements", /* @__PURE__ */ new Map());
    this.element = q("svg", {
      attributes: {
        viewBox: "0 0 80 80"
      },
      classes: ["arrows"]
    }), this._orientation = e, this._defs = q("defs"), this.element.appendChild(this._defs), this._group = q("g"), this.element.appendChild(this._group);
  }
  get arrows() {
    return this._arrows;
  }
  set arrows(e) {
    const t = e == null ? void 0 : e.filter((c) => c.from !== c.to), i = t ? new Set(t.map((c) => l._escapedBrushName(c.brush))) : /* @__PURE__ */ new Set(), r = new Set(this._markerElements.keys());
    r.forEach((c) => {
      if (!i.has(c)) {
        const d = this._markerElements.get(c);
        d && (this._defs.removeChild(d), this._markerElements.delete(c));
      }
    }), i.forEach((c) => {
      if (!r.has(c)) {
        const d = l._makeMarker(c);
        this._defs.appendChild(d), this._markerElements.set(c, d);
      }
    });
    const a = new Set(this._arrowElements.keys()), n = t ? new Set(t.map((c) => l._arrowHash(c))) : /* @__PURE__ */ new Set();
    a.forEach((c) => {
      if (!n.has(c)) {
        const d = this._arrowElements.get(c);
        d && (this._group.removeChild(d), this._arrowElements.delete(c));
      }
    }), t == null || t.forEach((c) => {
      const d = l._arrowHash(c);
      if (!this._arrowElements.has(d)) {
        const h = this._makeArrow(c);
        this._arrowElements.set(d, h), this._group.appendChild(h);
      }
    }), this._arrows = t ? [...t] : void 0;
  }
  /**
   * Orientation of the board; this determines direction to draw arrows.
   */
  get orientation() {
    return this._orientation;
  }
  set orientation(e) {
    var t;
    e !== this._orientation && (this._orientation = e, (t = this._arrows) == null || t.forEach((i) => {
      const r = l._arrowHash(i), a = this._arrowElements.get(r);
      a && this._group.removeChild(a);
      const n = this._makeArrow(i);
      this._group.appendChild(n), this._arrowElements.set(r, n);
    }));
  }
  _makeArrow(e) {
    const t = l._getSvgStrokeWidth(
      e.weight || l._DEFAULT_ARROW_WEIGHT
    ), i = x(e.from, this.orientation), r = x(e.to, this.orientation), a = {
      x1: i[1] * 10 + 5,
      y1: i[0] * 10 + 5,
      x2: r[1] * 10 + 5,
      y2: r[0] * 10 + 5
    }, n = l._computeXYProjections(
      t * l._ARROW_LENGTH,
      a
    ), c = l._computeXYProjections(
      l._ARROW_START_MARGIN,
      a
    ), d = l._escapedBrushName(
      e.brush || l._DEFAULT_BRUSH_NAME
    ), h = l._makeArrowClass(d);
    return q("line", {
      attributes: {
        x1: `${a.x1 + c.x}`,
        y1: `${a.y1 + c.y}`,
        x2: `${a.x2 - n.x}`,
        y2: `${a.y2 - n.y}`,
        stroke: "currentColor",
        "stroke-width": `${t}`,
        "marker-end": `url(#${l._makeArrowHeadId(d)})`,
        part: h
      },
      classes: [h]
    });
  }
  static _makeMarker(e) {
    const t = q("marker", {
      attributes: {
        id: l._makeArrowHeadId(e),
        refX: "0",
        refY: `${l._ARROW_WIDTH / 2}`,
        orient: "auto",
        markerWidth: `${l._ARROW_LENGTH}`,
        markerHeight: `${l._ARROW_WIDTH}`
      }
    }), i = l._makeArrowClass(e), r = q("polygon", {
      attributes: {
        fill: "currentColor",
        points: `0,0 ${l._ARROW_LENGTH},${l._ARROW_WIDTH / 2} 0,${l._ARROW_WIDTH}`,
        part: i
      },
      classes: [i]
    });
    return t.appendChild(r), t;
  }
  static _getSvgStrokeWidth(e) {
    switch (e) {
      case "bold":
        return 2.5;
      case "light":
        return 1;
      case "normal":
      default:
        return 1.8;
    }
  }
  static _escapedBrushName(e) {
    return CSS.escape(e || l._DEFAULT_BRUSH_NAME);
  }
  static _makeArrowHeadId(e) {
    return `arrowhead-${e}`;
  }
  static _makeArrowClass(e) {
    return `arrow-${e}`;
  }
  static _computeXYProjections(e, t) {
    const i = Math.atan2(t.y2 - t.y1, t.x2 - t.x1);
    return { x: e * Math.cos(i), y: e * Math.sin(i) };
  }
  static _arrowHash(e) {
    return `${e.from}_${e.to}_${e.brush || l._DEFAULT_BRUSH_NAME}_${e.weight || l._DEFAULT_ARROW_WEIGHT}`;
  }
};
/**
 * Length of arrow from base to tip, in terms of line "stroke width" units.
 */
s(l, "_ARROW_LENGTH", 2.4), /**
 * Width of arrow base, in terms of line "stroke width" units.
 */
s(l, "_ARROW_WIDTH", 2), /**
 * Margin applied at start of line, along direction of arrow. In CSS viewport units.
 */
s(l, "_ARROW_START_MARGIN", 2.7), /**
 * Default brush name when none is specified for an arrow.
 */
s(l, "_DEFAULT_BRUSH_NAME", "primary"), /**
 * Default arrow weight when none is specified.
 */
s(l, "_DEFAULT_ARROW_WEIGHT", "normal");
let N = l;
const g = class g extends HTMLElement {
  constructor() {
    super();
    s(this, "_shadow");
    s(this, "_style");
    s(this, "_wrapper");
    s(this, "_boardArrowsWrapper");
    s(this, "_board");
    s(this, "_fileCoords");
    s(this, "_rankCoords");
    s(this, "_arrows");
    s(this, "_customPieceTypes");
    s(this, "_pendingFen");
    this._shadow = this.attachShadow({ mode: "open" }), this._style = document.createElement("style"), this._style.textContent = de, this._shadow.appendChild(this._style), this._wrapper = S("div", {
      classes: ["wrapper", g._DEFAULT_COORDS_PLACEMENT]
    }), this._shadow.appendChild(this._wrapper), this._boardArrowsWrapper = S("div", {
      classes: ["board-arrows-wrapper"]
    }), this._wrapper.appendChild(this._boardArrowsWrapper), this._board = new H(
      {
        orientation: g._DEFAULT_SIDE,
        animationDurationMs: g._DEFAULT_ANIMATION_DURATION_MS
      },
      (t) => this.dispatchEvent(t),
      this._shadow
    ), this._boardArrowsWrapper.appendChild(this._board.element), this._fileCoords = new V({
      direction: "file",
      orientation: g._DEFAULT_SIDE
    }), this._rankCoords = new V({
      direction: "rank",
      orientation: g._DEFAULT_SIDE
    }), this._wrapper.appendChild(this._fileCoords.element), this._wrapper.appendChild(this._rankCoords.element), this._arrows = new N(g._DEFAULT_SIDE), this._boardArrowsWrapper.appendChild(this._arrows.element);
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
  attributeChangedCallback(t, i, r) {
    switch (t) {
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
        k(t);
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
      $,
      g._DEFAULT_SIDE
    );
  }
  set orientation(t) {
    this.setAttribute("orientation", t);
  }
  /**
   * What side is allowed to move pieces. Either `"white`, `"black"`, or
   * unset. When unset, pieces from either side can be moved around.
   *
   * @attr
   */
  get turn() {
    return this._parseRestrictedStringAttribute("turn", $);
  }
  set turn(t) {
    t ? this.setAttribute("turn", t) : this.removeAttribute("turn");
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
  set interactive(t) {
    this._setBooleanAttribute("interactive", t);
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
  set position(t) {
    this._pendingFen = void 0, this._board.position = { ...t };
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
    return z(this._board.position, this._customPieceTypes);
  }
  set fen(t) {
    const i = F(t, this._customPieceTypes);
    if (i.ok)
      this._pendingFen = void 0, this.position = i.position;
    else if (i.error === "unknown-pieces")
      this._pendingFen = t;
    else
      throw new Error(`Invalid FEN position: ${t}`);
  }
  /**
   * A map of single lowercase FEN letters to full piece type names, used
   * for fairy chess variants. For example, `{ a: "amazon", c: "commoner" }`.
   *
   * Keys must be single lowercase letters `a-z` that do not conflict with
   * standard FEN piece letters (`p`, `n`, `b`, `r`, `q`, `k`).
   *
   * Custom pieces can be styled via CSS `::part()` selectors using the
   * FEN letter: e.g. `::part(piece-wa)` for a white amazon (letter `a`).
   */
  get customPieceTypes() {
    return this._customPieceTypes;
  }
  set customPieceTypes(t) {
    t && oe(t), z(this._board.position, t), this._customPieceTypes = t, this._board.customPieceTypes = t, this._applyPendingFen();
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
      ue,
      g._DEFAULT_COORDS_PLACEMENT
    );
  }
  set coordinates(t) {
    this.setAttribute("coordinates", t);
  }
  /**
   * Duration, in milliseconds, of animation when adding/removing/moving pieces.
   *
   * @attr [animation-duration=200]
   */
  get animationDuration() {
    return this._parseNumberAttribute(
      "animation-duration",
      g._DEFAULT_ANIMATION_DURATION_MS
    );
  }
  set animationDuration(t) {
    this._setNumberAttribute("animation-duration", t);
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
  set arrows(t) {
    this._arrows.arrows = t;
  }
  addEventListener(t, i, r) {
    super.addEventListener(t, i, r);
  }
  removeEventListener(t, i, r) {
    super.removeEventListener(t, i, r);
  }
  /**
   * Start a move on the board at `square`, optionally with specified targets
   * at `targetSquares`.
   */
  startMove(t, i) {
    this._board.startMove(t, i);
  }
  /**
   * Imperatively cancel any in-progress moves.
   */
  cancelMove() {
    this._board.cancelMove();
  }
  _applyPendingFen() {
    if (this._pendingFen === void 0)
      return;
    const t = F(this._pendingFen, this._customPieceTypes);
    t.ok && (this._pendingFen = void 0, this.position = t.position);
  }
  _hasBooleanAttribute(t) {
    var i;
    return this.hasAttribute(t) && ((i = this.getAttribute(t)) == null ? void 0 : i.toLowerCase()) !== "false";
  }
  _setBooleanAttribute(t, i) {
    i ? this.setAttribute(t, "") : this.removeAttribute(t);
  }
  _setNumberAttribute(t, i) {
    this.setAttribute(t, i.toString());
  }
  _parseRestrictedStringAttribute(t, i) {
    const r = this.getAttribute(t);
    return i(r) ? r : void 0;
  }
  _parseRestrictedStringAttributeWithDefault(t, i, r) {
    const a = this._parseRestrictedStringAttribute(t, i);
    return a !== void 0 ? a : r;
  }
  _parseNumberAttribute(t, i) {
    const r = this.getAttribute(t);
    return r === null || Number.isNaN(Number(r)) ? i : Number(r);
  }
};
s(g, "_DEFAULT_SIDE", "white"), s(g, "_DEFAULT_ANIMATION_DURATION_MS", 200), s(g, "_DEFAULT_COORDS_PLACEMENT", "inside");
let B = g;
customElements.define("g-chess-board", B);
export {
  B as GChessBoardElement
};
//# sourceMappingURL=index.es.js.map
