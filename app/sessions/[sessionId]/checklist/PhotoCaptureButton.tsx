"use client";

import { useRef, useState } from "react";
import { addPhoto } from "@/lib/repo/photoRepo";

interface Props {
  sessionId: string;
  checklistItemId: string;
  areaName: string;
  detailLocation?: string;
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

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      // 한 번에 여러 장 가능. 순서대로 저장.
      for (const file of Array.from(files)) {
        await addPhoto({
          sessionId,
          checklistItemId,
          areaName,
          detailLocation,
          source: file,
        });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "사진 저장 중 오류가 발생했습니다.";
      // 카메라 권한 거부 또는 접근 불가 오류 감지
      if (
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("notallowed") ||
        msg.toLowerCase().includes("security")
      ) {
        setError(
          "카메라 접근이 차단되어 있습니다. 브라우저 설정 > 사이트 권한에서 카메라를 허용해 주세요.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
      // 같은 파일을 다시 선택할 수 있도록 input 초기화
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 ring-slate-900 ${
          busy ? "bg-slate-300 text-slate-600" : "bg-slate-900 text-white"
        }`}
      >
        <span aria-hidden>📷</span>
        <span>{busy ? "저장 중…" : "사진 촬영 / 추가"}</span>
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
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
