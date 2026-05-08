import { describe, it, expect } from "vitest";
import { CHECKLIST_SEED, DEFAULT_AREAS } from "@/lib/seed/checklist";

describe("DEFAULT_AREAS", () => {
  it("has no duplicate area names", () => {
    const unique = new Set(DEFAULT_AREAS);
    expect(unique.size).toBe(DEFAULT_AREAS.length);
  });

  it("is non-empty", () => {
    expect(DEFAULT_AREAS.length).toBeGreaterThan(0);
  });
});

describe("CHECKLIST_SEED", () => {
  it("is non-empty", () => {
    expect(CHECKLIST_SEED.length).toBeGreaterThan(0);
  });

  it("every item belongs to a known area", () => {
    const areaSet = new Set(DEFAULT_AREAS);
    for (const item of CHECKLIST_SEED) {
      expect(areaSet.has(item.area), `unknown area: "${item.area}"`).toBe(true);
    }
  });

  it("every item has requiredPhotoCount >= 1", () => {
    for (const item of CHECKLIST_SEED) {
      expect(
        item.requiredPhotoCount,
        `${item.title}: requiredPhotoCount should be >= 1`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("every item has a non-empty title, description, and captureGuide", () => {
    for (const item of CHECKLIST_SEED) {
      expect(item.title.trim(), `empty title in area ${item.area}`).toBeTruthy();
      expect(item.description.trim(), `empty description for "${item.title}"`).toBeTruthy();
      expect(item.captureGuide.trim(), `empty captureGuide for "${item.title}"`).toBeTruthy();
    }
  });

  it("has no duplicate titles within the same area", () => {
    const seen = new Map<string, Set<string>>();
    for (const item of CHECKLIST_SEED) {
      if (!seen.has(item.area)) seen.set(item.area, new Set());
      const areaSet = seen.get(item.area)!;
      expect(
        areaSet.has(item.title),
        `duplicate title "${item.title}" in area "${item.area}"`,
      ).toBe(false);
      areaSet.add(item.title);
    }
  });

  it("priority is one of the valid ChecklistPriority values", () => {
    const valid = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    for (const item of CHECKLIST_SEED) {
      expect(
        valid.has(item.priority),
        `invalid priority "${item.priority}" for "${item.title}"`,
      ).toBe(true);
    }
  });
});
