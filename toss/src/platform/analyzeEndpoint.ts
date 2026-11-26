/// <reference types="vite/client" />
// 분석 API 주소 — 토스 구현. 정적 번들이라 같은 출처 서버가 없다. 그래서 배포된 Next 웹 주소를 빌드 시 값으로 받는다.
// 값이 없으면 null을 돌려주고, 호출 지점(lib/repo/analysisRepo.ts)이 «서버 주소 미설정» 안내로 실패한다.
// 서버는 토스 출처를 CORS로 허용한다(lib/ai/cors.ts). 실기기 Origin 확인은 QR 런북 D2(docs/runbooks/QR-TEST-RUNBOOK.md, 문서 PR)에서 한다.
// 값은 프로덕션 주소를 쓴다 — 프리뷰 주소는 Deployment Protection이 켜져 있으면 OPTIONS가 401로 막힌다.
import { resolveAnalyzeEndpoint } from "@/lib/ai/endpoint";

export function analyzeEndpoint(): string | null {
  return resolveAnalyzeEndpoint(import.meta.env.VITE_HAJA_API_BASE);
}
