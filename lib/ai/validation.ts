import type { AiAnalysisPayload, AiAnalyzeInput } from "./types";
import type { DefectType, RepairDifficulty, RiskLevel } from "@/lib/domain/types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BASE64_LENGTH = 13_500_000; // ~10 MB raw
const MAX_PHOTOS = 5;
const MAX_AREA_NAME = 100;
const MAX_USER_MEMO = 1000;
const MAX_DETAIL_LOCATION = 200;

const VALID_DEFECT_TYPES = new Set<string>([
  "CRACK",
  "LEAK",
  "WATER_STAIN",
  "ELECTRICAL_ISSUE",
  "GAS_SAFETY",
  "WINDOW_DOOR_ISSUE",
  "TILE_DAMAGE",
  "FLOORING_ISSUE",
  "WALLPAPER_PAINT_ISSUE",
  "SILICONE_SEALING_ISSUE",
  "DRAINAGE_ISSUE",
  "LEVEL_SLOPE_ISSUE",
  "CABINET_FURNITURE_ISSUE",
  "SANITARY_FIXTURE_ISSUE",
  "VENTILATION_ISSUE",
  "FINISHING_ISSUE",
  "MISSING_WORK",
  "CONTAMINATION",
  "DAMAGE",
  "NOISE_OR_OPERATION",
  "OTHER",
]);

const VALID_RISK_LEVELS = new Set<string>(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const VALID_REPAIR_DIFFICULTIES = new Set<string>([
  "SIMPLE",
  "MODERATE",
  "HARD",
  "PROFESSIONAL_REQUIRED",
  "UNKNOWN",
]);

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAnalyzeInput(body: unknown): ValidationError | null {
  if (!body || typeof body !== "object") {
    return { field: "body", message: "요청 본문이 올바르지 않습니다." };
  }

  const b = body as Record<string, unknown>;

  // photos — required, array, 1..5 elements
  if (!Array.isArray(b.photos) || b.photos.length === 0) {
    return { field: "photos", message: "사진이 1장 이상 필요합니다." };
  }
  if (b.photos.length > MAX_PHOTOS) {
    return {
      field: "photos",
      message: `사진은 최대 ${MAX_PHOTOS}장까지 허용됩니다.`,
    };
  }

  for (let i = 0; i < b.photos.length; i++) {
    const photo = b.photos[i] as Record<string, unknown>;
    if (!photo || typeof photo !== "object") {
      return { field: `photos[${i}]`, message: "사진 데이터가 올바르지 않습니다." };
    }
    if (
      typeof photo.mimeType !== "string" ||
      !(ALLOWED_MIME_TYPES as readonly string[]).includes(photo.mimeType)
    ) {
      return {
        field: `photos[${i}].mimeType`,
        message: `지원되는 형식: ${ALLOWED_MIME_TYPES.join(", ")}`,
      };
    }
    if (typeof photo.base64 !== "string") {
      return { field: `photos[${i}].base64`, message: "base64 데이터가 필요합니다." };
    }
    if (photo.base64.length > MAX_BASE64_LENGTH) {
      return {
        field: `photos[${i}].base64`,
        message: "사진 파일 크기가 너무 큽니다. 10MB 이하로 줄여주세요.",
      };
    }
  }

  // areaName — required string
  if (typeof b.areaName !== "string" || b.areaName.trim().length === 0) {
    return { field: "areaName", message: "공간 이름이 필요합니다." };
  }
  if (b.areaName.length > MAX_AREA_NAME) {
    return {
      field: "areaName",
      message: `공간 이름은 ${MAX_AREA_NAME}자 이하여야 합니다.`,
    };
  }

  // optional string fields with length caps
  if (b.userMemo !== undefined) {
    if (typeof b.userMemo !== "string") {
      return { field: "userMemo", message: "userMemo는 문자열이어야 합니다." };
    }
    if (b.userMemo.length > MAX_USER_MEMO) {
      return {
        field: "userMemo",
        message: `메모는 ${MAX_USER_MEMO}자 이하여야 합니다.`,
      };
    }
  }

  if (b.detailLocation !== undefined) {
    if (typeof b.detailLocation !== "string") {
      return { field: "detailLocation", message: "detailLocation은 문자열이어야 합니다." };
    }
    if (b.detailLocation.length > MAX_DETAIL_LOCATION) {
      return {
        field: "detailLocation",
        message: `세부 위치는 ${MAX_DETAIL_LOCATION}자 이하여야 합니다.`,
      };
    }
  }

  // takenAtIso — required string
  if (typeof b.takenAtIso !== "string" || b.takenAtIso.trim().length === 0) {
    return { field: "takenAtIso", message: "촬영 시각(takenAtIso)이 필요합니다." };
  }

  return null;
}

export function validateAnalysisPayload(data: unknown): ValidationError | null {
  if (!data || typeof data !== "object") {
    return { field: "response", message: "AI 응답 형식이 올바르지 않습니다." };
  }

  const d = data as Record<string, unknown>;

  if (typeof d.isSuspectedDefect !== "boolean") {
    return { field: "isSuspectedDefect", message: "isSuspectedDefect 필드가 누락되었습니다." };
  }

  if (typeof d.defectType !== "string" || !VALID_DEFECT_TYPES.has(d.defectType)) {
    return {
      field: "defectType",
      message: `defectType 값이 올바르지 않습니다: ${String(d.defectType)}`,
    };
  }

  if (typeof d.riskLevel !== "string" || !VALID_RISK_LEVELS.has(d.riskLevel)) {
    return {
      field: "riskLevel",
      message: `riskLevel 값이 올바르지 않습니다: ${String(d.riskLevel)}`,
    };
  }

  if (typeof d.repairDifficulty !== "string" || !VALID_REPAIR_DIFFICULTIES.has(d.repairDifficulty)) {
    return {
      field: "repairDifficulty",
      message: `repairDifficulty 값이 올바르지 않습니다: ${String(d.repairDifficulty)}`,
    };
  }

  const requiredStrings = [
    "evidenceSummary",
    "suspectedCause",
    "contractorRequestText",
    "caution",
  ] as const;
  for (const field of requiredStrings) {
    if (typeof d[field] !== "string") {
      return { field, message: `${field} 필드가 누락되었습니다.` };
    }
  }

  if (typeof d.riskScore !== "number") {
    return { field: "riskScore", message: "riskScore 필드가 누락되었습니다." };
  }

  if (typeof d.repairDifficultyScore !== "number") {
    return { field: "repairDifficultyScore", message: "repairDifficultyScore 필드가 누락되었습니다." };
  }

  if (typeof d.confidence !== "number") {
    return { field: "confidence", message: "confidence 필드가 누락되었습니다." };
  }

  if (typeof d.additionalCheckRequired !== "boolean") {
    return { field: "additionalCheckRequired", message: "additionalCheckRequired 필드가 누락되었습니다." };
  }

  if (!Array.isArray(d.recommendedAdditionalPhotos)) {
    return { field: "recommendedAdditionalPhotos", message: "recommendedAdditionalPhotos 필드가 누락되었습니다." };
  }

  return null;
}
