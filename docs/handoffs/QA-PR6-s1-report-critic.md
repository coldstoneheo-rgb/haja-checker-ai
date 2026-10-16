# QA Report — PR #6 docs/s1-spike-report (1c85104) · critic(high)

- 종합 점수: 7/10 · 판정: PASS (심각 0 · 중요 4 · 경미 9)
- self-bias: 같은 계열 모델 · 문서 원문은 Maker 세션 사본으로 대조 · 브라우저 실측값은 재현하지 않고 산출물과의 모순만 확인

## 실행 검증(critic)
금지어 10종 0 · 문서 줄 번호 표본 25+ 일치(storage·hash-key·faq·sdk-3.x·in-app-ad·camera·광고·event·체크리스트·release-note) · SDK 3.4.0 `.d.ts` 인용 일치 · 레포 사용처(ReportView.tsx:40·50·90, reportRepo.ts:119, analysisRepo.ts:32, lib/ai/index.ts) 일치 · `.ait` 504,251B/137파일 · `out/` 1,475,941B · `/sessions` 스크립트 gz 224,204B · Vite dist 325,861B·JS gz 96,093B · 패치 `git apply --check` OK · AGENT_STATUS JSON ok

## 결함 → 처분(반영 커밋 = 이 파일과 같은 커밋)
1. [중요] 비교표 B 공수에 공통 작업(API 분리) 이중 계상 → 행을 «기반 고유 공수(공통·QA 제외)»로 바꿔 A 1~3시간 / B 3~6시간(추정), 공통 행에 실기기 QA 추가 · WORKLOG 의미 정정
2. [중요] ① B열이 동적 경로 미실측인데 «됨» → «placeholder — 딥링크·2단계 경로 미실측» 명시 · ② B열 «선례, haja 미실측»
3. [중요] 재현 근거가 레포 밖에만 → `S1-spike-configs.md`(Vite·shim·router·ait·PNG 설정 + ⑩ 명령 전문) 추가
4. [중요] PUBLIC 노출 → QA-PR4의 민감 커밋 안내 제거 · 로컬 경로 `~`로 일반화 · 사용자 원문 인용을 «사용자 위임 10-17»로
5. [경미] 내용 수정 16 → 15
6. [경미] 라우트 정적 4·동적 8 → 정적 5·동적 7
7. [경미] ④ 판정 → «조건부(용량 문서 없음)»
8. [경미] ② 판정에 전제 명시
9. [경미] «S2 공수 거의 같다»에 «추정»
10. [경미] 72/72는 main 실측·변환 트리 미실행 명시
11. [경미] ⑫ warm 표기 · cold 미측정 명시
12. [경미] WORKLOG 앞 블록 고쳐 쓰기 → 원문 복원, 새 블록에 «정정» 1줄
13. [경미] 원격 추적 ref `origin/chore/harness-pr0` prune 전 명시 · face-fate .ait는 «로컬 빌드본(추정)»으로 낮춤
