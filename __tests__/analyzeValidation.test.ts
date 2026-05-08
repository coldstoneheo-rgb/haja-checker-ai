import { describe, it, expect } from "vitest";
import {
  validateAnalyzeInput,
  validateAnalysisPayload,
} from "@/lib/ai/validation";

const validPhoto = {
  mimeType: "image/jpeg",
  base64: "abc123",
};

const validInput = {
  areaName: "거실",
  takenAtIso: "2026-05-11T10:00:00.000Z",
  photos: [validPhoto],
};

const validPayload = {
  isSuspectedDefect: true,
  defectType: "CRACK",
  evidenceSummary: "균열 확인",
  suspectedCause: "건조 수축",
  riskScore: 70,
  riskLevel: "HIGH",
  repairDifficultyScore: 40,
  repairDifficulty: "MODERATE",
  confidence: 0.85,
  additionalCheckRequired: false,
  recommendedAdditionalPhotos: [],
  contractorRequestText: "보수 요청",
  caution: "주의 사항",
};

describe("validateAnalyzeInput", () => {
  it("returns null for valid input", () => {
    expect(validateAnalyzeInput(validInput)).toBeNull();
  });

  it("rejects missing photos", () => {
    const err = validateAnalyzeInput({ ...validInput, photos: [] });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("photos");
  });

  it("rejects more than 5 photos", () => {
    const photos = Array(6).fill(validPhoto);
    const err = validateAnalyzeInput({ ...validInput, photos });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("photos");
  });

  it("rejects unsupported mimeType", () => {
    const err = validateAnalyzeInput({
      ...validInput,
      photos: [{ mimeType: "image/gif", base64: "abc" }],
    });
    expect(err).not.toBeNull();
    expect(err!.field).toContain("mimeType");
  });

  it("rejects oversized base64", () => {
    const bigBase64 = "a".repeat(13_500_001);
    const err = validateAnalyzeInput({
      ...validInput,
      photos: [{ mimeType: "image/jpeg", base64: bigBase64 }],
    });
    expect(err).not.toBeNull();
    expect(err!.field).toContain("base64");
  });

  it("rejects missing areaName", () => {
    const err = validateAnalyzeInput({ ...validInput, areaName: "" });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("areaName");
  });

  it("rejects areaName over 100 chars", () => {
    const err = validateAnalyzeInput({
      ...validInput,
      areaName: "a".repeat(101),
    });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("areaName");
  });

  it("rejects userMemo over 1000 chars", () => {
    const err = validateAnalyzeInput({
      ...validInput,
      userMemo: "a".repeat(1001),
    });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("userMemo");
  });

  it("rejects detailLocation over 200 chars", () => {
    const err = validateAnalyzeInput({
      ...validInput,
      detailLocation: "a".repeat(201),
    });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("detailLocation");
  });

  it("rejects missing takenAtIso", () => {
    const { takenAtIso: _, ...rest } = validInput;
    const err = validateAnalyzeInput(rest);
    expect(err).not.toBeNull();
    expect(err!.field).toBe("takenAtIso");
  });

  it("accepts png and webp mimeTypes", () => {
    expect(validateAnalyzeInput({
      ...validInput,
      photos: [{ mimeType: "image/png", base64: "abc" }],
    })).toBeNull();
    expect(validateAnalyzeInput({
      ...validInput,
      photos: [{ mimeType: "image/webp", base64: "abc" }],
    })).toBeNull();
  });
});

describe("validateAnalysisPayload", () => {
  it("returns null for valid payload", () => {
    expect(validateAnalysisPayload(validPayload)).toBeNull();
  });

  it("rejects invalid defectType", () => {
    const err = validateAnalysisPayload({ ...validPayload, defectType: "UNKNOWN_TYPE" });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("defectType");
  });

  it("rejects invalid riskLevel", () => {
    const err = validateAnalysisPayload({ ...validPayload, riskLevel: "EXTREME" });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("riskLevel");
  });

  it("rejects invalid repairDifficulty", () => {
    const err = validateAnalysisPayload({ ...validPayload, repairDifficulty: "EASY" });
    expect(err).not.toBeNull();
    expect(err!.field).toBe("repairDifficulty");
  });

  it("rejects missing required string fields", () => {
    const { evidenceSummary: _, ...rest } = validPayload;
    const err = validateAnalysisPayload(rest);
    expect(err).not.toBeNull();
    expect(err!.field).toBe("evidenceSummary");
  });

  it("rejects missing isSuspectedDefect", () => {
    const { isSuspectedDefect: _, ...rest } = validPayload;
    const err = validateAnalysisPayload(rest);
    expect(err).not.toBeNull();
    expect(err!.field).toBe("isSuspectedDefect");
  });

  it("rejects null/non-object body", () => {
    expect(validateAnalysisPayload(null)).not.toBeNull();
    expect(validateAnalysisPayload("string")).not.toBeNull();
  });
});
