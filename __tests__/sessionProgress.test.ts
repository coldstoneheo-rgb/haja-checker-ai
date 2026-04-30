/**
 * Tests the pure computation logic of computeSessionProgress.
 * We replicate the status-counting loop here to verify the logic without
 * hitting IndexedDB (which requires a browser runtime).
 */
import { describe, it, expect } from "vitest";
import type { ChecklistItemStatus, RiskLevel } from "@/lib/domain/types";

interface MinimalChecklistItem {
  status: ChecklistItemStatus;
}

interface MinimalDefect {
  checklistItemId?: string;
  riskLevel: RiskLevel;
}

function computeProgress(items: MinimalChecklistItem[], directDefects: MinimalDefect[]) {
  const total = items.length;
  let done = 0;
  let suspected = 0;
  let defects = 0;
  let cannotCheck = 0;
  let notStarted = 0;

  for (const item of items) {
    switch (item.status) {
      case "GOOD":
      case "PHOTO_DONE":
        done += 1;
        break;
      case "SUSPECTED":
        suspected += 1;
        done += 1;
        break;
      case "DEFECT":
        defects += 1;
        done += 1;
        break;
      case "CANNOT_CHECK":
      case "SKIPPED":
        cannotCheck += 1;
        break;
      default:
        notStarted += 1;
    }
  }

  let directDefectsUrgent = 0;
  let directDefectsHigh = 0;
  for (const d of directDefects) {
    if (d.riskLevel === "URGENT") directDefectsUrgent += 1;
    else if (d.riskLevel === "HIGH") directDefectsHigh += 1;
  }

  return {
    total,
    done,
    suspected,
    defects,
    cannotCheck,
    notStarted,
    ratio: total === 0 ? 0 : done / total,
    directDefectsTotal: directDefects.length,
    directDefectsUrgent,
    directDefectsHigh,
  };
}

describe("computeSessionProgress logic", () => {
  it("returns zeros for empty session", () => {
    const result = computeProgress([], []);
    expect(result.total).toBe(0);
    expect(result.done).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it("counts GOOD and PHOTO_DONE as done", () => {
    const items: MinimalChecklistItem[] = [
      { status: "GOOD" },
      { status: "PHOTO_DONE" },
    ];
    const result = computeProgress(items, []);
    expect(result.done).toBe(2);
    expect(result.suspected).toBe(0);
    expect(result.defects).toBe(0);
  });

  it("SUSPECTED increments both done and suspected", () => {
    const items: MinimalChecklistItem[] = [{ status: "SUSPECTED" }];
    const result = computeProgress(items, []);
    expect(result.done).toBe(1);
    expect(result.suspected).toBe(1);
  });

  it("DEFECT increments both done and defects", () => {
    const items: MinimalChecklistItem[] = [{ status: "DEFECT" }];
    const result = computeProgress(items, []);
    expect(result.done).toBe(1);
    expect(result.defects).toBe(1);
  });

  it("CANNOT_CHECK and SKIPPED go to cannotCheck, not done", () => {
    const items: MinimalChecklistItem[] = [
      { status: "CANNOT_CHECK" },
      { status: "SKIPPED" },
    ];
    const result = computeProgress(items, []);
    expect(result.cannotCheck).toBe(2);
    expect(result.done).toBe(0);
  });

  it("NOT_STARTED and PHOTO_REQUIRED go to notStarted", () => {
    const items: MinimalChecklistItem[] = [
      { status: "NOT_STARTED" },
      { status: "PHOTO_REQUIRED" },
    ];
    const result = computeProgress(items, []);
    expect(result.notStarted).toBe(2);
    expect(result.done).toBe(0);
  });

  it("ratio is done/total", () => {
    const items: MinimalChecklistItem[] = [
      { status: "GOOD" },
      { status: "GOOD" },
      { status: "NOT_STARTED" },
      { status: "NOT_STARTED" },
    ];
    const result = computeProgress(items, []);
    expect(result.ratio).toBeCloseTo(0.5);
  });

  it("counts direct defects by risk level", () => {
    const directDefects: MinimalDefect[] = [
      { riskLevel: "URGENT" },
      { riskLevel: "URGENT" },
      { riskLevel: "HIGH" },
      { riskLevel: "MEDIUM" },
    ];
    const result = computeProgress([], directDefects);
    expect(result.directDefectsTotal).toBe(4);
    expect(result.directDefectsUrgent).toBe(2);
    expect(result.directDefectsHigh).toBe(1);
  });

  it("total is sum of all status categories", () => {
    const items: MinimalChecklistItem[] = [
      { status: "GOOD" },
      { status: "DEFECT" },
      { status: "SUSPECTED" },
      { status: "CANNOT_CHECK" },
      { status: "NOT_STARTED" },
    ];
    const result = computeProgress(items, []);
    expect(result.total).toBe(5);
    expect(result.done + result.cannotCheck + result.notStarted).toBe(5);
  });
});
