import type {
  AiAnalyzeInput,
  AiAnalysisPayload,
  AiAnalyzer,
} from "@/lib/ai/types";
import type { DefectType } from "@/lib/domain/types";

const KEYWORD_TO_DEFECT: Array<{ keywords: string[]; type: DefectType }> = [
  { keywords: ["균열", "crack"], type: "CRACK" },
  { keywords: ["누수", "물 샘", "leak"], type: "LEAK" },
  { keywords: ["얼룩", "물자국", "water stain"], type: "WATER_STAIN" },
  { keywords: ["전기", "콘센트", "차단기"], type: "ELECTRICAL_ISSUE" },
  { keywords: ["가스"], type: "GAS_SAFETY" },
  { keywords: ["창문", "창호", "방충망"], type: "WINDOW_DOOR_ISSUE" },
  { keywords: ["타일"], type: "TILE_DAMAGE" },
  { keywords: ["마루", "바닥"], type: "FLOORING_ISSUE" },
  { keywords: ["도배", "벽지", "도장"], type: "WALLPAPER_PAINT_ISSUE" },
  { keywords: ["실리콘", "코킹"], type: "SILICONE_SEALING_ISSUE" },
  { keywords: ["배수", "물 고임", "역류"], type: "DRAINAGE_ISSUE" },
  { keywords: ["수평", "구배", "단차"], type: "LEVEL_SLOPE_ISSUE" },
];

function inferDefectType(text: string): DefectType {
  const lower = text.toLowerCase();
  for (const { keywords, type } of KEYWORD_TO_DEFECT) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return type;
    }
  }
  return "OTHER";
}

/**
 * 네트워크 없이 동작하는 결정론적 분석기.
 * 개발/오프라인 데모/테스트 용도. 실제 분석에는 GeminiAnalyzer 사용.
 */
export class MockAnalyzer implements AiAnalyzer {
  readonly name = "mock";

  async analyze(input: AiAnalyzeInput): Promise<AiAnalysisPayload> {
    const text = [
      input.areaName,
      input.detailLocation ?? "",
      input.checklistTitle ?? "",
      input.userMemo ?? "",
    ].join(" ");

    const defectType = inferDefectType(text);
    const memoLength = (input.userMemo ?? "").length;
    const photoCount = input.photos.length;

    const riskScore = Math.min(
      14,
      4 +
        (memoLength > 30 ? 3 : memoLength > 0 ? 1 : 0) +
        (photoCount >= 2 ? 2 : 0) +
        (defectType === "LEAK" || defectType === "ELECTRICAL_ISSUE" ? 4 : 0),
    );
    const riskLevel =
      riskScore >= 14
        ? "URGENT"
        : riskScore >= 9
          ? "HIGH"
          : riskScore >= 5
            ? "MEDIUM"
            : "LOW";

    const repairDifficultyScore = defectType === "OTHER" ? 2 : 4;
    const repairDifficulty =
      repairDifficultyScore <= 2
        ? "SIMPLE"
        : repairDifficultyScore <= 5
          ? "MODERATE"
          : repairDifficultyScore <= 8
            ? "HARD"
            : "PROFESSIONAL_REQUIRED";

    const location = [input.areaName, input.detailLocation]
      .filter(Boolean)
      .join(" / ");

    return {
      isSuspectedDefect: true,
      defectType,
      evidenceSummary: `${location} 부위에 ${input.checklistTitle ?? "점검 항목"} 관련 이상 징후가 의심됩니다.`,
      suspectedCause: "마감 또는 시공 불량 가능성이 있으며, 정확한 원인은 현장 확인이 필요합니다.",
      riskScore,
      riskLevel,
      repairDifficultyScore,
      repairDifficulty,
      confidence: 0.55,
      additionalCheckRequired: photoCount < 2,
      recommendedAdditionalPhotos:
        photoCount < 2
          ? ["전체 위치가 보이는 원거리 사진", "문제 부위 근접 사진"]
          : [],
      contractorRequestText: `${location} 부위 ${input.checklistTitle ?? "점검 항목"} 관련 이상이 확인되어 점검 및 보수 조치를 요청드립니다.`,
      caution:
        "본 결과는 사진 기반 AI 보조 분석이며, 최종 하자 여부는 시공자 또는 전문가 확인이 필요합니다.",
    };
  }
}
