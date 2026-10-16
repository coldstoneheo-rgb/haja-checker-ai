import { describe, it, expect } from "vitest";
import { computeNextDefectSequence, newDefectDisplayId } from "@/lib/db/id";

const DATE_20260511 = new Date(2026, 4, 11); // 2026-05-11

describe("computeNextDefectSequence", () => {
  it("returns 1 when there are no existing displayIds", () => {
    expect(computeNextDefectSequence([], DATE_20260511)).toBe(1);
  });

  it("returns max + 1 for existing ids on the same day", () => {
    const ids = [
      "D-20260511-001",
      "D-20260511-002",
      "D-20260511-003",
    ];
    expect(computeNextDefectSequence(ids, DATE_20260511)).toBe(4);
  });

  it("ignores ids from a different date", () => {
    const ids = ["D-20260510-001", "D-20260510-005"];
    expect(computeNextDefectSequence(ids, DATE_20260511)).toBe(1);
  });

  it("skips gaps — no duplicate after deletion", () => {
    // After D-001 and D-002 exist, user deletes D-001.
    // count-based logic would yield 1 again; max-based correctly yields 3.
    const ids = ["D-20260511-002"];
    expect(computeNextDefectSequence(ids, DATE_20260511)).toBe(3);
  });

  it("handles non-numeric suffixes gracefully", () => {
    const ids = ["D-20260511-abc", "D-20260511-001"];
    expect(computeNextDefectSequence(ids, DATE_20260511)).toBe(2);
  });

  it("mixed dates — only today's ids count", () => {
    const ids = [
      "D-20260510-010",
      "D-20260511-002",
      "D-20260511-004",
    ];
    expect(computeNextDefectSequence(ids, DATE_20260511)).toBe(5);
  });
});

describe("newDefectDisplayId", () => {
  it("formats sequence with zero-padding", () => {
    expect(newDefectDisplayId(1, DATE_20260511)).toBe("D-20260511-001");
    expect(newDefectDisplayId(42, DATE_20260511)).toBe("D-20260511-042");
    expect(newDefectDisplayId(999, DATE_20260511)).toBe("D-20260511-999");
  });
});
