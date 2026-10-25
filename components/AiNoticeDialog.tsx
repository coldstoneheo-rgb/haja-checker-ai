"use client";

import { useEffect } from "react";
import { AI_FIRST_USE_NOTICE } from "@/lib/ai/notice";

/** 첫 AI 분석 직전 1회 고지(생성형 AI 사전 고지). 확인해야 분석을 진행한다. */
export default function AiNoticeDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Esc = 취소(분석하지 않음)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-notice-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="ai-notice-title" className="text-base font-bold text-slate-900">
          {AI_FIRST_USE_NOTICE.title}
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-slate-700">
          {AI_FIRST_USE_NOTICE.lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            취소
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {AI_FIRST_USE_NOTICE.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
