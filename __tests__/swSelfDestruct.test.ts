// SW 자폭(port-03 PR B, #19와 묶음): 설치된 SW가 캐시를 지우고 등록을 해제한다 · 다시 등록하는 코드가 없다(헛돌기 0).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const sw = readFileSync(join(ROOT, "public/sw.js"), "utf8");
const code = sw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === "node_modules") return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|js|mjs)$/.test(name) ? [p] : [];
  });
}

describe("public/sw.js 자폭 버전", () => {
  it("캐시 쓰기 0 · fetch 가로채기 0", () => {
    expect(code).not.toMatch(/caches\.open|\.put\(|cache\.add|respondWith|addEventListener\(\s*['"`]fetch|\bonfetch\b|importScripts/);
  });

  it("캐시 전부 삭제 → unregister 1 → 열린 창 navigate 1회", () => {
    expect(code).toMatch(/caches\.keys\(\)/);
    expect(code).toMatch(/keys\.map\(\(key\) => caches\.delete\(key\)\)/);
    expect(code.match(/self\.registration\.unregister\(\)/g)).toHaveLength(1);
    expect(code.match(/\.navigate\(/g)).toHaveLength(1);
    expect(code).toMatch(/self\.skipWaiting\(\)/);
    expect(code).toMatch(/event\.waitUntil\(\s*\(async \(\) => \{/);
    expect(code).toMatch(/await self\.registration\.unregister\(\)/);
    expect(code).toMatch(/Promise\.resolve\(\)\.then\(\(\) => client\.navigate\(client\.url\)\)\.catch\(/);
    const order = ["caches.keys()", "registration.unregister()", "clients.matchAll("].map((s) => code.indexOf(s));
    expect(order.every((i, n) => i >= 0 && (n === 0 || i > order[n - 1]))).toBe(true);
  });

  it("레포 어디에도 serviceWorker.register가 없다(자폭 뒤 재등록 → 방문마다 헛돌기 방지)", () => {
    const bad = ["app", "components", "lib", "toss/src"]
      .flatMap((d) => walk(join(ROOT, d)))
      .filter((f) => /serviceWorker\s*\.\s*register\(/.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
});
