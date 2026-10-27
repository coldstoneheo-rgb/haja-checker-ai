// 광고(전면·리워드) — 토스 구현(스텁). 광고 실 호출 0 · 실 광고 ID 0(콘솔 발급은 사용자 손).
// 시그니처는 lib/platform/ads.ts(Next 웹 구현)와 같다 — vite alias·tsconfig paths가 이 파일로 바꿔 끼운다.
import type { PlatformResult } from "@/lib/platform/types";

/** 광고 그룹 ID 자리 — QR 실측 때 테스트 ID, 출시 때 콘솔 발급 ID. 지금은 비워 둔다. */
export const AD_GROUP_IDS = { interstitial: "", rewarded: "" } as const;

const PENDING: PlatformResult = { ok: false, message: "이 기능은 곧 지원됩니다." };

// TODO(QR-1029): loadFullScreenAd → showFullScreenAd({ options: { adGroupId: AD_GROUP_IDS.interstitial } }).
export async function showInterstitialAd(): Promise<PlatformResult> {
  return PENDING;
}

// TODO(QR-1029): 리워드 광고 제안 → showFullScreenAd(rewarded) onEvent "userEarnedReward"
//   → 서버 grantReward(lib/ai/usageLimit.ts, 라우트는 광고 검증과 함께 노출) → 오늘 한도 +10.
export async function onDailyLimit(): Promise<PlatformResult> {
  return PENDING;
}
