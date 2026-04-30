/**
 * 점검 현장에서 시간 절약을 위해 한 번에 누를 수 있는 빠른 태그.
 * 이 태그들은 사진 메타데이터로 저장되고, 보고서/AI 프롬프트 힌트로 재사용된다.
 */
export const QUICK_TAGS: readonly string[] = [
  "균열",
  "찍힘",
  "들뜸",
  "벌어짐",
  "오염",
  "누수 의심",
  "작동 불량",
  "마감 불량",
  "수평 불량",
  "배수 불량",
  "재촬영 필요",
] as const;

export type QuickTag = (typeof QUICK_TAGS)[number];
