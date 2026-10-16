import { getDB } from "@/lib/db/db";
import { newId } from "@/lib/db/id";
import type {
  ChecklistItem,
  InspectionArea,
  InspectionSession,
} from "@/lib/domain/types";
import { CHECKLIST_SEED, DEFAULT_AREAS } from "@/lib/seed/checklist";

export interface CreateSessionInput {
  complexName: string;
  buildingNo: string;
  unitNo: string;
  floorPlanType?: string;
  inspectorName?: string;
  phone?: string;
  inspectionDate: string;
  moveInDate?: string;
  builderName?: string;
}

/**
 * 새 점검 세션 + 기본 areas + 체크리스트 항목까지 트랜잭션으로 한 번에 만든다.
 * areas 는 DEFAULT_AREAS 기준이며, CHECKLIST_SEED 에 등록된 공간만 실제
 * 항목을 갖는다.
 */
export async function createSessionWithSeed(
  input: CreateSessionInput,
): Promise<string> {
  const db = getDB();
  const now = Date.now();
  const sessionId = newId();

  const session: InspectionSession = {
    id: sessionId,
    complexName: input.complexName.trim(),
    buildingNo: input.buildingNo.trim(),
    unitNo: input.unitNo.trim(),
    floorPlanType: input.floorPlanType?.trim() || undefined,
    inspectorName: input.inspectorName?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    inspectionDate: input.inspectionDate,
    moveInDate: input.moveInDate || undefined,
    builderName: input.builderName?.trim() || undefined,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  };

  const areaByName = new Map<string, InspectionArea>();
  DEFAULT_AREAS.forEach((name, index) => {
    areaByName.set(name, {
      id: newId(),
      sessionId,
      name,
      order: index,
      status: "NOT_STARTED",
    });
  });

  const items: ChecklistItem[] = CHECKLIST_SEED.map((seed, index) => {
    const area = areaByName.get(seed.area);
    if (!area) {
      throw new Error(
        `Checklist seed references unknown area: ${seed.area}`,
      );
    }
    return {
      id: newId(),
      sessionId,
      areaId: area.id,
      category: seed.category,
      title: seed.title,
      description: seed.description,
      captureGuide: seed.captureGuide,
      requiredPhotoCount: seed.requiredPhotoCount,
      priority: seed.priority,
      status: "NOT_STARTED",
      isUserAdded: false,
      order: index,
      updatedAt: now,
    };
  });

  await db.transaction(
    "rw",
    db.sessions,
    db.areas,
    db.checklistItems,
    async () => {
      await db.sessions.add(session);
      await db.areas.bulkAdd(Array.from(areaByName.values()));
      await db.checklistItems.bulkAdd(items);
    },
  );

  return sessionId;
}

export async function getSession(
  sessionId: string,
): Promise<InspectionSession | undefined> {
  return getDB().sessions.get(sessionId);
}

export async function listSessions(): Promise<InspectionSession[]> {
  const all = await getDB().sessions.toArray();
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDB();
  await db.transaction(
    "rw",
    [
      db.sessions,
      db.areas,
      db.checklistItems,
      db.photos,
      db.defects,
      db.analyses,
      db.reports,
    ],
    async () => {
      const photos = await db.photos
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      const defects = await db.defects
        .where("sessionId")
        .equals(sessionId)
        .toArray();

      await db.analyses
        .where("defectCandidateId")
        .anyOf(defects.map((d) => d.id))
        .delete();
      await db.photos.bulkDelete(photos.map((p) => p.id));
      await db.defects.bulkDelete(defects.map((d) => d.id));
      await db.checklistItems
        .where("sessionId")
        .equals(sessionId)
        .delete();
      await db.areas.where("sessionId").equals(sessionId).delete();
      await db.reports.where("sessionId").equals(sessionId).delete();
      await db.sessions.delete(sessionId);
    },
  );
}
