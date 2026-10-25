# HO-2026-1026-haja-s2-start-01 — REPORT

> 발주: LC `handoffs/HO-2026-1026-haja-s2-start-01.md` · 작업 창 haja-checker-ai · 2026-10-26 03:2x~ KST
> 결정 3(사용자 원문 10-26 01:4x):
> - ① 코드 기반: **B Vite 재작성**
> - ② 저장: **Dexie 유지 + 용량 경고**
> - ③ 실기기 QR: **10-29**
> - PUBLIC 전환: **아니오**
>
> 과금 0(Gemini 실호출 0) · 배포·env 0 · 콘솔·업로드 0(`ait build`는 로컬 .ait 생성만)

## 체크리스트 (완료 조건 번호)

- [x] 1 계획 REPLY — LC 수용. 보강 3:
  - 공존은 전환기 한정으로 명시하고, import 경계 테스트를 둔다.
  - 임대 시드에 출처를 표시하고, AI off를 테스트로 드러낸다.
  - PR마다 포그라운드 검증을 1회 한다.
- [x] 2 PR1 전환 골격 — #11 → main `19e6cda`
- [x] 3 PR2 모드 3종 — #12 → main `57513ab`(머지 뒤 main 실측 npm test **98/98**)
- [x] 4 PR3 고지·라벨·상한 — #13 → main `6ac6a15`(critic 5/10 → 반영 → 재검수 PASS 8/10 · main 병합 브랜치 115/115)
- [x] 5 PR4 docs — #14 → main `71ba72f`(동의 3줄 확정은 사용자 몫)
- [x] 6 PR마다 critic → LC 게이트 → 머지 — #10~#14 전부 끝. 후속 소형 #15(서버 mode 가드)도 머지 `b174dc0`
- [x] 7 인계 블록 — 이 파일 + AGENT_STATUS·WORKLOG

## PR 표

| PR | 내용 | critic(high) | 테스트 | 빌드 | 머지 |
|---|---|---|---|---|---|
| #10 PR0 | spike worktree 정리 기록 + REPORT 초안 | 생략(docs) | — | — | `9e2bced` |
| #11 PR1 | Vite(`toss/`) 골격 · 쿼리 라우팅 · 세션 목록 1화면 · `apps-in-toss.config.ts` · import 경계 테스트 | PASS 8/10 → 중요 2·경미 3 반영 | **83/83**(74 + 9) | typecheck 0(루트+toss) · next build 0 · vite build 0(JS gz 96KB, dexie 한 벌 4.4.2) · `ait build` 0(`haja-check.ait` 110KB) | `19e6cda` |
| #12 PR2 | mode 3종 · recipientType · 임대 시드 20 · DB v2 · 임대 AI off | PASS 7/10 → 중요 1·경미 2 반영 | 89/89(74 + 15) · main 머지 뒤 98/98 | tsc 0 · next build 0 | `57513ab` |
| #13 PR3 | 첫 이용 고지 1회 · «AI 분석» 라벨 · 보고서 고정 문구 · 상한 카운터 | 5/10 NEEDS_REVISION(심각 2: 고지 우회) → 반영 → 재검수 PASS 8/10 | 91/91(74 + 17) · main 병합 뒤 115/115 | tsc 0 · next build 0 | `6ac6a15` |
| #15 후속 | 서버 mode 가드(입주·퇴거 400) · `.env.example` 원가 · 정적 검사 toss/ | 생략(소형) | 116/116 | typecheck 0 · next build 0 · build:toss 0 | `b174dc0` |
| #14 PR4 | 동의 3줄 초안 · 19세 고지 위치 · 비게임 자가 점검표 · 금지어 grep | 생략(docs) | — | — | `71ba72f` |

테스트 수는 PR마다 그 시점 main을 기준으로 잰 값이다. #12 머지 뒤 main은 98(실측)이고, #13을 main과 병합한 브랜치(fa4e7c4)는 115(실측)다.

## PR0 — 정리 (코드 0)

| 항목 | 결과 |
|---|---|
| 허용 규칙 템플릿 | #9 → main `72fe71e`(이 HO 전, 사용자 창 지시) |
| spike worktree `~/haja-spikes/next-export` | 작업트리 변경(staged 24파일 +73/−127)이 `S1-next-export-query-routing.patch`와 같은 hunk임을 diff로 확인 → `git stash`(stash@{0}에 보존) → junction `node_modules` rmdir(`/s` 없이) → `dir /AL /S /B` 0건 → `git worktree remove`(`--force` 0) → 본 레포 `node_modules` 319개 유지 |
| 로컬 `spike/next-export` | `git branch -d`(35319b5, main 조상이라 강제 삭제 0) |
| `~/haja-spikes/` 나머지 | `vite-port/`·`ait-next/`·`share-png/` 등 레포 밖 폴더는 이식 참고용으로 남김 |

## 발견

- **공존은 전환기 한정**이다. Next 제거 시점은 10화면 이식이 끝나는 조각이다. 그 전까지 두 빌드는 같은 `lib/`·`app/` 원본을 쓰고, `__tests__/tossBoundary.test.ts`가 이를 지킨다(toss는 dexie 직접 import 0, lib는 next·vite·app·toss import 0, vite `@/` = 레포 루트, dedupe에 dexie).
- **viewport**: critic 경미 7 권고로 `user-scalable=no`를 한때 뺐다가 **복원(가이드)**했다(bd621cf). 근거는 토스 비게임 가이드 «제스처 확대·축소 비활성»이다(PLATFORM-FACTS §3, face-fate LAUNCH-POLICY-CHECK).
- **`photos: read` 권한**(`apps-in-toss.config.ts`): `Device.getPhotos`(앨범 다중 선택, PLAN §8-2 3)용이라 유지한다. S3 콘솔 권한 사유 1줄 초안: «점검 사진을 앨범에서 골라 체크리스트 항목에 붙일 때 사용해요.»
- **`ait build` 실측**: `@apps-in-toss/web-framework` 3.4.0 설치에 43초가 걸렸다. `ait build`는 13초, exit 0이다. 출력에 deploymentId가 찍히지만 업로드는 0이다.
- **도구 체인**: package-lock의 최상위 vite가 8.0.10에서 7.3.7로 내려갔다(plugin-react 5와 맞춤). vitest도 vite 7을 쓰며 테스트는 green이다.
- **임대 모드 가드**: 클라이언트 2중(MODE_CONFIG·화면 숨김 + analysisRepo)에 더해, #15에서 서버도 payload mode가 입주·퇴거면 400으로 막는다. mode 없는 요청(구버전)은 통과하고, 비용은 상한 카운터가 막는다.
- **상한 저장소 한계**(#13): 함수 메모리 어댑터는 인스턴스마다 따로 세고, 콜드 스타트 때 0으로 돌아간다. 그래서 «월 $30 자동 중단»은 **KV(S3) 전까지 보장되지 않는다**. 그 전까지 Google Cloud 쪽 예산 알림·한도를 걸어야 한다(사용자 손, S3).
  - 사용자 키는 IP다. 통신사 공유 IP(CGNAT)에서는 30회를 여러 사용자가 나눠 쓴다.
  - 분석이 실패해도 1회를 차감한다(상류 원가가 이미 났을 수 있음).
- **고지 문구 «1곳 외 0»의 예외 2**: 홈 푸터 «참고용이며 …»(`app/page.tsx:121`)와 보고서 7절의 기존 면책 단락(`ReportView.tsx:339-350`). 둘 다 기존 문구라서 남겼다. 문안 확정 때(LC 대조 → 사용자) 정리할 대상이다.
- **동의 1줄과 고지 3줄째 표현 차이**: #14 동의 1줄 «서버를 거치고»와 #13 고지 «Google Gemini로 전송되고»가 서로 다르다. 문안 확정 때 하나로 맞춘다(전송 주체를 밝히는 쪽 권장, #13 critic 결함 5).
- 금지어 grep에서 «특이사항»(`ChecklistView.tsx:265`)의 «이사»가 부분 문자열로 잡힌다. 단어 경계 grep으로는 0건이다(#14 §4).

## 머지 SHA

| PR | SHA |
|---|---|
| #9 settings 템플릿(HO 전) | `72fe71e` |
| #10 PR0 | `9e2bced` |
| #11 PR1 | `19e6cda` |
| #12 PR2 | `57513ab` |
| #13 PR3 | `6ac6a15` |
| #14 PR4 | `71ba72f` |
| #15 서버 mode 가드 | `b174dc0` |

테스트 실측: main `b174dc0` = **116/116**(npm test, 11 files). 시작 기준 74에서 +42.

## 다음 조각 (이식·후속)

1. **toss 이식 9화면**: 새 세션 → 대시보드 → 체크리스트 → 하자 → 분석 → 보고서. 이식하면서 함께 할 것:
   - 원본 상단 «뒤로» 링크 제거(상단 바 중복)
   - `metadata` → `document.title`
   - `public/`(아이콘·manifest·sw.js) 처리
   - `index.css` `@source` 정리
2. **Link shim 외부 href**: openURL 경유 또는 개발 중 assert(#11 critic 경미 4). scroll 옵션도 따른다.
3. **next 전용 import 금지 항목**: `next/image` 등 shim이 없는 import를 경계 테스트에 추가한다.
4. **임대 모드 문구 분기**(#12 critic):
   - `findingNoun`을 화면에 반영하고 «하자/시공» 문구를 일괄 처리한다(ReportView 17·SessionOverview 4·ChecklistView 3 등).
   - NewSessionForm의 시공사·입주예정일 필드를 모드별로 나눈다.
   - 세션 목록·대시보드에 mode를 표시한다.
5. **실기기 전 스텁 → QR 10-29**: 3 카메라(`Device.openCamera`/`getPhotos`) · 4 공유(PNG `File.saveBase64` + `intoss://`) · 6 광고(전면·리워드, 테스트 ID) · 7 식별키(`getAnonymousKey`).
6. **`/api/analyze` Vercel 함수 분리 + CORS**(허용 origin `*.apps.tossmini.com`). 배포·env는 사용자 손.
7. **인쇄·새 창 4곳 대체**(`ReportView.tsx:40·50·90`, `reportRepo.ts:119`).
8. **보고서 7절 AI 면책 절과 고정 문구 중복 문안**: 사용자가 확정한다(동의 3줄·고지 3줄과 묶어 [ASK] 1회).
8-1. **AiNoticeDialog**: focus trap(#13 critic 경미 9, 미반영) · 기본 포커스를 «확인» 대신 «취소»에 둘지(N4, 문안 확정 때 결정).
9. **상한 KV 어댑터(S3)**: incr와 되돌리기를 원자적으로 묶는다(Lua·트랜잭션). 되돌리기 전에 실패하면 카운터가 새고(N2), 일일 상한 거절이 잠깐 월 예산 자리를 차지하는데(N1), 둘 다 덜 허용하는 쪽이다.
10. **고지 게이트 정적 검사를 `toss/` 트리로 넓힌다**(N3, 이식 조각).
11. **v1 세션 recipientType 백필**: 수신처를 찍는 조각에서 `?? "BUILDER"`로 처리한다(#12 LC 관찰 ②).
12. **임대 모드에 남은 AI 문구**: SessionOverview:122·ChecklistView:138-162의 «AI 분석» CTA와 ReportView 7절 AI 면책 절이 무조건 렌더된다. «하자/시공 문구 일괄» 조각에서 처리한다(#12 LC 관찰 ③).
13. **NewDefectForm 공간 초기값**: 첫 공간이 «현관»으로 우연히 같을 뿐이다. 세션을 읽은 뒤 `areas[0]`으로 다시 맞춘다(#12 LC 관찰 ⑧).

## effort

- 세션: medium
- critic: high(#9·#11·#12·#13). 버그 수정·검수 규약에 따랐다.
- 올린 곳 없음: 파일 건너뜀·테스트 미실행·중도 포기 신호가 0이었다.
