# 품질 감사 후속 개선 계획 (D-Day 5/11 대비)

**작성일**: 2026-05-08  
**기준 문서**: `docs/quality_audit_code_review_report.md` (GPT 감사)  
**작성자**: Opus 4.7 (설계) / 실행: Sonnet 4.6  
**남은 시간**: D-3일 (5/8 → 5/11)

---

## 0. 감사 결과 요약 및 코드 cross-check

GPT가 보고한 P1 7건, P2 6건, P3 1건 중 **현재 코드 기준 실재 확인** 결과:

| ID | 항목 | 실재 | 비고 |
|----|------|------|------|
| P1-1 | CHECKLIST_SEED 27개 (28 기준 불일치) | ✅ | 27 confirmed |
| P1-2 | 직접 하자 사진 첨부 UI 없음 | ✅ | NewDefectForm에 사진 입력 없음 |
| P1-3 | 직접 하자 목록에 체크리스트 연동 하자 표시 | ✅ | DefectsList 필터 없음 |
| P1-4 | displayId `count + 1` 중복 가능 | ✅ | 삭제 후 재생성 시 충돌 |
| P1-5 | AI 분석 partial state 가능 | ✅ | defect update + analysis add 분리 |
| P1-6 | /api/analyze 입력 검증 부족 | ✅ | photos > 0 + areaName만 검증 |
| P1-7 | 보고서 화면 접근 경로 없음 | ✅ | SessionOverview에 /report 링크 없음 |
| P2-1 | 체크리스트 메모 입력 UI 부재 | ✅ | userMemo 필드만 있고 textarea 없음 |
| P2-2 | 사진 편집 dialog 도달 불가 | ✅ | **D-1에서 내가 도입한 regression** |
| P2-3 | 사진 삭제 후 상태 재계산 안 함 | ✅ | deletePhoto는 단순 delete |
| P2-4 | analyses sessionId 인덱스 부재 | ✅ | toArray() scan |
| P2-5 | 직접 하자 통계에 checklist-linked 포함 | ✅ | computeSessionProgress에 필터 없음 |
| P2-6 | AI consent 모달 없음 | ✅ | 분석 전 동의 흐름 없음 |
| P2-7 | 자동 테스트 갭 | ✅ | 28 length, displayId 등 미커버 |
| P3-1 | image.ts dead code | ✅ | **D-1에서 내가 도입** |

→ **15건 모두 실재**. 감사 보고서가 정확합니다.

---

## 1. 우선순위 분류 기준

남은 일정 3일 + 본 점검 1일 = 4일. 모든 항목을 다 잡지 말고 **점검 당일 기능 차단/데이터 손실 위험**을 기준으로 분류합니다.

| 등급 | 정의 |
|------|------|
| **🔴 A** | 점검 당일 핵심 기능 차단 → 반드시 수정 |
| **🟠 B** | 데이터 무결성/보안 위험 → 강력 권장 수정 |
| **🟡 C** | UX/완성도 → 시간 허용 시 수정 |
| **⚪ Defer** | 본 점검 후 처리 (DB migration, JSON import 등) |

---

## 2. Phase A — 점검 당일 차단 이슈 (🔴 반드시 수정, 약 4–5h)

### A1. 직접 하자 사진 첨부 UI [P1-2]
**문제**: D-2 시나리오 4 ("직접 하자 등록 후 사진 2장 + AI 분석") 통과 불가.

**설계**:
1. `app/sessions/[sessionId]/defects/[defectId]/page.tsx` 신규 생성 (직접 하자 상세 화면)
2. 상세 화면에 `PhotoCaptureButton` (defectCandidateId 사용) + `PhotoGrid` 변형 (defectCandidateId 기반 조회)
3. `NewDefectForm` 저장 후 `router.push(/sessions/{id}/defects/{defectId})`로 이동 (저장 → 사진 → 분석 흐름)
4. `DefectsList`의 카드 탭 시 상세 화면으로 이동
5. `listPhotosForItem` 옆에 `listPhotosForDefect(defectCandidateId)` 추가 (photoRepo)

**파일**:
- 신규: `app/sessions/[sessionId]/defects/[defectId]/page.tsx`, `app/sessions/[sessionId]/defects/[defectId]/DefectDetailView.tsx`
- 수정: `app/sessions/[sessionId]/defects/new/NewDefectForm.tsx` (저장 후 redirect), `lib/repo/photoRepo.ts` (listPhotosForDefect)

### A2. 보고서 접근 경로 복구 [P1-7]
**문제**: 사용자가 URL 직접 입력 없이 보고서 도달 불가.

**설계**:
1. `SessionOverview.tsx`의 CTA 영역에 "보고서" 링크 카드 추가 (체크리스트/하자/AI 분석과 동등 위치)
2. `AnalysisView` 분석 완료 후 화면 하단에 "보고서로 이동 →" CTA 추가

**파일**: `SessionOverview.tsx`, `AnalysisView.tsx`

### A3. 직접 하자 목록 / 통계 분리 [P1-3 + P2-5]
**문제**: 체크리스트 분석으로 생성된 하자가 "직접 추가 하자" 목록에 섞여 통계도 부풀려짐. 사용자가 잘못 삭제 시 데이터 손상.

**설계**:
1. `DefectsList` 쿼리: `.filter((d) => !d.checklistItemId)` 적용
2. `computeSessionProgress`: `directDefects` 변수를 `directOnly = defects.filter(d => !d.checklistItemId)`로 교체 후 카운트
3. 테스트 추가: sessionProgress.test.ts에 mixed defects 케이스 추가

**파일**: `DefectsList.tsx`, `lib/repo/checklistRepo.ts`, `__tests__/sessionProgress.test.ts`

### A4. displayId 중복 방지 [P1-4]
**문제**: 삭제→재생성 시 ID 충돌. 시공사 제출 시 혼선.

**설계**:
1. `newDefectDisplayId`는 그대로. ID **계산 로직**을 변경:
   ```ts
   const existing = await db.defects.where("sessionId").equals(sessionId).toArray();
   const todayPrefix = `D-${yyyymmdd}-`;
   const maxSuffix = existing
     .map(d => d.displayId)
     .filter(id => id.startsWith(todayPrefix))
     .map(id => parseInt(id.slice(todayPrefix.length), 10))
     .reduce((a, b) => Math.max(a, b), 0);
   const next = maxSuffix + 1;
   ```
2. `addDefect` (직접 하자) + `analyzeChecklistItem`의 defect 생성 부분 모두 수정
3. ID 계산을 defect insert와 같은 transaction에 포함
4. 테스트 추가: `__tests__/defectId.test.ts` — count 방식 vs maxSuffix 방식 차이 케이스

**파일**: `lib/repo/defectRepo.ts`, `lib/repo/analysisRepo.ts`, `__tests__/defectId.test.ts` (신규)

### A5. 사진 편집 dialog 복구 [P2-2 — D-1 regression]
**문제**: D-1에서 PhotoViewer 도입 시 PhotoEditorDialog로 가는 경로 끊김. 메모 입력 불가.

**설계**:
1. `PhotoViewer` 내부에 메모 영역 추가:
   - 기본 모드: 메모 표시 (기존)
   - 탭하면 textarea + "저장" 버튼 (인라인 편집)
   - quickTags도 같은 영역에서 토글
2. `updatePhoto`로 즉시 저장
3. `PhotoEditorDialog` 컴포넌트 자체는 deprecate 또는 삭제

**파일**: `PhotoViewer.tsx` 확장, `PhotoGrid.tsx` (setEditing 제거)

---

## 3. Phase B — 안정성/보안 보강 (🟠 권장 수정, 약 3–4h)

### B1. AI 분석 transaction 통일 [P1-5]
**설계**: 
- `analyzeChecklistItem`: defect.add/update + analysis.add를 `db.transaction("rw", [db.defects, db.analyses], ...)` 안으로 통일
- `analyzeDirectDefect`: 동일
- 분석 결과 정책: 1 defect = 최신 1 analysis만 유지 (기존 analysis는 삭제 후 추가)

**파일**: `lib/repo/analysisRepo.ts`

### B2. /api/analyze 입력 검증 + 30s timeout [P1-6]
**설계**:
1. Route Handler에 검증 추가:
   - `photos.length` ≤ 5
   - 각 photo `base64.length` ≤ ~13.4M (10MB raw)
   - `mimeType ∈ ["image/jpeg", "image/png", "image/webp"]`
   - 문자열 필드 길이 제한 (areaName ≤ 100, userMemo ≤ 1000 등)
2. `AbortSignal.timeout(30_000)` 도입 (request.signal과 합쳐서 사용)
3. Gemini 응답 runtime 검증: 필드 존재 + 타입 + enum 값 (DefectType, RiskLevel)
4. 검증 실패 시 400, timeout 시 504, schema 어긋나면 502 반환

**파일**: `app/api/analyze/route.ts`, `lib/ai/types.ts` (validator 함수), `__tests__/analyzeRoute.test.ts` (신규)

### B3. 사진 삭제 후 상태 재계산 [P2-3]
**설계**:
- `deletePhoto(photoId)`를 transaction 안에서:
  1. photo 조회 (sessionId, checklistItemId)
  2. 같은 checklistItemId의 photos count 확인
  3. count === 0 && item.status === "PHOTO_DONE"이면 → "PHOTO_REQUIRED"로 되돌림
  4. checklistItemId 없는 (직접 하자) 경우 — defect도 동일 처리 검토
- 트랜잭션 테이블: `[db.photos, db.checklistItems]`

**파일**: `lib/repo/photoRepo.ts`

### B4. 체크리스트 항목 메모 UI [P2-1]
**설계**:
- `ChecklistRow`에 expand 가능한 메모 textarea 추가 (기본 collapsed, "메모 추가/편집" 버튼 클릭 시 펼침)
- 저장은 onBlur 또는 명시적 "저장" 버튼
- `setChecklistItemMemo(itemId, memo)` 함수 추가 (checklistRepo.ts)
- AI 분석 시 이미 `item.userMemo`를 전달 중 → 추가 작업 불필요

**파일**: `ChecklistView.tsx` 또는 `ChecklistRow` 컴포넌트, `lib/repo/checklistRepo.ts`

---

## 4. Phase C — 폴리시/완성도 (🟡 시간 허용 시, 약 2h)

### C1. CHECKLIST_SEED 28개로 정렬 [P1-1]
**설계**: "기타" 영역에 1항목 추가 — `세대 입구 우편함·디지털 도어록 보조 장치` 또는 `현관 도어록 배터리·키 동작`. CLAUDE.md/PRD/D-2 시나리오는 28 기준이므로 **28에 맞춤**.
- 테스트: `expect(CHECKLIST_SEED).toHaveLength(28)` + `expect(seed.area === "기타").length).toBeGreaterThan(0)` 추가

**파일**: `lib/seed/checklist.ts`, `__tests__/checklist.test.ts`

### C2. AI consent 모달 [P2-6]
**설계**:
- 첫 분석 실행 전 모달: "사진 압축본이 Google Gemini API로 전송되어 분석에 사용됩니다. 사진은 Google에 의해 학습 데이터로 사용되지 않습니다 (개인정보 보호 정책 안내)."
- 동의 후 `localStorage.setItem("haja:ai-consent", "1")`
- 다음부터는 모달 없이 분석 실행

**파일**: `AnalysisView.tsx`, `components/AiConsentDialog.tsx` (신규)

### C3. 테스트 보강 [P2-7]
**설계**:
- 28 length 테스트 (C1과 동시)
- displayId 중복 방지 테스트 (A4와 동시) 
- direct vs linked filter 테스트 (A3와 동시)
- /api/analyze validator 테스트 (B2와 동시)
- 각 Phase 작업과 함께 자연스럽게 추가

→ 별도 phase가 아닌 각 작업 시 동시 추가

### C4. image.ts dead code 정리 [P3-1]
**설계**: 
- `supportsImageBitmapResize()` 함수 제거 (호출 안됨)
- `assessPhotoQuality`의 `shortSide` placeholder 제거
- `void shortSide` 제거

**파일**: `lib/util/image.ts`

---

## 5. Defer (본 점검 후로 미룸)

| 항목 | 사유 |
|------|------|
| P2-4 analyses sessionId 인덱스 | Dexie schema migration 필요. 기존 사용자 데이터 보전 필요. 본 점검 시 데이터 양으로는 성능 무관. |
| JSON import | 기능 추가 작업량 큼. 5/11 시점 사용자가 1명 1기기이므로 export만으로 백업 충분. |
| 다크모드 / 우선순위 필터 / AI 일괄 분석 | 모의점검 결과 명시 요구 없음. |

---

## 6. 작업 순서 및 예상 시간

| Phase | 작업 | 예상 시간 | 누적 |
|-------|------|-----------|------|
| **A** (🔴) | A1 직접 하자 사진 UI | 90m | 1.5h |
| | A2 보고서 접근 경로 | 20m | 1.8h |
| | A3 직접/연동 분리 + 테스트 | 30m | 2.3h |
| | A4 displayId 수정 + 테스트 | 60m | 3.3h |
| | A5 사진 편집 복구 | 60m | 4.3h |
| **B** (🟠) | B1 AI transaction | 30m | 4.8h |
| | B2 API validation + timeout + 테스트 | 90m | 6.3h |
| | B3 사진 삭제 후 상태 재계산 | 30m | 6.8h |
| | B4 체크리스트 메모 UI | 45m | 7.5h |
| **C** (🟡) | C1 28개 정렬 + 테스트 | 15m | 7.8h |
| | C2 AI consent 모달 | 45m | 8.5h |
| | C4 dead code 정리 | 10m | 8.7h |

**총 예상**: 8–9시간. Sonnet 4.6 작업으로 1세션 내 완료 가능.  
**커밋 단위**: Phase별 1커밋 (A, B, C) — 작업 추적과 rollback 용이성 확보.

---

## 7. 검증 체크리스트

각 Phase 종료 시:
- [ ] `npm test` 통과
- [ ] `npm run typecheck` 통과
- [ ] 기존 통과 테스트 회귀 없음

전체 종료 시:
- [ ] D-2 시나리오 4 (직접 하자 + AI) 가능 확인
- [ ] D-2 시나리오 7 (보고서 출력) 접근 경로 확인
- [ ] displayId 중복 방지 단위 테스트 추가
- [ ] /api/analyze 검증 단위 테스트 추가
- [ ] Vercel Preview 재배포 후 실기기 재검증 (사용자)

---

## 8. 사용자 결정 필요

다음 중 진행 방향을 선택해 주세요:

**Option 1**: Phase A + B + C 전체 진행 (8–9h, 권장)
**Option 2**: Phase A + B만 진행 (~7h, 점검 차단 + 보안만)
**Option 3**: Phase A만 진행 (~4h, 점검 차단만, 시간 부족 시)
**Option 4**: 일부 Phase에서 특정 항목 제외 (사용자 지정)

또한 다음 사항도 확인 부탁드립니다:
- C1 28번째 항목 추가 시 "기타" 영역에 어떤 항목을 추가할지 (제안: "세대 입구 우편함·디지털 도어록 보조 장치")
- A1 직접 하자 사진 UI: 신규 detail page 방식 vs 기존 NewDefectForm 안에서 첨부 방식 중 선호
