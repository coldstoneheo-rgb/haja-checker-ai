<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI 에이전트 작업 가이드

## 핵심 규칙 (절대 위반 금지)

1. **브랜치**: 모든 작업은 `claude/review-inspection-app-plan-RbozI` 브랜치에서 수행. `main`에 직접 푸시 금지.
2. **API 키 노출 금지**: `GEMINI_API_KEY`는 `app/api/` 서버 라우트 내부에서만 사용. 클라이언트 번들 포함 금지.
3. **IndexedDB는 브라우저 전용**: `lib/db/db.ts`의 `getDB()`는 `"use client"` 컴포넌트 또는 클라이언트 사이드 함수에서만 호출.
4. **테스트 통과 유지**: 코드 변경 후 반드시 `npm test && npm run typecheck` 실행. 실패 시 수정 후 커밋.

## 작업 시작 전 반드시 읽을 파일

- `lib/domain/types.ts` — 모든 타입 정의의 단일 출처
- `lib/db/db.ts` — Dexie 스키마 (7 테이블과 인덱스)
- `PRD.md` — 제품 요구사항 및 아키텍처 결정 사항

## 새 기능 추가 시 체크리스트

- [ ] `lib/domain/types.ts`에 새 타입을 먼저 정의했는가?
- [ ] DB 스키마 변경 시 `lib/db/db.ts`의 버전을 올렸는가?
- [ ] 클라이언트 전용 파일에 `"use client"` 디렉티브를 추가했는가?
- [ ] `lib/util/labels.ts`에 새 enum의 한국어 레이블을 추가했는가?
- [ ] 테스트 가능한 순수 로직은 `__tests__/`에 테스트를 작성했는가?

## 커밋 메시지 형식

```
feat(D-N): 짧은 한국어 설명

- 구체적 변경 사항 1
- 구체적 변경 사항 2

https://claude.ai/code/session_...
```

## 자주 실수하는 패턴

### ❌ 잘못된 예: 서버 컴포넌트에서 Dexie 사용
```typescript
// app/sessions/page.tsx (서버 컴포넌트)
import { getDB } from "@/lib/db/db"; // 빌드 실패
```

### ✅ 올바른 예: 클라이언트 컴포넌트에서 useLiveQuery 사용
```typescript
"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/db";
const sessions = useLiveQuery(() => getDB().sessions.toArray());
```

### ❌ 잘못된 예: 트랜잭션에서 테이블 누락
```typescript
// defects와 analyses 둘 다 쓰는데 하나만 명시 → 오류
db.transaction("rw", db.defects, async () => {
  await db.analyses.add(...); // 오류: analyses not in transaction
});
```

### ✅ 올바른 예: 6개 초과 테이블은 배열로
```typescript
db.transaction("rw", [db.defects, db.analyses], async () => {
  await db.defects.add(...);
  await db.analyses.add(...);
});
```

## 테스트 작성 원칙

- 브라우저 API(IndexedDB, Canvas, Blob, File, URL.createObjectURL 등)를 사용하는 코드는 테스트하지 않는다.
- 순수 함수와 결정론적 로직만 테스트한다.
- 테스트 파일은 `__tests__/` 디렉터리에 `.test.ts` 확장자로 작성한다.
- Vitest 환경: `node` (DOM 없음). `vi.mock()`으로 Dexie를 모킹하지 않는다.

## 환경별 동작 차이

| 환경 | AI 분석기 | IndexedDB | Service Worker |
|------|-----------|-----------|----------------|
| `npm run dev` + API 키 없음 | MockAnalyzer | 정상 | 미등록 |
| `npm run dev` + API 키 있음 | GeminiAnalyzer | 정상 | 미등록 |
| Vercel 프리뷰/프로덕션 | GeminiAnalyzer | 정상 | 등록됨 |
| `npm test` | MockAnalyzer (직접 import) | 사용 안 함 | 사용 안 함 |
