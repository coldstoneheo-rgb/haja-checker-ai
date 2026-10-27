// S2 이식 조각 3(HO-2026-1026-haja-s2-port-03): 실기기 «없음» 3종(카메라·광고·식별키) 스텁 + 호출 지점 · Next 웹 무회귀.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { read, ROOT, tossGraph, TOSS_ALIASES } from "./helpers/tossGraph";

const graph = tossGraph();
const ADAPTERS = ["reportActions", "camera", "ads", "identity"] as const;
const exportNames = (src: string) =>
  [...src.matchAll(/export (?:async function|function|const) (\w+)/g)].map((m) => m[1]).sort();
const todoCount = (src: string) => src.match(/TODO\(QR-1029\)/g)?.length ?? 0;

describe("플랫폼 어댑터 4종(Next 웹 / 토스 스텁)", () => {
  it.each(ADAPTERS)("%s: 두 구현이 있고 export 이름이 같다(토스 전용 상수 AD_GROUP_IDS 제외)", (name) => {
    expect(existsSync(join(ROOT, `lib/platform/${name}.ts`))).toBe(true);
    expect(existsSync(join(ROOT, `toss/src/platform/${name}.ts`))).toBe(true);
    const toss = exportNames(read(`toss/src/platform/${name}.ts`)).filter((n) => n !== "AD_GROUP_IDS");
    expect(toss).toEqual(exportNames(read(`lib/platform/${name}.ts`)));
    expect(TOSS_ALIASES.some(([re, t]) => re.test(`@/lib/platform/${name}`) && t === `toss/src/platform/${name}.ts`)).toBe(true);
    expect(read("toss/tsconfig.json")).toContain(`"@/lib/platform/${name}": ["./src/platform/${name}.ts"]`);
  });

  it("toss 그래프에 Next 웹 어댑터가 하나도 실리지 않는다(lib/platform은 types.ts만)", () => {
    expect(graph.files.filter((f) => f.startsWith("lib/platform/"))).toEqual(["lib/platform/types.ts"]);
    for (const name of ["camera", "ads", "identity"]) expect(graph.files).toContain(`toss/src/platform/${name}.ts`);
  });

  it("toss/src/platform에 어댑터 아닌 파일은 openURL.ts뿐이다(새 플랫폼 파일은 이 표에 올린다)", () => {
    const files = readdirSync(join(ROOT, "toss/src/platform")).sort();
    expect(files).toEqual(["ads.ts", "camera.ts", "identity.ts", "openURL.ts", "reportActions.ts"]);
  });
});

describe("TODO(QR-1029) 자리 수 고정", () => {
  it("토스 스텁: openURL 1 · reportActions 3 · camera 1 · ads 2 · identity 1", () => {
    const counts = Object.fromEntries(
      ["openURL", ...ADAPTERS].map((n) => [n, todoCount(read(`toss/src/platform/${n}.ts`))]),
    );
    expect(counts).toEqual({ openURL: 1, reportActions: 3, camera: 1, ads: 2, identity: 1 });
  });

  it.each([
    ["app/sessions/[sessionId]/checklist/PhotoCaptureButton.tsx", "camera"],
    ["lib/repo/analysisRepo.ts", "identity"],
    ["app/sessions/[sessionId]/analysis/AnalysisView.tsx", "ads"],
  ])("호출 지점 %s → @/lib/platform/%s (TODO 1개)", (file, name) => {
    const src = read(file);
    expect(src).toContain(`from "@/lib/platform/${name}"`);
    expect(todoCount(src)).toBe(1);
    expect(graph.files).toContain(file);
  });
});

describe("스텁은 실제 호출 0", () => {
  it("토스 스텁은 SDK·네트워크를 부르지 않는다(실기기 실측 전)", () => {
    for (const n of ["camera", "ads", "identity"]) {
      const src = read(`toss/src/platform/${n}.ts`);
      expect(src, n).not.toMatch(/from ["']@apps-in-toss\//);
      expect(src, n).not.toMatch(/\bfetch\(/);
    }
  });

  it("광고 그룹 ID는 비어 있다(실 ID 0 — 콘솔 발급은 사용자 손)", async () => {
    const { AD_GROUP_IDS } = await import("@/toss/src/platform/ads");
    expect(AD_GROUP_IDS).toEqual({ interstitial: "", rewarded: "" });
  });

  it("서버는 아직 클라이언트 식별키 헤더를 읽지 않는다(상한 키 = 접속 주소)", () => {
    const route = read("app/api/analyze/route.ts");
    expect(route).not.toContain("x-haja-anon-key");
    expect(route).toMatch(/return "ip:" \+/);
  });
});

describe("Next 웹 무회귀", () => {
  it("웹 카메라 = <input type=file accept=image/* capture=environment multiple> 그대로", async () => {
    const web = await import("@/lib/platform/camera");
    expect(web.nativeCamera).toBe(false);
    const btn = read("app/sessions/[sessionId]/checklist/PhotoCaptureButton.tsx");
    expect(btn).toMatch(/<input\s+ref=\{inputRef\}\s+type="file"\s+accept="image\/\*"\s+capture="environment"\s+multiple/);
    expect(btn).toMatch(/\{nativeCamera \? \(/);
  });

  it("토스도 QR 실측 전에는 <input type=file>을 쓴다(스텁이 사진 기능을 막지 않는다) · 네이티브 경로는 busy·예외 처리", async () => {
    const toss = await import("@/toss/src/platform/camera");
    expect(toss.nativeCamera).toBe(false);
    const btn = read("app/sessions/[sessionId]/checklist/PhotoCaptureButton.tsx");
    const native = btn.slice(btn.indexOf("async function pickNative"), btn.indexOf("function retry"));
    expect(native).toMatch(/if \(busy\) return;\s*setBusy\(true\);/);
    expect(native).toMatch(/catch \(err\) \{[\s\S]*setError\(classifyError\(err\)\)/);
  });

  it("상한(429) 처리: 판정은 그대로(일괄 분석 중단), 리워드 자리는 하루 상한·캡 전에만, 기다리지 않는다", async () => {
    const { isRateLimited, canOfferReward } = await import("@/lib/ai/limitError");
    const daily = { status: 429, reason: "DAILY_LIMIT", canReward: true };
    const capped = { status: 429, reason: "DAILY_LIMIT", canReward: false };
    const monthly = { status: 429, reason: "MONTHLY_BUDGET" };
    expect([daily, capped, monthly].map(isRateLimited)).toEqual([true, true, true]);
    expect([daily, capped, monthly].map(canOfferReward)).toEqual([true, false, false]);
    expect(canOfferReward({ status: 429, reason: "MONTHLY_BUDGET", canReward: true })).toBe(false);
    expect(isRateLimited({ status: 500 })).toBe(false);
    expect(isRateLimited(new Error("x"))).toBe(false);
    const view = read("app/sessions/[sessionId]/analysis/AnalysisView.tsx");
    expect(view.match(/return noteLimit\(err\);/g)).toHaveLength(2);
    expect(view).toMatch(/if \(canOfferReward\(err\)\) void onDailyLimit\(\);\s*return isRateLimited\(err\);/);
    expect(view).not.toMatch(/await onDailyLimit/);
    expect(view.match(/if \(limited\) break;/g)).toHaveLength(2);
    const repo = read("lib/repo/analysisRepo.ts");
    expect(repo).toMatch(/status: response\.status,\s*reason: data\.reason,\s*canReward: data\.canReward,/);
  });

  it("웹 식별키 = null → analyze 요청 헤더 변화 0", async () => {
    const web = await import("@/lib/platform/identity");
    await expect(web.getAnonymousKey()).resolves.toBeNull();
    expect(read("lib/repo/analysisRepo.ts")).toMatch(/\.\.\.\(anonKey \? \{ "x-haja-anon-key": anonKey \} : \{\}\)/);
  });

  it("웹 광고 = 동작 0(window·fetch 없음)", async () => {
    const src = read("lib/platform/ads.ts");
    expect(src).not.toMatch(/\bwindow\b|\bfetch\(/);
    const web = await import("@/lib/platform/ads");
    await expect(web.onDailyLimit()).resolves.toMatchObject({ ok: false });
  });
});
