/** 플랫폼 어댑터(Next 웹 / 토스) 공통 결과. 실패 message는 화면에 그대로 보인다. */
export type PlatformResult = { ok: true } | { ok: false; message: string };
