import { describe, it, expect } from "vitest";
import { MockAnalyzer } from "@/lib/ai/MockAnalyzer";
import type { AiAnalyzeInput } from "@/lib/ai/types";

function makeInput(overrides: Partial<AiAnalyzeInput> = {}): AiAnalyzeInput {
  return {
    areaName: "거실",
    detailLocation: "",
    checklistTitle: "",
    userMemo: "",
    takenAtIso: new Date().toISOString(),
    photos: [],
    ...overrides,
  };
}

const analyzer = new MockAnalyzer();

describe("MockAnalyzer.analyze", () => {
  it("always resolves to an AiAnalysisPayload", async () => {
    const result = await analyzer.analyze(makeInput());
    expect(result).toBeDefined();
    expect(typeof result.isSuspectedDefect).toBe("boolean");
    expect(typeof result.riskScore).toBe("number");
    expect(typeof result.confidence).toBe("number");
  });

  it("infers CRACK from '균열' keyword", async () => {
    const result = await analyzer.analyze(makeInput({ areaName: "균열 발생 거실" }));
    expect(result.defectType).toBe("CRACK");
  });

  it("infers LEAK from '누수' keyword", async () => {
    const result = await analyzer.analyze(makeInput({ userMemo: "천장 누수 발견" }));
    expect(result.defectType).toBe("LEAK");
  });

  it("infers ELECTRICAL_ISSUE from '전기' keyword", async () => {
    const result = await analyzer.analyze(makeInput({ checklistTitle: "전기 콘센트 점검" }));
    expect(result.defectType).toBe("ELECTRICAL_ISSUE");
  });

  it("infers FLOORING_ISSUE from '마루' keyword", async () => {
    const result = await analyzer.analyze(makeInput({ checklistTitle: "거실 마루 상태" }));
    expect(result.defectType).toBe("FLOORING_ISSUE");
  });

  it("falls back to OTHER when no keyword matches", async () => {
    const result = await analyzer.analyze(makeInput({ areaName: "창고", checklistTitle: "잡동사니" }));
    expect(result.defectType).toBe("OTHER");
  });

  it("riskScore is in [0, 14] range", async () => {
    const cases = [
      makeInput(),
      makeInput({ areaName: "누수", userMemo: "물이 매우 많이 새고 있어 긴급 처리 요망합니다.", photos: [{ mimeType: "image/jpeg", base64: "a" }, { mimeType: "image/jpeg", base64: "b" }] }),
    ];
    for (const input of cases) {
      const result = await analyzer.analyze(input);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(14);
    }
  });

  it("riskLevel is URGENT at max riskScore (LEAK + long memo + 2 photos)", async () => {
    // 4 (base) + 3 (memo>30) + 2 (photos>=2) + 4 (LEAK) = 13 → URGENT (>= 12)
    const highRiskInput = makeInput({
      areaName: "누수",
      userMemo: "a".repeat(31),
      photos: [{ mimeType: "image/jpeg", base64: "x" }, { mimeType: "image/jpeg", base64: "y" }],
    });
    const result = await analyzer.analyze(highRiskInput);
    expect(result.riskScore).toBe(13);
    expect(result.riskLevel).toBe("URGENT");
  });

  it("riskLevel is LOW when no keywords, no memo, no photos", async () => {
    // 4 (base) → LOW (< 5)
    const result = await analyzer.analyze(makeInput({ areaName: "기타", photos: [] }));
    expect(result.riskLevel).toBe("LOW");
  });

  it("additionalCheckRequired is true when photos < 2", async () => {
    const result = await analyzer.analyze(makeInput({ photos: [] }));
    expect(result.additionalCheckRequired).toBe(true);
  });

  it("additionalCheckRequired is false when photos >= 2", async () => {
    const result = await analyzer.analyze(makeInput({
      photos: [{ mimeType: "image/jpeg", base64: "a" }, { mimeType: "image/jpeg", base64: "b" }],
    }));
    expect(result.additionalCheckRequired).toBe(false);
  });

  it("confidence is fixed at 0.55", async () => {
    const result = await analyzer.analyze(makeInput());
    expect(result.confidence).toBe(0.55);
  });

  it("name is 'mock'", () => {
    expect(analyzer.name).toBe("mock");
  });
});
