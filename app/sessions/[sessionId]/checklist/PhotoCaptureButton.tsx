"use client";

import { useRef, useState } from "react";
import { addPhoto } from "@/lib/repo/photoRepo";

interface Props {
  sessionId: string;
  checklistItemId: string;
  areaName: string;
  detailLocation?: string;
}

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("permission") || lower.includes("notallowed") || lower.includes("security")) {
    return "카메라 접근이 차단되어 있습니다. 브라우저 설정 > 사이트 권한에서 카메라를 허용해 주세요.";
  }
  if (lower.includes("memory") || lower.includes("out of memory") || lower.includes("allocation")) {
    return "메모리가 부족합니다. 다른 앱을 닫고 다시 시도해 주세요.";
  }
  if (lower.includes("인코딩") || lower.includes("encoding") || lower.includes("toBlob")) {
    return "사진 처리 중 오류가 발생했습니다. 다시 시도해 주세요.";
  }
  return msg || "사진 저장 중 오류가 발생했습니다. 다시 시도해 주세요.";
}

export default function PhotoCaptureButton({
  sessionId,
  checklistItemId,
  areaName,
  detailLocation,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);

  async function processFiles(files: FileList) {
    setBusy(true);
    setError(null);
    setSaved(0);
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        await addPhoto({ sessionId, checklistItemId, areaName, detailLocation, source: file });
        count += 1;
        setSaved(count);
      }
    } catch (err) {
      console.error("[PhotoCaptureButton]", err);
      setError(classifyError(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  }

  function retry() {
    setError(null);
    inputRef.current?.click();
  }

  const label = busy
    ? saved > 0
      ? `저장 중… (${saved}장 완료)`
      : "처리 중…"
    : "사진 촬영 / 추가";

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 ring-slate-900 transition ${
          busy ? "cursor-not-allowed bg-slate-300 text-slate-600 ring-slate-300" : "bg-slate-900 text-white"
        }`}
      >
        <span aria-hidden>📷</span>
        <span>{label}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          disabled={busy}
          onChange={onChange}
        />
      </label>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2"
        >
          <p className="text-xs font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="shrink-0 rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700"
          >
            재시도
          </button>
        </div>
      )}
    </div>
  );
}
