import { getDB } from "@/lib/db/db";
import { newId } from "@/lib/db/id";
import type {
  ChecklistItemStatus,
  EvidencePhoto,
} from "@/lib/domain/types";
import {
  assessPhotoQuality,
  downscaleImage,
  generateThumbnail,
} from "@/lib/util/image";

export interface AddPhotoInput {
  sessionId: string;
  checklistItemId?: string;
  defectCandidateId?: string;
  areaName: string;
  detailLocation?: string;
  source: File | Blob;
  takenAt?: number;
  userMemo?: string;
  quickTags?: string[];
}

const MAX_LONG_SIDE = 1024;

/**
 * 카메라/파일에서 받은 원본 이미지를 1024px 로 다운스케일해 썸네일과 함께
 * Dexie 에 저장한다. 같은 체크리스트 항목에 사진이 추가되면 항목 상태를
 * PHOTO_DONE 으로 자동 전이한다 (사용자가 이후 GOOD/SUSPECTED/DEFECT 로
 * 다시 바꿀 수 있다).
 */
export async function addPhoto(
  input: AddPhotoInput,
): Promise<EvidencePhoto> {
  const downscaled = await downscaleImage(input.source, {
    maxSize: MAX_LONG_SIDE,
    mimeType: "image/jpeg",
    quality: 0.85,
  });
  // 순차 실행 — 동시 Canvas 디코드 시 iOS Safari 메모리 초과 방지
  const thumbnail = await generateThumbnail(downscaled.blob, 256);
  const qualityScore = await assessPhotoQuality(downscaled.blob);

  const db = getDB();
  const now = Date.now();
  const photo: EvidencePhoto = {
    id: newId(),
    sessionId: input.sessionId,
    checklistItemId: input.checklistItemId,
    defectCandidateId: input.defectCandidateId,
    blob: downscaled.blob,
    thumbnail,
    areaName: input.areaName,
    detailLocation: input.detailLocation,
    takenAt: input.takenAt ?? now,
    width: downscaled.width,
    height: downscaled.height,
    fileSize: downscaled.fileSize,
    userMemo: input.userMemo,
    quickTags: input.quickTags && input.quickTags.length > 0
      ? input.quickTags
      : undefined,
    isRepresentative: false,
    qualityScore,
    createdAt: now,
  };

  await db.transaction("rw", [db.photos, db.checklistItems], async () => {
    await db.photos.add(photo);
    if (input.checklistItemId) {
      const existing = await db.checklistItems.get(input.checklistItemId);
      if (existing) {
        const next: ChecklistItemStatus =
          existing.status === "NOT_STARTED" ||
          existing.status === "PHOTO_REQUIRED"
            ? "PHOTO_DONE"
            : existing.status;
        await db.checklistItems.update(input.checklistItemId, {
          status: next,
          updatedAt: now,
        });
      }
    }
  });

  return photo;
}

export async function listPhotosForItem(
  itemId: string,
): Promise<EvidencePhoto[]> {
  const db = getDB();
  const photos = await db.photos
    .where("checklistItemId")
    .equals(itemId)
    .toArray();
  return photos.sort((a, b) => a.createdAt - b.createdAt);
}

export async function listPhotosForDefect(
  defectCandidateId: string,
): Promise<EvidencePhoto[]> {
  const db = getDB();
  const photos = await db.photos
    .where("defectCandidateId")
    .equals(defectCandidateId)
    .toArray();
  return photos.sort((a, b) => a.createdAt - b.createdAt);
}

export interface UpdatePhotoInput {
  userMemo?: string;
  quickTags?: string[];
  isRepresentative?: boolean;
  detailLocation?: string;
}

export async function updatePhoto(
  photoId: string,
  patch: UpdatePhotoInput,
): Promise<void> {
  const update: Partial<EvidencePhoto> = {};
  if (patch.userMemo !== undefined) update.userMemo = patch.userMemo;
  if (patch.quickTags !== undefined) {
    update.quickTags =
      patch.quickTags.length > 0 ? patch.quickTags : undefined;
  }
  if (patch.isRepresentative !== undefined) {
    update.isRepresentative = patch.isRepresentative;
  }
  if (patch.detailLocation !== undefined) {
    update.detailLocation = patch.detailLocation;
  }
  if (Object.keys(update).length === 0) return;
  await getDB().photos.update(photoId, update);
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = getDB();
  await db.transaction("rw", [db.photos, db.checklistItems], async () => {
    const photo = await db.photos.get(photoId);
    await db.photos.delete(photoId);

    if (photo?.checklistItemId) {
      const remaining = await db.photos
        .where("checklistItemId")
        .equals(photo.checklistItemId)
        .count();
      if (remaining === 0) {
        const item = await db.checklistItems.get(photo.checklistItemId);
        if (item && item.status === "PHOTO_DONE") {
          await db.checklistItems.update(photo.checklistItemId, {
            status: "PHOTO_REQUIRED" as ChecklistItemStatus,
            updatedAt: Date.now(),
          });
        }
      }
    }
  });
}
