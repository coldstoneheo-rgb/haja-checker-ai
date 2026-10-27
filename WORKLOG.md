# WORKLOG — haja-checker-ai

규약: https://github.com/coldstoneheo-rgb/life-coordinator/blob/main/docs/WORKLOG_PROTOCOL.md (최신이 위, append-only)

---
date: 2026-10-27
project: haja-checker-ai
agent: claude-code
summary: S2 이식 조각 3 — 실기기 스텁 3종(카메라·광고·식별키) 머지 · SW 자폭 열어 둠(#19 묶음) · #18 관찰 ③④
status: on_track
progress: "HO-2026-1026-haja-s2-port-03 조건 1~7 끝 (근거: main 7ce4d0e(#21)·ae8ea33(#22) · 164/164(main) · vitest 162/162(A)·147/147(B)·145/145(C) · typecheck 0 · next build 0 · build:toss 0 · critic high A 8.5·B 8·C 8.5 · LC PASS #21·#22·#23)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/22 PR A 스텁 3종", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/21 PR C 임대 잔여", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/23 PR B SW 자폭(열림)"]
next: QR 10-29 실기기(준비 표) → /api/analyze 분리+CORS → 리워드 UI·문안 ASK
blockers: #19·#23 머지는 사용자 · 문안 ASK · 콘솔·.ait 업로드는 사용자 손
monetization: 광고 자리 생김(AD_GROUP_IDS 빈 값, 하루 상한∧canReward → onDailyLimit) — 실 호출 0
learning_need: 스텁을 «켜진» 상태로 두면 아직 없는 기능이 있는 기능을 막는다 — 스텁 기본값은 기존 경로 유지
---
## 의미
critic 1차가 잡은 것은 «토스 카메라 스텁을 true로 두면 사진 기능 전체가 막힌다»였다. 자리만 만든다는 목표가 기존 동작을 끄는 쪽으로 미끄러진 것이다. 스텁은 꺼 두고, 실측 뒤 SDK 연결과 같은 커밋에서 켠다.

---
date: 2026-10-26
project: haja-checker-ai
agent: claude-code
summary: S2 이식 조각 마감 — #17·#18 머지(사용자 위임) · #19 Next 화면 제거 열어 둠(머지 금지) · 실기기 스텁 점검
status: on_track
progress: "HO-2026-1026-haja-s2-port-02 조건 1~6 끝 · 7 = #19 열림(⛔) · 8 = #17·#18·#19 LC PASS · 9 = #20 (근거: main 2a5d438 · npx vitest run 143/143(main)·144/144(#19) · typecheck 0 · next build 0 · build:toss 0 · critic high 8/10 ×3 PR · LC PASS #17·#18)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/17 PR5 이식", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/18 PR6 모드 문구", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/19 PR7 Next 화면 제거(열림)"]
next: 실기기 QR 10-29(카메라·광고·식별키 인터페이스부터) → /api/analyze 분리 → 문안 ASK
blockers: #19 머지는 사용자(웹 UI·웹 데이터·SW 좀비 확인) · Vercel 배포 한도(간헐 rate limit — prod 2a5d438은 success, #19 머지 뒤 prod 배포 확인)
monetization: 광고 스텁 없음(다음 조각)
learning_need: 신축 회귀를 «원문 표 1:1» 테스트로 묶어야 critic 반복(6→7→8)이 줄어든다
---
## 의미
PR6는 critic이 세 번 돌았다. 두 번 모두 «신축 Next 웹 문구가 몰래 바뀜»이었고, 공용 문구 표에 값을 몰아넣으면 입력 라벨과 표시 라벨처럼 쓰임이 다른 문자열이 한 키로 합쳐지는 것이 원인이었다. 원문 26개를 main SHA에서 대조해 표로 고정한 뒤에야 PASS가 났다 — 회귀 0 제약은 «바뀐 곳 검사»가 아니라 «원문 전체 고정»으로 지킨다.

---
date: 2026-10-26
project: haja-checker-ai
agent: claude-code
summary: S2 이식 조각 — toss 10화면·외부 href 가드·보고서 플랫폼 어댑터(#17) · 모드 문구·임대 잔여(PR6 WIP) · 사용자 지시로 중간 마감
status: on_track
progress: "HO-2026-1026-haja-s2-port-02 조건 1~4 끝(#17 59c5583, critic 8/10 PASS) · 5·6 코드 끝(feat/s2-mode-copy 2f413b8, critic 미완) · 7 미착수 (근거: npx vitest run 140/140 · typecheck 0 · next build 0 · build:toss 0)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/17 PR5 이식", "feat/s2-mode-copy PR6 WIP(PR 미개설)"]
next: PR6 critic → PR 개설 → PR7 Next 화면 제거(머지 금지, 10-28 사용자 판단)
blockers: 없음(머지는 사용자 · 게이트는 LC)
monetization: 변화 없음
learning_need: 토스 WebView confirm() 대화상자·휠/롱프레스 새 탭 동작(실기기)
---
## 의미
머지가 곧 Vercel 배포라, 공유 컴포넌트를 바꿀 때는 «toss에서만 다르게»를 빌드 타임 alias(플랫폼 어댑터)로 풀고 Next 웹 회귀 0을 테스트로 묶었다. node 환경에서 렌더 테스트가 어려운 «임대 모드에 하자 0»은 문구 표 + toss 진입 import 그래프 위 리터럴 정적 검사로 대신했고, 변이로 실제로 잡는지 확인했다.

---
date: 2026-10-26
project: haja-checker-ai
agent: claude-code
summary: S2 전환 착수 — Vite(toss/) 골격·모드 3종·AI 고지·상한 카운터·동의 문안 초안·비게임 자가 점검표
status: on_track
progress: "HO-2026-1026-haja-s2-start-01 조건 1~7 끝 (근거: #11 19e6cda · #12 57513ab · #13 6ac6a15 · #14 71ba72f · #15 b174dc0 · npm test 116/116 · typecheck 0 · next build 0 · build:toss(ait build) 0)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/11 Vite 골격", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/12 모드 3종", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/13 고지·상한", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/14 동의·자가점검", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/15 서버 mode 가드"]
next: toss 이식 9화면(Next 제거) → 실기기 전 스텁(카메라·공유·광고·식별키) → QR 10-29
blockers: 문안 확정(사용자) · 월 $30 상한은 메모리 어댑터라 미보장 — KV(S3) 전 GCP 예산 한도 필요
monetization: 광고(전면·리워드) 미배선 — 상한 카운터에 리워드 +10 자리만(grantReward, 라우트 미노출)
learning_need: 토스 WebView에서 pushState 쿼리 라우팅과 백버튼 관계(실기기)
---
## 의미
사용자 결정 3(B Vite · Dexie 유지+경고 · QR 10-29)을 받아 S2를 시작했다. Next를 지우지 않고 `toss/` Vite 번들을 옆에 세워 같은 lib·app 원본을 쓰게 했고, 경계 테스트로 두 빌드가 한 벌의 도메인·DB를 쓰는지 고정했다. critic이 PR3에서 «첫 이용 고지»를 우회하는 진입점 2곳을 잡아 공용 게이트 hook + 정적 진입점 테스트로 막았다. critic 권고(viewport 확대 허용)는 토스 가이드와 충돌해 되돌렸다 — 리뷰 권고도 1차 자료로 확인한다.

---
date: 2026-10-17
project: haja-checker-ai
agent: claude-code
summary: PR #5·#6 스쿼시 머지 + 브랜치 정리 + CLAUDE.md 커밋 가드·경로 정리 PR
status: on_track
progress: "HO-2026-1017 조건 4 끝 (근거: #5 264733e · #6 b39639d · 원격 브랜치 main만 · npm test 74/74 · typecheck exit 0)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/5 시드 28 머지", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/6 S1 REPORT 머지", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/7 커밋 가드·경로"]
next: 사용자 코드 기반 결정(A Next export / B Vite) → S2 전환 발주
blockers: 사용자 결정 대기 — 코드 기반 · 저장 구조(iOS IndexedDB 7일) · 실기기 QR 일정 · 레포 공개 범위
learning_need: Windows에서 git worktree remove가 junction 대상까지 지우는 동작
---
## 의미
사용자 한 줄(«PR #5·#6 머지 진행, CLAUDE.md 가드·경로 정리 PR 포함»)로 S0·S1 산출물이 main에 들어갔다. 정리 중 사고 1건: 워크트리 `haja-wt-s0`를 `git worktree remove`로 지우자 junction으로 연결한 본 레포 `node_modules`까지 비워졌다 — 설치물만 영향, `npm ci`로 복구(test 74/74). 이 교훈과 빈 인덱스 커밋 가드를 CLAUDE.md «커밋 가드»에 한 줄로 넣었다.

---
date: 2026-10-17
project: haja-checker-ai
agent: claude-code
summary: S0 되살리기 + S1 스파이크 12항목 + Next 유지 vs Vite 재작성 비교표 REPORT
status: on_track
progress: "HO-2026-1017 조건 0·1·2·3 끝, 4 게이트 단계 (근거: #4 35319b5 · #5 20f88ef 74/74 · next export build exit 0 · ait build exit 0 · vite build exit 0 · docs/handoffs/HO-2026-1017-haja-spike-S0-S1-REPORT.md)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/4 하네스", "https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/5 시드 28", "docs/s1-spike-report REPORT PR"]
next: 사용자 코드 기반 결정(A Next export / B Vite) → S2 전환 발주
blockers: iOS WebView IndexedDB 7일 미사용 삭제(문서) — Dexie 전량 로컬 저장 설계와 충돌, 저장 구조 결정 필요
monetization: 광고 전면·리워드 SDK 문서상 됨(사전 로드 필수, 샌드박스 불가 → QR 검증) · 식별키는 토스 로그인 없이 발급
learning_need: 토스 WebView에서 window.print·Blob 다운로드·history 백버튼 실동작(문서 없음)
---
## 의미
두 코드 기반 모두 토스 번들(정적, SSR 금지)에 들어간다는 것을 실측으로 확인해, 결정 축이 «되느냐»에서 «유지 비용»으로 좁혀졌다. S2의 큰 공수(API 분리·CORS·인쇄 대체·저장 구조·실기기 QA)는 두 안이 같아서, 기반 고유 공수 차이는 1~3시간 대 3~6시간(추정)이다. 정정: 앞 블록 blockers의 «projects.json excluded»는 LC f2bf311 재등록으로 해소. iOS 7일 삭제는 어느 쪽을 골라도 풀어야 하는 새 위험이다. 사고 1건: 마감 커밋 c52a736이 빈 인덱스에서 만들어져 파일 95개 삭제로 PR #6 브랜치에 올라갔다 — 원인 미상, `git read-tree ef84fc2`로 복구(f53d174), force push 0. 다음부터 커밋 전 `git ls-files | wc -l`을 확인한다.

---
date: 2026-10-17
project: haja-checker-ai
agent: claude-code
summary: LC 협업 하네스 구성(PR-0 #4) — effort 설정(세션 medium·critic high)·AGENT_STATUS·WORKLOG·handoffs 폴더·CLAUDE.md LC 협업 규약·AGENTS.md 브랜치 규칙 재정의
status: on_track
progress: "HO-2026-1017-haja-spike-S0-S1-01 조건 0 게이트 단계 (근거: #4 42770d6·d8d0053 · critic 8/10 PASS · npm test 72/72 · typecheck exit 0)"
changes: ["https://github.com/coldstoneheo-rgb/haja-checker-ai/pull/4 chore(harness) PR-0(코드 0)"]
next: PR-0 LC 게이트 → 스쿼시 머지, 이어 S0 되살리기(시드 28 PR)
blockers: 레포 PUBLIC — 발주서 사본은 gitignore로 로컬 전용, 공개 범위는 사용자 결정 대기 · LC projects.json에서 haja가 excluded(«휴면·claude/review 브랜치» 사유는 낡음)
---
## 의미
haja는 5월 MVP 뒤 손이 끊겨 LC 발주·게이트를 거친 적이 없다. 하네스로 상태·흔적·머지 규칙을 다른 워커와 같은 꼴로 맞춰, S1 스파이크(Next 유지 vs Vite 재작성) 결과를 LC 스캔이 읽을 수 있게 한다(projects.json excluded 해제 뒤).

## 체크리스트 — HO-2026-1017-haja-spike-S0-S1-01
- [x] 0 하네스(#4 35319b5 · critic 8/10 · LC PASS · 브랜치 정리): ⓐ settings.json ⓑ critic.md(사용자 한 줄 10-17 수신) ⓒ AGENT_STATUS ⓓ WORKLOG ⓔ handoffs 폴더 ⓕ CLAUDE.md 규약 ⓖ AGENTS.md 브랜치 ⓗ PR-0 critic→LC→머지
- [x] 1 S0(ⓕ는 PR #5 머지 대기): ⓐ fetch·SHA·브랜치 결정 ✓(origin/main a320218 · 기능 브랜치) ⓑ npm ci ✓ ⓒ build exit 0 ✓(라우트 13 · lockfile root 경고) ⓓ test 72/72·typecheck 0 ✓ ⓔ 로컬 master 0f45988·claude/review 0c8ea94 삭제 ✓ + 로컬 main=origin/main 0/0 · 원격 claude/review 삭제 [ASK] ⓕ PR #5 b911d19·daf21f0(74/74) critic 8.5 PASS · LC 게이트 중 ⓖ env 이름 ✓(.env.local=VERCEL_OIDC_TOKEN뿐 · 코드 참조 GEMINI_API_KEY·GEMINI_VISION_MODEL·AI_ANALYZER → 로컬은 Mock)
- [x] 2 S1 12항목 — REPORT §2
- [x] 3 비교표 — REPORT §3
- [x] 4 REPORT + PR #6(critic 7/10 → LC PASS) + dirty 0 — 머지는 사용자 한 줄 대기
