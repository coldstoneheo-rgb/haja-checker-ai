/**
 * 토스 번들이 부를 분석 API 주소 계산(순수 함수). 토스 번들은 정적 파일이라 같은 출처 서버가 없다.
 * 그래서 빌드 시 값 VITE_HAJA_API_BASE(배포된 Next 웹 주소, 예: https://<배포 주소>)에 /api/analyze를 붙인다.
 * 값이 없거나 https가 아니면 null을 돌려준다. 그러면 호출 지점이 «서버 주소 미설정» 안내로 실패한다.
 * 예외로 http://localhost·127.0.0.1은 허용한다(로컬 dev:toss 시험용).
 */
export const ANALYZE_PATH = "/api/analyze";

export function resolveAnalyzeEndpoint(base: string | undefined | null): string | null {
  const s = (base ?? "").trim();
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return null;
  if (u.search || u.hash || u.username || u.password) return null;
  const path = u.pathname.replace(/\/+$/, "");
  return `${u.origin}${path}${ANALYZE_PATH}`;
}

/** 주소가 없을 때 사용자에게 보일 문구(토스 번들 · 서버 주소 미설정). */
export const ANALYZE_ENDPOINT_MISSING = "AI 분석 서버 주소가 설정되지 않았습니다. 앱을 최신 버전으로 업데이트해 주세요.";
