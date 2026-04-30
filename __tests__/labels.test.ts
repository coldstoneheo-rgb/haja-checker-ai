import { describe, it, expect } from "vitest";
import {
  DEFECT_TYPE_LABELS,
  RISK_LEVEL_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  RISK_LEVEL_COLORS,
  CHECKLIST_STATUS_LABELS,
  CHECKLIST_STATUS_COLORS,
  DEFECT_STATUS_LABELS,
} from "@/lib/util/labels";
import type {
  DefectType,
  RiskLevel,
  RepairDifficulty,
  ChecklistItemStatus,
  DefectStatus,
} from "@/lib/domain/types";

const DEFECT_TYPES: DefectType[] = [
  "CRACK", "LEAK", "WATER_STAIN", "ELECTRICAL_ISSUE", "GAS_SAFETY",
  "WINDOW_DOOR_ISSUE", "TILE_DAMAGE", "FLOORING_ISSUE", "WALLPAPER_PAINT_ISSUE",
  "SILICONE_SEALING_ISSUE", "DRAINAGE_ISSUE", "LEVEL_SLOPE_ISSUE",
  "CABINET_FURNITURE_ISSUE", "SANITARY_FIXTURE_ISSUE", "VENTILATION_ISSUE",
  "FINISHING_ISSUE", "MISSING_WORK", "CONTAMINATION", "DAMAGE",
  "NOISE_OR_OPERATION", "OTHER",
];

const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const REPAIR_DIFFICULTIES: RepairDifficulty[] = [
  "SIMPLE", "MODERATE", "HARD", "PROFESSIONAL_REQUIRED", "UNKNOWN",
];

const CHECKLIST_STATUSES: ChecklistItemStatus[] = [
  "NOT_STARTED", "PHOTO_REQUIRED", "PHOTO_DONE", "GOOD", "SUSPECTED",
  "DEFECT", "CANNOT_CHECK", "SKIPPED",
];

const DEFECT_STATUSES: DefectStatus[] = [
  "DRAFT", "ANALYZED", "USER_CONFIRMED", "SUBMITTED", "REPAIRED", "REJECTED",
];

describe("DEFECT_TYPE_LABELS", () => {
  it("has a non-empty Korean label for every DefectType", () => {
    for (const t of DEFECT_TYPES) {
      expect(DEFECT_TYPE_LABELS[t], `missing label for ${t}`).toBeTruthy();
    }
  });

  it("covers all 21 DefectType values", () => {
    expect(Object.keys(DEFECT_TYPE_LABELS)).toHaveLength(DEFECT_TYPES.length);
  });
});

describe("RISK_LEVEL_LABELS", () => {
  it("has a label for every RiskLevel", () => {
    for (const l of RISK_LEVELS) {
      expect(RISK_LEVEL_LABELS[l], `missing label for ${l}`).toBeTruthy();
    }
  });
});

describe("RISK_LEVEL_COLORS", () => {
  it("has a Tailwind class string for every RiskLevel", () => {
    for (const l of RISK_LEVELS) {
      expect(RISK_LEVEL_COLORS[l], `missing color for ${l}`).toBeTruthy();
    }
  });
});

describe("REPAIR_DIFFICULTY_LABELS", () => {
  it("has a label for every RepairDifficulty", () => {
    for (const d of REPAIR_DIFFICULTIES) {
      expect(REPAIR_DIFFICULTY_LABELS[d], `missing label for ${d}`).toBeTruthy();
    }
  });
});

describe("CHECKLIST_STATUS_LABELS", () => {
  it("has a label for every ChecklistItemStatus", () => {
    for (const s of CHECKLIST_STATUSES) {
      expect(CHECKLIST_STATUS_LABELS[s], `missing label for ${s}`).toBeTruthy();
    }
  });
});

describe("CHECKLIST_STATUS_COLORS", () => {
  it("has a Tailwind class string for every ChecklistItemStatus", () => {
    for (const s of CHECKLIST_STATUSES) {
      expect(CHECKLIST_STATUS_COLORS[s], `missing color for ${s}`).toBeTruthy();
    }
  });
});

describe("DEFECT_STATUS_LABELS", () => {
  it("has a label for every DefectStatus", () => {
    for (const s of DEFECT_STATUSES) {
      expect(DEFECT_STATUS_LABELS[s], `missing label for ${s}`).toBeTruthy();
    }
  });
});
