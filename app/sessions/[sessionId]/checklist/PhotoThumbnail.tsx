"use client";

import { useBlobUrl } from "@/lib/util/blobUrl";
import type { EvidencePhoto } from "@/lib/domain/types";

interface Props {
  photo: EvidencePhoto;
  onClick?: () => void;
}

export default function PhotoThumbnail({ photo, onClick }: Props) {
  const url = useBlobUrl(photo.thumbnail ?? photo.blob);
  const tagCount = photo.quickTags?.length ?? 0;
  const hasMemo = !!photo.userMemo && photo.userMemo.trim().length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
      aria-label="사진 편집"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">
          …
        </span>
      )}
      {(tagCount > 0 || hasMemo) && (
        <span className="absolute bottom-1 left-1 right-1 flex justify-between gap-1 text-[10px] font-semibold text-white">
          {hasMemo && (
            <span className="rounded bg-black/60 px-1.5 py-0.5">메모</span>
          )}
          {tagCount > 0 && (
            <span className="ml-auto rounded bg-amber-500/90 px-1.5 py-0.5">
              #{tagCount}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
