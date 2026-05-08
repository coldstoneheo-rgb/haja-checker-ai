"use client";

import { useEffect, useState } from "react";
import { useBlobUrl } from "@/lib/util/blobUrl";
import { deletePhoto } from "@/lib/repo/photoRepo";
import type { EvidencePhoto } from "@/lib/domain/types";

interface Props {
  photos: EvidencePhoto[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photo = photos[index];
  const url = useBlobUrl(photo?.blob);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!photo) return null;

  async function onDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deletePhoto(photo.id);
    if (photos.length <= 1) { onClose(); return; }
    setIndex((i) => Math.min(i, photos.length - 2));
    setConfirmDelete(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,0px),16px)] pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
          ✕ 닫기
        </button>
        <span className="text-xs font-medium text-white/60">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${confirmDelete ? "bg-rose-600 text-white" : "bg-white/10 text-white"}`}
        >
          {confirmDelete ? "확인 삭제" : "삭제"}
        </button>
      </div>

      {/* Image */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="max-h-full max-w-full object-contain"
            style={{ touchAction: "pinch-zoom" }}
            draggable={false}
          />
        ) : (
          <span className="text-sm text-white/40">로딩 중…</span>
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      {photos.length > 1 && (
        <div
          className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="pointer-events-auto rounded-full bg-white/10 p-2 text-white disabled:opacity-20"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={index === photos.length - 1}
            onClick={() => setIndex((i) => i + 1)}
            className="pointer-events-auto rounded-full bg-white/10 p-2 text-white disabled:opacity-20"
          >
            ›
          </button>
        </div>
      )}

      {/* Footer — memo */}
      {photo.userMemo && (
        <div
          className="px-4 py-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-white/80">{photo.userMemo}</p>
        </div>
      )}
    </div>
  );
}
