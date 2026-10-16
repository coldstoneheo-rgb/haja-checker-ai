# HO-2026-1017-haja-spike-S0-S1-01 — haja-checker-ai S0 되살리기 + S1 스파이크 12항목 → Next 유지 vs Vite 재작성 비교표

> 로드맵: `PLAN-2026-1003` §0 순위 3 haja-checker-ai — 스파이크 REPORT 예정 10-17이 **슬립**(흔적 0). 목표 ②(수익 파이프라인 증대): 토스 미니앱 두 번째 앱(무료+광고)의 코드 기반 결정 재료. 목표 ①에는 직접 닿지 않으므로 과금 0·배포 0 범위.
> 등급 [HO] origin:lc(사용자 10-16 «4. 판단대로» → LC 판단 «ff 쉬는 지점에 haja 창») · 수신 haja 새 창(레포 `C:\Users\colds\haja-checker-ai`) · 발주 10-16 23:5x KST · **새벽 무인 루프 창**(결정은 아침 ≤8문항).

## 0. 사실(LC 실측 10-16 23:4x, 읽기만)
- 로컬 브랜치 `claude/review-inspection-app-plan-RbozI`(= origin 동명), 마지막 커밋 0c8ea94 2026-05-08(«doc: quality audit and code review report») · 로컬 `master` · `origin/main` 존재(PLAN §8 S0는 `a320218` 기준 — 현재 SHA는 워커가 fetch로 확정). 작업트리 clean.
- Next 16.2.4(App Router) · scripts dev/build/start/lint/typecheck/test(vitest) · CLAUDE.md «npm test 45 tests» vs PLAN §8 «테스트 72» — 실측으로 확정. `.env.local` GEMINI_API_KEY 없으면 MockAnalyzer 자동(= 과금 0 경로).
- AGENTS.md 핵심 규칙: 작업 브랜치 = `claude/review-…`, main 직접 push 금지, 키는 `app/api/` 서버 라우트만, IndexedDB 클라이언트 전용, 변경 뒤 `npm test && npm run typecheck`.
- 정본: PLAN §8(사용자 답 10-03 · LC 판단 8건 · §8-1 S0~S4 표 · §8-2 구현 계획) — 이 발주서는 §8-1의 S0·S1 행을 그대로 완료 조건으로 옮긴 것.
- 채널톡 Q1~Q5(사용자 발송분) 답 유무는 LC 미확인 — 스파이크와 무관(§8 판단 2).

- **사용자 원문(10-17 00:1x, LC 창)**: «haja 워커는 지금 다른 워커들처럼 lc와 협업으로 작업해 본 적이 없어. haja 작업 시작 전에 하네스 구성하고 지금 다른 워커들하고 하는 것과 같은 워크플로우 구성하고 opus5.5로 모델 설정 해놨으니까 opus5.5 프롬프트 프로토콜에 따라 지시문 전달하고 마찬가지로 critic+lc 게이트 통과하면 머지 직접 하라그래.» → 조건 0(하네스) 신설 · 머지 위임 = 사용자 원문으로 이 창에 적용(분류기가 막으면 [BLOCKED] 1줄, 아침 사용자 allow).
- 창 이름 `haja-checker-ai-44`(00:1x 개설). 새벽 루프 순서(사용자): ff 마감 → haja S1 본작업. 조건 0·1은 지금, 조건 2·3은 LC «가» 뒤(RAM 16GB: 무거운 작업 한 창씩).

## 1. 먼저 읽을 것
`CLAUDE.md` · `AGENTS.md` · `PRD.md` · `docs/quality_audit_code_review_report.md` · `docs/D2-*.md` · `lib/domain/types.ts` · `lib/db/db.ts` · `next.config.ts` · `vercel.json` · LC `docs/PLAN-2026-1003-portfolio-implementation.md` §8 전체 · face-fate 레포 `docs/CONSOLE-STEPS-2026-0928.md`·`docs/CLI-UPLOAD-2026-1006.md`(ait 빌드·업로드 선례, 읽기만) · 토스 앱인토스 공식 문서(web.commands·Device·Share·광고 SDK) 직독. 여기 적히지 않았더라도 관련 문서를 넓게 열어 본 뒤 계획을 세운다.

## 2. 이미 결정된 것(다시 묻지 않는다)
1. 서비스명 «하자체크», 포지셔닝 «신축 입주 하자 점검 + 입주·퇴거 집 상태 기록», 수익 = 무료 + 인앱 광고, 분석 상한 30/일·+10·캡 60·월 $30(PLAN §8 사용자 답).
2. 코드 기반(Next 유지 vs Vite 재작성)은 **스파이크 REPORT 뒤 LC·사용자 결정** — 이 창은 비교표까지. 어느 쪽이든 `lib/domain`·`lib/db`·`lib/ai`는 승계.
3. S0 브랜치 정리는 워커 주권(삭제 전 SHA 기록, LC는 fetch 비교). AGENTS.md «main 직접 push 금지»는 유지 — PR로.
4. 과금 0(Gemini 실호출 0, MockAnalyzer) · 배포 0(Vercel 프로덕션 변경 0) · 콘솔 0(앱 등록·.ait 업로드·QR은 S3 사용자 손). 토스 WebView 실측 항목은 «실기기 대기»로 표기.
5. 콘솔 텍스트 금지어(전월세·임대인·임차인·보증금·이사·인테리어·중개·시세·분양·임대차)는 S2 몫이지만, 이 창에서 만드는 문서에도 쓰지 않는다.
6. 머지 = critic(high) PASS → LC 게이트 PASS → **워커 스쿼시 머지 + 브랜치 즉시 정리**(사용자 원문 «critic+lc 게이트 통과하면 머지 직접 하라그래», 이 창 한정). 분류기가 머지를 막으면 [BLOCKED] 1줄 보고하고 다음 항목 진행(아침 사용자 allow).
7. effort = REF-2026-1015 §3 표(세션 medium · critic high). 이 레포는 settings·서브에이전트 frontmatter가 없을 수 있다 — 첫 TASK로 face-fate/L2C 선례대로 적용(§3-A 6번).
8. 출력 한국어(코드·SHA·경로만 원문). 턴 종료 = [IDLE] 또는 [ASK] 한 줄.

## 3. 완료 조건(번호 = 체크리스트, PLAN §8-1 S0·S1 행)
0. **하네스 구성(face-fate 레포 `C:\Users\colds\AI\claude\face-fate` 선례를 읽고 같은 꼴로, 읽기만)**: ⓐ `.claude/settings.json` — `modelSettings.claude-opus-5-5.effortLevel = medium` + 읽기 전용 allow 목록(git fetch·npm test·typecheck·build) ⓑ `.claude/agents/critic.md`(face-fate 것을 복사해 이 레포 용어만 바꿈, `effort: high`, 생성 0·평가만) ⓒ `AGENT_STATUS.json` 신설(face-fate 형식: state·as_of·head·waiting_on·next_actions·recent) ⓓ 루트 `WORKLOG.md` 신설(LC `docs/WORKLOG_PROTOCOL.md` 2-Layer 블록) ⓔ `handoffs/` + `docs/handoffs/` 폴더(REPORT 착지) ⓕ `CLAUDE.md`에 «LC 협업 규약» 절 1개(머지 규칙 = critic(high) PASS → LC 게이트 PASS → 스쿼시 머지 → 원격·로컬 브랜치 즉시 정리 · 출력 한국어 · 턴 종료 규약 포인터 = LC `docs/WORKER-PROMPT-GUIDE.md` §3-A · effort 정본 REF-2026-1015 §3) ⓖ AGENTS.md «작업 브랜치 = claude/review-…·main 직접 push 금지» 규칙은 PR 경유로 재정의(기능 브랜치 → PR → 스쿼시 → main; 직접 push 금지는 유지) ⓗ 이 조건 0을 **PR-0**(코드 0, 설정·문서만)으로 올려 critic → LC 게이트 → 머지 — 첫 왕복으로 워크플로우 자체를 검증한다.
1. **S0 되살리기**: ⓐ `git fetch` → origin/main·origin/claude/… SHA 기록 → 작업 브랜치 결정(워커 주권, 사유 1줄) ⓑ `npm ci` exit 0 ⓒ `npm run build` exit 0 ⓓ `npm test` 전부 녹색 + 개수(45/72 중 실측값) + `npm run typecheck` 0 ⓔ stale 브랜치(`master`·`claude/review-…`) 처분 전후 목록·SHA(삭제는 로컬만, 원격 삭제는 [ASK]) ⓕ 시드 27↔PRD 28 불일치 해소(또는 사유) ⓖ 환경변수 3종 확인(값 기록 0).
2. **S1 스파이크 12항목** 각각 «됨 / 안 됨 / 조건부» + 근거(명령·출력 꼬리·공식 문서 URL+줄): ① Next 정적 export(`output: 'export'`) + 동적 세그먼트(`[sessionId]`) → 쿼리/해시 라우팅 대안 ② `ait build`가 Next 산출물을 받는가(web.commands 커스텀, face-fate 선례 대조) ③ Vite+React 골격에 화면 1개(세션 목록) 이식 공수 ④ `Device.openCamera`/`getPhotos` 사양(장수·용량 — 문서 직독, 실기기는 대기) ⑤ `window.print`·`window.open` 대체(공유 PNG/서버 PDF) ⑥ Service Worker ⑦ IndexedDB 영속(캐시 정리 시) ⑧ 식별키(anon key) 발급에 토스 로그인 필요 여부(문서) ⑨ 라이트 모드·네비게이션 바·뒤로가기 ⑩ `/api/analyze` → Vercel 함수 분리 + CORS ⑪ 광고 SDK(전면·리워드) 로드 ⑫ 번들 크기·2초 인터랙션(로컬 측정). 실측 가능한 것은 실측(①②③⑤⑥⑦⑩⑫), 문서만 가능한 것은 문서(④⑧⑨⑪).
3. **비교표 1쪽**: Next 유지 vs Vite 재작성 — 공수(일)·위험·테스트 승계율·토스 적합(①②⑨)·추천 없음(두 안의 근거만, 결정은 LC·사용자). «추정»은 «추정»으로 표기.
4. **REPORT** `docs/handoffs/HO-2026-1017-haja-spike-S0-S1-REPORT.md`(S0 결과 / 12항목 표 / 비교표 / 사용자 확인 항목 ≤3 / effort 1줄) + `AGENT_STATUS.json` 신설(face-fate 형식) + WORKLOG 블록 + PR(critic high) → LC 게이트 → 작업트리 dirty 0 → [IDLE].

## 4. 멈출 곳(각각 멈추고 보고)
- (a) Gemini 실호출·유료 API 0. 키 파일 생성 0.
- (b) Vercel 프로덕션·도메인·env 변경 0. 콘솔·.ait 업로드 0.
- (c) 원격 브랜치 삭제·force push 0 → [ASK].
- (d) 스파이크 ③(Vite 이식)이 2시간을 넘기면 중단하고 «조건부 + 소요» 기록.
- (e) 위임 문장 없는 창에서 머지 0. 교착 2왕복 → [ASK] 1줄.

## 5. 반박 가능
조건 1ⓔ 브랜치 처분과 조건 3 비교표 축은 LC 안 — 계획 REPLY에 수용/반박/대안.

## 6. 보고 시점 · 예산
계획 REPLY(10분 안: S0 브랜치 결정·12항목 실측/문서 분류) → S0 완료 1줄 → 항목마다 1줄 → REPORT 경로 → [IDLE]. 예산 300분. 검증은 줄이지 않는다.
