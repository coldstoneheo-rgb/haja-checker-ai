import { getDB } from "@/lib/db/db";
import { newDefectDisplayId, newId } from "@/lib/db/id";
import type {
  DefectCandidate,
  DefectStatus,
  DefectType,
  RepairDifficulty,
  RiskLevel,
} from "@/lib/domain/types";

export interface AddDefectInput {
  sessionId: string;
  areaName: string;
  detailLocation?: string;
  defectType: DefectType;
  userMemo?: string;
  riskLevel: RiskLevel;
  repairDifficulty: RepairDifficulty;
}

export async function addDefect(input: AddDefectInput): Promise<DefectCandidate> {
  const db = getDB();
  const now = Date.now();

  const existingCount = await db.defects
    .where("sessionId")
    .equals(input.sessionId)
    .count();

  const defect: DefectCandidate = {
    id: newId(),
    displayId: newDefectDisplayId(existingCount + 1),
    sessionId: input.sessionId,
    areaName: input.areaName,
    detailLocation: input.detailLocation,
    defectType: input.defectType,
    userMemo: input.userMemo,
    riskLevel: input.riskLevel,
    repairDifficulty: input.repairDifficulty,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  };

  await db.defects.add(defect);
  return defect;
}

export async function listDefects(sessionId: string): Promise<DefectCandidate[]> {
  const defects = await getDB().defects
    .where("sessionId")
    .equals(sessionId)
    .toArray();
  return defects.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateDefect(
  defectId: string,
  patch: Partial<
    Pick<
      DefectCandidate,
      | "areaName"
      | "detailLocation"
      | "defectType"
      | "userMemo"
      | "riskLevel"
      | "repairDifficulty"
      | "requestedAction"
      | "status"
    >
  > & { status?: DefectStatus },
): Promise<void> {
  await getDB().defects.update(defectId, { ...patch, updatedAt: Date.now() });
}

export async function deleteDefect(defectId: string): Promise<void> {
  const db = getDB();
  await db.transaction("rw", [db.defects, db.photos], async () => {
    await db.photos
      .where("defectCandidateId")
      .equals(defectId)
      .delete();
    await db.defects.delete(defectId);
  });
}

export async function countDefectsByRiskLevel(
  sessionId: string,
): Promise<Record<RiskLevel, number>> {
  const defects = await listDefects(sessionId);
  const counts: Record<RiskLevel, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };
  for (const d of defects) {
    counts[d.riskLevel] += 1;
  }
  return counts;
}
