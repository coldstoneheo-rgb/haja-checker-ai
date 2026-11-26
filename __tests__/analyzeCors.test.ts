// HO-2026-1127: /api/analyze 다른 출처 호출(CORS) — 토스 미니앱 출처 통과 · 허용 안 된 출처 차단 · 상한 429 동작 그대로.
// 분석기는 Mock만 쓴다(유료 호출 0). 라우트 모듈은 env를 읽은 뒤 import한다(모듈 단위 허용 목록·카운터).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  allowedOrigins,
  CORS_ALLOW_HEADERS,
  DEFAULT_ALLOWED_ORIGINS,
  judgeOrigin,
  normalizeOrigin,
  TOSS_APP_NAME,
} from "@/lib/ai/cors";
import { ANALYZE_ENDPOINT_MISSING, resolveAnalyzeEndpoint } from "@/lib/ai/endpoint";
import { DAILY_BASE } from "@/lib/ai/usageLimit";
import { read } from "./helpers/tossGraph";

const TOSS_LIVE = "https://haja-check.apps.tossmini.com";
const TOSS_QR = "https://haja-check.private-apps.tossmini.com";
const EXTRA = "https://extra.example.com";
const HOST = "haja.example.vercel.app";

type RouteModule = typeof import("@/app/api/analyze/route");
let route: RouteModule;

beforeAll(async () => {
  process.env.AI_ANALYZER = "mock";
  // 셸·.env에 빌드 값이 있어도 «값 없음» 경로를 시험한다
  vi.stubEnv("VITE_HAJA_API_BASE", "");
  // 덧붙임 env: 정상 1 + 와일드카드·형식 오류(버려져야 한다)
  process.env.HAJA_CORS_ORIGINS = ` ${EXTRA} , * , https://*.tossmini.com, not a url, https://bad.example.com/path`;
  route = await import("@/app/api/analyze/route");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const validBody = {
  areaName: "거실",
  takenAtIso: "2026-11-27T10:00:00.000Z",
  photos: [{ mimeType: "image/jpeg", base64: "abc123" }],
};

let ipSeq = 0;
function post(opts: { origin?: string; ip?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: HOST,
    "x-forwarded-for": opts.ip ?? `10.0.0.${++ipSeq}`,
    ...(opts.origin ? { origin: opts.origin } : {}),
    ...opts.headers,
  };
  const req = new Request(`https://${HOST}/api/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? validBody),
  });
  return route.POST(req as Parameters<RouteModule["POST"]>[0]);
}

function preflight(origin: string | null, requestHeaders = "content-type, x-haja-anon-key") {
  const headers: Record<string, string> = {
    host: HOST,
    "access-control-request-method": "POST",
    "access-control-request-headers": requestHeaders,
  };
  if (origin) headers.origin = origin;
  const req = new Request(`https://${HOST}/api/analyze`, { method: "OPTIONS", headers });
  return route.OPTIONS(req as Parameters<RouteModule["OPTIONS"]>[0]);
}

describe("허용 출처 목록", () => {
  it("기본 = 토스 출시·QR 테스트 출처 2개(appName = apps-in-toss.config.ts)", () => {
    expect(TOSS_APP_NAME).toBe("haja-check");
    expect(read("apps-in-toss.config.ts")).toContain(`appName: "${TOSS_APP_NAME}"`);
    expect([...DEFAULT_ALLOWED_ORIGINS]).toEqual([TOSS_LIVE, TOSS_QR]);
  });

  it("env 덧붙임: 정상 출처만 받고, 전체 허용(*)·와일드카드 host·경로 붙은 값·형식 오류는 버린다", () => {
    const set = allowedOrigins(` ${EXTRA} , * , https://*.tossmini.com, not a url, https://bad.example.com/path, https://x.com/`);
    expect([...set].sort()).toEqual([EXTRA, TOSS_QR, TOSS_LIVE].sort());
    expect(normalizeOrigin("*")).toBeNull();
    expect(normalizeOrigin("null")).toBeNull();
    expect(normalizeOrigin("ftp://a.com")).toBeNull();
    expect(normalizeOrigin("HTTPS://Haja-Check.Apps.TossMini.com")).toBe(TOSS_LIVE);
  });

  it("버려진 env 항목은 운영 로그용으로 돌려준다(빈 항목 제외)", async () => {
    const { rejectedOriginEntries } = await import("@/lib/ai/cors");
    expect(rejectedOriginEntries(` ${EXTRA} , * ,, https://x.com/`)).toEqual(["*", "https://x.com/"]);
    expect(rejectedOriginEntries(undefined)).toEqual([]);
  });

  it("env가 비면 기본 2개뿐", () => {
    expect(allowedOrigins(undefined).size).toBe(2);
    expect(allowedOrigins("").size).toBe(2);
  });

  it("판정: Origin 없음·같은 host = same · 허용 = allowed · 그 밖(옛 web.tossmini 출처 포함) = denied", () => {
    const set = allowedOrigins(undefined);
    expect(judgeOrigin(null, HOST, set)).toEqual({ kind: "same" });
    expect(judgeOrigin(`https://${HOST}`, HOST, set)).toEqual({ kind: "same" });
    expect(judgeOrigin(TOSS_QR, HOST, set)).toEqual({ kind: "allowed", origin: TOSS_QR });
    expect(judgeOrigin("https://evil.example.com", HOST, set)).toEqual({ kind: "denied" });
    expect(judgeOrigin("https://haja-check.web.tossmini.com", HOST, set)).toEqual({ kind: "denied" });
    expect(judgeOrigin("https://haja-check.apps.tossmini.com.evil.com", HOST, set)).toEqual({ kind: "denied" });
    expect(judgeOrigin("null", HOST, set)).toEqual({ kind: "denied" });
  });
});

describe("사전 요청(OPTIONS)", () => {
  it.each([TOSS_LIVE, TOSS_QR, EXTRA])("%s → 204 + Allow-Origin(그 출처) + Allow-Headers에 x-haja-anon-key", async (origin) => {
    const res = await preflight(origin);
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(origin);
    expect(res.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
    const allowHeaders = res.headers.get("access-control-allow-headers")!.toLowerCase();
    expect(allowHeaders).toContain("content-type");
    expect(allowHeaders).toContain("x-haja-anon-key");
    expect(allowHeaders).toBe(CORS_ALLOW_HEADERS.toLowerCase());
    expect(res.headers.get("vary")).toBe("Origin");
  });

  it("허용 안 된 출처 → 403, Allow-Origin 없음", async () => {
    const res = await preflight("https://evil.example.com");
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("env의 * 는 받지 않았다 → 아무 출처나 403", async () => {
    const res = await preflight("https://anything.example.org");
    expect(res.status).toBe(403);
  });

  it("같은 출처 → 204, Allow-* 없음", async () => {
    const res = await preflight(`https://${HOST}`);
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("POST — 출처별", () => {
  it("토스 QR 출처 + x-haja-anon-key → 200(Mock) + Allow-Origin", async () => {
    const res = await post({ origin: TOSS_QR, headers: { "x-haja-anon-key": "local:abc" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(TOSS_QR);
    const data = (await res.json()) as { riskLevel?: string };
    expect(typeof data.riskLevel).toBe("string");
  });

  it("같은 출처(Next 웹) → 200, Allow-Origin 없음(지금과 같음)", async () => {
    const res = await post({ origin: `https://${HOST}` });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("Origin 없음(서버 간 호출) → 200, 지금과 같음", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("허용 안 된 출처 → 403이고 상한 카운터를 쓰지 않는다(같은 IP가 뒤에 30회 그대로)", async () => {
    const ip = "10.9.9.9";
    for (let i = 0; i < 5; i++) {
      const res = await post({ origin: "https://evil.example.com", ip });
      expect(res.status).toBe(403);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    }
    for (let i = 0; i < DAILY_BASE; i++) {
      expect((await post({ origin: TOSS_LIVE, ip })).status).toBe(200);
    }
    expect((await post({ origin: TOSS_LIVE, ip })).status).toBe(429);
  });

  it("잘못된 본문(400)에도 허용 출처면 Allow-Origin이 붙는다(토스에서 오류 문구를 읽을 수 있게)", async () => {
    const res = await post({ origin: TOSS_LIVE, body: { areaName: "거실" } });
    expect(res.status).toBe(400);
    expect(res.headers.get("access-control-allow-origin")).toBe(TOSS_LIVE);
  });
});

describe("POST — 하루 상한 429 동작 그대로", () => {
  it("한 IP 30회 200 → 31번째 429(DAILY_LIMIT · canReward true) + Allow-Origin", async () => {
    const ip = "10.7.7.7";
    for (let i = 0; i < DAILY_BASE; i++) {
      expect((await post({ origin: TOSS_QR, ip })).status).toBe(200);
    }
    const res = await post({ origin: TOSS_QR, ip });
    expect(res.status).toBe(429);
    expect(res.headers.get("access-control-allow-origin")).toBe(TOSS_QR);
    const data = (await res.json()) as { error: string; reason: string; canReward: boolean };
    expect(data).toEqual({ error: "오늘 AI 분석 횟수를 모두 사용했습니다.", reason: "DAILY_LIMIT", canReward: true });
  });

  it("상한 키는 여전히 접속 주소 — 식별키 헤더를 바꿔도 같은 IP면 같은 카운터", async () => {
    const ip = "10.6.6.6";
    for (let i = 0; i < DAILY_BASE; i++) {
      expect((await post({ origin: TOSS_QR, ip, headers: { "x-haja-anon-key": `local:${i}` } })).status).toBe(200);
    }
    expect((await post({ origin: TOSS_QR, ip, headers: { "x-haja-anon-key": "local:new" } })).status).toBe(429);
  });
});

describe("토스 호출 주소(VITE_HAJA_API_BASE)", () => {
  it("https 주소 → 끝 슬래시를 정리하고 /api/analyze를 붙인다", () => {
    expect(resolveAnalyzeEndpoint("https://haja.example.vercel.app")).toBe("https://haja.example.vercel.app/api/analyze");
    expect(resolveAnalyzeEndpoint(" https://haja.example.vercel.app/ ")).toBe("https://haja.example.vercel.app/api/analyze");
    expect(resolveAnalyzeEndpoint("https://a.com/base//")).toBe("https://a.com/base/api/analyze");
  });

  it("로컬 dev만 http 허용", () => {
    expect(resolveAnalyzeEndpoint("http://localhost:3000")).toBe("http://localhost:3000/api/analyze");
    expect(resolveAnalyzeEndpoint("http://127.0.0.1:3100")).toBe("http://127.0.0.1:3100/api/analyze");
    expect(resolveAnalyzeEndpoint("http://haja.example.com")).toBeNull();
  });

  it("값 없음·형식 오류·쿼리 붙은 값 → null", () => {
    for (const v of [undefined, null, "", "   ", "haja.example.com", "ftp://a.com", "https://a.com?x=1"]) {
      expect(resolveAnalyzeEndpoint(v)).toBeNull();
    }
  });

  it("Next 웹 어댑터 = 같은 출처 상대 경로(변화 0)", async () => {
    const web = await import("@/lib/platform/analyzeEndpoint");
    expect(web.analyzeEndpoint()).toBe("/api/analyze");
  });

  it("토스 어댑터 = 빌드 시 값을 resolveAnalyzeEndpoint로 · 값이 없으면 null", async () => {
    const src = read("toss/src/platform/analyzeEndpoint.ts");
    expect(src).toMatch(/return resolveAnalyzeEndpoint\(import\.meta\.env\.VITE_HAJA_API_BASE\);/);
    expect(src).not.toMatch(/\bfetch\(/);
    const toss = await import("@/toss/src/platform/analyzeEndpoint");
    expect(toss.analyzeEndpoint()).toBeNull(); // 시험 환경엔 값이 없다
  });

  it("호출 지점: 주소가 null이면 fetch 전에 «서버 주소 미설정» 안내로 실패한다", () => {
    const repo = read("lib/repo/analysisRepo.ts");
    expect(repo).toMatch(/const endpoint = analyzeEndpoint\(\);\s*if \(!endpoint\) throw new Error\(ANALYZE_ENDPOINT_MISSING\);/);
    expect(repo).toMatch(/await fetch\(endpoint, \{/);
    expect(repo).not.toContain('fetch("/api/analyze"');
    expect(ANALYZE_ENDPOINT_MISSING).toContain("서버 주소");
  });

  it("DefectDetailView 단건 분석도 하루 상한이면 리워드 자리를 부른다(기다리지 않음)", () => {
    const view = read("app/sessions/[sessionId]/defects/[defectId]/DefectDetailView.tsx");
    expect(view).toContain('from "@/lib/platform/ads"');
    expect(view).toMatch(/if \(canOfferReward\(err\)\) void onDailyLimit\(\);/);
    expect(view).not.toMatch(/await onDailyLimit/);
  });
});
