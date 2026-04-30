# 하자체크 AI — Product Requirements Document

**버전**: 1.0  
**작성일**: 2026-04-30  
**상태**: 개발 완료 (D-3 기준)

---

## 1. 개요

### 제품 한 줄 정의
신축 아파트 입주 전 하자 점검을 스마트폰으로 체계적으로 수행하고, AI가 사진을 분석해 하자 보고서를 자동 생성하는 PWA.

### 배경과 문제 정의
신축 아파트 입주 전 하자 점검은 법적 권리이지만, 일반 입주민은:
- 무엇을 봐야 할지 모른다 (점검 항목 부재)
- 사진을 찍었어도 어떤 하자인지 판단하기 어렵다
- 시공사와 소통할 공식 증거 자료를 준비하기 어렵다

기존 해결책(전문 하자 점검 업체)은 비용이 크고 일정 조율이 어렵다.

### 목표 사용자
- 신축 아파트 입주 예정자 (기술 숙련도: 스마트폰 기본 사용 수준)
- 1인 또는 가족 단위로 자체 점검을 진행하는 사람
- 점검 결과를 시공사·관리사무소에 제출할 예정인 사람

---

## 2. 핵심 요구사항

### 2.1 기능 요구사항

#### F-1: 점검 세션 관리
- 단지명, 동·호수, 점검일, 입주자 정보를 입력해 세션을 생성한다
- 여러 세션을 독립적으로 저장·열람할 수 있다
- 세션 상태: DRAFT → IN_PROGRESS → ANALYZING → REPORT_READY → ARCHIVED

#### F-2: 체크리스트 기반 점검
- 12개 영역(현관·거실·주방·욕실 2개·침실 2개·안방·발코니·다용도실·전기통신·기타), 28개 기본 항목을 제공한다
- 항목별 점검 상태를 단계별로 기록한다: 미점검 → 사진완료 → 양호/의심/하자/확인불가
- 사용자가 항목을 직접 추가할 수 있다

#### F-3: 사진 촬영 및 관리
- 카메라 촬영 또는 갤러리 업로드를 지원한다
- 촬영 가이드(① 전체 위치 ② 부위 포함 ③ 클로즈업) 3종을 항목마다 제공한다
- 사진을 1024px JPEG 0.85로 자동 리사이즈해 IndexedDB에 저장한다
- 256px 썸네일을 별도 생성해 목록에서 빠르게 표시한다
- 밝기(Rec.709 기준) 및 해상도 기반 품질 평가(0–1 점수)를 제공한다
- iOS Safari EXIF orientation을 읽어 Canvas에서 올바른 방향으로 저장한다

#### F-4: AI 하자 분석
- 점검 항목 사진 + 메모를 Gemini Vision API에 전송해 분석한다
- 분석 결과: 하자 유형(21종), 위험도(LOW/MEDIUM/HIGH/URGENT), 수리 난이도(5단계), 신뢰도, 추가 촬영 권고, 시공사 요청 문구
- 사용자가 AI 분석 결과를 편집·확정할 수 있다
- 네트워크 없는 개발/테스트 환경에서는 MockAnalyzer로 대체한다

#### F-5: 직접 하자 등록
- 체크리스트 항목과 무관하게 발견한 하자를 직접 등록한다
- 하자 ID는 D-YYYYMMDD-NNN 형식으로 자동 부여된다
- AI 분석을 직접 하자에도 동일하게 적용할 수 있다

#### F-6: 보고서 생성
- 세션 전체 진행률, 하자 목록, 분석 결과를 종합한 인쇄용 보고서를 생성한다
- `window.print()` 기반 PDF 출력 — 한국어 폰트 처리가 브라우저에 위임된다
- 원시 데이터 JSON export 기능을 제공해 백업 및 외부 활용을 지원한다

#### F-7: 오프라인 지원 (PWA)
- Service Worker로 정적 자산과 페이지 HTML을 캐싱한다
- 오프라인 상태에서도 점검 데이터 열람 및 신규 항목 기록이 가능하다
- AI 분석과 네트워크 요청은 오프라인에서 자동 차단되고 안내 메시지를 표시한다
- manifest.webmanifest로 홈 화면 추가(A2HS)를 지원한다

### 2.2 비기능 요구사항

| 항목 | 요건 |
|------|------|
| 플랫폼 | iOS 16+ Safari, Android 11+ Chrome |
| 응답 속도 | 페이지 전환 < 500ms (캐시 히트 기준) |
| AI 분석 시간 | < 30초 (Gemini API 기준) |
| 저장소 | IndexedDB, 기기당 최대 ~500MB (브라우저 제한) |
| 보안 | Gemini API 키는 서버 사이드에서만 사용, 클라이언트 미노출 |
| 비용 | Gemini gemini-3.1-flash-lite-preview: ~$0.25/M 입력토큰 → 점검 1회당 약 $0.17 |
| 접근성 | 한국어 전용 UI |

---

## 3. 기술 아키텍처

### 3.1 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| 언어 | TypeScript 5 (strict) |
| 로컬 DB | Dexie 4 (IndexedDB wrapper) |
| 반응형 UI | useLiveQuery (dexie-react-hooks) |
| AI | Google Gemini Vision API (gemini-3.1-flash-lite-preview) |
| 테스트 | Vitest 4 |
| 배포 | Vercel (icn1 리전) |

### 3.2 데이터 모델 (IndexedDB 7 테이블)

```
sessions          — 점검 세션 (1개 생성 후 재사용)
areas             — 점검 영역 (현관·거실 등 12개)
checklistItems    — 체크리스트 항목 (28개 기본 + 사용자 추가)
photos            — 증거 사진 (Blob + 썸네일 + 메타데이터)
defects           — 하자 후보 (체크리스트 연결 또는 직접 등록)
analyses          — AI 분석 결과 (defect와 1:N 관계)
reports           — 내보낸 보고서 Blob (현재 JSON만)
```

### 3.3 AI 분석 흐름

```
클라이언트                    서버 (Next.js Route)        Gemini API
   │                               │                         │
   ├─ analyzeChecklistItem()        │                         │
   │   ├─ 사진 → base64 변환         │                         │
   │   └─ POST /api/analyze ────────►                         │
   │                               ├─ createAnalyzer()        │
   │                               │   (GeminiAnalyzer)       │
   │                               └─ analyzer.analyze() ─────►
   │                                                          │
   │◄─────────────────── AiAnalysisPayload ───────────────────┤
   │                                                          │
   ├─ DefectCandidate 생성/업데이트                            │
   └─ AiAnalysisResult IndexedDB 저장
```

### 3.4 Service Worker 캐시 전략

| 요청 경로 | 전략 | 캐시 |
|-----------|------|------|
| `/_next/static/*` | Cache-First | haja-static-v1 |
| `/icons/*`, `/manifest.webmanifest` | Cache-First | haja-static-v1 |
| `/api/*` | 항상 네트워크 (캐시 없음) | — |
| 그 외 동일 출처 GET | Network-First (오프라인 fallback) | haja-dynamic-v1 |

---

## 4. 화면 구성

| 경로 | 설명 |
|------|------|
| `/` | 세션 목록 홈 |
| `/sessions/new` | 세션 생성 |
| `/sessions/[id]` | 세션 대시보드 (진행률, 영역 요약) |
| `/sessions/[id]/checklist` | 체크리스트 목록 |
| `/sessions/[id]/checklist/[areaId]` | 영역별 항목 상세 |
| `/sessions/[id]/defects` | 직접 하자 목록 |
| `/sessions/[id]/analysis` | AI 분석 관리 |
| `/sessions/[id]/report` | 보고서 미리보기 + 출력/export |

---

## 5. 개발 일정

| 마일스톤 | 내용 | 상태 |
|----------|------|------|
| D-8 | 직접 하자 추가, 하자 ID 자동 생성, 진행률 강화 | ✅ 완료 |
| D-7 | Gemini Vision API 연동, 위험도 산정, 분석 결과 편집 | ✅ 완료 |
| D-6 | PDF 보고서 8섹션, JSON export | ✅ 완료 |
| D-5 | Service Worker 오프라인 캐시, 사진 3종 촬영 가이드 | ✅ 완료 |
| D-4 | 사진 품질 자동 평가, 카메라 권한 오류 안내 | ✅ 완료 |
| D-3 | 핵심 로직 단위 테스트 45개, iOS Safari EXIF 방향 보정 | ✅ 완료 |
| D-2 | 1차 실기기 모의 점검 (기기 테스트) | 예정 |
| D-1 | 피드백 hotfix, 종이 백업 PDF 출력 최종 확인 | 예정 |
| D-0 | 실제 점검일 (2026-05-11) | — |

---

## 6. 미결 사항 및 알려진 한계

- **카메라 권한 거부 복구**: 기기 설정으로 안내하지만 자동 해제 불가
- **IndexedDB 용량**: 기기 저장 용량의 약 60%가 브라우저 한도이나 사진 수에 따라 조기 소진 가능. 500장 기준 약 500MB 예상.
- **AI 분석 정확도**: Gemini Vision은 건축 전문 학습이 아니므로 오진 가능. 보조 도구 역할이며 최종 판단은 사용자가 한다.
- **PDF 인쇄 레이아웃**: `window.print()` 의존으로 기기/브라우저별 여백·페이지 분리가 다를 수 있다.
- **공유**: 세션 데이터는 기기 로컬에만 저장. 다른 기기로 전달하려면 JSON export → 수동 전송이 필요하다.
