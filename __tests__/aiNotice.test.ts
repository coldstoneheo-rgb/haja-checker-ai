import { describe, it, expect } from "vitest";
import {
  AI_FIRST_USE_NOTICE,
  AI_NOTICE_ACK_KEY,
  AI_RESULT_LABEL,
  REPORT_AI_FIXED_TEXT,
  ackAiNotice,
  needsAiNotice,
  type KeyValueStorage,
} from "@/lib/ai/notice";

function memStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe("첫 이용 AI 고지 1회", () => {
  it("처음엔 보이고, 확인하면 다시 안 보인다", () => {
    const s = memStorage();
    expect(needsAiNotice(s)).toBe(true);
    ackAiNotice(s, 123);
    expect(s.data.get(AI_NOTICE_ACK_KEY)).toBe("123");
    expect(needsAiNotice(s)).toBe(false);
  });

  it("저장소가 없거나 던지면 보여 주는 쪽으로 실패한다", () => {
    expect(needsAiNotice(null)).toBe(true);
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    expect(needsAiNotice(broken)).toBe(true);
    expect(() => ackAiNotice(broken)).not.toThrow();
  });
});

describe("고지·라벨 문구", () => {
  it("결과 라벨 «AI 분석», 보고서 고정 문구", () => {
    expect(AI_RESULT_LABEL).toBe("AI 분석");
    expect(REPORT_AI_FIXED_TEXT).toBe("AI 참고 의견이며 확정 판정이 아닙니다.");
  });

  it("첫 이용 고지는 3줄이고 «확정 판정이 아닙니다»를 포함한다", () => {
    expect(AI_FIRST_USE_NOTICE.lines).toHaveLength(3);
    expect(AI_FIRST_USE_NOTICE.lines.join(" ")).toContain("확정 판정이 아닙니다");
  });
});

describe("AI 분석 진입점은 모두 고지 게이트를 거친다(정적 검사)", () => {
  it("analyzeChecklistItem·analyzeDirectDefect를 부르는 화면은 useAiNoticeGate를 쓴다", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(n) ? [p] : [];
      });
    const root = join(__dirname, "..");
    const callers = [...walk(join(root, "app")), ...walk(join(root, "components"))].filter((f) =>
      /\b(analyzeChecklistItem|analyzeDirectDefect)\(/.test(readFileSync(f, "utf8")),
    );
    expect(callers.length).toBeGreaterThanOrEqual(2);
    for (const f of callers) {
      const src = readFileSync(f, "utf8");
      expect(src.includes("useAiNoticeGate()"), f).toBe(true);
      // 버튼에서 run*·analyzeAll을 guarded 없이 부르지 않는다
      expect(/on(Click|Analyze)=\{\(\) => (run\w+|analyzeAll)\(/.test(src), f).toBe(false);
      expect(/on(Click|Analyze)=\{(run\w+|analyzeAll)\}/.test(src), f).toBe(false);
    }
  });
});
