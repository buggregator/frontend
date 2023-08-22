import { expect, test, describe } from "vitest";
import { formatDuration } from "./formats";

describe("formatDuration", () => {
  test("should return correct string for milliseconds", () => {
    expect(formatDuration(1)).toBe("0.0010 ms");
    expect(formatDuration(1000)).toBe("1 ms");
  });

  test("should return correct string for milliseconds negative", () => {
    expect(formatDuration(-1)).toBe("0.0010 ms");
    expect(formatDuration(-1000)).toBe("1 ms");
  });

  test("should return correct string for seconds", () => {
    expect(formatDuration(1000 * 1000)).toBe("1 s");
    expect(formatDuration(1000 * 1000 * 59.9999)).toBe("59 s, 999.9000 ms");
  });

  test("should return correct string for minutes", () => {
    expect(formatDuration(1000 * 1000 * 60)).toBe("1 m");
    expect(formatDuration(1000 * 1000 * 60 * 59.9999)).toBe("59 m, 59 s, 994 ms");
  });

  test("should return correct string for hours", () => {
    expect(formatDuration(1000 * 1000 * 60 * 60)).toBe("1 h");
    expect(formatDuration(1000 * 1000 * 60 * 60 * 23.9999)).toBe("23 h, 59 m, 59 s, 640 ms");
  });

  test("should return correct string for days", () => {
    expect(formatDuration(1000 * 1000 * 60 * 60 * 24)).toBe("1 d");
    expect(formatDuration(1000 * 1000 * 60 * 60 * 24 * 364.9999)).toBe("364 d, 23 h, 59 m, 51 s, 360 ms");
  });
});
