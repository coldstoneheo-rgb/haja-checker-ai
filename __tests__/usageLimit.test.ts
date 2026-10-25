import { describe, it, expect } from "vitest";
import {
  DAILY_BASE,
  DAILY_CAP,
  MemoryUsageStore,
  consumeAnalysis,
  dailyLimit,
  grantReward,
  kstDay,
} from "@/lib/ai/usageLimit";

const NOW = new Date("2026-10-26T03:00:00Z"); // KST 12:00
const user = "anon-1";

async function useN(store: MemoryUsageStore, n: number, extra: Partial<Parameters<typeof consumeAnalysis>[0]> = {}) {
  let last;
  for (let i = 0; i < n; i++) last = await consumeAnalysis({ store, userKey: user, now: NOW, ...extra });
  return last!;
}

describe("하루 상한 경계값", () => {
  it("30번째 허용 · 31번째 거절(리워드 가능)", async () => {
    const store = new MemoryUsageStore();
    const d30 = await useN(store, 30);
    expect(d30).toEqual({ allowed: true, remaining: 0 });
    const d31 = await consumeAnalysis({ store, userKey: user, now: NOW });
    expect(d31).toEqual({ allowed: false, reason: "DAILY_LIMIT", remaining: 0, canReward: true });
  });

  it("리워드 1회 → 40번째 허용 · 41번째 거절", async () => {
    const store = new MemoryUsageStore();
    await useN(store, 30);
    expect(await grantReward({ store, userKey: user, now: NOW })).toBe(true);
    expect((await useN(store, 10)).allowed).toBe(true);
    expect((await consumeAnalysis({ store, userKey: user, now: NOW })).allowed).toBe(false);
  });

  it("리워드 3회로 캡 60 · 4회째 리워드 거절 · 61번째 거절(리워드 불가)", async () => {
    const store = new MemoryUsageStore();
    for (let i = 0; i < 3; i++) expect(await grantReward({ store, userKey: user, now: NOW })).toBe(true);
    expect(await grantReward({ store, userKey: user, now: NOW })).toBe(false);
    expect((await useN(store, 60)).allowed).toBe(true);
    expect(await consumeAnalysis({ store, userKey: user, now: NOW })).toEqual({
      allowed: false,
      reason: "DAILY_LIMIT",
      remaining: 0,
      canReward: false,
    });
  });

  it("dailyLimit: 0→30, 1→40, 3→60, 9→60(캡)", () => {
    expect([0, 1, 3, 9].map(dailyLimit)).toEqual([DAILY_BASE, 40, DAILY_CAP, DAILY_CAP]);
  });

  it("KST 자정에 초기화(사용자별)", async () => {
    const store = new MemoryUsageStore();
    await useN(store, 30);
    const tomorrow = new Date("2026-10-26T15:00:00Z"); // KST 10-27 00:00
    expect(kstDay(tomorrow)).toBe("2026-10-27");
    expect((await consumeAnalysis({ store, userKey: user, now: tomorrow })).allowed).toBe(true);
    expect((await consumeAnalysis({ store, userKey: "anon-2", now: NOW })).allowed).toBe(true);
  });
});

describe("월 예산 $30", () => {
  it("예산 직전까지 허용, 넘는 1회는 거절 — 거절은 카운터를 늘리지 않는다", async () => {
    const store = new MemoryUsageStore();
    // 원가 $1로 두면 30회째에 정확히 $30 → 허용, 31회째 거절
    const opts = { costPerCallUsd: 1 };
    let ok = 0;
    for (let i = 0; i < 30; i++) {
      const u = `u${i}`;
      const d = await consumeAnalysis({ store, userKey: u, now: NOW, ...opts });
      if (d.allowed) ok++;
    }
    expect(ok).toBe(30);
    const over = await consumeAnalysis({ store, userKey: "u-last", now: NOW, ...opts });
    expect(over).toEqual({ allowed: false, reason: "MONTHLY_BUDGET", remaining: 0, canReward: false });
    expect(await store.get("used:2026-10-26:u-last")).toBe(0);
  });

  it("달이 바뀌면(KST) 예산 초기화", async () => {
    const store = new MemoryUsageStore();
    await consumeAnalysis({ store, userKey: user, now: NOW, costPerCallUsd: 30 });
    expect((await consumeAnalysis({ store, userKey: "x", now: NOW, costPerCallUsd: 1 })).allowed).toBe(false);
    const nextMonth = new Date("2026-10-31T15:00:00Z"); // KST 11-01 00:00
    expect((await consumeAnalysis({ store, userKey: "x", now: nextMonth, costPerCallUsd: 1 })).allowed).toBe(true);
  });
});
