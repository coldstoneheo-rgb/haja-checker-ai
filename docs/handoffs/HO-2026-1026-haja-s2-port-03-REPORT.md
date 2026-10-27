# HO-2026-1026-haja-s2-port-03 REPORT — 실기기 스텁 3종 · SW 자폭(⛔) · #18 관찰 ③④

## 인계 블록
- **한 일**
  - #22 PR A: 카메라·광고·식별키 스텁 + 플랫폼 어댑터 + 호출 지점 3곳 + 정적 테스트 19건.
  - #21 PR C: 임대 BUILDER는 «기타»로 표시, 빈 체크리스트 제목은 모드별.
  - #23 PR B: sw.js 자폭 버전. ⛔ 머지 금지, base는 #19.
  - QR 10-29 준비 표(아래).
- **발견**
  - 토스 스텁이 `nativeCamera=true`이면 토스 빌드의 사진 기능이 통째로 막힌다(critic 1차). 그래서 QR 실측 전에는 input을 유지한다.
  - Dexie에는 기기 단위 키가 없다. 그래서 식별키 폴백은 localStorage로 했다.
  - 자폭 SW를 SwRegister가 남은 트리에 넣으면 방문마다 헛돈다. 무한 루프는 아니다(critic 정정). 그래서 PR B는 #19 위에 쌓았다.
  - 서버 429 응답의 reason·canReward를 클라이언트가 버리고 있었다. 지금은 오류 객체에 싣는다.
- **LC·사용자에게 필요한 것**
  - **사용자 결정 묶음 1줄**: #19(Next 화면 제거) + #23(SW 자폭)은 한 번에 정한다. 머지하면 #19 다음 #23(`rebase --onto origin/main`)을 넣거나 하나로 합친다. 배포 뒤 #23 본문의 실측을 한다.
  - QR 10-29 표의 «사용자 손» 열: 콘솔 광고 그룹 발급, 카메라 권한 선언, .ait 업로드.
  - 문안 ASK: 리워드 제안 문구가 아직 없다.
- **effort**: 세션 medium. critic 4회(A 2회·B·C)는 high(규약).

## 체크리스트(완료 조건)
- [x] 1. 계획 REPLY (10-27, LC [a6a670]) — identity 반박(Dexie 기기 키 없음 → localStorage) 수용
- [x] 2. PR A #22 → main ae8ea33 — 변이 1회(상대경로 직접 import → 2 fail) · critic 7.5 → 8.5 PASS · LC PASS(차단 0·관찰 4)
- [x] 3. PR B #23 f2d5772 — 변이 1회(SwRegister 복원 → 1 fail) · critic 8 PASS · LC PASS(차단 0·관찰 5) · ⛔ 열어 둠(base #19)
- [x] 4. PR C #21 → main 7ce4d0e — critic 8.5 PASS · LC PASS(차단 0·관찰 5) · 머지 전 main ae8ea33 위 rebase 재확인 164/164
- [x] 5. A 162/162 · B 147/147 · C 145/145 · typecheck·next build·build:toss 모두 0
- [x] 6. QR 10-29 준비 표(아래)
- [x] 7. 인계 블록(이 문서 + AGENT_STATUS·WORKLOG, PR D)

## QR 10-29 준비 표 — 실기기에서 채울 것
| 자리 | 스텁(파일:줄) | 실기기에서 할 것 | 사용자 손 |
|---|---|---|---|
| 카메라 | `toss/src/platform/camera.ts` `nativeCamera=false` · 호출 `PhotoCaptureButton.tsx` pickNative | ① WebView `<input type=file capture>`로 촬영·앨범이 되는지 먼저 실측 ② 안 되면 `openCamera({base64:true,maxWidth:1024})`·`fetchAlbumPhotos` → `ImageResponse{id,dataUri}` → File 변환 → `nativeCamera=true` ③ 권한 거부(`OpenCameraPermissionError`) 문구 | 카메라 권한 콘솔 선언 여부 |
| 광고 | `toss/src/platform/ads.ts` `AD_GROUP_IDS` 빈 값 · 호출 `AnalysisView.tsx` noteLimit(하루 상한·canReward일 때만) | 테스트 광고 그룹 ID로 `loadFullScreenAd`→`showFullScreenAd` · `userEarnedReward` 수신 → 서버 `grantReward` 라우트 노출(광고 검증 붙인 뒤) · 리워드 제안 UI·문구(문안 ASK) · 전면 광고 호출 지점 미정 · `DefectDetailView` 단건 분석 429도 호출 지점 추가 여부 | 콘솔 광고 그룹 발급(테스트·실), 광고 문안 승인 |
| 식별키 | `toss/src/platform/identity.ts` localStorage `haja.anonKey` 폴백 · 호출 `analysisRepo.ts` 헤더 `x-haja-anon-key` | `getAnonymousKey()` → `hash` 실측(미지원 버전 `"ERROR"`/undefined 처리) · 서버는 S3 KV + 검증 전까지 헤더 불신 유지 · 다른 출처 호출 시 CORS `Access-Control-Allow-Headers`에 헤더 추가 | — |
| 보고서 저장 | `toss/src/platform/reportActions.ts:15·20·25` | PNG → `saveBase64Data` / 공유 | — |
| 외부 링크 | `toss/src/platform/openURL.ts:2` | `openURL` 연결 | — |
| 임대 화면 | — | #18 관찰 ① 임대 세션 눈 확인 1회(수신처 «기타» 폴백·빈 체크리스트 제목 포함) | 기기·QR 스캔 |
| 공통 | — | `/api/analyze` 다른 출처 호출(분리 + CORS)은 이번 밖 — 토스에서 AI 분석은 그 전까지 실패가 정상 | .ait 업로드·콘솔 등록 |

## LC 게이트 관찰(#22)
- tsc·vite build는 게이트가 직접 돌리지 못했다(분류기). 워커 실행 결과 0과 Vercel preview pass로 대신했다.
- 토스 스텁의 «곧 지원» 문구는 지금 화면에 나올 길이 없다. QR-1029에서 `nativeCamera=true` 전환은 SDK 연결과 같은 커밋으로 한다.
- `canReward === true`는 엄격 비교다. S3 KV 작업 때 429 응답 스키마 테스트를 붙인다.
- 어댑터 export 동일성 정규식은 `function`·`const`만 본다(`export let`·`export {}`·`export type`은 놓친다).

## 다음 조각
1. QR 10-29: 위 표를 실기기에서 채운다. 카메라는 input 실측을 먼저 하고, 광고는 테스트 ID로, 식별키는 hash로.
2. `/api/analyze` 분리 + CORS(`x-haja-anon-key`는 Allow-Headers에 넣기). 배포·env는 사용자.
3. 리워드 제안 UI·문구(문안 ASK) · 서버 `grantReward` 라우트(광고 검증과 함께) · DefectDetailView 단건 분석의 429 호출 지점.
4. #19 + #23 사용자 결정. 머지하면 #23은 rebase --onto main 또는 #19에 합친다. 실측 절차는 #23 본문에 있다.

## LC 게이트 관찰(#21·#23)
- #21
  - `reportRepo.ts` 기본 제목 리터럴이 copy 표와 겹친다.
  - «기타»가 결함 유형 OTHER와 같은 글자다(한 화면에 같이 나올 수 있다).
  - 저장값 불변 테스트는 지금 값이 맞는지만 본다. 쓰기 경로를 바꾸는 PR의 회귀는 못 잡는다.
- #23
  - `matchAll`에 includeUncontrolled가 없다(실사용 경로는 skipWaiting+claim이 덮는다. 리허설 3단계에서 확인).
  - 테스트가 소스 서식에 밀착돼 있다.
  - register 탐지가 4개 디렉터리로 하드코딩돼 있다.
- **CI 없음**: 머지 코멘트에 로컬 vitest 수치를 남긴다(#21은 남김).
