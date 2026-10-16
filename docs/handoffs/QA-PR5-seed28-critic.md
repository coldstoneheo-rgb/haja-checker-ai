# QA Report — PR #5 fix/seed-28 (b911d19) · critic(high)

- 종합 점수: 8.5/10 · 판정: PASS (심각·중요 0)
- self-bias: 같은 계열 모델. 새 항목 문구의 현장 적절성은 사람 확인 필요

## 실행 검증
`npm test` 74/74 · `tsc --noEmit` 0 · 시드 base 27 → HEAD 28(base «기타» 0) · 추가 줄 금지어 0 · 변경 2파일

## 합격
PRD:39·107 · D2 시나리오 0/28 · app/page.tsx:10 · CLAUDE.md 28과 정합 · 감사 보고서 :58 권장 1·2 이행 · CHECKLIST_SEED 사용처 = sessionRepo.ts:61 하나, DB version(1)·재시드 없음 → 기존 세션 무영향 · order 27 맨 끝 · 진행률 동적 계산 · «기타» 탭 새 세션부터 노출

## 결함 → 처분
1. [경미] CLAUDE.md «45 tests» drift → REPORT PR에서 정정
2. [경미] 거실 «벽지·천장 마감»과 일부 겹침 → daf21f0 설명에 범위 문구
3. [경미] 보고서 위치가 «기타»로만 → daf21f0 «위치는 메모에 방 이름으로» · 후속 검토
4. [경미] improvement-plan «27 confirmed»·도어록안 → daf21f0 C1 완료 표기

LC 게이트: PASS(차단 0, 사본 재현 vitest 74/74 · tsc 0 · 신규 테스트 2개 main 시드에서 실패 확인 · 금지어 0)
