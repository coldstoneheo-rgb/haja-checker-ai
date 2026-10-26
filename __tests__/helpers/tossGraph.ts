// toss 번들 진입점(toss/src/main.tsx)에서 import를 따라가 토스 빌드에 실리는 레포 파일 전부를 모은다.
// vite.config.mts의 alias(next/link·next/navigation shim, 플랫폼 어댑터, @/)를 같은 순서로 적용한다.
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export const ROOT = join(__dirname, "..", "..");

/** vite.config.mts resolve.alias와 같은 순서(첫 일치가 이긴다). */
export const TOSS_ALIASES: [RegExp, string][] = [
  [/^next\/link$/, "toss/src/shims/next-link.tsx"],
  [/^next\/navigation$/, "toss/src/shims/next-navigation.ts"],
  [/^@\/lib\/platform\/reportActions$/, "toss/src/platform/reportActions.ts"],
];

/** from "x" · import "x" · import("x") · export … from "x" 모두 */
export const importsOf = (src: string) =>
  [...src.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g)].map((m) => m[1]);

const EXTS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function fileFor(base: string): string | null {
  for (const e of EXTS) {
    const p = base + e;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

/** 레포 안 파일이면 절대 경로, 패키지(bare)면 null. css 등 비코드도 null. */
export function resolveSpec(fromFile: string, spec: string): string | null {
  const alias = TOSS_ALIASES.find(([re]) => re.test(spec));
  if (alias) return join(ROOT, alias[1]);
  if (spec.startsWith("@/")) return fileFor(join(ROOT, spec.slice(2)));
  if (spec.startsWith(".")) return fileFor(resolve(dirname(fromFile), spec));
  return null;
}

export interface TossGraph {
  /** 레포 루트 기준 경로(슬래시) */
  files: string[];
  /** alias를 거치지 않은 패키지 import(예: "react", "next/image") — 파일별 */
  bare: { file: string; spec: string }[];
  /** 레포 경로처럼 보이는데 파일을 못 찾은 import(css 제외) — 그래프 누락 방지용, 비어 있어야 한다 */
  unresolved: { file: string; spec: string }[];
}

export function tossGraph(entry = "toss/src/main.tsx"): TossGraph {
  const seen = new Set<string>();
  const bare: TossGraph["bare"] = [];
  const unresolved: TossGraph["unresolved"] = [];
  const stack = [join(ROOT, entry)];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f) || !/\.(ts|tsx)$/.test(f)) continue;
    seen.add(f);
    for (const spec of importsOf(readFileSync(f, "utf8"))) {
      const r = resolveSpec(f, spec);
      if (r) stack.push(r);
      else if (!spec.startsWith(".") && !spec.startsWith("@/")) bare.push({ file: rel(f), spec });
      else if (!/\.css$/.test(spec)) unresolved.push({ file: rel(f), spec });
    }
  }
  return { files: [...seen].map(rel).sort(), bare, unresolved };
}

export const rel = (f: string) => relative(ROOT, f).replace(/\\/g, "/");
export const read = (relPath: string) => readFileSync(join(ROOT, relPath), "utf8");
