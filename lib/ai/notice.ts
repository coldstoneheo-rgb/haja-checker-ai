/**
 * 생성형 AI 고지·표시(토스 서비스 오픈 정책 §2-4). 가드 문구 최소화(LC 10-15):
 * 첫 이용 1회 고지 + 결과 카드 라벨 + 보고서 고정 문구 1곳 — 그 밖에는 두지 않는다.
 * 문안은 초안(LC 대조 → 사용자 확정).
 */

export const AI_RESULT_LABEL = "AI 분석";

export const REPORT_AI_FIXED_TEXT = "AI 참고 의견이며 확정 판정이 아닙니다.";

export const AI_FIRST_USE_NOTICE = {
  title: "AI 분석을 시작하기 전에",
  lines: [
    "사진을 AI가 분석해 하자 의심 여부를 알려 드려요.",
    "결과는 AI 참고 의견이며 확정 판정이 아닙니다.",
    "분석할 때만 사진이 서버를 거치고, 서버에 저장하지 않아요.",
  ],
  confirm: "확인했어요",
} as const;

/** 고지 확인 기록 키. 버전을 올리면 문안이 바뀐 뒤 한 번 더 보여 준다. */
export const AI_NOTICE_ACK_KEY = "haja:ai-notice-ack:v1";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 저장소를 못 쓰면(사생활 보호 모드 등) 매번 보여 준다 — 고지를 건너뛰는 쪽으로 실패하지 않는다. */
export function needsAiNotice(storage: KeyValueStorage | null | undefined): boolean {
  try {
    return storage?.getItem(AI_NOTICE_ACK_KEY) == null;
  } catch {
    return true;
  }
}

export function ackAiNotice(storage: KeyValueStorage | null | undefined, now = Date.now()): void {
  try {
    storage?.setItem(AI_NOTICE_ACK_KEY, String(now));
  } catch {
    // 기록 실패는 다음에 다시 보여 주는 것으로 충분
  }
}
