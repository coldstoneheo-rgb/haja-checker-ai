// 보고서 화면의 출력 동작 — Next 웹 구현(기존 동작 그대로: 인쇄·새 창·anchor 다운로드).
// 토스 빌드는 vite alias로 toss/src/platform/reportActions.ts(스텁)를 대신 쓴다 — 인쇄·새 창 0.
import type { PlatformResult } from "@/lib/platform/types";

export type { PlatformResult };

export const REPORT_ACTION_LABELS = {
  report: "인쇄 / PDF 저장",
  json: "JSON 백업",
  blankChecklist: "📋 빈 체크리스트 출력 (종이 백업용)",
} as const;

export function printReport(): PlatformResult {
  window.print();
  return { ok: true };
}

/** html = 완결된 문서(reportRepo.buildBlankChecklistHtml). 새 창에 쓰고 인쇄 대화상자를 연다. */
export function printBlankChecklist(html: string): PlatformResult {
  const w = window.open("", "_blank");
  if (!w) return { ok: false, message: "팝업이 차단되어 새 창을 열 수 없습니다." };
  w.document.write(html);
  w.document.close();
  w.print();
  return { ok: true };
}

export function saveFile(blob: Blob, filename: string): PlatformResult {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return { ok: true };
}
