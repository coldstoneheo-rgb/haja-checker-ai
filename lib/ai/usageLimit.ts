/**
 * AI 분석 상한(서버 전용) — 사용자 승인 10-03: 하루 30회 · 리워드 1회당 +10 · 하루 캡 60 · 월 $30 넘으면 전체 중단.
 * 저장소는 인터페이스로 둔다. 지금은 함수 메모리 어댑터(인스턴스마다 따로 셈 — 느슨한 상한),
 * KV 어댑터는 env·배포가 열리는 S3에서 붙인다.
 */

export const DAILY_BASE = 30;
export const REWARD_BONUS = 10;
export const DAILY_CAP = 60;
export const MONTHLY_BUDGET_USD = 30;
/** 분석 1회 원가 추정(Gemini Flash 계열 이미지 2~3장, 추정) — 실측 뒤 env로 덮어쓴다. */
export const DEFAULT_COST_PER_CALL_USD = 0.003;

export interface UsageStore {
  get(key: string): Promise<number>;
  /** key 값에 by를 더하고 새 값을 돌려준다. */
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

/** KST 날짜·월 키(한국 사용자 기준 자정에 초기화). */
export function kstDay(now: Date): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
export function kstMonth(now: Date): string {
  return kstDay(now).slice(0, 7);
}

const k = {
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

/** 한 번 쓸 수 있으면 쓰고(카운터 +1, 월 지출 +원가) 결과를 돌려준다. 막히면 아무것도 늘리지 않는다. */
export async function consumeAnalysis(opts: LimitOptions): Promise<LimitDecision> {
  const now = opts.now ?? new Date();
  const cost = toMicro(opts.costPerCallUsd ?? DEFAULT_COST_PER_CALL_USD);
  const budget = toMicro(opts.monthlyBudgetUsd ?? MONTHLY_BUDGET_USD);
  const [used, rewards, spend] = await Promise.all([
    opts.store.get(k.used(opts.userKey, now)),
    opts.store.get(k.rewards(opts.userKey, now)),
    opts.store.get(k.spend(now)),
  ]);
  const limit = dailyLimit(rewards);
  if (spend + cost > budget) {
    return { allowed: false, reason: "MONTHLY_BUDGET", remaining: 0, canReward: false };
  }
  if (used >= limit) {
    return { allowed: false, reason: "DAILY_LIMIT", remaining: 0, canReward: limit < DAILY_CAP };
  }
  const nowUsed = await opts.store.incr(k.used(opts.userKey, now), 1);
  await opts.store.incr(k.spend(now), cost);
  return { allowed: true, remaining: Math.max(0, limit - nowUsed) };
}

/** 리워드 광고 1회 시청 → 오늘 한도 +10(캡 60). 캡에 닿았으면 false. */
export async function grantReward(opts: Pick<LimitOptions, "store" | "userKey" | "now">): Promise<boolean> {
  const now = opts.now ?? new Date();
  const rewards = await opts.store.get(k.rewards(opts.userKey, now));
  if (dailyLimit(rewards) >= DAILY_CAP) return false;
  await opts.store.incr(k.rewards(opts.userKey, now), 1);
  return true;
}
