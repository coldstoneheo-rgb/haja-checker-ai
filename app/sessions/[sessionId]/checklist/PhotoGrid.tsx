"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { listPhotosForItem } from "@/lib/repo/photoRepo";
import type { EvidencePhoto } from "@/lib/domain/types";
import PhotoGuide from "@/components/PhotoGuide";
import PhotoThumbnail from "./PhotoThumbnail";
import PhotoViewer from "./PhotoViewer";

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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return <PhotoGuide />;
  }

  const lacking = Math.max(0, requiredPhotoCount - photos.length);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, idx) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onClick={() => setViewerIndex(idx)}
            />
          ))}
        </div>
        {lacking > 0 ? (
          <>
            <p className="text-[11px] font-medium text-amber-700">
              권장 {requiredPhotoCount}장 중 {photos.length}장 — {lacking}장 더
              필요합니다.
            </p>
            {photos.length < 3 && <PhotoGuide compact />}
          </>
        ) : (
          <p className="text-[11px] font-medium text-emerald-700">
            권장 사진 수({requiredPhotoCount}장) 달성.
          </p>
        )}
        {photos.some(
          (p) => p.qualityScore !== undefined && p.qualityScore < 0.4,
        ) && (
          <p className="text-[11px] font-medium text-rose-700">
            ⚠ 화질이 낮은 사진이 있습니다. 밝은 곳에서 재촬영을 권장합니다.
          </p>
        )}
      </div>
      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
