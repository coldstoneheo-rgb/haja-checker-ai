import type { DefectType, RepairDifficulty, RiskLevel } from "@/lib/domain/types";

export const DEFECT_TYPE_LABELS: Record<DefectType, string> = {
  CRACK: "균열",
  LEAK: "누수",
  WATER_STAIN: "물얼룩",
  ELECTRICAL_ISSUE: "전기 문제",
  GAS_SAFETY: "가스 안전",
  WINDOW_DOOR_ISSUE: "창호·문 문제",
  TILE_DAMAGE: "타일 손상",
  FLOORING_ISSUE: "바닥재 문제",
  WALLPAPER_PAINT_ISSUE: "벽지·도장 불량",
  SILICONE_SEALING_ISSUE: "실리콘·코킹 문제",
  DRAINAGE_ISSUE: "배수 문제",
  LEVEL_SLOPE_ISSUE: "수평·기울기 문제",
  CABINET_FURNITURE_ISSUE: "수납장·가구 문제",
  SANITARY_FIXTURE_ISSUE: "위생기구 문제",
  VENTILATION_ISSUE: "환기 문제",
  FINISHING_ISSUE: "마감 불량",
  MISSING_WORK: "미시공",
  CONTAMINATION: "오염",
  DAMAGE: "파손",
  NOISE_OR_OPERATION: "소음·작동 불량",
  OTHER: "기타",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  URGENT: "긴급",
};

export const REPAIR_DIFFICULTY_LABELS: Record<RepairDifficulty, string> = {
  SIMPLE: "단순 보수",
  MODERATE: "보통",
  HARD: "어려움",
  PROFESSIONAL_REQUIRED: "전문가 필요",
  UNKNOWN: "미상",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-rose-100 text-rose-700",
};
