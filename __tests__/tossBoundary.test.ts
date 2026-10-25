// 전환기 경계: Next(app/)와 Vite(toss/) 두 빌드가 같은 lib/domain·lib/db를 쓰는지 지킨다.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { hrefFor, matchRoute, pathFromSearch } from "@/toss/src/router";

const ROOT = join(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

const importsOf = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

describe("toss/ import 경계", () => {
  const tossFiles = walk(join(ROOT, "toss", "src"));
  const libFiles = walk(join(ROOT, "lib"));

  it("toss/는 dexie를 직접 import하지 않는다(DB는 @/lib/db 한 벌)", () => {
    const bad = tossFiles.filter((f) => importsOf(f).some((s) => s === "dexie"));
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("toss/에 도메인 타입·DB 스키마 사본이 없다", () => {
    const bad = tossFiles.filter((f) => {
      const src = readFileSync(f, "utf8");
      return /new\s+Dexie\(|\.stores\(\{|export\s+interface\s+InspectionSession\b/.test(src);
    });
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("lib/는 Next·Vite·toss/ 어느 쪽에도 기대지 않는다", () => {
    const bad = libFiles.filter((f) =>
      importsOf(f).some((s) => /^next(\/|$)|^vite$|^@\/toss\/|^@\/app\//.test(s)),
    );
    expect(bad.map((f) => relative(ROOT, f))).toEqual([]);
  });
});

describe("toss 쿼리 라우터", () => {
  it("p가 없거나 잘못되면 세션 목록", () => {
    expect(pathFromSearch("")).toBe("/sessions");
    expect(pathFromSearch("?p=/")).toBe("/sessions");
    expect(pathFromSearch("?p=https://evil.example")).toBe("/sessions");
  });

  it("hrefFor ↔ pathFromSearch 왕복", () => {
    const path = "/sessions/abc 1/defects/d-2";
    expect(pathFromSearch(hrefFor(path))).toBe(path);
    expect(hrefFor("/sessions/new")).toBe("?p=/sessions/new");
  });

  it("matchRoute: 이식한 경로만 화면, 나머지는 준비 중", () => {
    expect(matchRoute("/sessions")).toEqual({ name: "sessions" });
    expect(matchRoute("/sessions/x/report")).toEqual({ name: "pending", path: "/sessions/x/report" });
  });
});
