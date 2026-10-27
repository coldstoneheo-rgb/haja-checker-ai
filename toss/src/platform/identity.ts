// 익명 식별키(상한 카운터 키 자리) — 토스 구현(스텁). S3 KV 어댑터 전까지 서버는 이 키를 믿지 않는다.
// 시그니처는 lib/platform/identity.ts(Next 웹 구현)와 같다 — vite alias·tsconfig paths가 이 파일로 바꿔 끼운다.
import { newId } from "@/lib/db/id";

const LOCAL_KEY = "haja.anonKey";

// TODO(QR-1029): @apps-in-toss/web-framework getAnonymousKey() → { hash, type: "HASH" }의 hash. 실패·미지원이면 아래 로컬 폴백.
export async function getAnonymousKey(): Promise<string | null> {
  try {
    const stored = window.localStorage.getItem(LOCAL_KEY);
    if (stored) return stored;
    const key = "local:" + newId();
    window.localStorage.setItem(LOCAL_KEY, key);
    return key;
  } catch {
    return null;
  }
}
