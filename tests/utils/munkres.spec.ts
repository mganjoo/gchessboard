import { test, expect } from "@playwright/test";
import { munkres } from "../../src/utils/munkres.js";

test.describe("munkres", () => {
  test("works", () => {
    const result = munkres([
      [99, 40, 75, 81, 76, 83],
      [74, 51, 94, 55, 55, 81],
      [34, 91, 75, 25, 35, 94],
      [7, 36, 66, 55, 10, 40],
      [83, 9, 3, 8, 23, 7],
      [64, 94, 47, 89, 26, 42],
    ]);
    expect(result).toStrictEqual([
      [0, 1],
      [1, 4],
      [2, 3],
      [3, 0],
      [4, 2],
      [5, 5],
    ]);
  });

  test("transparently returns for empty matrices", () => {
    expect(munkres([])).toStrictEqual([]);
  });

  test("automatically pads with 0s when rows < cols", () => {
    const result = munkres([
      [47, 68, 13],
      [51, 31, 70],
    ]);
    expect(result).toStrictEqual([
      [0, 2],
      [1, 1],
    ]);
  });

  test("automatically pads with 0s when cols < rows", () => {
    const result = munkres([
      [50, 42],
      [93, 56],
      [58, 66],
    ]);
    expect(result).toStrictEqual([
      [0, 1],
      [2, 0],
    ]);
  });

  test("automatically pads with 0s for irregular matrices", () => {
    const result = munkres([
      [50, 42, 70],
      [93, 56],
      [58, 66, 52],
    ]);
    expect(result).toStrictEqual([
      [0, 1],
      [1, 2],
      [2, 0],
    ]);
  });
});
