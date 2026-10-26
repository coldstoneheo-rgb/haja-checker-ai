// S2 이식 조각(HO-2026-1026-haja-s2-port-02): 10화면 라우팅 · 외부 href · 인쇄·새 창 0 · Next 웹 회귀 0.
import { describe, expect, it } from "vitest";
import { matchRoute, type Route } from "@/toss/src/router";
import { assertInternalHref, isInternalHref } from "@/toss/src/shims/next-link";
import { read, tossGraph, TOSS_ALIASES } from "./helpers/tossGraph";

const graph = tossGraph();

describe("toss 진입 그래프", () => {
  it("모든 레포 import가 파일로 풀린다(그래프 누락 0)", () => {
    expect(graph.unresolved).toEqual([]);
  });

  it("헬퍼 alias = vite.config.mts alias(같은 정규식)", () => {
    const cfg = read("vite.config.mts");
    for (const [re, target] of TOSS_ALIASES) {
      expect(cfg, re.source).toContain(`find: ${re.toString()}`);
      expect(cfg, target).toContain(`here("./${target}")`);
    }
  });

  it("10화면 원본이 모두 실린다", () => {
    for (const f of [
      "app/sessions/SessionsList.tsx",
      "app/sessions/new/NewSessionForm.tsx",
      "app/sessions/[sessionId]/SessionOverview.tsx",
      "app/sessions/[sessionId]/checklist/ChecklistView.tsx",
      "app/sessions/[sessionId]/defects/DefectsList.tsx",
      "app/sessions/[sessionId]/defects/new/NewDefectForm.tsx",
      "app/sessions/[sessionId]/defects/[defectId]/DefectDetailView.tsx",
      "app/sessions/[sessionId]/analysis/AnalysisView.tsx",
      "app/sessions/[sessionId]/report/ReportView.tsx",
      "toss/src/pages/HomePage.tsx",
    ]) {
      expect(graph.files, f).toContain(f);
    }
  });
});

describe("쿼리 라우팅 10화면", () => {
  it("matchRoute: 10경로", () => {
    const cases: [string, Route][] = [
      ["/home", { name: "home" }],
      ["/sessions", { name: "sessions" }],
      ["/sessions/new", { name: "sessionNew" }],
      ["/sessions/s1", { name: "overview", sessionId: "s1" }],
      ["/sessions/s1/checklist", { name: "checklist", sessionId: "s1" }],
      ["/sessions/s1/defects", { name: "defects", sessionId: "s1" }],
      ["/sessions/s1/defects/new", { name: "defectNew", sessionId: "s1" }],
      ["/sessions/s1/defects/d1", { name: "defectDetail", sessionId: "s1", defectId: "d1" }],
      ["/sessions/s1/analysis", { name: "analysis", sessionId: "s1" }],
      ["/sessions/s1/report", { name: "report", sessionId: "s1" }],
    ];
    for (const [path, route] of cases) expect(matchRoute(path), path).toEqual(route);
    expect(new Set(cases.map(([, r]) => r.name)).size).toBe(10);
  });

  it("모르는 경로는 pending", () => {
    for (const p of ["/x", "/sessions/s1/nope", "/sessions/s1/defects/d1/x", "/sessions//checklist", "/sessions/s1/"]) {
      expect(matchRoute(p).name, p).toBe("pending");
    }
  });

  it("새 세션→대시보드→체크리스트→하자→분석→보고서 왕복: 화면 안 이동 대상이 전부 이식 화면이다", () => {
    // 이식 화면이 실제로 내보내는 이동 대상(href·router.push·replace)을 소스에서 모은다
    const targets = new Set<string>();
    for (const f of graph.files) {
      const src = read(f);
      for (const m of src.matchAll(/href=(?:"([^"]+)"|\{`([^`]+)`\})|router\.(?:push|replace)\(`([^`]+)`\)/g)) {
        const t = (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]+\}/g, "x");
        targets.add(t);
      }
    }
    const pending = [...targets].filter((t) => matchRoute(t).name === "pending");
    expect(pending).toEqual([]);
    // 왕복 경로의 각 다리가 소스에 존재한다
    for (const leg of [
      "/sessions/new", // 목록 → 새 세션
      "/sessions/x", // 새 세션 → 대시보드(router.push)
      "/sessions/x/checklist", // 대시보드 → 체크리스트
      "/sessions/x/defects", // 대시보드 → 하자 목록
      "/sessions/x/defects/new", // 하자 목록 → 신규
      "/sessions/x/defects/x", // 신규 → 상세
      "/sessions/x/analysis", // 대시보드·체크리스트 → 분석
      "/sessions/x/report", // 분석·대시보드 → 보고서
      "/sessions", // 보고서 쪽에서 목록으로(세션 없음 화면)
    ]) {
      expect(targets, leg).toContain(leg);
    }
  });
});

describe("Link shim 외부 href", () => {
  it("앱 안 경로만 internal", () => {
    expect(isInternalHref("/sessions")).toBe(true);
    for (const h of ["https://evil.example", "//evil.example", "/\\evil.example", "mailto:a@b.c", "#x"]) {
      expect(isInternalHref(h), h).toBe(false);
    }
  });

  it("개발 중 외부 href는 throw, 빌드본은 throw 없이 openExternal로", () => {
    expect(() => assertInternalHref("https://evil.example", true)).toThrow(/외부 링크 금지/);
    expect(() => assertInternalHref("https://evil.example", false)).not.toThrow();
    expect(() => assertInternalHref("/sessions", true)).not.toThrow();
    const shim = read("toss/src/shims/next-link.tsx");
    expect(shim).toMatch(/assertInternalHref\(href, import\.meta\.env\.DEV\)/);
    expect(shim).toMatch(/else openExternal\(href\)/);
    expect(shim).toMatch(/navigate\(href, replace, scroll\)/);
  });
});

describe("인쇄·새 창 0(toss) · Next 웹 회귀 0", () => {
  it("toss 그래프에 window.print·window.open·anchor download가 없다", () => {
    const bad = graph.files.filter((f) => /window\.(print|open)\s*\(|\.download\s*=/.test(read(f)));
    expect(bad).toEqual([]);
  });

  it("toss 그래프는 Next 웹 어댑터(lib/platform/reportActions.ts)를 싣지 않고 토스 스텁을 싣는다", () => {
    expect(graph.files).not.toContain("lib/platform/reportActions.ts");
    expect(graph.files).toContain("toss/src/platform/reportActions.ts");
    expect(read("toss/src/platform/reportActions.ts")).toMatch(/TODO\(QR-1029\)/);
  });

  it("Next 웹 어댑터는 기존 인쇄·새 창·다운로드 경로를 그대로 쓴다", () => {
    const web = read("lib/platform/reportActions.ts");
    expect(web).toMatch(/window\.print\(\)/);
    expect(web).toMatch(/window\.open\("", "_blank"\)/);
    expect(web).toMatch(/a\.download = filename/);
    const view = read("app/sessions/[sessionId]/report/ReportView.tsx");
    expect(view).toContain('from "@/lib/platform/reportActions"');
    expect(view).not.toMatch(/window\.(print|open)/);
  });

  it("두 어댑터의 export 이름이 같다", () => {
    const names = (src: string) => [...src.matchAll(/export (?:function|const) (\w+)/g)].map((m) => m[1]).sort();
    expect(names(read("toss/src/platform/reportActions.ts"))).toEqual(names(read("lib/platform/reportActions.ts")));
  });
});

describe("고지 게이트: toss 진입 그래프 전수", () => {
  it("toss 번들에서 analyze*를 부르는 화면은 모두 useAiNoticeGate를 쓰고, /api/analyze 호출은 analysisRepo 한 곳뿐", () => {
    const callers = graph.files.filter((f) => /\b(analyzeChecklistItem|analyzeDirectDefect)\(/.test(read(f)));
    const screens = callers.filter((f) => f.endsWith(".tsx"));
    expect(screens.sort()).toEqual([
      "app/sessions/[sessionId]/analysis/AnalysisView.tsx",
      "app/sessions/[sessionId]/defects/[defectId]/DefectDetailView.tsx",
    ]);
    for (const f of screens) expect(read(f).includes("useAiNoticeGate()"), f).toBe(true);
    const fetchers = graph.files.filter((f) => /["'`]\/api\/analyze/.test(read(f)));
    expect(fetchers).toEqual(["lib/repo/analysisRepo.ts"]);
  });
});
