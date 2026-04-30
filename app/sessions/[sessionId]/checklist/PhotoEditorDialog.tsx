"use client";

import { useEffect, useState } from "react";
import { useBlobUrl } from "@/lib/util/blobUrl";
import { deletePhoto, updatePhoto } from "@/lib/repo/photoRepo";
import { QUICK_TAGS } from "@/lib/seed/quickTags";
import type { EvidencePhoto } from "@/lib/domain/types";

interface Props {
  photo: EvidencePhoto;
  onClose: () => void;
}

export default function PhotoEditorDialog({ photo, onClose }: Props) {
  const url = useBlobUrl(photo.blob);
  // 다른 사진을 열 때 폼 상태가 새로 초기화되도록 부모에서 key={photo.id} 를
  // 지정한다. 그래서 useState 초기값으로 충분하며 별도 동기화 effect 는 없다.
  const [memo, setMemo] = useState(photo.userMemo ?? "");
  const [tags, setTags] = useState<string[]>(photo.quickTags ?? []);
  const [busy, setBusy] = useState<"saving" | "deleting" | null>(null);

  // ESC 로 닫기.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function onSave() {
    setBusy("saving");
    try {
      await updatePhoto(photo.id, { userMemo: memo, quickTags: tags });
      onClose();
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    setBusy("deleting");
    try {
      await deletePhoto(photo.id);
      onClose();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="사진 편집"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white"
        >
          ← 닫기
        </button>
        <span className="text-xs font-medium text-white/70">
          {new Date(photo.takenAt).toLocaleString("ko-KR")}
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-5">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="max-h-[55vh] w-full rounded-xl object-contain"
          />
        ) : (
          <span className="text-sm text-white/70">불러오는 중…</span>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-t-3xl bg-white px-5 pt-5 pb-[max(env(safe-area-inset-bottom,0px),16px)] shadow-xl">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-500">위치</p>
          <p className="text-sm font-medium text-slate-900">
            {photo.areaName}
            {photo.detailLocation ? ` · ${photo.detailLocation}` : ""}
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">메모</span>
          <textarea
            className="min-h-[64px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 실리콘 벌어짐, 물 사용 시 누수 의심"
            rows={3}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">빠른 태그</span>
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

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onDelete}
            disabled={busy !== null}
            className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50"
          >
            {busy === "deleting" ? "삭제 중…" : "삭제"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy !== null}
            className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "saving" ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
