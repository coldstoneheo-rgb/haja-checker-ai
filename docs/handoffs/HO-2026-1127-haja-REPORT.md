# HO-2026-1127 haja REPORT — `/api/analyze` 다른 출처 호출(CORS) · QR 시험 런북

## LC가 사용자에게 올릴 한 쪽
- **QR 시험까지 남은 사용자 손 ≈ 55분** — 런북 `docs/runbooks/QR-TEST-RUNBOOK.md` 맨 위 참조.
  1. PR #25 머지 → Vercel 자동 배포(5분)
  2. `toss/.env.local`에 `VITE_HAJA_API_BASE` 1줄 넣기(2분)
  3. `npm run build:toss`(3분)
  4. 콘솔 «앱 출시»에 `.ait` 올리기 · 권한 사유 붙여 넣기 · «토스앱 테스트» QR(9분)
  5. 폰 시험 14단계(29분) · 적어 보내기(5분)
- **결정 대기(사용자)**
  1. PR #25 머지·배포 여부. 머지하면 웹 주소에서 다른 사이트 출처의 POST가 403이 되고, 같은 출처 화면은 그대로입니다.
  2. SDK 연결(광고·식별키·저장·공유·openURL)을 1차 QR 앞에 넣을지. 권고는 «1차 QR 먼저(카메라 input·Origin·AI 분석) → 결과 보고 SDK PR → 2차 QR»입니다.
  3. 실기기 Origin이 기본값과 다를 때만 Vercel env `HAJA_CORS_ORIGINS` 추가.
  4. (이월) #19·#23 묶음 결정 · 리워드 제안 문구.
- **다음 창**
  1. QR 결과 반영
  2. SDK 연결 PR(카메라 input 실패 시 `Device.openCamera` 포함)
  3. 리워드 제안 UI·`grantReward` 라우트(광고 검증과 함께)

## 체크리스트(발주서 완료 조건)
- [x] 1. 계획 REPLY. 01:28 옛 LC `-fd`가 수용했고, 01:30에 `-a2`로 1줄 다시 보냄. 덧붙임 «env 전체 허용 값 금지 시험» 반영.
- [x] 2. 분석 API 다른 출처 호출 — PR #25. 시험 `__tests__/analyzeCors.test.ts` 25건(Mock만).
  - 허용 출처 근거: 앱인토스 공식 `guide/operation/toss.md` FAQ «토스 앱에서 통신이 되지 않아요» — «서버의 CORS 허용 Origin에 미니앱 Origin을 추가해야 해요»
    - `https://<appName>.apps.tossmini.com`(실서비스)
    - `https://<appName>.private-apps.tossmini.com`(콘솔 QR, SDK 3.1.0+)
    - 기존 근거: `S1-docs-findings.md:136`. 설치 SDK는 3.4.0이라 3.0.x용 `web.tossmini.com`은 넣지 않음.
  - 실기기 실측은 런북 D2에 넣음.
- [x] 3. 토스 호출 지점 = 어댑터 `analyzeEndpoint`(`VITE_HAJA_API_BASE` + `/api/analyze`). 값이 없으면 fetch 전에 «서버 주소 미설정» 안내로 실패. 시험 포함.
  - `DefectDetailView` 429도 같은 흐름에서 닿아 함께 처리(리워드 자리 호출).
- [x] 4. vitest 190/190 · typecheck 0 · next build 0 · build:toss 0(6e002b5 기준 재실행) — PR #25 본문.
- [x] 5. 런북 `docs/runbooks/QR-TEST-RUNBOOK.md` — 손 분 수(20+29+5) · port-03 표 7항목 · `.ait` 명령 · 권한 사유 초안 · 배포·env 단계.
- [x] 6. 열린 PR 사실(아래).
- [ ] 7. PR #25 → critic → LC 게이트 요청(머지 0).
- [ ] 8. AGENT_STATUS · WORKLOG · 이 REPORT → [CLOSED].

## 한 일
- **PR #25** `feat/analyze-cors`
  - `lib/ai/cors.ts`: 허용 출처 2개 + env 덧붙임. `*`·와일드카드 host·경로·형식 오류는 거부.
  - `route.ts`
    - `OPTIONS`: 허용 204 · 거부 403
    - `POST`: 거부 출처는 본문을 읽기 전 403이라 카운터를 쓰지 않음
    - 모든 응답에 `Vary: Origin`, 허용 출처면 Allow-* 추가
  - 토스 주소 어댑터 · `DefectDetailView` 429 리워드 자리.
- **런북 1장**: 공식 문서 2쪽(`guide/operation/toss.md` · `console-workspace.md`)으로 업로드·QR 조건·웹 디버그 툴즈를 확인해 넣음.

## 발견
- QR 실행 조건은 세 가지: 토스앱 로그인 · **워크스페이스 멤버** · **만 19세 이상**(console-workspace.md).
- 「테스트를 최소 1번 이상 완료해야 검토를 요청할 수 있어요」(console-workspace.md) — 출시 검토의 전제.
- CLI 업로드 `npx ait deploy`가 있고, 키는 콘솔 «키» 메뉴에서 받음(`npx ait token add`로 1회 등록).
- 권한 사용 사유의 콘솔 입력 위치는 공식 문서에 없음. 런북 P6에 «화면에서 찾고 메뉴 이름 적기»로 넣음.
- 토스 번들의 «스텁» 5종(광고·식별키·저장·공유·openURL)은 SDK 호출이 0이다. 그래서 1차 QR에서는 «멈추지 않는지»만 볼 수 있다. port-03 표의 «광고 테스트 ID·식별키 hash 실측»은 SDK 연결 판이 있어야 한다(결정 대기 ②).
- 화면에 외부 링크가 0건이라(결정 «외부 링크 0») openURL은 실측할 자리가 없다(런북 D11 건너뜀).

## 열린 PR 사실(조건 6 — 닫거나 고치지 않음)
- **#8** `chore(status): 10-17 마감`
  - AGENT_STATUS·WORKLOG 2파일 · CONFLICTING(DIRTY).
  - 내용(10-17 상태)은 이후 #20·#24의 10-26·10-27 상태가 덮었다.
  - 닫아도 잃는 것은 없다(사실 기록은 WORKLOG 10-17 블록에 이미 있음).
- **#19** `⛔ Next 화면 제거`
  - main과 `git merge-tree` 충돌 0(main 대비 4 뒤 · 3 앞). PR #25 브랜치와도 충돌 0.
  - GitHub 표시는 MERGEABLE·UNSTABLE.
- **#23** `⛔ SW 자폭`(base #19)
  - main과 · PR #25와 `merge-tree` 충돌 0(main 대비 4 뒤 · 5 앞).
  - GitHub 표시는 MERGEABLE·CLEAN.

## effort
- 세션 medium.
- critic은 high — 정의 frontmatter 규약.
- 문서 조사 서브에이전트(web-fetch)는 기본값.
