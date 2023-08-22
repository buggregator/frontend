import { expect, test, describe } from "vitest";
import { formatDuration } from "./formats";

describe("formatDuration", () => {
  test("should return correct string for positive number", () => {
    expect(formatDuration(1000)).toBe("1.0000 ms");
  });

  test("should return correct string for negative number", () => {
    expect(formatDuration(-1000)).toBe("1.0000 ms");
  });

  test("should return correct string for milliseconds", () => {
    expect(formatDuration(1)).toBe("0.0010 ms");
    expect(formatDuration(1000)).toBe("1.0000 ms");
  });

  test("should return correct string for seconds", () => {
    expect(formatDuration(1000 * 1000)).toBe("1.0000 s");
    expect(formatDuration(1000 * 1000 * 59.9999)).toBe("59.0000 s, 999.9000 ms");
  });

  test("should return correct string for minutes", () => {
    expect(formatDuration(1000 * 1000 * 60)).toBe("1.0000 m");
    expect(formatDuration(1000 * 1000 * 60 * 59.9999)).toBe("59.0000 m, 59.0000 s, 994.0000 ms");
  });

  test("should return correct string for hours", () => {
    expect(formatDuration(1000 * 1000 * 60 * 60)).toBe("1.0000 h");
    expect(formatDuration(1000 * 1000 * 60 * 60 * 23.9999)).toBe("23.0000 h, 59.0000 m, 59.0000 s, 640.0000 ms");
  });

  test("should return correct string for days", () => {
    expect(formatDuration(1000 * 1000 * 60 * 60 * 24)).toBe("1.0000 d");
  });
});
