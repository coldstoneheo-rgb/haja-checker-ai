// 분석 API 주소 — Next 웹 구현: 같은 출처 상대 경로(변화 0).
// 토스 빌드는 vite alias로 toss/src/platform/analyzeEndpoint.ts(빌드 시 값 VITE_HAJA_API_BASE)를 대신 쓴다.
export function analyzeEndpoint(): string | null {
  return "/api/analyze";
}
