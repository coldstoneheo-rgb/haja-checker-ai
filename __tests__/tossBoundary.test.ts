// 전환기 경계: Next(app/)와 Vite(toss/) 두 빌드가 같은 lib/domain·lib/db를 쓰는지 지킨다.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { hrefFor, matchRoute, pathFromSearch } from "@/toss/src/router";
import { paramsFromPath } from "@/toss/src/shims/next-navigation";

const ROOT = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

/** from "x" · import "x" · import("x") · export … from "x" 모두 */
const importsOf = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)].map(
    (m) => m[1],
  );

/** 상대 import를 레포 루트 기준 경로로 푼다(상대가 아니면 그대로). */
const resolved = (file: string, spec: string) =>
  spec.startsWith(".") ? relative(ROOT, resolve(dirname(file), spec)).replace(/\\/g, "/") : spec;

describe("toss/ import 경계", () => {
  const tossFiles = walk(join(ROOT, "toss", "src"));
  const libFiles = walk(join(ROOT, "lib"));

  it("toss/는 dexie를 직접 import하지 않는다(DB는 @/lib/db 한 벌)", () => {
    const bad = tossFiles.filter((f) => importsOf(f).some((s) => /^dexie(\/|$)/.test(s)));
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("toss/에 도메인 타입·DB 스키마 사본이 없다", () => {
    const bad = tossFiles.filter((f) =>
      /new\s+Dexie\(|\.stores\(\{|export\s+interface\s+InspectionSession\b/.test(readFileSync(f, "utf8")),
    );
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("lib/는 Next·Vite·app/·toss/ 어느 쪽에도 기대지 않는다(상대 경로 포함)", () => {
    const bad = libFiles.flatMap((f) =>
      importsOf(f)
        .map((s) => resolved(f, s))
        .filter((s) => /^next(\/|$)|^vite$|^@\/(toss|app)\/|^(toss|app)\//.test(s))
        .map((s) => `${relative(ROOT, f)} → ${s}`),
    );
    expect(bad).toEqual([]);
  });

  it("vite 설정: @/ = 레포 루트, dexie·dexie-react-hooks dedupe(S1 ③ 필수)", () => {
    const cfg = readFileSync(join(ROOT, "vite.config.mts"), "utf8");
    expect(cfg).toMatch(/find:\s*\/\^@\\\/\/,\s*replacement:\s*here\("\.\/"\)/);
    const dedupe = cfg.match(/dedupe:\s*\[([^\]]*)\]/)?.[1] ?? "";
    expect(dedupe).toContain('"dexie"');
    expect(dedupe).toContain('"dexie-react-hooks"');
  });
});

describe("toss 쿼리 라우터", () => {
  it("p가 없거나 앱 밖을 가리키면 세션 목록", () => {
    expect(pathFromSearch("")).toBe("/sessions");
    expect(pathFromSearch("?p=/")).toBe("/sessions");
    expect(pathFromSearch("?p=https://evil.example")).toBe("/sessions");
    expect(pathFromSearch("?p=//evil.example")).toBe("/sessions");
    expect(pathFromSearch("?p=/%5Cevil.example")).toBe("/sessions");
  });

  it("hrefFor ↔ pathFromSearch 왕복", () => {
    const path = "/sessions/abc 1/defects/d-2";
    expect(pathFromSearch(hrefFor(path))).toBe(path);
    expect(hrefFor("/sessions/new")).toBe("?p=/sessions/new");
  });

  it("matchRoute: 이식한 경로는 화면, 모르는 경로는 pending(10경로 전수는 tossPort.test.ts)", () => {
    expect(matchRoute("/sessions")).toEqual({ name: "sessions" });
    expect(matchRoute("/sessions/x/nope")).toEqual({ name: "pending", path: "/sessions/x/nope" });
  });
});

describe("next/navigation shim useParams", () => {
  it("sessionId·defectId, 정적 세그먼트 new는 파라미터가 아니다", () => {
    expect(paramsFromPath("/sessions/s1")).toEqual({ sessionId: "s1" });
    expect(paramsFromPath("/sessions/s1/defects/d1")).toEqual({ sessionId: "s1", defectId: "d1" });
    expect(paramsFromPath("/sessions/new")).toEqual({});
    expect(paramsFromPath("/sessions/s1/defects/new")).toEqual({ sessionId: "s1" });
  });

  it("%가 섞인 딥링크에도 던지지 않는다(이중 디코딩 회귀)", () => {
    const path = pathFromSearch("?p=/sessions/%25zz");
    expect(path).toBe("/sessions/%zz");
    expect(() => paramsFromPath(path)).not.toThrow();
    expect(paramsFromPath(path)).toEqual({ sessionId: "%zz" });
  });
});

describe("toss 번들의 next import", () => {
  it("shim 있는 next/link·next/navigation 말고는 next 패키지 import가 없다(next/image 등)", async () => {
    const { tossGraph } = await import("./helpers/tossGraph");
    const bad = tossGraph()
      .bare.filter(({ spec }) => /^next(\/|$)/.test(spec))
      .map(({ file, spec }) => `${file} → ${spec}`);
    expect(bad).toEqual([]);
  });
});

describe("Next 화면 제거(S2 (가))", () => {
  it("app/에 page.tsx 0 · /api/analyze 라우트는 남는다", () => {
    // walk()는 .ts/.tsx만 모으므로 page.js·jsx까지 보려고 따로 훑는다
    const all = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? all(p) : [relative(ROOT, p).replace(/\\/g, "/")];
      });
    const appFiles = all(join(ROOT, "app"));
    expect(appFiles.filter((f) => /\/page\.[jt]sx?$/.test(f))).toEqual([]);
    expect(appFiles).toContain("app/api/analyze/route.ts");
  });
});
