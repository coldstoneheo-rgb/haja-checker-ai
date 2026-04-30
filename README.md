# 하자체크 AI

신축 아파트 사전점검 현장에서 사진 증거를 빠짐없이 수집하고, 사진·메모·위치를
기반으로 하자 의심 여부, 위험도, 보수 난이도, 시공자 요청 문구를 자동 정리해
PDF 보고서로 제공하는 PWA.

> AI 보조 분석 결과이며, 최종 하자 여부는 시공자·전문가 확인이 필요합니다.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Dexie (IndexedDB) — 오프라인 우선 저장소
- PWA manifest + (이후) Service Worker
- 배포: Vercel
- AI 분석: Google Gemini Vision API (`gemini-3-flash-preview`, D-7 연동)

## Development schedule (5/11 점검 기준)

| Day | Date | Focus |
| --- | --- | --- |
| D-11 | 4/30 | 프로젝트 셋업 · Dexie 스키마 · PWA 매니페스트 |
| D-10 | 5/1  | 세션 · 체크리스트 · 사전 준비물/동선 화면 |
| D-9  | 5/2  | 카메라 + IndexedDB 사진 저장 + 메모 + 빠른 태그 |
| D-8  | 5/3  | 직접 하자 추가 · 진행률 · 하자 ID 자동 생성 |
| D-7  | 5/4  | Claude Vision API + 위험도 7요소 산정 + 결과 편집 |
| D-6  | 5/5  | PDF 보고서 (8섹션) + JSON export 백업 |
| D-5  | 5/6  | Service Worker 오프라인 + 사진 3종 가이드 |
| D-4  | 5/7  | 권한 · 에러 · 사진 품질 경고 |
| D-3  | 5/8  | 핵심 로직 단위 테스트 + iOS Safari 호환성 |
| D-2  | 5/9  | 1차 실기기 모의 점검 |
| D-1  | 5/10 | 피드백 hotfix · 종이 백업 PDF |
| D-Day | 5/11 | 실제 점검 수행 |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint
npm run build        # 프로덕션 빌드
```

Node `>=20` (`.nvmrc`로 22 고정).

## Deploy to Vercel

1. GitHub 저장소에서 Vercel **Add New Project → Import**.
2. Framework Preset이 **Next.js**로 자동 감지되고 `vercel.json`이 적용된다.
   - Region: `icn1` (서울)
   - Build: `npm run build` · Install: `npm ci` · Output: `.next`
3. Environment Variables 등록 (D-7 AI 연동 시점부터 필수):
   - `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)에서 발급. 실제 사용자 사진을 다루므로 **유료(빌링 활성화) 사용 권장**. 무료 티어는 입력이 학습에 활용될 수 있음.
   - `GEMINI_VISION_MODEL` — 기본 `gemini-3-flash-preview` (선택)
   - `AI_ANALYZER` — `gemini`(기본) 또는 `mock`(오프라인 데모용, 선택)
4. Deploy. 첫 배포 후 PWA 설치는 모바일 브라우저에서 "홈 화면에 추가".

> 카메라/위치 권한이 PWA에서 동작하도록 `Permissions-Policy` 헤더를 vercel.json에
> 설정해 두었다.

## Project layout

```
app/                 Next.js App Router 페이지
  page.tsx           홈
  sessions/          세션 생성/목록/상세/체크리스트/분석/보고서
components/          공용 UI 컴포넌트
lib/
  domain/types.ts    도메인 타입 (Session, ChecklistItem, EvidencePhoto, ...)
  db/db.ts           Dexie 스키마 (IndexedDB)
  db/id.ts           ID 생성 헬퍼 (UUID, 하자 표시 ID)
  seed/checklist.ts  국토교통부 표준점검표 기반 기본 체크리스트
  ai/                AI 분석 추상화 (AiAnalyzer 인터페이스, Gemini/Mock 구현)
public/
  manifest.webmanifest
  icons/             PWA 아이콘
```

## Notes

- 사진 원본은 IndexedDB(`photos.blob`)에 저장합니다. 외부로 전송할 때는 사용자
  동의 후 압축본만 전송합니다.
- AI 결과는 항상 "하자 의심" 표현을 사용하며, 확정 판정 표현은 사용하지
  않습니다.
- 네트워크 없이도 점검 세션 생성·체크·촬영·저장이 가능해야 합니다.
