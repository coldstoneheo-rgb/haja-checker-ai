export type InspectionStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "ANALYZING"
  | "REPORT_READY"
  | "ARCHIVED";

export type AreaStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export type ChecklistPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ChecklistItemStatus =
  | "NOT_STARTED"
  | "PHOTO_REQUIRED"
  | "PHOTO_DONE"
  | "GOOD"
  | "SUSPECTED"
  | "DEFECT"
  | "CANNOT_CHECK"
  | "SKIPPED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type RepairDifficulty =
  | "SIMPLE"
  | "MODERATE"
  | "HARD"
  | "PROFESSIONAL_REQUIRED"
  | "UNKNOWN";

export type DefectType =
  | "CRACK"
  | "LEAK"
  | "WATER_STAIN"
  | "ELECTRICAL_ISSUE"
  | "GAS_SAFETY"
  | "WINDOW_DOOR_ISSUE"
  | "TILE_DAMAGE"
  | "FLOORING_ISSUE"
  | "WALLPAPER_PAINT_ISSUE"
  | "SILICONE_SEALING_ISSUE"
  | "DRAINAGE_ISSUE"
  | "LEVEL_SLOPE_ISSUE"
  | "CABINET_FURNITURE_ISSUE"
  | "SANITARY_FIXTURE_ISSUE"
  | "VENTILATION_ISSUE"
  | "FINISHING_ISSUE"
  | "MISSING_WORK"
  | "CONTAMINATION"
  | "DAMAGE"
  | "NOISE_OR_OPERATION"
  | "OTHER";

export type DefectStatus =
  | "DRAFT"
  | "ANALYZED"
  | "USER_CONFIRMED"
  | "SUBMITTED"
  | "REPAIRED"
  | "REJECTED";

export interface InspectionSession {
  id: string;
  complexName: string;
  buildingNo: string;
  unitNo: string;
  floorPlanType?: string;
  inspectorName?: string;
  phone?: string;
  inspectionDate: string;
  moveInDate?: string;
  builderName?: string;
  status: InspectionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface InspectionArea {
  id: string;
  sessionId: string;
  name: string;
  order: number;
  status: AreaStatus;
}

export interface ChecklistItem {
  id: string;
  sessionId: string;
  areaId: string;
  category: string;
  title: string;
  description: string;
  captureGuide: string;
  requiredPhotoCount: number;
  priority: ChecklistPriority;
  status: ChecklistItemStatus;
  isUserAdded: boolean;
  order: number;
  userMemo?: string;
  updatedAt: number;
}

export interface EvidencePhoto {
  id: string;
  sessionId: string;
  checklistItemId?: string;
  defectCandidateId?: string;
  blob: Blob;
  thumbnail?: Blob;
  areaName: string;
  detailLocation?: string;
  takenAt: number;
  width: number;
  height: number;
  fileSize: number;
  userMemo?: string;
  quickTags?: string[];
  isRepresentative: boolean;
  qualityScore?: number;
  createdAt: number;
}

export interface DefectCandidate {
  id: string;
  displayId: string;
  sessionId: string;
  checklistItemId?: string;
  areaName: string;
  detailLocation?: string;
  defectType: DefectType;
  userMemo?: string;
  aiSummary?: string;
  suspectedCause?: string;
  riskLevel: RiskLevel;
  riskScore?: number;
  repairDifficulty: RepairDifficulty;
  repairDifficultyScore?: number;
  confidence?: number;
  requestedAction?: string;
  additionalCheckRequired?: boolean;
  status: DefectStatus;
  createdAt: number;
  updatedAt: number;
}

export interface AiAnalysisResult {
  id: string;
  defectCandidateId: string;
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
  createdAt: number;
}

export interface ReportExport {
  id: string;
  sessionId: string;
  fileName: string;
  blob: Blob;
  createdAt: number;
}
