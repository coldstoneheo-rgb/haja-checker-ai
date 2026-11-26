/**
 * /api/analyze 다른 출처 호출(CORS) — 서버 전용 순수 로직. 토스 미니앱 번들은 정적 파일이라 서버가 없다.
 * 그래서 토스 WebView가 이 Next 라우트(Vercel 함수)를 절대 주소로 부른다.
 *
 * 기본 허용 출처의 근거는 docs/handoffs/S1-docs-findings.md:136이다(앱인토스 문서 storage.md 425행 절).
 * - 출시: https://<appName>.apps.tossmini.com
 * - QR 테스트: https://<appName>.private-apps.tossmini.com
 * appName은 apps-in-toss.config.ts와 같은 값이다. 실기기 Origin 실측 전이므로, 다른 값이 나오면
 * env HAJA_CORS_ORIGINS(쉼표 구분)로 덧붙인다. 런북은 docs/runbooks/QR-TEST-RUNBOOK.md다.
 */

export const TOSS_APP_NAME = "haja-check";

export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  `https://${TOSS_APP_NAME}.apps.tossmini.com`,
  `https://${TOSS_APP_NAME}.private-apps.tossmini.com`,
];

export const CORS_ALLOW_METHODS = "POST, OPTIONS";
/** x-haja-anon-key = 토스 익명 식별키 자리(서버는 아직 믿지 않는다 — route.ts userKeyOf). */
export const CORS_ALLOW_HEADERS = "Content-Type, x-haja-anon-key";
export const CORS_MAX_AGE = "600";

/** 출처 문자열 정규화: scheme+host(+port)만, 소문자. 경로가 붙었거나 형식이 틀리면 null. */
export function normalizeOrigin(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.pathname !== "/" || u.search || u.hash || u.username || u.password) return null;
    // URL은 끝 슬래시 없는 입력도 pathname "/"로 본다 — 끝 슬래시를 붙여 쓴 값만 허용 목록 표기 오류로 본다
    if (s.endsWith("/")) return null;
    // 와일드카드·이상한 글자가 든 host는 받지 않는다(전체 허용 금지 — 분석 API는 유료 호출)
    if (!/^[a-z0-9.-]+$/.test(u.hostname)) return null;
    return u.origin.toLowerCase();
  } catch {
    return null;
  }
}

/** 허용 출처 = 기본 2개 + env 덧붙임(쉼표 구분). 형식이 틀린 항목·와일드카드(*)는 버린다. */
export function allowedOrigins(extraEnv: string | undefined): Set<string> {
  const set = new Set(DEFAULT_ALLOWED_ORIGINS);
  for (const part of (extraEnv ?? "").split(",")) {
    const o = normalizeOrigin(part);
    if (o) set.add(o);
  }
  return set;
}

export type OriginVerdict =
  /** Origin 머리말 없음(서버 간 호출·일부 같은 출처 GET) 또는 같은 출처 — 지금과 같게 처리, CORS 머리말 없음 */
  | { kind: "same" }
  /** 허용된 다른 출처 — 응답에 CORS 머리말을 붙인다 */
  | { kind: "allowed"; origin: string }
  /** 허용 안 된 다른 출처 — 403, 상한 카운터를 쓰지 않는다 */
  | { kind: "denied" };

/**
 * 요청 판정. host = 요청의 Host 머리말(같은 출처 판정용). 브라우저는 같은 출처 POST에도 Origin을 보내므로
 * «Origin의 host == 요청 Host»를 같은 출처로 본다(Next 웹 화면·Vercel 프리뷰 주소 무회귀).
 */
export function judgeOrigin(
  originHeader: string | null,
  hostHeader: string | null,
  allowed: Set<string>,
): OriginVerdict {
  if (originHeader === null) return { kind: "same" };
  const origin = normalizeOrigin(originHeader);
  if (origin === null) return { kind: "denied" }; // "null"(샌드박스 iframe·file://) 포함
  if (hostHeader && new URL(origin).host === hostHeader.trim().toLowerCase()) return { kind: "same" };
  if (allowed.has(origin)) return { kind: "allowed", origin };
  return { kind: "denied" };
}

/** 허용된 출처에 붙일 응답 머리말. Vary: Origin은 판정 결과와 무관하게 붙인다(CDN 캐시 섞임 방지). */
export function corsHeaders(verdict: OriginVerdict): Record<string, string> {
  if (verdict.kind !== "allowed") return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": verdict.origin,
    "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
    "Access-Control-Max-Age": CORS_MAX_AGE,
    Vary: "Origin",
  };
}
