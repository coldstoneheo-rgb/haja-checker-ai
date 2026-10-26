# HO-2026-1026-haja-s2-port-02 REPORT (인계 블록 — 완료 조건 9)

## 마감 상태(10-26 오후)

- main `2a5d438` · #17 PR5 → `e7487be`, #18 PR6 → `2a5d438` 스쿼시 머지(사용자 위임 «critic+lc 게이트 pass면 알아서 머지해» · 각 critic(high) 8/10 PASS · LC PASS) · 가지 feat/s2-port-screens·feat/s2-mode-copy 원격·로컬 삭제
- 열린 PR: **#19 PR7 Next 화면 제거 ⛔ 머지 금지**(base main, chore/s2-remove-next-pages 코드 `4a52bc3` · HEAD `61dc719`(docs), critic 8/10 조건부 PASS · LC 게이트 PASS(issuecomment-6409033304, 차단 0·관찰 6) · 사용자 결정 10-28 복귀 뒤, 기본값 (b) sw.js 유지) · 이 인계 PR · #8(무관)
- 완료 조건: 1~6 끝 · 7 = #19 열림(⛔ 머지 대기) · 8 = #17·#18·#19 LC 게이트 PASS · #20 critic 8/10 PASS → 게이트 요청 · 9 = 이 블록(#20)
- 테스트 116 → 143(main) · 144(#19) · typecheck·next build·build:toss exit 0

## 한 일 / 발견 / LC·사용자에게 필요한 것

- 한 일: toss 10화면·쿼리 라우팅·외부 href 가드·보고서 출력 어댑터(#17) · 모드 문구 표·임대 AI 잔여 숨김·recipientType 백필·areas[0](#18) · Next 화면 제거(#19, 열어 둠)
- 발견: **Vercel 배포 한도**(무료 «api-deployments-free-per-day» 100, LC 확인)는 **간헐적** — 04:25Z~05:33Z 사이 성공·실패가 섞였다(프리뷰 11b6fd5·892012b·d7da36a success / 38351d0·cea7cbd·61dc719 failure «Deployment rate limited — retry in 24 hours»). **prod 웹 = `2a5d438`(#18)** — Production deployment 05:08Z success(38351d0 프리뷰 실패 04:37Z 뒤에도 성공), `e7487be` 04:07Z success. #19 머지 뒤에는 prod 배포 성공 여부를 반드시 확인(`gh api …/commits/<sha>/status`). 재배포·#19 머지는 사용자 복귀 뒤 · Next 웹 의도된 변경 = #17 2건(팝업 차단 안내·빈 체크리스트 escape) + #18 목록·대시보드 모드 표시 · #19 머지 시 웹 UI 소멸·웹 IndexedDB 데이터 갇힘·SW 좀비(#19 본문) · 세션 삭제 `confirm()`의 WebView 동작 미확인
- 필요한 것: 사용자 — #19 머지 시점·SW (a)/(b) · 아래 «사용자 승인 뒤» 문서 수정 승인 / LC — #19 게이트 코멘트

## 다음 조각

1. **실기기 스텁 → QR 10-29** — 이번 조각은 발주서가 허용한 «없음» 3종 인터페이스(동작 없는 함수 + 호출 지점 `TODO(QR-1029)`)를 만들지 않고 넘겼다(PR 3개 critic 반복에 시간 사용). 다음 세션 첫 작업 후보: `toss/src/platform/camera.ts`(`openCamera`/`getPhotos` → 호출 지점 `PhotoCaptureButton.tsx`, vite alias로 Next 웹은 `<input type="file">` 유지) · `toss/src/platform/ads.ts`(전면·리워드, 테스트 ID — 리워드 성공 → 서버 `grantReward` 라우트는 그때 노출) · `toss/src/platform/identity.ts`(`getAnonymousKey` → 상한 카운터 키). 실측 뒤 구현
2. `/api/analyze` Vercel 함수 분리 + CORS(`*.apps.tossmini.com`) — 배포·env는 사용자
3. 문안 확정(동의 3줄·고지 3줄·보고서 면책 중복 · 홈 면책 1줄) + AiNoticeDialog focus trap — 사용자 ASK
4. 상한 KV 어댑터(S3)
5. LC #18 관찰: ① 임대 비렌더는 전부 정적 테스트 — QR 10-29에 임대 대시보드·체크리스트·보고서 눈 확인 1회 ② #19 전까지 Vercel 웹 임대 세션은 page.tsx 6곳 «하자» 혼재 ③ PR5 이전 임대+수신처 BUILDER 세션은 «수신처: 시공사» 표시 — `recipientLabel` 폴백 ④ `reportRepo.ts` 빈 체크리스트 제목 «사전점검» — 모드별 ⑤ toss `HomePage.tsx` 소개 문구 신축 중심 — 문안 ASK 때
6. LC #19 관찰: ③ 문서 잔재 `CLAUDE.md:35·50`(SwRegister)·`.claude/agents/critic.md:24`(고지 출처 `app/page.tsx`) — 아래 «사용자 승인 뒤» 표 ④ stale `.next/types`가 남은 트리에서는 `npm run typecheck`가 TS2307×10으로 깨짐 — `npx next build` 1회로 자가 치유(#19 머지 뒤 다른 창에서 typecheck 실패 시 이 원인)
7. `next.config.ts` `largePageDataBytes`(페이지 0이라 무의미) 정리 · SW (a)를 고르면 sw.js 자폭 버전 PR

### 실기기 스텁 인터페이스 점검(10-26, `grep -rn "TODO(QR-1029)"`)

| REPORT S2 «다음 조각» 5 | 지금 | 위치 |
|---|---|---|
| 4 공유·저장(PNG `File.saveBase64` + `intoss://`) | 스텁 있음(동작 0, «곧 지원» 1줄) | `toss/src/platform/reportActions.ts:15·20·25` |
| (외부 링크 openURL) | 스텁 있음 | `toss/src/platform/openURL.ts:2` · 호출 `toss/src/shims/next-link.tsx` |
| 3 카메라(`Device.openCamera`/`getPhotos`) | **없음** — `<input type="file">` 그대로 | `app/sessions/[sessionId]/checklist/PhotoCaptureButton.tsx` |
| 6 광고(전면·리워드, 테스트 ID) | **없음** — 리워드 +10 자리만 서버(`grantReward`, 라우트 미노출) | — |
| 7 식별키(`getAnonymousKey`) | **없음** | — |

### 사용자 승인 뒤 고칠 문서(PR 열지 않음)

| 파일 | 지금 서술 | 고칠 내용 | 승인 필요 이유 |
|---|---|---|---|
| `CLAUDE.md:35-50` | 루트 레이아웃 + SwRegister · `page.tsx` 구조 · `SwRegister.tsx` | toss/src/pages 10화면 · Next는 `/api/analyze`만 | 프로젝트 지침(#19 머지 뒤 사실이 됨) |
| `README.md:66` | «page.tsx 홈» | toss 홈 `/home` | #19 머지 뒤 |
| `AGENTS.md:86` | Vercel 프로덕션 «Service Worker 등록됨» | 등록 안 함(SwRegister 제거) | #19 머지 뒤 |
| `PRD.md:68·132` | SW 페이지 캐싱 | toss WebView·SW 없음 | 제품 문서 |
| `README.md:14` | «PWA manifest + (이후) Service Worker» | toss 미니앱(WebView) · manifest 미사용 | #19 머지 뒤 |
| `CLAUDE.md:22` | «2026-10-17 main 74» | 143(10-26 main) | 숫자 낡음 |
| `AGENTS.md:45` | 예시 경로 `app/sessions/page.tsx` | toss 페이지 예시 | #19 머지 뒤 없는 파일 |
| `CLAUDE.md:87·174` | sw.js 구조·`no-cache` 서빙 | SW (a) 자폭을 고를 때만 | SW 결정에 따름 |
| `.claude/agents/critic.md:24` | 고지 문구 출처 `app/page.tsx` | `toss/src/pages/HomePage.tsx` | `.claude/agents/*.md`는 사용자 직접 승인(CLAUDE.md 규약) |

## effort

- 세션 medium · critic high 7회(PR5 1 · PR6 3 — 6→7→8 · PR7 1 · 인계 #20 2 — 6/10 → 반영 → 재검), 검수 규약 · 올린 곳 없음
- 컨텍스트 약 55%(추정)

발주서: `life-coordinator/handoffs/HO-2026-1026-haja-s2-port-02.md` · 기준 main `42863fe` · 116/116

## 완료 조건 체크리스트

- [x] 1. 계획 REPLY(≤15분) — PR 3개 스택(PR5 이식 / PR6 문구·임대 / PR7 Next 화면 제거) · (가) · LC ACK + 보강 2건(PR7 머지 금지 · Next 웹 회귀 0 어댑터)
- [x] 2. (#17 머지 e7487be) 9화면 이식 — `toss/src/pages/` 10화면 · 쿼리 라우팅 · 왕복 경로 테스트 · «뒤로» 제거 · `document.title` · public/ 방침 · `@source` (PR5)
- [x] 3. (#17 머지) Link shim 외부 href(개발 중 throw + 빌드본 openExternal 스텁) · scroll · next 전용 import 금지(변이 1회) (PR5)
- [x] 4. (#17 머지) 인쇄·새 창 4곳 대체 — 플랫폼 어댑터(Next 웹 = 기존 동작, toss = 스텁 TODO(QR-1029)) · toss 그래프 window.print/open 0 · Next 웹 회귀 0 테스트 (PR5)
- [x] 5. (PR6 `8790e37`+`1e891cc`) findingNoun — `lib/seed/modeCopy.ts` · `app/sessions/new/NewSessionForm.tsx` · `app/sessions/SessionsList.tsx`·«하자/시공» 문구 일괄 · NewSessionForm 모드별 필드 · 목록·대시보드 mode 표시 (PR6)
- [x] 6. (PR6 동일) 임대 모드 잔여 — `app/sessions/[sessionId]/report/ReportView.tsx` `{copy.aiOn && <ReportAiDisclaimer` · `lib/seed/modes.ts` `analysisPath`· `lib/seed/modes.ts` `sessionRecipient`·`pickArea` · `__tests__/modeCopy.test.ts`(AI CTA·7절 면책 절 비렌더) · recipientType 백필 · areas[0] · 고지 게이트 toss 진입점 전수(PR5에서 테스트 선반영) (PR6)
- [x] 7. (PR7 chore/s2-remove-next-pages, critic 8/10 조건부 PASS, **⛔ 머지 금지 — 사용자 확인**) Next 화면 제거 (가) — page.tsx 10 + SwRegister·PageStub, next build exit 0(`/api/analyze`만) · build:toss 0 · 144/144
- [x] 8. PR마다 critic(high) → LC 게이트 요청(PR 코멘트 + SendMessage) — #17·#18 PASS·머지 · #19 요청 10-26(issuecomment-6408938298) · #20 critic 6/10 → 반영 → 재검
- [x] 9. 인계 블록 — 이 파일 위쪽 «마감 상태»~«effort» · AGENT_STATUS · WORKLOG(PR #20)

## 경계 테스트 확장(계획 REPLY ①~⑥)

- [x] ① next/* 중 link·navigation 외 import 금지 — toss 진입 그래프(`__tests__/helpers/tossGraph.ts`) 기준, `next/image` 변이로 실패 확인
- [x] ② toss 그래프 window.print·window.open·anchor download 0 — `window.open` 변이로 실패 확인
- [x] ③ 외부 href assert
- [x] ④ matchRoute 10경로 + 화면 안 이동 대상 전부 이식 화면
- [x] ⑤ 고지 게이트 toss 진입 그래프 전수
- [x] ⑥ 임대 문구 정적 검사(PR6) — `__tests__/modeCopy.test.ts`, 리터럴·AI CTA 가드 변이 2회로 실패 확인

## 결정·방침

- public/: toss 번들에 넣지 않는다(vite root=toss, `toss/public` 없음). 아이콘·이름은 콘솔 등록(S3), WebView라 manifest·sw.js 불필요. Next 쪽 `public/`은 `/api/analyze` 분리(6번)까지 유지.
- 홈(`/home`): 첫 화면은 세션 목록 유지, 목록 헤더 «사용법»으로 진입. 기능 설명 3곳(PDF 인쇄·PWA)만 토스 동작에 맞춤, 하단 면책 1줄은 문안 ASK 때까지 원문.
- 보고서 출력: `@/lib/platform/reportActions`를 vite alias·tsconfig paths로 `toss/src/platform/reportActions.ts`(스텁)로 바꿔 끼운다. 스텁은 «이 기능은 곧 지원됩니다.» 1줄을 화면에 띄운다.

## PR5 critic(high) 8/10 PASS → 반영

- 1 Next 웹 회귀 테스트가 정적 매칭뿐 → `buildBlankChecklistHtml` 순수 테스트(행 수·제목·점검일·escape) 추가
- 2 의도된 Next 웹 변경 2건 공개: ① 팝업 차단 시 조용히 끝나던 것이 «팝업이 차단되어 새 창을 열 수 없습니다.» 1줄 표시 ② 빈 체크리스트 HTML에 escape(단지명 등의 `&<>"'`가 about:blank 창에 HTML로 들어가던 것을 막음)
- 3 `sub in SESSION_SUB` 프로토타입 체인 → `Object.hasOwn`, toString·__proto__·constructor pending 테스트(`in`으로 되돌리는 변이로 실패 확인)
- 4 modifier 키 분기 제거는 의도(새 창 0) 주석 + 휠 클릭(auxclick) 새 탭 차단
- 5 왕복 테스트를 [출발 파일 → 대상] 쌍으로, 따옴표 경로 수집, 변수 href 0, popstate 구독 확인
- 6 `vite/client` 전역 타입 → shim 안 좁은 `ImportMeta` 캐스트
- 7 `/sessions/new/...` → pending(useParams shim과 일치)

## PR6 문구·임대 방침

- 문구 표 `lib/seed/modeCopy.ts`(MODE_COPY): 신축 = 기존 문구 그대로, 임대 = «기록/손상/전달». findingNoun «상태»는 «직접 추가 상태»처럼 어색해 직접 추가 항목은 «기록», 체크 상태 DEFECT는 «손상».
- 임대에서 숨김: 시공사·입주예정일 필드·표시 · 수신처 «시공사» 선택지 · 유형 «미시공» · «AI 분석» CTA(대시보드·체크리스트, 마지막 공간은 «보고서로 이동») · 보고서 7절 AI 면책 절(문안은 `ReportAiDisclaimer.tsx`로 옮겼을 뿐 그대로).
- 렌더 테스트 대신(node 환경·useLiveQuery): 문구 표 임대 값 «하자»·«시공» 0 + toss 진입 그래프 .tsx 리터럴 0(브랜드 «하자체크», 신축 전용 AI 화면 2·면책 파일·홈 제외) + 라벨 맵 직접 사용 0.
- recipientType 백필 `sessionRecipient()` = `recipientType ?? DEFAULT_RECIPIENT[mode]`(v1은 mode도 없어 «BUILDER»). 임대만: 대시보드 «수신처» 행 · 보고서 표지 «점검 종류»·«수신처» 행. 전 모드: 목록 모드 표시 · 대시보드 모드 배지.
- NewDefectForm 공간: `pickArea(areas, chosen)` — 세션 로드 전 고른 값 없음(null) → 로드 뒤 그 모드의 areas[0]. 로드 전에는 폼 대신 «불러오는 중…».
- Next 웹(신축)에 실리는 변경 = 세션 목록 모드 표시 · 대시보드 모드 배지 2곳뿐(발주서 요구). 그 밖 신축 문구는 원문 그대로 — 테스트 «신축 문자열 필드 전부 = main e7487be 원문»이 MODE_COPY.NEW_BUILD 문자열 26개를 표로 1:1 고정(대시보드·표지 «시공사» 라벨 포함, critic 2차 지적 1·2) + 상태 라벨·prepItems·showModeMeta.
- **게이트 판단 항목(critic 지적 6)**: PR6 머지 뒤 PR7 전까지, Next 웹에서 임대 세션을 만들면 Next `page.tsx` 6곳(체크리스트 안내 «양호/의심/하자/확인불가» · 하자 목록·신규·상세 제목 · 신규 안내 문단 «하자를 직접 기록… 하자 ID» · 분석 화면 «AI 하자 분석 / 의심/하자 항목…»(임대는 CTA 없음, URL 직접 진입 때만))이 «하자»로 남고 본문은 «손상»·«기록»으로 섞인다. toss 번들은 0. Next 화면은 PR7에서 빠지므로 손대지 않았다.
- recipientType 백필은 표시용(`sessionRecipient()`)만. DB 마이그레이션·JSON export에는 적용하지 않는다(v1 export는 원본 그대로 — 의도).
- AI CTA 가드: `analysisPath(sessionId, mode)`가 AI 끈 모드에서 null → `href`·`router.push`에 null을 넘길 수 없어 극성 실수는 타입 오류(변이 `{!aiHref &&` → tsc error 1 + 테스트 실패 확인).
- 리터럴 검사: typescript AST로 문자열·템플릿·JSX 텍스트만 본다(주석 정규식 제거). 임대 렌더 .ts 상수(공간·추천 동선·빠른 태그·임대 시드·위험도·보수·하자상태 라벨)도 검사.

- toss 전용 변경(Next 웹 무관): 분석 화면 `document.title` «AI 하자 분석» → «AI 분석»(임대 직접 진입에도 쓰이는 제목이라 중립어).
- critic 3차 경미 1 반영: ChecklistView·NewDefectForm·DefectDetailView 세션 조회를 `?? null`로 — 잘못된 링크에서 원문처럼 «항목 없음»·폼이 뜨고 무한 «불러오는 중…» 0.

## 다음 PR 후보(범위 밖 메모)

- `lib/repo/reportRepo.ts` 빈 체크리스트 제목 «사전점검 체크리스트 (종이 백업)» — 임대에도 신축 용어(금지어 아님, critic 2차 지적 7). toss는 스텁이라 현재 노출 0.
