import Dexie, { Table } from "dexie";
import type {
  AiAnalysisResult,
  ChecklistItem,
  DefectCandidate,
  EvidencePhoto,
  InspectionArea,
  InspectionSession,
  ReportExport,
} from "@/lib/domain/types";

export class HajaCheckerDB extends Dexie {
  sessions!: Table<InspectionSession, string>;
  areas!: Table<InspectionArea, string>;
  checklistItems!: Table<ChecklistItem, string>;
  photos!: Table<EvidencePhoto, string>;
  defects!: Table<DefectCandidate, string>;
  analyses!: Table<AiAnalysisResult, string>;
  reports!: Table<ReportExport, string>;

  constructor() {
    super("haja-checker");
    this.version(1).stores({
      sessions: "id, status, createdAt, updatedAt",
      areas: "id, sessionId, [sessionId+order]",
      checklistItems:
        "id, sessionId, areaId, status, [sessionId+areaId], [sessionId+areaId+order]",
      photos:
        "id, sessionId, checklistItemId, defectCandidateId, takenAt, [sessionId+checklistItemId]",
      defects: "id, sessionId, displayId, status, riskLevel, [sessionId+status]",
      analyses: "id, defectCandidateId, createdAt",
      reports: "id, sessionId, createdAt",
    });
  }
}

let dbInstance: HajaCheckerDB | null = null;

export function getDB(): HajaCheckerDB {
  if (typeof window === "undefined") {
    throw new Error("DB is only available in the browser");
  }
  if (!dbInstance) {
    dbInstance = new HajaCheckerDB();
  }
  return dbInstance;
}
