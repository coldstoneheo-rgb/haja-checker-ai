import type {
  DefectType,
  RepairDifficulty,
  RiskLevel,
} from "@/lib/domain/types";

export interface AiPhotoInput {
  mimeType: string;
  /** 1024px 리사이즈 + JPEG 0.8 권장. base64 인코딩(헤더 prefix 제외). */
  base64: string;
}

export interface AiAnalyzeInput {
  areaName: string;
  detailLocation?: string;
  checklistTitle?: string;
  checklistDescription?: string;
  userMemo?: string;
  takenAtIso: string;
  photos: AiPhotoInput[];
}

/**
 * AI가 직접 만들어내는 분석 페이로드. DB 저장 시 id/createdAt/defectCandidateId
 * 등은 호출자가 채운다.
 */
export interface AiAnalysisPayload {
  isSuspectedDefect: boolean;
  defectType: DefectType;
  evidenceSummary: string;
  suspectedCause: string;
  riskScore: number;
  riskLevel: RiskLevel;
  repairDifficultyScore: number;
  repairDifficulty: RepairDifficulty;
  confidence: number;
  additionalCheckRequired: boolean;
  recommendedAdditionalPhotos: string[];
  contractorRequestText: string;
  caution: string;
}

export interface AiAnalyzer {
  readonly name: string;
  analyze(
    input: AiAnalyzeInput,
    signal?: AbortSignal,
  ): Promise<AiAnalysisPayload>;
}

export class AiAnalyzerError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiAnalyzerError";
  }
}
