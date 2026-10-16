# S1 스파이크 ③ — 하자체크 세션 목록 화면 Vite+React 이식 실측

- 대상: `app/sessions/page.tsx`(34줄) + `app/sessions/SessionsList.tsx`(118줄)
- 레포: `C:\Users\colds\haja-checker-ai` (읽기만, 수정·커밋·브랜치 0. 끝난 뒤 `git status`는 시작 때와 같음)
- 스파이크: `C:\Users\colds\haja-spikes\vite-port\`
- 시작 01:57:48 / 끝 02:09 경 → **총 약 11분**(상한 2시간의 1/10 미만)

## 판정: **됨** (조건 1개: `/api/analyze` 서버 라우트는 전체 앱 이식 때 따로 처리해야 함. 이번 화면과는 관계없음)

- `npx vite build` → **exit 0** (44 modules, 6~9초)
- `npx tsc --noEmit -p .` → **exit 0**
- 레포 원본 `SessionsList.tsx`는 **한 글자도 고치지 않고** `@/app/sessions/SessionsList`로 직접 import해 번들에 들어감(번들에서 "점검 세션 목록", "불러오는 중", "이 세션의 모든 데이터" 문자열 확인)
- `lib/` 21개 모듈 전부를 `@` 별칭으로 import하는 스모크 테스트에서 tsc exit 0, vite build exit 0

## 단계별 소요 (분)

| 단계 | 시각 | 소요 | 비고 |
|---|---|---|---|
| 사전 조사(대상 파일·lib·grep) | 01:57:48–01:58:37 | ~1 | |
| 골격 생성(package.json, index.html, vite/ts 설정 손으로 작성) | 01:59:06–01:59:09 | <1 | create-vite 미사용 |
| 의존성 설치 | 01:59:22–02:01:43 | ~2.5 | ERESOLVE 1회 재시도 포함 |
| 이식(라우터·shim·페이지 2개) | 02:02:03–02:04:42 | ~2.5 | 실제 작성은 ~0.5분. ~2분은 의미 없는 `python -` 스텁이 Bash에서 멈춰 타임아웃된 시간(작업 실수, 이식 난이도와 무관) |
| 빌드 통과 | 02:04:42–02:05:08 | ~0.5 | **첫 시도에 통과** |
| tsc 통과 | 02:06:03–02:06:42 | ~0.7 | 1회 수정(tsconfig paths) |
| 검증(dedupe 비교, lib 전체 스모크) | 02:06:42–02:08:39 | ~2 | |

※ 에이전트가 작업한 시간이다. 사람이 처음 하면 3~5배쯤 걸린다고 본다(**추정**).

## 막힌 것과 우회

| # | 증상 | 위치 | 우회 |
|---|---|---|---|
| 1 | `@vitejs/plugin-react@latest`(6.1.2)가 peer로 `vite@^8`을 요구해 Vite 7과 ERESOLVE | 스파이크 package.json | `@vitejs/plugin-react@^5`(5.2.0)로 고정 |
| 2 | **Dexie가 두 벌 번들됨**: 레포 `lib/db/db.ts:1`의 `import Dexie from "dexie"`가 레포 `node_modules`의 dexie 4.4.2를 잡고, 스파이크의 dexie-react-hooks는 dexie 4.4.6을 잡음. JS 405.79kB(gz 132.18) | `lib/db/db.ts:1` | `resolve.dedupe: ["dexie","dexie-react-hooks","react","react-dom"]` → 한 벌(4.4.6)만 남고 **299.04kB(gz 96.26)**. dedupe를 빼면 빌드는 통과하지만, Dexie 인스턴스가 둘이 되어 useLiveQuery 반응성이 깨질 위험이 있음. **이 설정은 필수** |
| 3 | `next/link`, `next/navigation` import | `app/sessions/SessionsList.tsx:4-5`, `app/sessions/page.tsx:1` | Vite `resolve.alias`(정규식 `^next/link$`, `^next/navigation$`)를 `src/shims/*`로 연결 → 원본 무수정. tsc 쪽은 `tsconfig.paths`에 같은 매핑을 추가(안 하면 `TS2307 Cannot find module 'next/link'`, `src/pages/*.tsx:1`) |
| 4 | `export const metadata`(서버 컴포넌트 전용) | `app/sessions/page.tsx:4-6` | page.tsx는 `src/pages/SessionsPage.tsx`로 복사해 metadata를 `document.title` effect로 바꿈(JSX는 동일) |
| 5 | `router.refresh()` | `app/sessions/SessionsList.tsx:72` | shim에서 no-op으로 처리. useLiveQuery가 반응형이라 기능 손실 없음 |
| — | `"use client"` 지시어 | `SessionsList.tsx:1`, lib 3개 파일 | **문제 없음**. 빌드 경고 0 |
| — | Tailwind 클래스가 레포 파일에 있음 | — | `src/index.css`에 `@source "../../../haja-checker-ai/app/sessions"` 한 줄 추가 |

### 전체 앱 이식 때 남는 조건(이번 화면 밖)
- `lib/repo/analysisRepo.ts:32`의 `fetch("/api/analyze")`가 서버 라우트 `app/api/analyze/route.ts`(66줄, `next/server`)에 의존한다. 정적 번들에는 서버가 없으므로 별도 서버리스 함수(Vercel Function 등)로 떼어내고 절대 URL과 CORS를 정해야 한다. **유일한 구조적 조건**
- `lib/ai/index.ts:15,20,22,35`는 `process.env`를 쓰는 서버 전용 코드다. 빌드는 통과하지만 클라이언트 번들에 넣으면 안 된다(서버 함수 쪽으로 옮겨야 함)
- `app/layout.tsx`의 metadata/viewport/manifest와 `components/SwRegister.tsx`는 index.html과 main.tsx로 옮겨야 한다(PWA, `public/sw.js`는 복사)

## Next 전용 API 사용 통계 (app + components + lib)

| 항목 | 수 |
|---|---|
| `grep -rlE "from \"next/(link\|navigation\|image\|router\|dynamic\|font)" app components \| wc -l` | **20개 파일** |
| `next/link` import | 17개 파일, `<Link` 호출 25회 |
| `next/navigation` import | 6개 파일. `useRouter()` 5회, `router.push` 5회, `router.refresh` 1회, `useParams` 6회. `useSearchParams`·`usePathname` 0회 |
| `next/image`·`router`·`dynamic`·`font` | 0 |
| `next/server` | 1개 파일(`app/api/analyze/route.ts`) |
| `from "next"`(타입 Metadata) | 1개 파일(layout) |
| metadata/viewport export | 5개 파일 |
| `notFound()`·`redirect()` | 0 |
| **lib/ 안 Next import** | **0** |
| 이식 대상 2파일 | page.tsx: next/link 1 import, `<Link` 2회 · SessionsList.tsx: next/link + next/navigation 2 import, `<Link` 2회, useRouter 1회, router.refresh 1회 |

«라우팅 변경 파일 수»: shim+alias 방식이면 **원본 수정 0개 파일**이다. shim 없이 직접 고치면 20개 파일. metadata 때문에 래퍼를 둬야 하는 page는 5개.

## 빌드 크기 (vite 7.3.7, dedupe 적용)

| 파일 | raw | gzip |
|---|---|---|
| index.html | 0.45 kB | 0.33 kB |
| CSS | 26.37 kB | 5.92 kB |
| **JS** | **299.04 kB** | **96.26 kB** |
| `du -sb dist` | **325,861 B** | |

(lib 21개 모듈을 전부 넣은 스모크 빌드는 JS 341.55kB, gz 109.58kB)

## 테스트 승계율

- 레포 `vitest.config.ts`: `environment: "node"`, `@` → 레포 루트 별칭. Next 플러그인 의존은 없다.
- `__tests__/*.test.ts` 7개 중 Next import가 있는 파일은 **0개**. import 대상은 vitest, `@/lib/{db/id, ai/MockAnalyzer, ai/types, ai/validation, seed/checklist, util/labels, domain/types}`뿐이다.
- **테스트 승계율 = 7/7 (100%)**. vitest 설정(별칭 한 줄)만 옮기면 그대로 돈다(판단 근거는 grep이며, 스파이크 폴더에서 실행하지는 않음).

## 전체 앱 이식 공수 (**추정**)

근거: 화면 10개(page.tsx 10, tsx 28개, 3,581줄). 이번 1화면은 에이전트 약 4분(설치 제외), 그중 라우터와 shim은 한 번만 만들면 됨.

| 작업 | 추정(사람+에이전트) |
|---|---|
| 라우트 테이블 확장(10개 경로, `useParams` shim이 sessionId·defectId 처리) | 1~2시간 |
| page.tsx 10개를 래퍼로 옮기기(metadata를 title로) | 1~2시간 (화면당 5~10분 × 10) |
| `/api/analyze`를 별도 서버리스 함수로 분리, URL·CORS·키 관리 | 2~4시간 ← 최대 변수 |
| layout, PWA(sw.js, manifest), 보안 헤더 이전 | 1~2시간 |
| 실기기(WebView) 수동 QA | 2~4시간 |
| **합계** | **약 1~1.5일 (추정)** |

승계율: lib 100%(21/21 모듈 무수정 import), 컴포넌트는 shim 방식이면 원본 거의 무수정, 테스트 100%.
