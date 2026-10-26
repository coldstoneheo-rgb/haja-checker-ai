// 보고서 출력 동작 — 토스 구현(스텁). WebView에는 인쇄·새 창·anchor 다운로드가 없다(결정: 인쇄·새 창 0).
// 시그니처는 lib/platform/reportActions.ts(Next 웹 구현)와 같다 — vite alias·tsconfig paths가 이 파일로 바꿔 끼운다.
import type { PlatformResult } from "@/lib/platform/types";

export type { PlatformResult };

const PENDING: PlatformResult = { ok: false, message: "이 기능은 곧 지원됩니다." };

export const REPORT_ACTION_LABELS = {
  report: "이미지로 저장",
  json: "JSON 백업",
  blankChecklist: "📋 빈 체크리스트 저장 (종이 백업용)",
} as const;

// TODO(QR-1029): 보고서 DOM → PNG → File.saveBase64 / 공유(intoss://). 실기기 실측 뒤 구현.
export function printReport(): PlatformResult {
  return PENDING;
}

// TODO(QR-1029): 빈 체크리스트도 PNG 저장 경로로 합친다.
export function printBlankChecklist(_html: string): PlatformResult {
  return PENDING;
}

// TODO(QR-1029): Blob → base64 → File.saveBase64.
export function saveFile(_blob: Blob, _filename: string): PlatformResult {
  return PENDING;
}
