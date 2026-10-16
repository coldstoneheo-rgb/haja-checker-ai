# HO-2026-1017-haja-spike-S0-S1 — REPORT

> 발주: LC `handoffs/HO-2026-1017-haja-spike-S0-S1-01.md` · 작업 창 haja-checker-ai · 2026-10-17 00:2x~02:3x KST
> 과금 0(Gemini 실호출 0, `AI_ANALYZER=mock`) · 배포 0 · 콘솔·업로드 0 · 원격 브랜치 삭제 0
> 스파이크 코드는 레포 밖 `C:\Users\colds\haja-spikes\`(커밋 안 함). 재현용 산출물만 이 폴더에 둔다:
> `S1-next-export-query-routing.patch` · `S1-vite-port-RESULT.md` · `S1-docs-findings.md`

## 0. 하네스(조건 0) — 끝

| 항목 | 결과 |
|---|---|
| PR-0 | #4 → main **35319b5** (critic 8/10 PASS → 반영 828e78f · LC PASS · 사용자 «effort 설정 PR 진행, 게이트 PASS 뒤 머지까지») |
| 내용 | `.claude/settings.json`(effort medium + allow 6) · `.claude/agents/critic.md`(effort high) · `AGENT_STATUS.json` · `WORKLOG.md` · `handoffs/`(로컬 전용, gitignore) · `docs/handoffs/` · CLAUDE.md «LC 협업 규약» · AGENTS.md 브랜치 규칙 |
| 브랜치 정리 | 원격·로컬 `chore/harness-pr0` 삭제 확인(`gh api …/branches` = `fix/seed-28`·`main`) |

## 1. S0 되살리기(조건 1)

| # | 결과 | 근거 |
|---|---|---|
| ⓐ | origin/main **a320218** → 이제 35319b5 · 작업은 origin/main에서 딴 기능 브랜치(옛 `claude/review-…`는 main 대비 9 뒤·0 앞 = 전부 머지됨) | `git rev-list --left-right --count origin/main...HEAD` = `9 0` |
| ⓑ | `npm ci` exit 0 | — |
| ⓒ | `npm run build` exit 0 · 라우트 13(정적 4 · 동적 `[sessionId]` 계열 8 · API 1) · 경고: 홈 폴더 `C:\Users\colds\package-lock.json` 때문에 turbopack root 오추론 | build 로그 |
| ⓓ | `npm test` **72/72**(7파일) · `npm run typecheck` exit 0 · CLAUDE.md «45 tests»는 낡은 값 → 이 PR에서 정정 | vitest 출력 |
| ⓔ | 로컬 `master` **0f45988** · `claude/review-inspection-app-plan-RbozI` **0c8ea94** 삭제(`-d`, 둘 다 main 조상) · 로컬 `main` 새로 만듦(origin/main과 0/0) · 원격 `claude/review-…`는 01:0x에 이미 GitHub에 없음(이 창·LC 아님, 삭제 주체 미상) | `git branch -vv` 전후 · `gh api branches` |
| ⓕ | 시드 실측 **27**(영역 «기타» 0항목) → PR **#5**(«기타» 1항목 + 28 고정·영역별 1건 이상 테스트, 74/74) · critic 8.5 PASS · LC PASS · **머지는 사용자 한 줄 대기** | `docs/handoffs/QA-PR5-seed28-critic.md` |
| ⓖ | 환경변수 이름만: 코드 참조 `GEMINI_API_KEY`·`GEMINI_VISION_MODEL`·`AI_ANALYZER` · `.env.local`에는 `VERCEL_OIDC_TOKEN`만 있음 → 로컬은 Mock 경로 | grep `process.env` |

## 2. S1 스파이크 12항목(조건 2)

판정: **됨** / **안 됨** / **조건부**(조건을 적음). «실기기 대기» = 토스앱 QR에서만 확인할 수 있음.

| # | 항목 | 판정 | 근거(명령·수치·문서) |
|---|---|---|---|
| ① | Next 정적 export + 동적 세그먼트 | **조건부 → 변환 후 됨** | 그대로는 실패: `Page "/sessions/[sessionId]/defects/[defectId]" is missing "generateStaticParams()"`. `[sessionId]`→`s`, `[defectId]`→`d`, `useParams`→`useSearchParams`(`?id=`·`&d=`) 기계 변환(스크립트 2초) + `Suspense` 레이아웃 1개 + `app/api` 제외 → `next build` exit 0, 정적 12쪽. `trailingSlash: true`로 `…/index.html` 구조. **Chrome 실측**(python 정적 서버): 세션 생성 → `/sessions/s/?id=…` 개요 → 링크로 체크리스트 이동 → 보고서 URL 직접 새로고침 모두 렌더, 콘솔 오류 0. 잃은 것: `checklist` 쪽 `metadata`(탭 제목) 1건 — 나머지 변환 쪽은 원래 metadata 없음(패치의 `-export const metadata` 1건) |
| ② | `ait build`가 Next 산출물을 받는가 | **됨(로컬)** | `@apps-in-toss/web-framework@3.4.0` 별도 폴더, `webBundleDir: 'out'` → `npx ait build` exit 0, `haja-check-spike.ait` 504,251B(파일 137개). `web.commands`는 3.x에서 삭제 — `package.json` build 스크립트에 `&& ait build`(sdk-3.x.md 187–188행). .ait 안 경로 구분자가 `\`(120건)이나 출시된 face-fate.ait도 같음(5건) → 차단 아님. 업로드 0 |
| ③ | Vite+React 골격에 화면 1개 이식 | **됨** | 세션 목록 1화면 **약 11분**(상한 2시간) · `vite build`·`tsc` exit 0 · 원본 `SessionsList.tsx` 무수정 import(`next/link`·`next/navigation` shim 별칭) · `lib/` 21모듈 import 스모크 통과 · **필수 함정**: Dexie 두 벌 번들 → `resolve.dedupe` 필요(JS gz 132→96KB). 상세 `S1-vite-port-RESULT.md` |
| ④ | `Device.openCamera`/`getPhotos` | **됨(문서)** · 실기기 대기 | 반환 `{id, dataUri}` · 옵션 `base64`·`maxWidth`(기본 1024) · 앨범 기본 10장 · 권한 `camera: access`·`photos: read` · 품질·용량 옵션 문서 없음. `<input capture>` 언급 없음 |
| ⑤ | `window.print`·`window.open` 대체 | **조건부** | 사용처 4곳: `ReportView.tsx:40`(print) · `:50`·`:90`(open+print) · `reportRepo.ts:119`(Blob 다운로드). 문서에 print·다운로드 0건 → 대체 `File.saveBase64`(이미지·PDF) · `File.openPDFViewer`(5.261.0+) · `Share.sendMessage`는 **텍스트만**, 이미지 공유 API 없음. **PNG 실측**: `html-to-image` 1.11.13(번들 +5.2KB gz)로 보고서 `<main>` → PNG 1024×4776, 114KB, **13.1초**(데스크톱 Chrome) — 폰에선 더 느릴 것(추정), 쪼개기·축소 필요 |
| ⑥ | Service Worker | **조건부** · 실기기 대기 | export판에서 `/sw.js` 등록·active 실측(`navigator.serviceWorker.getRegistrations()`), JS 10개 SW 캐시 응답 · 토스 문서 grep 0건 · 번들이 토스 서버에서 서빙되므로 오프라인 캐시는 선택 기능(추정) |
| ⑦ | IndexedDB 영속 | **조건부** | 실측: DB `haja-checker` 생성·조회 됨, `storage.persisted()` false · `persist()` 요청 false(데스크톱 Chrome). 문서: 출시판 업데이트 간 유지 · QR판↔출시판 미공유 · **iOS WebView IndexedDB는 7일 미사용 시 자동 삭제**(storage.md 441행, Cache API 권장) · SDK `Storage` 용량 제한 없음 |
| ⑧ | 식별키에 토스 로그인 필요? | **됨(불필요)** | `getAnonymousKey` 비게임 전용, appLogin 불필요, 앱 삭제·기기 변경에도 같은 hash, 미니앱마다 다름(hash-key.md 26–27·171·293). 샌드박스는 mock |
| ⑨ | 라이트 모드·네비 바·뒤로가기 | **조건부** · 실기기 대기 | 라이트 모드 강제(faq 248–250) · 상단 바 = config `navigationBar`(런타임 변경은 3.5.0+) · `graniteEvent backEvent` 구독 시 기본 뒤로가기 차단 · history와 백버튼 관계·`window.open`은 문서 없음 |
| ⑩ | `/api/analyze` 분리 + CORS | **조건부** | 같은 출처 Mock 호출 200(`next start`, `AI_ANALYZER=mock`) · 다른 출처(127.0.0.1:8731 → :3100)는 **Chrome `Failed to fetch`** — 프리플라이트 204에 `Access-Control-Allow-Origin` 없음(`curl -i -X OPTIONS`). 필요: `OPTIONS` 처리 + 허용 origin `https://<appName>.apps.tossmini.com`·`https://<appName>.private-apps.tossmini.com`(storage.md 425행 절) + 클라이언트 절대 URL. 정적 번들엔 서버 없음(SSR 금지, faq 411행) |
| ⑪ | 광고 SDK(전면·리워드) | **됨(문서)** · 실기기 대기 | `loadFullScreenAd` → `showFullScreenAd`(사전 로드 필수) · 테스트 ID `ait-ad-test-interstitial-id`·`ait-ad-test-rewarded-id` · WebView 배너 `TossAds.attachBanner`(5.241.0+) · 샌드박스 미지원 → QR로만 검증. «배너 미지원» 문장은 광고 대시보드 힌트 안(in-app-ad.md 313행) — 지표 미집계 뜻으로 보임(추정) |
| ⑫ | 번들 크기·2초 인터랙션 | **조건부** · 실기기 대기 | Next export: `out/` 1,475,941B · JS 24개 합계 1.05MB(gz 307KB) · `/sessions` 첫 로드 스크립트 10개 gz **219KB**. 로컬 Chrome(SW 캐시): domInteractive 131ms · load 1,941ms. Vite 1화면: JS gz **96KB**(lib 전체 import 시 110KB) · `dist` 325,861B. 폰·토스 WebView 2초는 실기기 대기 |

## 3. 비교표(조건 3) — 추천 없음, 근거만

| 축 | A. Next 유지(정적 export) | B. Vite 재작성 |
|---|---|---|
| 공수(일) | 라우팅 변환 0.5일(추정 — 기계 변환은 실측 2초, 탭 제목 1쪽·QA 포함) | 1~1.5일(추정 — 1화면 11분 실측 × 화면 10개 + 라우터·레이아웃·PWA 이전) |
| 두 안 공통 공수 | `/api/analyze` 외부 함수 분리 + CORS 2~4시간(추정) · 인쇄 4곳 → `saveBase64`/`openPDFViewer` · 사진 `Device` API · 저장 구조(iOS 7일) · 광고·식별키 — **S2 공수는 두 안이 거의 같다** | 〃 |
| 위험 | Next 16 정적 export 제약(동적 라우트·`metadata`·서버 기능 금지)을 계속 지켜야 함 · 프레임워크가 쓰지 않는 서버 기능을 품고 감 · 홈 폴더 lockfile 경고 | shim(`next/link`·`next/navigation`) 유지 또는 20파일 수정 · Dexie dedupe 누락 시 반응성 깨짐 · 새 빌드 설정 유지 |
| 테스트 승계율 | 7/7 파일 · 72/72(Next import 0) | 7/7 파일(Next import 0, grep 판단 — 실행은 미실측) |
| 토스 적합 ① | 조건부 → 변환 후 됨(실측) | 됨(해시·쿼리 라우터, 1화면 실측) |
| 토스 적합 ② | 됨(`ait build` exit 0 실측) | 됨(face-fate 출시 선례: Vite + `ait build`) |
| 토스 적합 ⑨ | 둘 다 문서 조건 동일 — 뒤로가기는 history 기반 SPA에서 실기기 대기 | 〃 |
| 산출물 크기 | `out/` 1.48MB · 첫 로드 JS gz 219KB(`/sessions`) · `.ait` 504KB | 1화면 `dist` 0.33MB · JS gz 96KB · 전체 앱은 미실측(lib 전체 import 110KB) |
| 라우팅 변경 파일 수 | 내용 수정 16 · 새 파일 1(`Suspense` 레이아웃) · 경로만 이동 7 · `app/api` 제외 1 (+73/−127줄, `S1-next-export-query-routing.patch`) | shim·별칭이면 원본 수정 0 · 직접 고치면 20파일 · `metadata` 래퍼 5쪽 |

## 4. 사용자 확인 항목(≤3)
1. **코드 기반**: A(Next 정적 export) / B(Vite 재작성) — 위 표 근거, 결정은 LC·사용자.
2. **저장 구조**: iOS WebView IndexedDB 7일 미사용 삭제(문서) — 사진은 Cache API, 메타는 SDK `Storage`로 옮길지 / 현행 Dexie 유지 + 경고 문구로 갈지.
3. **실기기 QR 확인 일정**: ④⑥⑨⑪⑫ + `window.print`·Blob 다운로드·백버튼 — 콘솔 업로드·QR은 사용자 손(S3).

## 5. effort
세션 medium · critic high(PR #4·#5·이 PR) · 문서 조사·Vite 이식 서브에이전트 medium(기본). 올린 곳 없음(건너뜀·테스트 미실행·중도 포기 신호 0).

## 6. 남은 것·주의
- PR #5 머지(사용자 한 줄) · 원격 추적 ref `origin/claude/review-…` 정리(아침 문항) · 레포 PUBLIC 여부.
- 스파이크 작업트리 `C:\Users\colds\haja-spikes\next-export`(로컬 브랜치 `spike/next-export`, 원격 없음)는 REPORT 머지 뒤 정리.
- 이 레포는 PUBLIC — 이 REPORT에는 공개 문서·측정값만 적었다.
