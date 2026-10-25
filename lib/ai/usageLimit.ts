/**
 * AI 분석 상한(서버 전용) — 사용자 승인 10-03: 하루 30회 · 리워드 1회당 +10 · 하루 캡 60 · 월 $30 넘으면 전체 중단.
 *
 * 동시성: «먼저 더하고, 넘으면 되돌린다». incr가 원자적이면(KV INCRBY 등) 동시 요청이 와도 한도를 넘겨 허용하지 않는다.
 *
 * 저장소 한계(지금 = 함수 메모리 어댑터):
 * - 인스턴스마다 따로 센다. 콜드 스타트마다 0으로 돌아간다.
 * - 그래서 «하루 30회»는 느슨한 상한이고, «월 $30 자동 중단»은 **보장되지 않는다**.
 * - KV 어댑터(S3, env·배포가 열린 뒤)가 붙기 전까지는 Google Cloud 쪽 예산 알림·한도를 함께 걸어야 한다.
 */

export const DAILY_BASE = 30;
export const REWARD_BONUS = 10;
export const DAILY_CAP = 60;
export const MONTHLY_BUDGET_USD = 30;
/** 분석 1회 원가 추정(Gemini Flash 계열 이미지 2~3장, 추정) — 실측 뒤 env로 덮어쓴다. */
export const DEFAULT_COST_PER_CALL_USD = 0.003;

export interface UsageStore {
  get(key: string): Promise<number>;
  /** key 값에 by(음수 가능)를 원자적으로 더하고 새 값을 돌려준다. */
  incr(key: string, by: number): Promise<number>;
}

export class MemoryUsageStore implements UsageStore {
  private m = new Map<string, number>();
  async get(key: string) {
    return this.m.get(key) ?? 0;
  }
  async incr(key: string, by: number) {
    const v = (this.m.get(key) ?? 0) + by;
    this.m.set(key, v);
    return v;
  }
}

/** KST 날짜·월 키(한국 사용자 기준 자정에 초기화, 서머타임 없음). */
export function kstDay(now: Date): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
export function kstMonth(now: Date): string {
  return kstDay(now).slice(0, 7);
}

export const usageKeys = {
  used: (user: string, now: Date) => `used:${kstDay(now)}:${user}`,
  rewards: (user: string, now: Date) => `rewards:${kstDay(now)}:${user}`,
  spend: (now: Date) => `spend-micro:${kstMonth(now)}`,
};

export function dailyLimit(rewards: number): number {
  return Math.min(DAILY_BASE + REWARD_BONUS * Math.max(0, rewards), DAILY_CAP);
}

export type LimitDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: "DAILY_LIMIT" | "MONTHLY_BUDGET"; remaining: number; canReward: boolean };

export interface LimitOptions {
  store: UsageStore;
  userKey: string;
  now?: Date;
  costPerCallUsd?: number;
  monthlyBudgetUsd?: number;
}

const toMicro = (usd: number) => Math.round(usd * 1_000_000);

/** env 원가 값 검사: 유한한 양수만 받는다(음수·0·NaN이면 기본값). */
export function parseCostPerCall(raw: string | undefined): number | undefined {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * 1회를 쓸 수 있으면 쓰고(하루 +1, 월 지출 +원가) 결과를 돌려준다. 막히면 더한 것을 되돌려 카운터는 그대로다.
 * 정책: 분석이 실패해도(타임아웃·오류) 차감은 유지한다 — 상류 원가가 이미 났을 수 있다.
 */
export async function consumeAnalysis(opts: LimitOptions): Promise<LimitDecision> {
  const now = opts.now ?? new Date();
  // 1µ$ 미만으로 반올림돼 예산이 줄지 않는 일이 없게 최소 1
  const cost = Math.max(1, toMicro(opts.costPerCallUsd ?? DEFAULT_COST_PER_CALL_USD));
  const budget = toMicro(opts.monthlyBudgetUsd ?? MONTHLY_BUDGET_USD);
  const usedKey = usageKeys.used(opts.userKey, now);
  const spendKey = usageKeys.spend(now);

  const spend = await opts.store.incr(spendKey, cost);
  if (spend > budget) {
    await opts.store.incr(spendKey, -cost);
    return { allowed: false, reason: "MONTHLY_BUDGET", remaining: 0, canReward: false };
  }
  const limit = dailyLimit(await opts.store.get(usageKeys.rewards(opts.userKey, now)));
  const used = await opts.store.incr(usedKey, 1);
  if (used > limit) {
    await opts.store.incr(usedKey, -1);
    await opts.store.incr(spendKey, -cost);
    return { allowed: false, reason: "DAILY_LIMIT", remaining: 0, canReward: limit < DAILY_CAP };
  }
  return { allowed: true, remaining: limit - used };
}

/** 리워드 광고 1회 시청 → 오늘 한도 +10(캡 60). 캡에 닿았으면 false. 광고 SDK 검증이 붙기 전에는 라우트에 노출하지 않는다. */
export async function grantReward(opts: Pick<LimitOptions, "store" | "userKey" | "now">): Promise<boolean> {
  const now = opts.now ?? new Date();
  const key = usageKeys.rewards(opts.userKey, now);
  const rewards = await opts.store.incr(key, 1);
  if (dailyLimit(rewards - 1) >= DAILY_CAP) {
    await opts.store.incr(key, -1);
    return false;
  }
  return true;
}
