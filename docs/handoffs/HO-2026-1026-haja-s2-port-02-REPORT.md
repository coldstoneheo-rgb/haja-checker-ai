# HO-2026-1026-haja-s2-port-02 REPORT (중간 마감 — 사용자 지시 «모든 창 마감하고 새창» 10-26 13:0x)

## 마감 상태(10-26)

- (갱신 10-26 오후) #17 PR5 → main `e7487be` 스쿼시 머지(사용자 위임 «critic+lc 게이트 pass면 알아서 머지해» · critic 8/10 · LC PASS) · feat/s2-port-screens 원격·로컬 삭제
- PR6 feat/s2-mode-copy: main 위로 rebase → 코드 `8790e37` · critic(high) 6/10 → 반영 `1e891cc` → 7/10 → 반영 `b45cd40` → **8/10 PASS** → 경미 반영(세션 없음/로딩 구분 · 배선 단언) → PR 개설(base main) → LC 게이트 → PASS면 사용자 위임대로 머지
- PR7(Next 화면 제거): 미착수. 머지 = 웹 UI 소멸이라 위임과 별개로 머지 전 사용자 확인

## 한 일 / 발견 / LC·사용자에게 필요한 것

- 한 일: PR5 #17(10화면·외부 href·보고서 어댑터, 116→131) · PR6 코드(모드 문구·임대 잔여·백필·areas[0], 131→143, 빌드 3종 exit 0, critic 6→7 → 반영)
- 발견: 의도된 Next 웹 변경: #17 2건(팝업 차단 안내 · 빈 체크리스트 escape) + PR6 신축은 목록·대시보드 모드 표시뿐 · PR7 뒤에도 `public/sw.js`가 남아 옛 SW 설치 브라우저는 캐시된 옛 화면을 볼 수 있음 · 세션 목록 삭제가 `confirm()`(토스 WebView 대화상자 동작은 실기기 QR에서 확인)
- 필요한 것: PR6 LC 게이트 판정(«게이트 판단 항목» Next 웹 임대 혼재 6곳 포함) · PR7 머지는 사용자 별도 확인(웹 UI 소멸)

## effort

- 세션 medium · critic high 4회(PR5 1 · PR6 3 — 6→7→8, 검수 규약) · 올린 곳 없음

발주서: `life-coordinator/handoffs/HO-2026-1026-haja-s2-port-02.md` · 기준 main `42863fe` · 116/116

## 완료 조건 체크리스트

- [x] 1. 계획 REPLY(≤15분) — PR 3개 스택(PR5 이식 / PR6 문구·임대 / PR7 Next 화면 제거) · (가) · LC ACK + 보강 2건(PR7 머지 금지 · Next 웹 회귀 0 어댑터)
- [x] 2. (#17 머지 e7487be) 9화면 이식 — `toss/src/pages/` 10화면 · 쿼리 라우팅 · 왕복 경로 테스트 · «뒤로» 제거 · `document.title` · public/ 방침 · `@source` (PR5)
- [x] 3. (#17 머지) Link shim 외부 href(개발 중 throw + 빌드본 openExternal 스텁) · scroll · next 전용 import 금지(변이 1회) (PR5)
- [x] 4. (#17 머지) 인쇄·새 창 4곳 대체 — 플랫폼 어댑터(Next 웹 = 기존 동작, toss = 스텁 TODO(QR-1029)) · toss 그래프 window.print/open 0 · Next 웹 회귀 0 테스트 (PR5)
- [x] 5. (PR6 `8790e37`+`1e891cc`) findingNoun — `lib/seed/modeCopy.ts` · `app/sessions/new/NewSessionForm.tsx` · `app/sessions/SessionsList.tsx`·«하자/시공» 문구 일괄 · NewSessionForm 모드별 필드 · 목록·대시보드 mode 표시 (PR6)
- [x] 6. (PR6 동일) 임대 모드 잔여 — `app/sessions/[sessionId]/report/ReportView.tsx` `{copy.aiOn && <ReportAiDisclaimer` · `lib/seed/modes.ts` `analysisPath`· `lib/seed/modes.ts` `sessionRecipient`·`pickArea` · `__tests__/modeCopy.test.ts`(AI CTA·7절 면책 절 비렌더) · recipientType 백필 · areas[0] · 고지 게이트 toss 진입점 전수(PR5에서 테스트 선반영) (PR6)
- [x] 7. (PR7 chore/s2-remove-next-pages, critic 8/10 조건부 PASS, **⛔ 머지 금지 — 사용자 확인**) Next 화면 제거 (가) — page.tsx 10 + SwRegister·PageStub, next build exit 0(`/api/analyze`만) · build:toss 0 · 144/144
- [ ] 8. (PR5 끝 · PR6 critic 미완) PR마다 critic(high) → LC 게이트 → 열어 둠
- [x] 9. 인계 블록(중간 마감)(REPORT 마감 · AGENT_STATUS · WORKLOG)

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

## PR7 머지 전 사용자 확인 자료(critic 조건)

1. **웹 UI 소멸**: 머지 = main push = Vercel 배포 → 웹 주소에는 404와 `/api/analyze`만 남는다.
2. **웹 데이터 갇힘**: 웹(Vercel 도메인)에서 쌓은 점검 세션은 그 브라우저 IndexedDB에만 있다. 머지 뒤 보고서·JSON 백업 화면이 사라져 꺼낼 길이 없다. toss 앱은 출처가 달라 같은 데이터를 못 읽는다. 대안: 머지 전 공지·백업 기간 / 머지 미룸.
3. **서비스워커 좀비**: `public/sw.js`가 그대로라 이미 설치된 SW가 남는다. 온라인이면 404, 오프라인·약한 신호면 캐시된 옛 화면이 뜨고 다시 온라인이 되면 404 → «데이터가 사라졌다»로 보인다. 선택: (a) sw.js를 자폭 버전(캐시 전부 삭제 + unregister)으로 교체하는 후속 PR / (b) 오프라인 열람용으로 그대로 둠. sw.js 파일을 지우는 것은 답이 아니다(업데이트 404 → 옛 SW 영구 잔류).
4. 후속 docs PR: CLAUDE.md·README·AGENTS.md·PRD.md의 SwRegister·page.tsx·«SW 등록됨» 서술 정리. `.claude/agents/critic.md:24`의 고지 문구 출처 `app/page.tsx` → `toss/src/pages/HomePage.tsx`는 사용자 승인이 있어야 고칠 수 있다(규약).
5. 이번 PR 안 반영: layout metadata에서 manifest·appleWebApp 제거(404를 홈 화면에 추가하는 것 방지) · page 검사 `page.[jt]sx?`로 넓힘. `next.config.ts` `largePageDataBytes`는 무해해 후속 정리.
