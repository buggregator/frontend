import { expect, test, describe } from "vitest";
import { getNotEmptyArrayOrNull } from "./arrays";

describe("getNotEmptyArrayOrNull", () => {
  // create test for check non array data: [number, object, map, set, string, boolean, null, undefined]
  test("should return null if data is primitive", () => {
    expect(getNotEmptyArrayOrNull(1)).toBe(null);
    expect(getNotEmptyArrayOrNull(Infinity)).toBe(null);
    expect(getNotEmptyArrayOrNull("string")).toBe(null);
    expect(getNotEmptyArrayOrNull(false)).toBe(null);
    expect(getNotEmptyArrayOrNull(null)).toBe(null);
    expect(getNotEmptyArrayOrNull(undefined)).toBe(null);
  });

  test("should return null if data is object", () => {
    expect(getNotEmptyArrayOrNull({ a: 1, b: "2", c: true })).toBe(null);
    expect(
      getNotEmptyArrayOrNull(
        new Map([
          ["a", 1],
          ["b", 2],
          ["c", 3],
        ])
      )
    ).toBe(null);
    expect(getNotEmptyArrayOrNull(new Set([1, "2", true]))).toBe(null);
    expect(getNotEmptyArrayOrNull(Math)).toBe(null);
  });

  test("should return null if data is empty array", () => {
    expect(getNotEmptyArrayOrNull([])).toBe(null);
    expect(getNotEmptyArrayOrNull(([1, 2].length = 0))).toBe(null);
  });

  test("should return null if data is not empty array", () => {});

  test("should return not empty array if data is not empty array", () => {
    const data = [1, 2, 3];
    const result = getNotEmptyArrayOrNull(data);
    expect(result).toBe(data);
  });
});
