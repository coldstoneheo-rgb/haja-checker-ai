import { describe, it, expect } from "vitest";
import { newId, newDefectDisplayId } from "@/lib/db/id";

describe("newId", () => {
  it("returns a non-empty string", () => {
    expect(typeof newId()).toBe("string");
    expect(newId().length).toBeGreaterThan(0);
  });

  it("returns unique values across calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()));
    expect(ids.size).toBe(100);
  });
});

describe("newDefectDisplayId", () => {
  it("matches D-YYYYMMDD-NNN format", () => {
    const id = newDefectDisplayId(1);
    expect(id).toMatch(/^D-\d{8}-\d{3}$/);
  });

  it("zero-pads sequence to 3 digits", () => {
    expect(newDefectDisplayId(1)).toMatch(/-001$/);
    expect(newDefectDisplayId(42)).toMatch(/-042$/);
    expect(newDefectDisplayId(999)).toMatch(/-999$/);
  });

  it("uses the provided date", () => {
    const date = new Date(2025, 4, 11); // May 11 2025
    expect(newDefectDisplayId(1, date)).toBe("D-20250511-001");
  });

  it("pads single-digit month and day", () => {
    const date = new Date(2025, 0, 5); // Jan 5 2025
    expect(newDefectDisplayId(7, date)).toBe("D-20250105-007");
  });

  it("handles sequence > 999 without truncation", () => {
    const id = newDefectDisplayId(1000);
    expect(id).toMatch(/^D-\d{8}-1000$/);
  });
});
