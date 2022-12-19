/**
 * This code is a TypeScript port of code in https://github.com/addaleax/munkres-js.
 *
 * Some changes include porting to TypeScript, simplifying some loop logic, and
 * other formatting and name changes.
 *
 * Original copyright details:
 *
 * Copyright 2014 Anna Henningsen (Conversion to JS)
 * Copyright 2008 Brian M. Clapper
 *
 * Original Copyright and License
 * ==============================
 *
 * Copyright 2008-2016 Brian M. Clapper
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const STAR = 1;
const PRIME = 2;
type Marking = 0 | typeof STAR | typeof PRIME;

class Munkres {
  C: number[][];
  n: number;
  originalRows: number;
  originalCols: number;
  marked: Marking[][];
  rowCovered: boolean[];
  colCovered: boolean[];
  Z0Row = 0;
  Z0Col = 0;

  constructor(costMatrix: number[][], padValue?: number) {
    const maxNumColumns = costMatrix.reduce(
      (acc, row) => Math.max(acc, row.length),
      0
    );
    this.n = Math.max(costMatrix.length, maxNumColumns);
    this.originalRows = costMatrix.length;
    this.originalCols = maxNumColumns;

    this.C = [];
    for (let i = 0; i < this.n; i++) {
      const row = costMatrix[i] === undefined ? [] : costMatrix[i].slice();
      while (row.length < this.n) {
        row.push(padValue || 0);
      }
      this.C.push(row);
    }

    this.marked = this._makeMatrix(this.n, 0);
    this.rowCovered = Array(this.n).fill(false);
    this.colCovered = Array(this.n).fill(false);
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
    let step = 1;

    const steps: Record<number, () => number> = {
      1: this._step1,
      2: this._step2,
      3: this._step3,
      4: this._step4,
      5: this._step5,
      6: this._step6,
    };

    for (;;) {
      const func = steps[step];
      if (!func)
        // done
        break;

      step = func.apply(this);
    }

    const results = [];
    for (let i = 0; i < this.originalRows; ++i)
      for (let j = 0; j < this.originalCols; ++j)
        if (this.marked[i][j] == STAR) {
          results.push([i, j]);
        }

    return results;
  }

  /**
   * Create an n×n matrix, populating it with the specific value.
   */
  private _makeMatrix<T>(n: number, val: T) {
    const matrix: T[][] = [];
    for (let i = 0; i < n; ++i) {
      const row: T[] = [];
      for (let j = 0; j < n; ++j) {
        row.push(val);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * For each row of the matrix, find the smallest element and
   * subtract it from every element in its row. Go to Step 2.
   */
  private _step1() {
    for (let i = 0; i < this.n; ++i) {
      // Find the minimum value for this row and subtract that minimum
      // from every element in the row.
      const minval = Math.min(...this.C[i]);
      for (let j = 0; j < this.n; ++j) {
        this.C[i][j] -= minval;
      }
    }
    return 2;
  }

  /**
   * Find a zero (Z) in the resulting matrix. If there is no starred
   * zero in its row or column, star Z. Repeat for each element in the
   * matrix. Go to Step 3.
   */
  private _step2() {
    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.n; ++j) {
        if (this.C[i][j] === 0 && !this.rowCovered[i] && !this.colCovered[j]) {
          this.marked[i][j] = STAR;
          this.rowCovered[i] = true;
          this.colCovered[j] = true;
          break;
        }
      }
    }
    this._clearCovers();
    return 3;
  }

  /**
   * Cover each column containing a starred zero. If K columns are
   * covered, the starred zeros describe a complete set of unique
   * assignments. In this case, Go to DONE, otherwise, Go to Step 4.
   */
  private _step3() {
    let count = 0;

    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.n; ++j) {
        if (this.marked[i][j] === STAR && !this.colCovered[j]) {
          this.colCovered[j] = true;
          count++;
        }
      }
    }

    return count >= this.n ? 7 : 4;
  }

  /**
   * Find an uncovered zero and prime it. If there is no starred zero
   * in the row containing this primed zero, go to Step 5. Otherwise,
   * cover this row and uncover the column containing the starred
   * zero. Continue in this manner until there are no uncovered zeros
   * left. Go to Step 6.
   */
  private _step4() {
    let star_col = -1;

    for (;;) {
      const [row, col] = this._findFirstUncoveredZero();
      if (row < 0) {
        return 6;
      }

      this.marked[row][col] = PRIME;
      star_col = this._findStarInRow(row);
      if (star_col >= 0) {
        this.rowCovered[row] = true;
        this.colCovered[star_col] = false;
      } else {
        this.Z0Row = row;
        this.Z0Col = col;
        return 5;
      }
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
  private _step5() {
    let count = 0;
    const path: number[][] = [[this.Z0Row, this.Z0Col]];

    for (;;) {
      const row = this._findStarInCol(path[count][1]);
      if (row < 0) {
        break;
      }

      path.push([row, path[count][1]]);
      count++;

      const col = this._findPrimeInRow(path[count][0]);
      path.push([path[count][0], col]);
      count++;
    }

    for (let i = 0; i <= count; i++) {
      const [row, col] = path[i];
      // Element at row, col is either starred or primed.
      //   if star -> unstar
      //   if prime -> star
      this.marked[row][col] = this.marked[row][col] == STAR ? 0 : STAR;
    }

    this._clearCovers();
    this._erasePrimes();
    return 3;
  }

  /**
   * Add the value found in Step 4 to every element of each covered
   * row, and subtract it from every element of each uncovered column.
   * Return to Step 4 without altering any stars, primes, or covered
   * lines.
   */
  private _step6() {
    const minval = this._findSmallestUncovered();

    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.rowCovered[i]) {
          this.C[i][j] += minval;
        }
        if (!this.colCovered[j]) {
          this.C[i][j] -= minval;
        }
      }
    }

    return 4;
  }

  /**
   * Clear all covered matrix cells.
   */
  private _clearCovers() {
    for (let i = 0; i < this.n; i++) {
      this.rowCovered[i] = false;
      this.colCovered[i] = false;
    }
  }

  /**
   * Erase all prime markings.
   */
  private _erasePrimes() {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++)
        if (this.marked[i][j] === PRIME) {
          this.marked[i][j] = 0;
        }
    }
  }

  /**
   * Find the first uncovered element with value 0. If none found, return [-1, -1].
   */
  private _findFirstUncoveredZero(): [number, number] {
    for (let i = 0; i < this.n; i++)
      for (let j = 0; j < this.n; j++)
        if (this.C[i][j] === 0 && !this.rowCovered[i] && !this.colCovered[j])
          return [i, j];

    return [-1, -1];
  }

  /**
   * Find the first starred element in the specified row. Returns
   * the column index, or -1 if no starred element was found.
   */
  private _findStarInRow(row: number) {
    for (let j = 0; j < this.n; j++) {
      if (this.marked[row][j] == STAR) {
        return j;
      }
    }
    return -1;
  }

  /**
   * Find the first starred element in the specified column. Returns
   * the row index, or -1 if no starred element was found.
   */
  private _findStarInCol(col: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.marked[i][col] == STAR) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find the first prime element in the specified row. Returns the column
   * index, or -1 if no prime element was found.
   */

  private _findPrimeInRow(row: number) {
    for (let j = 0; j < this.n; j++) {
      if (this.marked[row][j] == PRIME) {
        return j;
      }
    }
    return -1;
  }

  /**
   * Find the smallest uncovered value in the matrix.
   */
  private _findSmallestUncovered() {
    let minval = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (
          !this.rowCovered[i] &&
          !this.colCovered[j] &&
          minval > this.C[i][j]
        ) {
          minval = this.C[i][j];
        }
      }
    }

    return minval;
  }
}

export function munkres(costMatrix: number[][], padValue?: number) {
  const m = new Munkres(costMatrix, padValue);
  return m.compute();
}
