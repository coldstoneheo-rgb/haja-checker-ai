# WORKLOG — haja-checker-ai

규약: https://github.com/coldstoneheo-rgb/life-coordinator/blob/main/docs/WORKLOG_PROTOCOL.md (최신이 위, append-only)

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
