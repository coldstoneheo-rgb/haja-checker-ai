# 검단웰카운티 하자 점검·분석 웹앱 품질 감사 및 코드 검증 결과 보고서

- 대상 제품: 하자체크 AI — 신축 아파트 사전점검 PWA
- 대상 브랜치: `claude/review-inspection-app-plan-RbozI`
- 대상 저장소: `coldstoneheo-rgb/haja-checker-ai`
- 감사일: 2026-05-08 (Asia/Seoul)
- 감사 방식: 첨부 작업 계획 기반 문서 검토 + GitHub 커넥터를 통한 대상 브랜치 정적 코드 감사 + PR/배포 상태 확인

## 1. 결론

**Release Gate 판정: NO-GO**

정적 코드 감사 기준으로 서버/클라이언트 경계와 API 키 노출 방지 구조는 대체로 양호합니다. 그러나 실제 D-2 실기기 시나리오와 PRD의 핵심 플로우를 기준으로 보면, 본 점검 전 수정해야 할 **P1 이슈가 7건** 확인되었습니다. 특히 기본 체크리스트 수량 불일치, 직접 하자 사진 첨부/AI 분석 플로우 부재, 직접 하자 목록의 체크리스트 연동 하자 혼입, 하자 표시 ID 중복 가능성, AI 분석 저장의 partial state 가능성, `/api/analyze` 입력 검증 부족, 보고서 화면 접근 경로 부재는 본 점검 당일 사용성을 직접 저해할 수 있습니다.

자동 release gate 명령(`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`)은 이 실행 환경에서 로컬 저장소 checkout이 불가하여 직접 실행하지 못했습니다. GitHub 상태상 Vercel Preview 배포는 성공 상태로 확인되지만, 이는 전체 release gate 중 `build`에 가까운 신호일 뿐이며 테스트·타입체크·린트·실기기·Gemini 실연 검증을 대체하지 않습니다.

## 2. 감사 범위와 제약

### 수행한 항목

- 대상 브랜치 존재 확인
- `package.json`, Next.js/App Router 구조, Route Handler, Dexie 스키마, repository 계층, AI 분석 계층, 사진 처리 계층, PWA Service Worker, 보고서/export 코드 정적 검토
- GitHub PR #2, Vercel commit status, PR review comment 확인
- 첨부 문서 기반 D-2 acceptance scenario와 구현 코드의 요구사항 매칭

### 수행하지 못한 항목

- 로컬 `git status --short` 확인: 저장소를 컨테이너에 clone할 수 없어 미수행
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`: 로컬 checkout 불가로 미수행
- `npm run test:coverage`: 로컬 checkout 불가로 미수행
- iOS Safari / Android Chrome 실기기 검증: 물리 기기 접근 불가로 미수행
- Vercel Preview/Production 환경변수 직접 확인: Vercel 환경 변수 접근 권한 없음
- 실제 Gemini Vision API 실연: API 키와 사진 입력 기반 POST 검증 환경 부재로 미수행

## 3. 코드베이스 현황 요약

- Next.js `16.2.4`, React `19.2.4`, Dexie `4.4.2`, Vitest `4.1.5` 구성.
- IndexedDB 테이블은 `sessions`, `areas`, `checklistItems`, `photos`, `defects`, `analyses`, `reports` 7개.
- `/api/analyze`는 서버 Route Handler이며 `createAnalyzer()`를 통해 Gemini/Mock 분석기를 선택.
- Service Worker는 `/_next/static/*`, 아이콘, manifest를 캐싱하고 `/api/*`는 캐싱하지 않음.
- 보고서 화면은 `window.print()`와 JSON export를 제공하며, 빈 체크리스트 출력 기능도 구현되어 있음.

## 4. A0~A7 에이전트별 감사 결과

| Agent | 영역 | 판정 | 핵심 결과 |
|---|---|---:|---|
| A0 | Audit Lead / Release Gate | NO-GO | 대상 브랜치 존재와 Vercel Preview 성공은 확인. 로컬 release gate와 실기기/AI 실연은 미수행. P1 7건 존재. |
| A1 | Next.js 16 / App Router Boundary | 부분 통과 | 서버 페이지가 Dexie를 직접 호출하는 패턴은 확인되지 않음. 클라이언트 파일에는 대체로 `"use client"` 존재. API 키는 서버 경로에 국한됨. |
| A2 | Domain / Dexie Data Integrity | NO-GO | 하자 표시 ID 중복 가능성, 분석 저장 partial state, 개별 하자 삭제 시 분석 orphan, 세션 진행률 직접 하자 카운트 오표시. |
| A3 | AI / Security / Privacy | NO-GO | API key client exposure는 현재 정적 감사상 없음. 다만 `/api/analyze` 입력 검증·크기 제한·MIME 제한·30초 timeout·runtime output validation 부족. |
| A4 | Mobile Photo / Browser API | 조건부 | EXIF 보정·Canvas `toBlob()` null 처리·Object URL revoke는 구현됨. 단, 직접 하자 사진 UI 부재와 실기기 미검증으로 통과 불가. |
| A5 | PWA / Offline / Service Worker | 부분 통과 | `/api/*` 비캐싱과 SW 캐시 전략은 양호. 오프라인 실기기 재실행과 IndexedDB 유지 검증은 미수행. |
| A6 | Report / Export / Backup | 부분 통과 | 보고서·JSON export·빈 체크리스트 출력은 구현. 그러나 앱 내 보고서 접근 링크가 사라져 D-2 시나리오상 사용자가 도달하기 어려움. JSON import 미구현. |
| A7 | Test Strategy / CI | NO-GO | 핵심 테스트는 존재하지만 28개 seed, direct defect ID 중복, API validation, report/export schema, deletion cascade 테스트가 없음. CI workflow는 확인되지 않음. |

## 5. Findings

### [P1] 기본 체크리스트 요구사항 28개와 seed 구현 27개 불일치

- 영역: 세션/체크리스트, acceptance criteria
- 파일: `lib/seed/checklist.ts`, `lib/repo/sessionRepo.ts`, `__tests__/checklist.test.ts`
- 증상: PRD와 D-2 시나리오는 기본 체크리스트 28개 초기화를 요구하지만, 현재 `CHECKLIST_SEED`는 27개 항목으로 보입니다. `DEFAULT_AREAS`에는 `기타`가 있으나 해당 영역의 seed 항목이 없습니다.
- 영향: 신규 세션 대시보드가 D-2 기준 `0/28`이 아니라 `0/27`로 표시될 수 있으며, 시나리오 1 완료 기준을 실패합니다.
- 원인 추정: 초기 PR #1에서는 27개 seed로 시작했으나 PRD/감사계획/D-2 시나리오가 28개 기준으로 업데이트되었고, 테스트가 수량을 고정 검증하지 않습니다.
- 권장 수정:
  1. 실제 요구사항이 28개라면 `기타` 또는 누락 영역에 1개 항목을 추가합니다.
  2. `__tests__/checklist.test.ts`에 `expect(CHECKLIST_SEED).toHaveLength(28)`를 추가합니다.
  3. 요구사항을 27개로 변경하려는 의도라면 PRD와 D-2 시나리오의 28개 기준을 모두 정정합니다.
- 검증 방법: `npm test` 및 신규 세션 생성 후 대시보드 `0/28` 표시 확인.
- 상태: Open

### [P1] 직접 하자 등록 플로우에서 사진 첨부 및 AI 분석이 사실상 막힘

- 영역: 직접 하자, 사진, AI 분석
- 파일: `app/sessions/[sessionId]/defects/new/NewDefectForm.tsx`, `app/sessions/[sessionId]/analysis/AnalysisView.tsx`, `lib/repo/photoRepo.ts`
- 증상: `addPhoto()`는 `defectCandidateId`를 받을 수 있지만, 직접 하자 등록 폼에는 사진 촬영/업로드 UI가 없습니다. 분석 화면은 직접 하자에 `사진 없음`을 표시하고 `photoCount === 0`이면 분석 버튼을 실행하지 않습니다.
- 영향: D-2 시나리오 4의 “직접 하자 사진 2장 촬영 → AI 분석 실행”이 통과 불가합니다. PRD의 “직접 하자에도 AI 분석 동일 적용” 요구사항도 만족하지 못합니다.
- 원인 추정: 체크리스트 사진 컴포넌트만 구현되었고, 직접 하자 상세/편집 화면 또는 직접 하자용 `PhotoCaptureButton` 연결이 누락되었습니다.
- 권장 수정:
  1. 직접 하자 생성 후 상세 화면으로 이동하여 `defectCandidateId` 기반 사진 첨부를 지원합니다.
  2. 또는 직접 하자 생성 폼 내부에서 저장 후 생성된 defect ID에 사진을 순차 첨부하는 2단계 UI를 제공합니다.
  3. 분석 화면의 직접 하자 카드에 “사진 추가” CTA를 배치합니다.
- 검증 방법: 직접 하자 생성 → 사진 2장 첨부 → 분석 페이지에서 `photoCount=2` → AI 분석 성공.
- 상태: Open

### [P1] 직접 하자 목록이 체크리스트 연동 하자까지 표시·삭제할 수 있음

- 영역: 데이터 무결성, 직접 하자 목록
- 파일: `app/sessions/[sessionId]/defects/DefectsList.tsx`, `lib/repo/checklistRepo.ts`, `lib/repo/defectRepo.ts`
- 증상: 직접 하자 목록은 `sessionId`의 모든 defects를 조회하며 `checklistItemId`가 있는 체크리스트 연동 하자를 필터링하지 않습니다. `deleteDefect()`는 호출 대상이 직접 하자인지 체크리스트 연동 하자인지 구분하지 않습니다.
- 영향: 사용자는 “직접 추가 하자” 화면에서 AI 분석으로 생성된 체크리스트 하자를 삭제할 수 있습니다. 이 경우 체크리스트 상태와 AI 분석 결과가 불일치하거나 증거 사진이 삭제될 수 있습니다.
- 원인 추정: direct defect와 checklist-linked defect의 UI 경계가 repository 쿼리에 반영되지 않았습니다.
- 권장 수정:
  1. 직접 하자 목록에서는 `.filter((d) => !d.checklistItemId)`를 적용하거나 `[sessionId+checklistItemId]` 계열 인덱스를 추가합니다.
  2. `deleteDefect()`는 직접 하자 삭제 전용과 checklist-linked defect 삭제 전용을 분리합니다.
  3. checklist-linked defect 삭제 시 체크리스트 상태, 사진, 분석, UI를 함께 정합 처리합니다.
- 검증 방법: 체크리스트 의심 항목 AI 분석 후 직접 하자 목록에 해당 defect가 보이지 않는지 확인.
- 상태: Open

### [P1] 하자 표시 ID `D-YYYYMMDD-NNN` 중복 가능성

- 영역: 데이터 무결성, ID 생성
- 파일: `lib/repo/defectRepo.ts`, `lib/repo/analysisRepo.ts`, `lib/db/db.ts`
- 증상: 직접 하자와 체크리스트 분석 하자 모두 세션 내 defects count + 1 방식으로 displayId를 생성합니다. 삭제 후 재등록하거나 동시 저장이 발생하면 기존 displayId와 중복될 수 있습니다. Dexie schema에도 `[sessionId+displayId]` 유니크 제약이 없습니다.
- 재현 예: 직접 하자 2개 생성(`001`, `002`) → `001` 삭제 → 새 하자 추가 → count는 1이므로 새 displayId가 `002`가 되어 기존 `002`와 중복될 수 있음.
- 영향: 시공사 제출용 보고서에서 하자 ID가 중복되면 현장 커뮤니케이션과 보수 추적이 혼선됩니다.
- 권장 수정:
  1. `displayId` 생성은 “현재 count”가 아니라 동일 세션/날짜의 최대 suffix + 1로 계산합니다.
  2. defects store에 `[sessionId+displayId]` 인덱스를 추가하고, 애플리케이션 레벨에서 중복 방지 검증을 수행합니다.
  3. defect 생성과 ID 계산을 하나의 transaction 안으로 이동합니다.
- 검증 방법: 삭제 후 재등록, 빠른 연속 클릭, 체크리스트 분석과 직접 하자 동시 생성 시 중복 없음 확인.
- 상태: Open

### [P1] AI 분석 저장이 transaction으로 묶이지 않아 partial state 가능

- 영역: AI 분석, Dexie transaction
- 파일: `lib/repo/analysisRepo.ts`
- 증상: `analyzeChecklistItem()`은 defect 생성/수정 후 별도 함수 `saveAnalysisResult()`에서 analysis를 저장합니다. `analyzeDirectDefect()`도 defect update 후 analysis 저장을 별도로 수행합니다.
- 영향: analysis 저장이 실패하면 `DefectCandidate.status = ANALYZED`와 AI 필드가 반영되었지만 `analyses` 테이블에는 결과가 없는 불일치 상태가 생길 수 있습니다. 반대로 재시도 시 중복·이전 결과 혼재가 발생할 수 있습니다.
- 권장 수정:
  1. defect add/update와 analysis add를 동일 Dexie transaction에 묶습니다.
  2. transaction 대상 테이블은 `[db.defects, db.analyses]`를 명시합니다.
  3. 기존 analysis를 유지할 정책인지 최신 1개만 유지할 정책인지 명확히 하고 테스트를 추가합니다.
- 검증 방법: analysis add 실패를 강제로 mock하여 defect/analysis가 모두 rollback되는지 확인.
- 상태: Open

### [P1] `/api/analyze` 입력 검증과 timeout 정책 부족

- 영역: AI, security, privacy, reliability
- 파일: `app/api/analyze/route.ts`, `lib/ai/GeminiAnalyzer.ts`, `lib/ai/types.ts`
- 증상: Route Handler는 JSON parse, `photos.length > 0`, `areaName`만 검증합니다. 사진 개수 제한, base64 크기 제한, MIME type whitelist, 문자열 길이, `takenAtIso` 유효성, output runtime schema validation이 없습니다. 30초 이내 응답 요구도 explicit timeout으로 구현되지 않았고 `maxDuration=60`입니다.
- 영향: 대용량 base64 입력으로 서버 비용·메모리·응답 지연이 증가할 수 있고, Gemini 응답이 schema에서 벗어나면 클라이언트 DB에 불완전 데이터가 저장될 수 있습니다. 본 점검 현장에서는 긴 대기 또는 재시도 불가 UX로 이어질 수 있습니다.
- 권장 수정:
  1. 사진 수 최대값(예: 5장), 사진당 base64 최대 크기, 전체 요청 body 제한을 둡니다.
  2. MIME type은 `image/jpeg`, `image/png`, `image/webp` 등 허용 목록으로 제한합니다.
  3. `AbortSignal.timeout(30_000)` 또는 서버/클라이언트 양쪽 timeout을 도입합니다.
  4. Gemini 응답 JSON에 대해 runtime validator를 적용합니다.
  5. 에러 메시지는 사용자 친화 메시지와 내부 로그를 분리합니다.
- 검증 방법: 잘못된 MIME, 과대 base64, 빈/잘못된 schema 응답, 30초 초과 응답 테스트.
- 상태: Open

### [P1] 보고서 화면으로 가는 앱 내 접근 경로가 없음

- 영역: 보고서, UX, release gate
- 파일: `app/sessions/[sessionId]/SessionOverview.tsx`, `app/sessions/[sessionId]/report/ReportView.tsx`
- 증상: 보고서 페이지와 JSON export는 구현되어 있지만, 세션 개요의 CTA에는 `체크리스트 진행`, `하자 추가`, `AI 분석`만 있고 `/report` 링크가 없습니다. PR #2 diff에서도 기존 `보고서` 링크가 `AI 분석` 링크로 대체된 이력이 확인됩니다.
- 영향: 사용자가 URL을 직접 알지 못하면 D-2 시나리오 7의 “보고서 탭 → PDF 출력 → JSON 내보내기”를 수행하기 어렵습니다.
- 권장 수정:
  1. SessionOverview 하단 CTA 또는 분석 완료 화면에 `보고서` 버튼을 추가합니다.
  2. 전체 주요 화면에 최소한 `세션 개요 / 체크리스트 / 하자 / 분석 / 보고서` 탭 구조를 제공합니다.
- 검증 방법: 모바일에서 세션 생성 후 URL 직접 입력 없이 보고서 화면 도달, 인쇄 다이얼로그와 JSON 다운로드 확인.
- 상태: Open

### [P2] 체크리스트 메모 입력과 사진 메모 편집 플로우가 누락 또는 도달 불가

- 영역: 체크리스트, 사진 UX, AI context
- 파일: `app/sessions/[sessionId]/checklist/ChecklistView.tsx`, `PhotoGrid.tsx`, `PhotoThumbnail.tsx`, `PhotoEditorDialog.tsx`
- 증상: 체크리스트 항목에는 `userMemo` 필드가 있고 AI 분석도 `item.userMemo`를 전송하지만, UI에는 항목 메모 입력이 없습니다. 또한 `PhotoGrid`의 `editing` 상태는 `PhotoEditorDialog`를 열기 위해 존재하나 실제로 `setEditing(photo)`를 호출하는 경로가 없고, 썸네일 클릭은 `PhotoViewer`만 엽니다.
- 영향: D-2 시나리오 3의 “메모 입력” 단계가 수행되지 않으며, AI 분석에 사용자 설명이 빠질 수 있습니다. 사진별 메모/빠른 태그 기능도 사용자가 접근하기 어렵습니다.
- 권장 수정:
  1. 항목 카드에 `userMemo` textarea와 저장 함수를 추가합니다.
  2. 사진 썸네일에는 “보기”와 “편집” 액션을 분리하거나 viewer 내부에서 메모 편집을 지원합니다.
  3. AI 분석 시 항목 메모와 대표 사진 메모를 함께 전달합니다.
- 검증 방법: 메모 입력 후 새로고침 유지, AI 요청 payload에 memo 반영, 사진 메모 저장 후 그리드 badge 표시.
- 상태: Open

### [P2] `analyses` 테이블 세션 인덱스 부재와 전체 table scan

- 영역: 데이터 성능, 세션 격리
- 파일: `lib/db/db.ts`, `lib/repo/analysisRepo.ts`, `lib/repo/reportRepo.ts`
- 증상: `analyses` store는 `id, defectCandidateId, createdAt`만 인덱싱하며 `sessionId`가 없습니다. `loadAnalysisPageData()`와 `buildReportData()`는 `db.analyses.toArray()` 후 session defects와 매칭합니다.
- 영향: 데이터가 누적될수록 분석 화면과 보고서 화면 성능이 떨어집니다. 현재 로직은 defectId set으로 필터링하므로 세션 데이터 표시 누출 가능성은 낮지만, orphan analysis가 누적되면 scan 비용이 증가합니다.
- 권장 수정:
  1. `AiAnalysisResult`에 `sessionId`를 추가하거나 `[defectCandidateId+createdAt]` 인덱스를 활용한 `anyOf(defectIds)` 쿼리로 대체합니다.
  2. Dexie migration version을 올립니다.
- 검증 방법: 다중 세션·다중 분석 데이터에서 보고서/분석 페이지 성능과 데이터 격리 확인.
- 상태: Open

### [P2] 직접 하자 통계가 checklist-linked defects까지 포함

- 영역: 진행률, 대시보드 정확성
- 파일: `lib/repo/checklistRepo.ts`, `app/sessions/[sessionId]/SessionOverview.tsx`
- 증상: `computeSessionProgress()`는 `db.defects.where("sessionId")` 전체를 direct defects로 집계합니다. checklist-linked defect도 direct defect 총계와 긴급/높음 badge에 포함될 수 있습니다.
- 영향: 세션 개요에서 “직접 추가 하자 n건”이 실제 직접 등록 건수보다 크게 표시됩니다.
- 권장 수정: `directDefects = defects.filter((d) => !d.checklistItemId)`로 계산하거나 DB 인덱스를 분리합니다.
- 검증 방법: 체크리스트 AI 분석으로 defect 생성 후 직접 하자 통계가 증가하지 않는지 확인.
- 상태: Open

### [P2] 사진 삭제 후 체크리스트 상태/진행률 재계산 누락 가능

- 영역: 사진, 진행률
- 파일: `lib/repo/photoRepo.ts`, `PhotoViewer.tsx`, `PhotoEditorDialog.tsx`
- 증상: `addPhoto()`는 첫 사진 추가 시 `NOT_STARTED/PHOTO_REQUIRED → PHOTO_DONE`으로 자동 전이하지만, `deletePhoto()`는 사진 삭제 후 해당 checklist item의 사진 수를 확인해 상태를 되돌리지 않습니다.
- 영향: 사진을 모두 삭제해도 항목이 `PHOTO_DONE` 또는 완료 상태로 남아 진행률이 실제 증거 사진 상태와 불일치할 수 있습니다.
- 권장 수정: 사진 삭제 transaction에서 해당 item/defect의 남은 사진 수를 계산하고, 정책에 따라 상태를 `PHOTO_REQUIRED` 또는 `NOT_STARTED`로 되돌립니다.
- 검증 방법: 사진 1장 추가 → 상태 PHOTO_DONE → 사진 삭제 → 진행률/상태/AI 분석 가능 여부 확인.
- 상태: Open

### [P2] AI 사진 전송에 대한 사전 consent 흐름 부족

- 영역: privacy, UX
- 파일: `AnalysisView.tsx`, `ReportView.tsx`
- 증상: 보고서 면책 고지에는 “AI 분석 요청 시 사용자 동의 하에 압축본이 Gemini Vision API로 전송”된다고 되어 있으나, 실제 분석 버튼 클릭 전 별도 사전 고지/동의 UI는 확인되지 않습니다.
- 영향: 주거 공간 사진이라는 민감한 데이터가 외부 API로 전송된다는 사실이 사용자가 분석 전에 명확히 인지하지 못할 수 있습니다.
- 권장 수정: 최초 AI 분석 실행 전 모달 또는 체크박스로 “사진 압축본이 Google Gemini API로 전송됨”을 명시하고 세션 단위 동의 상태를 저장합니다.
- 검증 방법: 첫 분석 시 동의 모달 표시, 동의 전 API 호출 없음, 동의 후 재분석 가능.
- 상태: Open

### [P2] 자동 테스트 gap

- 영역: 테스트 전략, CI
- 파일: `__tests__/checklist.test.ts`, `__tests__/id.test.ts`, `__tests__/sessionProgress.test.ts`, `vitest.config.ts`
- 증상: 순수 로직 테스트는 존재하지만 다음 핵심 요구사항 테스트가 없습니다.
  - `CHECKLIST_SEED.length === 28`
  - 삭제 후 displayId 중복 방지
  - 직접 하자만 direct 통계에 포함
  - JSON export shape 검증
  - `/api/analyze` validation 유닛 테스트
  - defect 삭제 시 analyses cascade
- 영향: 현재 확인된 P1/P2 결함이 테스트로 방지되지 않습니다.
- 권장 수정: 브라우저 API가 아닌 순수 로직으로 분리 가능한 부분부터 테스트 추가. CI workflow에서 `npm test && npm run typecheck && npm run lint && npm run build` 실행.
- 상태: Open

### [P3] 이미지 품질 함수 내 dead/helper 코드 정리 필요

- 영역: lint/maintenance
- 파일: `lib/util/image.ts`
- 증상: `supportsImageBitmapResize()`는 선언되어 있으나 호출 경로가 확인되지 않습니다. `assessPhotoQuality()`의 `shortSide`는 placeholder로 보이며 마지막에 `void shortSide`로 unused warning만 억제합니다.
- 영향: 기능 영향은 낮지만 코드 신뢰성과 유지보수성이 낮아집니다.
- 권장 수정: 사용하지 않는 helper와 placeholder 변수를 제거하거나 실제 해상도 품질 평가에 반영합니다.
- 상태: Open

## 6. 양호한 점

- `getDB()`는 `typeof window === "undefined"` guard가 있어 서버 직접 호출 시 즉시 오류를 발생시킵니다.
- 주요 Dexie/useLiveQuery/브라우저 API 사용 컴포넌트에 `"use client"`가 선언되어 있습니다.
- `GEMINI_API_KEY`는 현재 확인된 import graph에서 `/api/analyze` → `lib/ai/index.ts` 서버 경로에만 사용됩니다.
- Service Worker는 `/api/*`를 캐시하지 않으므로 AI 응답 캐싱 위험은 낮습니다.
- 이미지 처리에는 EXIF orientation 파싱, Canvas fallback, `toBlob()` null reject, Object URL revoke 훅이 존재합니다.
- JSON export는 `session`, `progress`, `checklistItems`, `defects`, `analyses`를 포함하고, 사진 Blob을 제외하는 백업 형태로 구현되어 있습니다.
- 빈 체크리스트 출력 기능이 `ReportView`에 구현되어 있어 종이 백업 경로는 코드상 존재합니다.

## 7. Release Gate 체크리스트

### 자동 검증

| 항목 | 결과 | 비고 |
|---|---:|---|
| 대상 브랜치 존재 | 통과 | GitHub branch 검색으로 확인 |
| `git status --short` | 미수행 | 로컬 checkout 불가 |
| `npm test` | 미수행 | 로컬 checkout 불가 |
| `npm run typecheck` | 미수행 | 로컬 checkout 불가 |
| `npm run lint` | 미수행 | 로컬 checkout 불가 |
| `npm run build` | 직접 미수행 / Vercel 성공 | Vercel Preview status는 success이나 release gate 전체 대체 불가 |
| `npm run test:coverage` | 미수행 | 로컬 checkout 불가 |

### 실기기 검증

| 항목 | 결과 | 비고 |
|---|---:|---|
| iOS Safari/PWA 설치 | 미수행 | 물리 기기 필요 |
| Android Chrome/PWA 설치 | 미수행 | 물리 기기 필요 |
| EXIF 방향 정상 | 미수행 | 코드상 보정 로직 있음 |
| 오프라인 앱 재실행 | 미수행 | SW 코드상 가능성은 있으나 실기기 필요 |
| AI 분석 30초 이내 응답 | 미수행 | API key/실제 POST 필요 |
| PDF 출력 정상 | 미수행 | 보고서 접근 링크 누락 수정 후 검증 필요 |
| JSON export 정상 | 미수행 | 코드상 구현됨 |

### 운영 준비

| 항목 | 결과 | 비고 |
|---|---:|---|
| Vercel Preview 배포 | 부분 통과 | GitHub/Vercel status success 확인 |
| Vercel Production `GEMINI_API_KEY` | 미확인 | 대시보드 접근 필요 |
| Vercel Preview `GEMINI_API_KEY` | 미확인 | 대시보드 접근 필요 |
| Gemini 실제 API 응답 | 미수행 | API key 및 사진 POST 필요 |
| Google AI Studio 사용량/비용 | 미확인 | 대시보드 접근 필요 |
| JSON export 백업 | 미수행 | 실기기/브라우저 필요 |
| 종이 백업 출력 | 코드상 구현 / 실출력 미수행 | 보고서 접근 링크 필요 |

## 8. Hotfix 우선순위

### 즉시 수정 권장(P1)

1. `CHECKLIST_SEED`를 PRD/D-2 기준 28개로 맞추고 테스트 추가.
2. 직접 하자 사진 첨부 UI 추가 및 분석 가능화.
3. 직접 하자 목록/통계에서 checklist-linked defects 제외.
4. displayId 생성 로직을 max suffix + transaction + unique validation으로 변경.
5. AI 분석 defect update/add + analysis add를 동일 transaction으로 묶기.
6. `/api/analyze` 입력 validation, request size/MIME/count 제한, 30초 timeout, runtime schema validation 추가.
7. 세션 개요 또는 공통 네비게이션에 보고서 링크 복구.

### D-1 또는 본 점검 직전 보강(P2)

1. 체크리스트 item memo 입력 UI 추가.
2. 사진 메모/빠른 태그 편집 접근 경로 복구.
3. 사진 삭제 후 체크리스트 상태 재계산.
4. analyses 조회 최적화.
5. 최초 AI 분석 전 privacy/consent 모달.
6. JSON import는 시간이 허용되면 추가, 아니면 “export는 백업이지 복구 수단이 아니다”는 운영 runbook 명시.

## 9. 권장 재검증 순서

1. P1 hotfix 적용.
2. `npm test && npm run typecheck && npm run lint && npm run build` 실행.
3. Vercel Preview 재배포 확인.
4. Vercel Preview/Production에 `GEMINI_API_KEY` 존재 확인.
5. D-2 시나리오 1~8을 iOS Safari/PWA 및 Android Chrome/PWA에서 수행.
6. AI 분석은 사진 1장, 3장, 과대 입력, 오프라인, timeout 상황을 각각 검증.
7. PDF 인쇄 미리보기와 JSON export 파일 내용을 확인.
8. 본 점검 전 JSON export와 빈 체크리스트 출력본을 확보.

## 10. 최종 의견

현재 상태는 “Vercel Preview 빌드는 되는 프로토타입”에 가깝고, “현장 점검 당일 데이터 손실 없이 AI 분석과 보고서 제출까지 안정 수행”이라는 감사 목표에는 아직 미달합니다. 특히 직접 하자 플로우, 보고서 접근성, 하자 ID 무결성, AI 입력 검증은 점검 당일에 바로 장애 또는 혼선을 만들 수 있으므로 P1 hotfix 없이는 Go 판정을 권장하지 않습니다.
