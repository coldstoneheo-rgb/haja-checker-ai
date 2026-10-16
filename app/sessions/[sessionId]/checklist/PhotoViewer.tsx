"use client";

import { useEffect, useState } from "react";
import { useBlobUrl } from "@/lib/util/blobUrl";
import { deletePhoto, updatePhoto } from "@/lib/repo/photoRepo";
import { QUICK_TAGS } from "@/lib/seed/quickTags";
import type { EvidencePhoto } from "@/lib/domain/types";

interface Props {
  photos: EvidencePhoto[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const photo = photos[index];
  const url = useBlobUrl(photo?.blob);

  // Reset edit state when the photo changes
  useEffect(() => {
    setEditing(false);
    setMemo(photo?.userMemo ?? "");
    setTags(photo?.quickTags ?? []);
    setConfirmDelete(false);
  }, [photo?.id, photo?.userMemo, photo?.quickTags]);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editing) { setEditing(false); return; }
        onClose();
      }
      if (!editing && e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, photos.length - 1));
      if (!editing && e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length, editing]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!photo) return null;

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      await updatePhoto(photo.id, { userMemo: memo, quickTags: tags });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

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
      onClick={editing ? undefined : onClose}
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
      {!editing && photos.length > 1 && (
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

      {/* Footer — memo/tags + edit panel */}
      <div
        className="flex flex-col gap-2 px-4 py-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-700">메모</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 실리콘 벌어짐, 누수 의심"
                rows={3}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                autoFocus
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">빠른 태그</span>
              <div className="-mx-1 flex flex-wrap gap-2 px-1">
                {QUICK_TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                        active
                          ? "bg-amber-500 text-white ring-amber-500"
                          : "bg-white text-slate-700 ring-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              {photo.userMemo && (
                <p className="text-sm text-white/80">{photo.userMemo}</p>
              )}
              {photo.quickTags && photo.quickTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.quickTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-amber-500/80 px-2 py-0.5 text-xs font-semibold text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
            >
              편집
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
