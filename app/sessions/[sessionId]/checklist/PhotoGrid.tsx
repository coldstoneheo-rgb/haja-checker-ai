"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { listPhotosForItem } from "@/lib/repo/photoRepo";
import type { EvidencePhoto } from "@/lib/domain/types";
import PhotoEditorDialog from "./PhotoEditorDialog";
import PhotoThumbnail from "./PhotoThumbnail";

interface Props {
  checklistItemId: string;
  requiredPhotoCount: number;
}

export default function PhotoGrid({
  checklistItemId,
  requiredPhotoCount,
}: Props) {
  const photos = useLiveQuery(
    () => listPhotosForItem(checklistItemId),
    [checklistItemId],
    [] as EvidencePhoto[],
  );
  const [editing, setEditing] = useState<EvidencePhoto | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        촬영된 사진이 없습니다. 권장 {requiredPhotoCount}장.
      </p>
    );
  }

  const lacking = Math.max(0, requiredPhotoCount - photos.length);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onClick={() => setEditing(photo)}
            />
          ))}
        </div>
        {lacking > 0 ? (
          <p className="text-[11px] font-medium text-amber-700">
            권장 {requiredPhotoCount}장 중 {photos.length}장 — {lacking}장 더
            필요합니다.
          </p>
        ) : (
          <p className="text-[11px] font-medium text-emerald-700">
            권장 사진 수({requiredPhotoCount}장) 달성.
          </p>
        )}
      </div>
      {editing && (
        <PhotoEditorDialog
          // 같은 photo id 라도 객체가 갱신되면 재렌더되도록 key 고정
          key={editing.id}
          photo={photos.find((p) => p.id === editing.id) ?? editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
