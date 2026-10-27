// /api/analyze 상한(429) 오류 판정 — analysisRepo.callAnalyzeApi가 응답의 status·reason·canReward를 오류에 싣는다.
export const isRateLimited = (err: unknown): boolean => (err as { status?: number })?.status === 429;

/** 리워드 광고를 제안할 상한인가: 하루 상한이고 리워드 캡 전(canReward). 월 예산 소진(MONTHLY_BUDGET)은 제안하지 않는다. */
export const canOfferReward = (err: unknown): boolean =>
  isRateLimited(err) &&
  (err as { reason?: string }).reason === "DAILY_LIMIT" &&
  (err as { canReward?: boolean }).canReward === true;
