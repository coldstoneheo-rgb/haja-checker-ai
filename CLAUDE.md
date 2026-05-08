@AGENTS.md

# 하자체크 AI — Claude 개발 가이드

## 빠른 시작

```bash
npm ci           # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:3000)
npm test         # 단위 테스트 (Vitest, 45 tests)
npm run typecheck # TypeScript 타입 검사
npm run build    # 프로덕션 빌드
```

환경 변수: `.env.local`에 `GEMINI_API_KEY=...` 설정. 없으면 MockAnalyzer 자동 사용.

---

## 프로젝트 구조

```
app/                        Next.js App Router 페이지
  layout.tsx                루트 레이아웃 + SwRegister
  page.tsx                  홈 → /sessions 리다이렉트
  sessions/
    page.tsx                세션 목록
    new/                    새 세션 생성
    [sessionId]/
      page.tsx              세션 대시보드 (진행률)
      checklist/            체크리스트 영역별 점검
      defects/              직접 하자 등록·목록
      analysis/             AI 분석 실행·결과 편집
      report/               보고서 미리보기·출력·JSON export
  api/
    analyze/route.ts        Gemini API 서버 라우트 (maxDuration=60)

components/
  SwRegister.tsx            Service Worker 등록 (5분마다 update 폴링)
  PhotoGuide.tsx            3종 사진 가이드 (compact prop)

lib/
  domain/types.ts           도메인 타입 정의 (모든 interface/type)
  db/
    db.ts                   Dexie DB 정의 (7 테이블)
    id.ts                   ID 생성: newId(), newDefectDisplayId()
  ai/
    types.ts                AiAnalyzer 인터페이스 + AiAnalyzeInput/Payload
    GeminiAnalyzer.ts       프로덕션 Gemini Vision 분석기
    MockAnalyzer.ts         오프라인/테스트용 결정론적 분석기
    index.ts                createAnalyzer() — 서버 사이드 팩토리
    prompts.ts              Gemini 프롬프트 템플릿
  repo/
    sessionRepo.ts          세션 CRUD
    checklistRepo.ts        체크리스트 항목 CRUD + computeSessionProgress()
    photoRepo.ts            사진 저장·조회 + qualityScore 계산
    defectRepo.ts           하자 후보 CRUD
    analysisRepo.ts         AI 분석 실행 오케스트레이션 (클라이언트 사이드)
    reportRepo.ts           보고서 데이터 집계 + JSON export
  seed/
    checklist.ts            기본 28개 점검 항목 데이터 (CHECKLIST_SEED)
    prep.ts                 세션 생성 시 seed 삽입 로직
    quickTags.ts            사진 빠른 태그 목록
  util/
    image.ts                Canvas 이미지 처리: 다운스케일, 썸네일, EXIF 방향 보정, 품질 평가
    labels.ts               한국어 레이블/색상 맵 (모든 enum)

__tests__/                  Vitest 단위 테스트 (node 환경)
  id.test.ts
  MockAnalyzer.test.ts
  labels.test.ts
  sessionProgress.test.ts
  checklist.test.ts

public/
  sw.js                     Service Worker (Cache-First + Network-First)
  manifest.webmanifest      PWA 매니페스트
  icons/                    앱 아이콘

PRD.md                      제품 요구사항 문서
vercel.json                 Vercel 배포 설정 (icn1 리전, 보안 헤더)
```

---

## 핵심 패턴

### 1. Dexie + useLiveQuery

```typescript
// 읽기: useLiveQuery로 반응형 (refresh 없이 실시간 업데이트)
import { useLiveQuery } from "dexie-react-hooks";
const items = useLiveQuery(() =>
  db.checklistItems.where("sessionId").equals(id).toArray()
);

// 쓰기: 일반 async function (트랜잭션 필요 시 db.transaction 사용)
await db.checklistItems.update(itemId, { status, updatedAt: Date.now() });
```

### 2. 파일 경로 별칭

```typescript
import { getDB } from "@/lib/db/db";   // @ = 프로젝트 루트
import type { ChecklistItem } from "@/lib/domain/types";
```

### 3. 서버 전용 코드

`lib/ai/index.ts`의 `createAnalyzer()`와 `app/api/analyze/route.ts`만 서버에서 실행된다. API 키는 절대 클라이언트 번들에 노출되지 않는다. `"use client"` 없는 파일이 서버 컴포넌트이므로 Dexie(브라우저 전용)를 임포트하면 안 된다.

### 4. 이미지 처리

`lib/util/image.ts`의 `downscaleImage()`는:
1. EXIF orientation을 직접 파싱 (DataView, iOS Safari 필수)
2. Canvas로 올바른 방향으로 드로잉
3. JPEG 0.85, 1024px 이하로 인코딩

### 5. 하자 ID 형식

```
D-20250511-001   (D-YYYYMMDD-NNN)
```

`newDefectDisplayId(sequence, date)` — 순번은 세션 내 기존 하자 수 + 1.

---

## 데이터 흐름

```
사용자 촬영
  → downscaleImage() [lib/util/image.ts]
  → photoRepo.addPhoto() [IndexedDB 저장]
  → analysisRepo.analyzeChecklistItem() [클라이언트]
    → POST /api/analyze [서버]
      → GeminiAnalyzer.analyze()
      → AiAnalysisPayload 반환
    → DefectCandidate 생성/업데이트
    → AiAnalysisResult IndexedDB 저장
  → useLiveQuery → UI 자동 갱신
```

---

## 테스트 전략

브라우저 API(IndexedDB, Canvas, Blob)가 필요한 코드는 단위 테스트에서 제외하고 수동 검증에 의존한다. 테스트 가능한 순수 로직만 `__tests__/`에 작성한다:

- `lib/db/id.ts` — 순수 함수
- `lib/ai/MockAnalyzer.ts` — 브라우저 API 없음
- `lib/util/labels.ts` — 상수 맵
- `lib/repo/checklistRepo.ts` 진행률 로직 — 분리된 순수 계산
- `lib/seed/checklist.ts` — 데이터 무결성

---

## 배포

- Vercel 자동 배포: `main` 브랜치 push → 자동 빌드
- 환경 변수: Vercel 대시보드에 `GEMINI_API_KEY` 설정
- 리전: `icn1` (서울) — Gemini API 레이턴시 최소화
- `/sw.js`는 `Cache-Control: no-cache`로 서빙 (항상 최신 SW 설치)

---

## 주의사항

- `"use client"` 디렉티브: Dexie, useLiveQuery, window/document 사용 파일에 필수
- Dexie 트랜잭션: 6개 초과 테이블은 배열로 전달 `db.transaction("rw", [t1, t2, ...], fn)`
- React 19 set-state-in-effect: effect에서 state 직접 설정 금지 → useMemo + cleanup 패턴 사용
- Canvas toBlob: iOS Safari에서 null 반환 가능 → reject 처리 필수
