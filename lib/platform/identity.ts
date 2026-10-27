// 익명 식별키(상한 카운터 키 자리) — Next 웹 구현: 보내지 않는다(서버는 접속 주소로 센다, app/api/analyze/route.ts).
// 토스 빌드는 vite alias로 toss/src/platform/identity.ts(스텁)를 대신 쓴다.
export async function getAnonymousKey(): Promise<string | null> {
  return null;
}
