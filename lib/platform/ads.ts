// 광고(전면·리워드) — Next 웹 구현: 웹에는 광고가 없다(동작 0).
// 토스 빌드는 vite alias로 toss/src/platform/ads.ts(스텁)를 대신 쓴다.
import type { PlatformResult } from "@/lib/platform/types";

const NONE: PlatformResult = { ok: false, message: "광고를 지원하지 않는 환경입니다." };

export async function showInterstitialAd(): Promise<PlatformResult> {
  return NONE;
}

/** AI 분석 하루 상한(429)에 닿았을 때 부른다. 웹은 아무것도 하지 않는다. */
export async function onDailyLimit(): Promise<PlatformResult> {
  return NONE;
}
