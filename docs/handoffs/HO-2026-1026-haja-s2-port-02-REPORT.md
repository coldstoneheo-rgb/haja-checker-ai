# HO-2026-1026-haja-s2-port-02 REPORT (초안 — 체크리스트 겸용)

발주서: `life-coordinator/handoffs/HO-2026-1026-haja-s2-port-02.md` · 기준 main `42863fe` · 116/116

## 완료 조건 체크리스트

- [x] 1. 계획 REPLY(≤15분) — PR 3개 스택(PR5 이식 / PR6 문구·임대 / PR7 Next 화면 제거) · (가) · LC ACK + 보강 2건(PR7 머지 금지 · Next 웹 회귀 0 어댑터)
- [x] 2. 9화면 이식 — `toss/src/pages/` 10화면 · 쿼리 라우팅 · 왕복 경로 테스트 · «뒤로» 제거 · `document.title` · public/ 방침 · `@source` (PR5)
- [x] 3. Link shim 외부 href(개발 중 throw + 빌드본 openExternal 스텁) · scroll · next 전용 import 금지(변이 1회) (PR5)
- [x] 4. 인쇄·새 창 4곳 대체 — 플랫폼 어댑터(Next 웹 = 기존 동작, toss = 스텁 TODO(QR-1029)) · toss 그래프 window.print/open 0 · Next 웹 회귀 0 테스트 (PR5)
- [x] 5. findingNoun·«하자/시공» 문구 일괄 · NewSessionForm 모드별 필드 · 목록·대시보드 mode 표시 (PR6)
- [x] 6. 임대 모드 잔여(AI CTA·7절 면책 절 비렌더) · recipientType 백필 · areas[0] · 고지 게이트 toss 진입점 전수(PR5에서 테스트 선반영) (PR6)
- [ ] 7. Next 화면 제거 (가) — PR7, **열어 두되 머지 금지**(머지 = Vercel 웹 UI 소멸)
- [ ] 8. PR마다 critic(high) → LC 게이트 → 열어 둠
- [ ] 9. 인계 블록(REPORT 마감 · AGENT_STATUS · WORKLOG)

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
- recipientType 백필 `sessionRecipient()` = `recipientType ?? DEFAULT_RECIPIENT[mode]`(v1은 mode도 없어 «BUILDER»). 대시보드·보고서 표지에 «수신처»·«점검 종류» 표시, 목록에 모드 표시.
- NewDefectForm 공간: `pickArea(areas, chosen)` — 세션 로드 전 고른 값 없음(null) → 로드 뒤 그 모드의 areas[0]. 로드 전에는 폼 대신 «불러오는 중…».
- Next 웹에 실리는 변경(임대 세션만 문구가 바뀜, 신축은 0 — 테스트 «신축은 기존 문구 그대로»): 단, 준비물 «포스트잇 또는 하자 표시 스티커» → «포스트잇 또는 표시 스티커»는 전 모드 공통으로 바꿨다. Next `page.tsx` 헤더 문구는 PR7에서 화면째 빠지므로 손대지 않았다.
