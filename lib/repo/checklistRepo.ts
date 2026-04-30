import { getDB } from "@/lib/db/db";
import type {
  ChecklistItem,
  ChecklistItemStatus,
  InspectionArea,
} from "@/lib/domain/types";

export interface AreaWithItems {
  area: InspectionArea;
  items: ChecklistItem[];
}

export async function listAreasWithItems(
  sessionId: string,
): Promise<AreaWithItems[]> {
  const db = getDB();
  const [areas, items] = await Promise.all([
    db.areas.where("sessionId").equals(sessionId).toArray(),
    db.checklistItems.where("sessionId").equals(sessionId).toArray(),
  ]);

  const itemsByArea = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const list = itemsByArea.get(item.areaId);
    if (list) list.push(item);
    else itemsByArea.set(item.areaId, [item]);
  }

  return areas
    .sort((a, b) => a.order - b.order)
    .map((area) => ({
      area,
      items: (itemsByArea.get(area.id) ?? []).sort(
        (a, b) => a.order - b.order,
      ),
    }));
}

export async function setChecklistItemStatus(
  itemId: string,
  status: ChecklistItemStatus,
): Promise<void> {
  await getDB().checklistItems.update(itemId, {
    status,
    updatedAt: Date.now(),
  });
}

export interface SessionProgress {
  total: number;
  done: number;
  suspected: number;
  defects: number;
  cannotCheck: number;
  notStarted: number;
  ratio: number;
}

export async function computeSessionProgress(
  sessionId: string,
): Promise<SessionProgress> {
  const items = await getDB()
    .checklistItems.where("sessionId")
    .equals(sessionId)
    .toArray();

  const total = items.length;
  let done = 0;
  let suspected = 0;
  let defects = 0;
  let cannotCheck = 0;
  let notStarted = 0;

  for (const item of items) {
    switch (item.status) {
      case "GOOD":
      case "PHOTO_DONE":
        done += 1;
        break;
      case "SUSPECTED":
        suspected += 1;
        done += 1;
        break;
      case "DEFECT":
        defects += 1;
        done += 1;
        break;
      case "CANNOT_CHECK":
      case "SKIPPED":
        cannotCheck += 1;
        break;
      default:
        notStarted += 1;
    }
  }

  return {
    total,
    done,
    suspected,
    defects,
    cannotCheck,
    notStarted,
    ratio: total === 0 ? 0 : done / total,
  };
}
