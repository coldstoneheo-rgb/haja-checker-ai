# 하자체크 → 앱인토스 WebView 미니앱(비게임) S1 스파이크 — 문서 항목 조사 (2026-10-17)

## 근거와 표기 규칙

- **[SDK]** = `C:\Users\colds\AI\claude\face-fate\node_modules\@apps-in-toss\web-framework\dist\index.d.ts`(3.4.0, 2,652줄)를 직접 읽음. `[SDK cfg]` = 같은 폴더의 `config.d.ts`(57줄). `[CLI]` = `node_modules/@apps-in-toss/cli/dist/index.js`(3.4.0). 숫자는 줄 번호.
- **[DOC]** = 2026-10-17에 `curl -sL https://developers-apps-in-toss.toss.im/<경로>.md`로 받은 원문. 줄 번호는 그 curl 출력 기준(1행은 `> For the complete documentation index…` 머리글). `llms-full.txt`는 3쪽으로 나뉜다(`/llms-full.txt`, `/1`, `/2`).
- 판정: **됨 / 안 됨 / 조건부**. 기기에서 직접 확인해야 하는 부분은 «실기기 대기». 문서와 타입 어디에도 없으면 «문서 없음». 근거 없이 짐작한 부분은 «추정».
- **버전 주의:** 문서는 SDK **3.7.0**(2026-10-01 릴리즈 노트)까지 반영돼 있다. 선례 레포의 설치본은 **3.4.0**이다. 그래서 문서에는 있는데 3.4.0 타입에는 없는 API가 있다(예: `NavigationBar.setOptions`는 3.5.0부터, 아래 ⑨).

---

## ④ 카메라와 앨범: `Device.openCamera` / `Device.getPhotos` / `Device.getAlbumItems`

**판정: 됨.** 단, 반환 형식과 웹 `<input capture>` 동작은 «실기기 대기».

| 항목 | 내용 | 근거 |
|---|---|---|
| 실제 이름 | `Device.openCamera`, `Device.getPhotos`, `Device.getAlbumItems`. 예전 이름 `openCamera`·`fetchAlbumPhotos`·`fetchAlbumItems`는 `@deprecated` | [SDK] 914·929·934 / 847 「@deprecated … `Device.openCamera`를 사용해주세요」 |
| 반환 형식 | `ImageResponse { id: string; dataUri: string }`. `openCamera`는 1장, `getPhotos`는 배열 | [SDK] 279–282 · 929 `Promise<ImageResponse>` · 914 `Promise<ImageResponse[]>` |
| base64 여부 | 옵션 `base64?: boolean`, 기본 `false`. `true`면 `dataUri` 자리에 **접두어 없는 base64 문자열**이 온다. 화면에 띄우려면 `'data:image/jpeg;base64,'`를 직접 붙여야 한다 | [DOC] `documentation/common/permission/camera.md` 31행 「`true`로 설정하면 `dataUri` 대신 Base64 인코딩된 문자열을 반환해요」 · 135행 「데이터 URL 스키마 Prefix를 붙여야해요」 |
| `base64:false`일 때 값 | 문서: 「`dataUri`: 이미지 데이터를 표현하는 데이터 URI예요」(camera.md 54행). 실제로 `data:` URI인지 `file://`류 경로인지는 문서로 확정할 수 없다 → **«실기기 대기»**. **추정:** haja의 `downscaleImage()`(Blob 입력)에 넣으려면 `base64:true`로 받아 Blob으로 바꾸는 길이 가장 안전하다 | camera.md 54행 |
| 한 번에 몇 장 | `openCamera`: 1장. `getPhotos`: `maxCount` 기본 10. `getAlbumItems`: `maxCount` 기본 10, 사용자가 **직접 고르는** 피커이며 취소하면 `[]`, 토스앱 5.261.0 이상 | [SDK] 908–914 「기본값은 `maxCount=10`, `maxWidth=1024`, `base64=false`」 · 930–933 「선택해 가져와요. 취소하면 빈 배열」 · [DOC] `device.getalbumitems.md` 9–11행 「토스앱 Android/iOS `5.261.0` 이상」 |
| 해상도와 용량 옵션 | `maxWidth?: number`(기본 1024px). JPEG 품질·용량 옵션은 **문서 없음** | [SDK] 283–286 `OpenCameraParams { base64?; maxWidth? }` · [DOC] `device.opencamera.md` 25행 「이미지의 최대 너비(px)예요. 기본값은 1024예요.」 |
| 권한 선언 | `apps-in-toss.config.ts` → `permissions: [{ name: 'camera', access: 'access' }, { name: 'photos', access: 'read' }]` | [SDK cfg] 17–22 · [DOC] `documentation/common/permission.md` 19–27행 「권한 이름: `camera` · 접근(`access`): openCamera」「`photos` · 읽기(`read`): fetchAlbumPhotos」 · 선례 face-fate `apps-in-toss.config.ts` `permissions: [{ name: 'camera', access: 'access' }]` |
| 권한 거부 처리 | `OpenCameraPermissionError` / `FetchAlbumPhotosPermissionError`를 던진다. `.getPermission()`·`.openPermissionDialog()`로 다시 요청 | [DOC] `device.opencamera.md` 11·45행 |
| 웹 `<input type=file capture>` | **문서 없음**(`input`·`capture`·`type="file"`로 문서 전체를 grep → 0건). 일반 Web API는 허용한다는 문구만 있다: 「WebView 환경에서 일반적인 웹 API 사용은 제한하지 않아요.」(permission.md 11–12행). 실제로 되는지는 **«실기기 대기»** | permission.md 11–12행 |

선례(face-fate `docs/DECISIONS.md` B20): 「`Device.openCamera`는 브리지가 없으면 throw」, 즉 토스 밖 브라우저에서는 이 경로를 쓸 수 없다.

---

## ⑧ 사용자 식별키: `getAnonymousKey` / `User.getAnonymousKey`

**판정: 됨.** 비게임 전용이고, 토스 로그인(appLogin)이 필요 없다.

| 질문 | 답 | 근거 |
|---|---|---|
| appLogin이 필요한가 | **필요 없다.** 서버 연동과 동의 화면도 없다 | [DOC] `documentation/common/authentication/hash-key.md` 171행 「토스 로그인처럼 별도의 인증 화면이나 서버 연동 없이, 미니앱 내부에서 고유한 사용자 식별자를 바로 얻을 수 있어요.」 · 293행 「토스 로그인(`appLogin`)과 달리 서버 API 연동 없이도 사용할 수 있어요.」 |
| 비게임에서 쓸 수 있나 | **비게임 전용.** 게임은 `getUserKeyForGame`을 쓴다. 다른 유형의 API를 쓰면 오류가 날 수 있다 | hash-key.md 19행 「비게임 · `getAnonymousKey` · 비게임 미니앱 전용 사용자 식별키」 · [DOC] `guide/authentication/anon-key.md` 「미니앱 유형에 맞는 발급 방식을 사용해야 해요. 다른 유형에서 사용하면 오류가 발생할 수 있어요.」(‘꼭 확인해 주세요’ 박스) |
| 반환값 | `{ type: 'HASH', hash: string }`. 함수형은 `'ERROR'`(알 수 없는 오류)나 `undefined`(앱 버전 낮음)를 돌려준다. `User.getAnonymousKey`는 반환 대신 `UNSUPPORTED_APP_VERSION`·`UNKNOWN_ERROR`를 throw한다 | [SDK] 266–269 · 2188–2193 · 2249–2254 |
| 수명과 범위 | **영구.** 같은 미니앱 안에서는 같은 사용자에게 항상 같은 값을 준다. 앱 삭제나 기기 변경 뒤에도 같은 값이다. 다른 미니앱에서는 다른 값이다 | hash-key.md 26–27행 「같은 미니앱 안에서 동일한 사용자에게 항상 같은 값이 반환돼요.」「앱 삭제나 기기 변경이 있더라도 동일한 사용자라면 같은 값이 반환돼요.」 · 21행 「미니앱별로 고유해요」 |
| 최소 버전 | 토스앱 5.232.0 | [SDK] 2183–2185 · hash-key.md 178행 |
| 샌드박스 | mock 값을 준다 → 실제 값은 QR로 연 토스앱에서만 나온다(**«실기기 대기»**) | hash-key.md 29·181행 |
| 서버 검증 | `POST https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/users/anon-key/verify`, 헤더 `x-anon-key`, **mTLS 필요** | hash-key.md 298행 이후 ‘식별키 검증하기’ |

---

## ⑨ 라이트 모드 · 네비게이션 바 · 뒤로가기 · 외부 링크

**판정: 조건부.** 라이트 모드는 강제다. 뒤로가기는 이벤트 API가 있지만 history와의 관계는 문서에 없다(«실기기 대기»).

### 9-1. 라이트 모드: **강제(정책)**
- [DOC] `guide/faq.md` 248·250행: 「현재 앱인토스 미니앱에서는 다크 모드를 지원하지 않아요.」「라이트 모드 기준으로 개발/디자인 및 출시해야 해요.」
- [DOC] `checklist/app-nongame.md` 58행(‘서비스 이용 동작’): 「[ ] 미니앱 테마는 라이트 모드로 구현돼 있어요.」 → **검수 항목이다.** haja에 `prefers-color-scheme: dark` 스타일이 있으면 꺼야 한다.

### 9-2. 네비게이션 바(상단 바)
- 기본 모양(비게임): [DOC] `documentation/common/navigationbar.md` 65행 「흰색 배경의 네비게이션 바가 기본으로 제공돼요. 좌측에는 미니앱 로고와 이름이, 우측에는 더보기 버튼과 X 버튼」.
- 정적 설정(3.4.0): `apps-in-toss.config.ts`의 `navigationBar?: { withBackButton, withHomeButton, withTitle, transparentBackground, theme: 'light'|'dark', initialAccessoryButton }`. [SDK cfg] 26–41. 문서 본문은 아직 `granite.config.ts`라고 적혀 있는데(navigationbar.md 107행), 3.x에서는 이 파일 이름이 `apps-in-toss.config.ts`로 바뀌었다.
- 런타임 변경: `NavigationBar.setOptions({ …, backgroundColor: '#RRGGBB' | null })`. **SDK 3.5.0+** 기능이고 3.4.0 타입에는 없다. [DOC] `release-note/release-note.md` 24–26행 「`NavigationBar.setOptions` API가 추가되었어요」(3.5.0, 2026-09-21) · `navigationbar.setoptions.md` 16–25행.
- 브랜드 색: 설정 키는 `brand.primaryColor` 하나뿐이다(3.x에서 displayName·icon이 삭제됨). [SDK cfg] 4–6 · [DOC] `documentation/integration/sdk-3.x.md` 27행 「`primaryColor`만 유지」. 색 대비가 모자라면 자동 보정된다(`design/consumer-ux-guide.md` 51행). **바 배경색을 브랜드 색으로 칠하는 설정 키는 문서 없음.** 3.5.0+의 `setOptions.backgroundColor`만 있다.
- 제약: 「파트너사 자체 로고를 추가하는 건 허용되지 않아요」(navigationbar.md ‘2. 네비게이션 바 커스터마이징’ 경고 박스). 홈 버튼은 비게임에서만 쓸 수 있다(같은 문서 ‘참고사항’).

### 9-3. 하드웨어·제스처 뒤로가기
- 이벤트 API: `graniteEvent.addEventListener('backEvent', { onEvent, onError })`. 해제 함수를 돌려준다. [SDK] 2334–2357. **구독하면 기본 뒤로가기가 막힌다**: [DOC] `documentation/common/screen/event.md` 17행 「`onEvent` · 뒤로가기 버튼이 눌리면 호출돼요. 기본 뒤로가기는 차단돼요.」 같은 방식으로 `homeEvent`도 구독할 수 있다.
- iOS 스와이프: 설정 `webView.allowsBackForwardNavigationGestures`(기본 `true`, iOS 전용). [SDK cfg] 52 · [DOC] `documentation/integration/props.md` ‘스와이프 뒤로가기/앞으로가기 허용’ 절. 런타임 토글은 `Screen.setIosSwipeBack({ isEnabled })`. [SDK] 1915–1918.
- 검수 기준: [DOC] `checklist/app-nongame.md` 56행 「안드로이드 시스템 백버튼을 누르면 뒤로가기 또는 미니앱이 종료돼요.」
- **history 기반 SPA 라우팅과의 관계: 문서 없음.** backEvent를 구독하지 않았을 때 안드로이드 백버튼이 WebView `history.back()`부터 소비하는지, 곧바로 미니앱을 닫는지는 적혀 있지 않다 → **«실기기 대기»**. **추정:** 구독하지 않으면 WebView 기본 동작(history pop)이 먼저 일어나고, 구독하면 앱이 직접 `history.back()`이나 `Screen.close()`를 호출해야 한다.

### 9-4. 외부 링크 · `window.open`
- SDK: `Device.openURL(url)`은 「지정한 URL을 기기의 기본 브라우저나 관련 앱에서 열어요」. [SDK] 951–955 · [DOC] `documentation/common/screen/open-url.md` 5행 「React Native의 `Linking.openURL`을 내부적으로 사용해요」.
- 정책: [DOC] `checklist/app-nongame.md` 47행 「브라우저 히스토리 조작이나 웹뷰 임베드 등 어떤 방식으로든, 자사 사이트(토스 도메인 외부)로 이동하거나 그 콘텐츠를 렌더링할 수 없어요. … (예: `window.location.replace`, 자사 도메인을 불러오는 WebView/iframe 중첩 등)」. 또 `intro/guide.md` 114·116행 「외부 링크는 허용된 경우에만 제한적으로」「서비스 본질과 직접 관련 없는 결제창·다운로드 페이지·홍보 랜딩 등은 인정되지 않아요」.
- **`window.open` / `target=_blank`의 WebView 동작: 문서 없음** → «실기기 대기».

---

## ⑪ 광고 SDK

**판정: 됨.** 전면·리워드는 같은 API를 쓴다. WebView 배너는 SDK와 문서가 모두 있다(토스앱 5.241.0+). 다만 문서 안에 «배너 미지원» 문장이 하나 있다(아래 11-3).

### 11-1. 전면(interstitial)·리워드(rewarded)
- API 이름: `loadFullScreenAd({ options: { adGroupId }, onEvent, onError })` → 해제 함수를 돌려준다. 표시는 `showFullScreenAd({ options: { adGroupId }, onEvent, onError })`. 두 함수 모두 `.isSupported()`가 있다. [SDK] 666–689. 광고 유형은 adGroupId가 정한다: [DOC] `documentation/common/monetization/iaa/interstitial-rewarded-ad.md` 9행 「전면형(Interstitial)과 보상형(Rewarded) 광고 모두 동일 API(`loadFullScreenAd`, `showFullScreenAd`)를 사용하며, 광고 타입은 광고 그룹 ID(adGroupId)를 기준으로 자동 결정돼요.」
- 이벤트: load는 `{type:'loaded'}`. show는 `clicked|dismissed|failedToShow|impression|show|requested|userEarnedReward{unitType,unitAmount}`. [SDK] 154–178.
- **사전 로드는 필수:** 같은 문서 46행 「광고를 표시하기 전에 반드시 호출해야 해요」, 52–54행 「반드시 `load → show → (다음 load)` 순서」「`loadFullScreenAd` 호출 후 이벤트를 받은 뒤 `showFullScreenAd`를 호출」「adGroupId가 같으면 한 번에 하나의 광고만 미리 로드할 수 있어요」.
- 지원 버전: 5.247.0 이상은 「토스 애즈 + AdMob」, 5.227.0~5.247.0 미만은 AdMob만, 5.227.0 미만은 미지원(같은 문서 15–19행).
- 구 API: `GoogleAdMob.loadAppsInTossAdMob / showAppsInTossAdMob / isAppsInTossAdMobLoaded`(v2 호환 별칭). [SDK] 693–717.
- **테스트 광고 ID**(같은 문서 766–771행 ‘테스트하기’): 전면 `ait-ad-test-interstitial-id` · 리워드 `ait-ad-test-rewarded-id` · 배너 리스트형 `ait-ad-test-banner-id` · 배너 피드형 `ait-ad-test-native-image-id`. 「실제 광고 ID로 테스트하면 정책 위반으로 간주해 불이익을 받을 수 있어요」.
- 콘솔: 광고 그룹 ID가 구글에 등록되기까지 「최대 2시간」 걸린다. 사업자 정보·정산 정보 등록이 먼저 필요하다(`guide/monetization/in-app-ad.md` ‘콘솔에서 설정하기’ 1–3).

### 11-2. WebView 배너
- API: `TossAds.initialize({callbacks})` → `TossAds.attachBanner(adGroupId, target, { theme:'auto'|'light'|'dark', tone, variant:'card'|'expanded', callbacks })` → `{ destroy }`. `TossAds.attach`는 deprecated다. [SDK] 635–665.
- 문서: [DOC] `documentation/common/monetization/iaa/web-banner.md` 7·11·15–16행 「WebView에서 배너 광고를 표시할 수 있는 광고 라이브러리예요.」「배너 광고 API는 토스 앱 5.241.0 이상에서 사용할 수 있어요.」. 18–20행 「5.241.0 미만에서는 빈 화면이 노출될 수 있으니 반드시 예외 처리」.
- **샌드박스에서는 인앱 광고가 안 된다:** 같은 문서 FAQ(805–808행) 「샌드박스에서는 인앱 광고 기능을 지원하지 않아요. … 콘솔 내 QR 코드로 테스트」 → 모든 광고 동작은 **«실기기 대기»**.

### 11-3. «L7008 vs L6920 모순» 원문 확인
- PLAN 메모가 가리킨 줄 번호는 다른 시점의 `llms-full.txt` 기준으로 보인다. 오늘 받은 판(3분할)에서는 줄 번호가 다르다. 같은 문장은 아래 위치에 있다.
  - «미지원» 쪽: `llms-full.txt` **7728행** = `guide/monetization/in-app-ad.md` **313행**: 「* 배너 광고는 아직 지원되지 않아요.」 위치는 **‘광고 분석하기 › 광고 노출 비중 및 eCPM’ 대시보드 그래프 설명의 ‘이렇게 활용해 보세요’ 힌트 박스 안**이다(바로 윗줄 312행은 「배너 광고는 비중이 높아도 eCPM이 낮아요」).
  - «지원» 쪽: `llms-full.txt/1` **9881·9889행** = `web-banner.md` 7·15행 「WebView에서 배너 광고를 표시할 수 있는 광고 라이브러리예요」「5.241.0 이상 · 지원 · 배너 광고 사용 가능」. 같은 guide 문서 68–80행(‘인앱 광고 유형 › 배너 광고’)과 225행도 배너(WebView) 연동 문서로 링크한다.
- 판단: SDK 3.4.0에 `TossAds.attachBanner`가 실제로 있고([SDK] 640·644), 연동 문서도 «지원»이라고 적는다. «아직 지원되지 않아요»는 **대시보드의 ‘광고 노출 비중’ 지표가 배너를 아직 집계하지 않는다는 뜻으로 읽힌다(추정).** 배너 노출 자체가 막혔다는 근거는 없다. 확정은 **«실기기 대기»**(5.241.0+ 토스앱 QR에서 `ait-ad-test-banner-id` 부착).

---

## ② (문서) `ait build`가 웹 번들을 받는 방식

**판정: 조건부.** 정적 산출물 폴더만 받는다. Next의 서버 기능(SSR·API 라우트)은 번들에 넣을 수 없다.

- **설정 키(3.x):** `webBundleDir?: string`, 기본 `'dist'`. [SDK cfg] 54 · [CLI] 352 `const webBundleDir = config.webBundleDir ?? "dist";`.
- **`web.commands`는 3.x에서 삭제됐다.** 빌드·개발 명령은 `package.json` 스크립트로 옮기고, build 스크립트 끝에 `&& ait build`를 붙인다. [DOC] `documentation/integration/sdk-3.x.md` 30행 「`web` 설정 · 설정 파일 내 `web.commands` 포함 → 삭제 후 `package.json`으로 이동」 · 187–188행 「`web.commands.build` → `package.json`의 `build` 스크립트에 옮기되, `ait build`를 함께 실행하도록 추가」 · [DOC] `documentation/sdk/v3.md` 116·120행 「`web` (host, port, commands) · 제거」「`outdir` → `webBundleDir` … 기본값은 `dist`로 동일」. 2.x 예시(`granite.config.ts`): `web: { host, port, commands: { dev: 'vite --port 3000', build: 'vite build' } }, outdir: 'dist'`(sdk-3.x.md 209–227행). 3.x 예시: `defineConfig({ appName, brand:{primaryColor}, webView:{}, permissions:[], webBundleDir:'dist' })`(같은 문서 237–245행).
- **정적 파일만 받는다:** [CLI] 293–303. `webBundleDir` 아래 파일을 그대로 `sources/`에 담고, `index.html`이 없으면 실패한다(「웹 빌드 디렉토리에 index.html이 존재해야 합니다.」). CLI 도움말(105–118행): 「webBundleDir에 지정한 디렉토리를 그대로 아티팩트에 담기 때문에, 이 명령을 실행하기 전에 웹 프레임워크의 빌드 명령(예: vite build)을 먼저 실행」.
- **SSR 금지(정책):** [DOC] `guide/faq.md` 411행 · `checklist/app-nongame.md` ‘보안 및 안정성’: 「서버 사이드 렌더링(SSR)은 사용할 수 없어요. 클라이언트 사이드 렌더링(CSR) 또는 정적 사이트 생성(SSG) 방식만 사용할 수 있어요.」 → haja의 `app/api/analyze/route.ts`(Gemini 키를 쓰는 서버 라우트)는 번들에 들어갈 수 없다. 외부 HTTPS 서버(현행 Vercel)에 남겨야 한다. Next를 쓰려면 `output: 'export'` 같은 정적 export가 필요하다. 이건 Next 쪽 사실이며 앱인토스 문서에는 Next 언급이 없다(**추정**).
- **번들 크기 상한:** [DOC] `guide/faq.md` 593행 「앱 번들은 압축 해제 기준 100MB 이하만 업로드할 수 있어요.」(`file-storage/storage.md` 452행에도 같은 문장).

---

## ⑤ (문서) 인쇄 · 다운로드 · 공유 · 이미지 저장

**판정: 조건부.** `window.print`와 `<a download>`는 문서 없음이다. 대체 수단으로 `File.saveBase64`·`File.openPDFViewer`·`Share`가 있다.

| 항목 | 내용 | 근거 |
|---|---|---|
| `window.print` | **문서 없음**(문서 전체 grep: `print`·`인쇄` 0건). WebView에서 인쇄가 되는지는 **«실기기 대기»**. **추정:** RN WebView 기반이라 동작하지 않을 가능성이 높다 | — |
| `window.open` | **문서 없음**(⑨-4 참조) | — |
| 파일 다운로드(`<a download>`, Blob URL) | **문서 없음.** 정책상 「다운로드 페이지」로 외부 이동하는 것은 불인정이다(`intro/guide.md` 116행). 이건 외부 링크 문제이고 로컬 다운로드 규정은 아니다 | — |
| 파일·이미지 저장 API | `File.saveBase64({ data, fileName, mimeType })`(구 `saveBase64Data`), 토스앱 Android 5.218.0 / iOS 5.216.0+. 이미지·PDF 모두 가능 | [SDK] 304–308 · 1166–1176 · [DOC] `documentation/common/file-storage/file.md` 9행 「Base64 데이터를 지정한 파일 이름과 MIME 타입으로 사용자 기기에 저장해요. 이미지, 텍스트, PDF 등 다양한 형식」 |
| PDF 보기(보고서 출력 대체) | `File.openPDFViewer({ data: base64, filename? })` → 닫으면 `'CLOSE'`. 5.261.0+ | [SDK] 309–313 · 1178–1190 · [DOC] `file-storage/pdf.md` 9행 「Base64로 인코딩된 PDF 데이터를 네이티브 PDF 뷰어로 여는 함수」 |
| 공유 | `Share.sendMessage({ message: string })`(구 `share`): **텍스트만**, 네이티브 공유 시트. `Share.createLink({ path: 'intoss://…', ogImageUrl? })`: 토스 딥링크 생성(ogImageUrl은 Android 5.240.0 / iOS 5.239.0+) | [SDK] 1943–1960 · [DOC] `common/growth/share/share-message.md` 시그니처 `function share(message: { message: string })` |
| 이미지 공유 API | **없음**(SDK 타입과 문서 모두). 공유 시 `intoss-private://` 대신 `intoss://`를 써야 한다(`checklist/app-nongame.md` ‘서비스 이용 동작’) | — |

선례(face-fate `docs/findings/2026-10-07-toss-savebase64-android.md`): Android 토스앱에서 `File.saveBase64`를 부르면 「다운로드 확인창 → 이미지 공유 선택창」이 뜬다. 이미지 공유가 필요하면 사실상 이 경로를 쓰게 된다(실측 1대).

---

## ⑦ (문서) WebView 저장소 영속성

**판정: 조건부.** 출시판에서는 업데이트 뒤에도 유지된다. 그러나 **iOS에서 IndexedDB는 7일 미사용 시 삭제된다**고 문서에 적혀 있다.

- origin 기준: [DOC] `documentation/common/file-storage/storage.md` 425행 「`localStorage`, IndexedDB, `window.caches` 같은 웹 표준 저장소는 웹뷰의 origin(URL)을 기준으로 저장돼요.」 출시 origin은 `https://<appName>.apps.tossmini.com`, QR 테스트 origin은 `https://<appName>.private-apps.tossmini.com`(같은 절).
- 업데이트 시 유지 여부(같은 절 표): 「토스앱 출시 — 이전 버전 ↔ 새 버전 · 공유됨」「QR 테스트 — 버전 A ↔ 버전 B · 공유됨」「QR 코드 테스트 ↔ 토스앱 출시 · 공유되지 않음」.
- **IndexedDB 경고**: 같은 문서 441행 「WebView 환경에서 IndexedDB를 사용하면 iOS에서 **7일간 상호작용이 없을 경우 데이터가 자동으로 삭제**돼요. 로컬 캐시가 필요하다면 `window.caches`(Cache API) 사용을 권장해요.」
- 앱 캐시 정리 시 동작: **문서 없음.** 토스앱 삭제 시 SDK `Storage`도 지워진다는 문장만 있다(같은 문서 9행 「토스 앱을 삭제하면 저장소에 저장된 데이터도 함께 삭제돼요.」).
- SDK Storage API: `Storage.getItem / setItem / removeItem / clearItems`(문자열 key-value), `getItems / setItems`(5.270.0+). 「앱이 종료되어도 유지돼요」. [SDK] 1984–2026.
- 용량: [DOC] storage.md 454행 「미니앱이 사용할 수 있는 저장소 용량(예: `Storage`, Cache API 등)에는 별도 제한이 없어요.」 (IndexedDB 용량은 따로 언급이 없다.)
- origin 이전 이력: SDK 3.1.1에서 `{appName}.web.tossmini.com` → `{appName}.apps.tossmini.com`으로 바뀌었다([DOC] `release-note/release-note.md` 52–56행). 옛 데이터 이전용 `Migration.getOriginStorage()`가 있다([SDK] 1466–1513 · `migration.getoriginstorage.md` 7행). 새로 시작하는 haja는 해당 없음.
- iOS 7일 삭제가 실제로 일어나는지, 사진 Blob을 몇 MB까지 넣을 수 있는지는 **«실기기 대기»**(7일 삭제는 사실상 S1에서 재현할 수 없으므로 문서 기준으로 설계).

---

## ⑥ (문서) Service Worker

**판정: 문서 없음.**
- 문서 전체(`llms-full.txt` 3쪽과 받은 개별 .md)에서 `Service Worker`·`serviceWorker`·`서비스 워커`·`sw.js`·`PWA`를 grep → 0건. 관련 문장은 「대부분의 표준 Web API를 동일하게 사용할 수 있어요」(permission.md 12행)와 Cache API 권장(storage.md 441행)뿐이다.
- SW 등록이 되는지(iOS WKWebView는 앱 바운드 도메인 설정이 없으면 SW를 막는 것으로 알려져 있다 — **추정**)는 **«실기기 대기»**. 번들이 토스 서버에서 서빙되므로 haja의 `/sw.js` 오프라인 캐시는 없어도 되는 기능일 가능성이 높다(**추정**).

---

## 요약 표

| 항목 | 판정 | 핵심 근거 1줄 | 실기기 대기 |
|---|---|---|---|
| ④ 카메라·앨범 | 됨 | `Device.openCamera({base64,maxWidth})` → `{id,dataUri}` 1장, `getPhotos`/`getAlbumItems` 기본 10장·1024px, 권한 `camera:access`·`photos:read` ([SDK] 279–287·914–934) | 예: `base64:false`일 때 dataUri 형식, `<input capture>` 동작 |
| ⑧ 사용자 식별키 | 됨 | 비게임 전용 `getAnonymousKey`, appLogin 불필요, 앱 삭제·기기 변경에도 같은 hash (hash-key.md 26–27·171·293) | 예: 샌드박스는 mock |
| ⑨ 라이트·네비·뒤로·링크 | 조건부 | 라이트 모드 강제(faq 248–250, 체크리스트 58), `graniteEvent backEvent` 구독 시 기본 뒤로가기 차단(event.md 17), 외부 도메인 이동·렌더 금지(체크리스트 47) | 예: history와 백버튼의 관계, `window.open` |
| ⑪ 광고 | 됨 | `loadFullScreenAd`→`showFullScreenAd` 사전 로드 필수, 테스트 ID `ait-ad-test-*`, WebView 배너 `TossAds.attachBanner` 5.241.0+ | 예: 샌드박스 미지원 → QR만 가능, «배너 미지원» 문장 해석 |
| ② 번들 방식 | 조건부 | `webBundleDir`(기본 dist) 폴더 그대로, `index.html` 필수, `web.commands`는 3.x에서 삭제(→ package.json), SSR 금지, 100MB | 아니오 |
| ⑤ 인쇄·다운로드·공유 | 조건부 | `window.print`·다운로드 문서 없음 → 대체: `File.saveBase64`·`File.openPDFViewer`(5.261.0+)·`Share.sendMessage`(텍스트만) | 예: `window.print`·Blob 다운로드 |
| ⑦ 저장소 영속성 | 조건부 | 출시판 업데이트 간 유지, QR↔출시 간 미공유, **iOS IndexedDB 7일 미사용 시 자동 삭제**, SDK Storage는 용량 제한 없음 (storage.md 425–454) | 예(부분) |
| ⑥ Service Worker | 문서 없음 | grep 0건 | 예 |

---

## haja 전환에 영향 큰 의외의 사실 (5)

1. **iOS에서 IndexedDB가 7일 미사용 시 자동 삭제된다**(storage.md 441행). haja는 세션·사진·하자·분석 결과를 모두 Dexie(IndexedDB)에 둔다. 입주 점검은 며칠씩 띄엄띄엄 쓰는 일이 흔해 데이터 손실 위험이 크다. 문서가 권하는 대안은 Cache API 또는 SDK `Storage`(문자열 KV, 용량 무제한)다. 사진은 Cache API에, 메타데이터는 Storage/서버에 두는 재설계를 검토해야 한다.
2. **SSR 금지와 정적 폴더 패키징**: `ait build`는 `webBundleDir`에 `index.html`이 있는 정적 산출물만 담는다. 그래서 `app/api/analyze`(Gemini 키를 쓰는 서버 라우트)를 번들 밖 HTTPS 서버로 분리해야 하고, Next를 정적 export로 바꿔야 한다. 이때 API 서버에 미니앱 origin(`https://<appName>.apps.tossmini.com`, QR 테스트는 `private-apps`)을 허용하는 CORS 설정이 필요하다(origin 표기: storage.md 425행 이하 · release-note 56행).
3. **QR 테스트와 출시판은 저장소가 분리된다**(storage.md 표). 실기기 QR로 쌓은 점검 데이터는 출시판에서 보이지 않는다. 테스트 계획에 반영해야 한다.
4. **보고서 «인쇄»는 문서상 대체 경로뿐이다.** `window.print` 언급이 없다. 공유 API는 텍스트만 지원한다(`Share.sendMessage({message})`). 현실적인 경로는 클라이언트에서 PDF를 만든 뒤 `File.openPDFViewer`(5.261.0+)나 `File.saveBase64`로 넘기는 것이다. JSON export도 `File.saveBase64`(mimeType `application/json`)로 바꿔야 한다. Android에서는 saveBase64가 공유 선택창으로 이어진다(face-fate 실측).
5. **라이트 모드 강제와 SDK 버전 차이**: 다크 모드 미지원이 검수 체크리스트 항목이다. 문서는 3.7.0 기준이라 `NavigationBar.setOptions`(3.5.0+) 같은 API가 선례 설치본 3.4.0 타입에는 없다. haja는 새로 설치할 때 버전을 고정하고 타입을 다시 읽어야 한다. 또 광고는 **샌드박스에서 전혀 동작하지 않아** QR 실기기에서만 검증할 수 있다.

---

### 재현 메모
- 원문 재취득: `curl -sL https://developers-apps-in-toss.toss.im/<경로>.md`(경로 목록은 `/llms.txt`). 위 줄 번호는 2026-10-17 취득본 기준이다. 문서는 수시로 개정되므로 줄 번호가 바뀔 수 있다. 절 제목으로 다시 찾으면 된다.
- SDK 인용은 face-fate 레포 `node_modules/@apps-in-toss/web-framework@3.4.0` 기준(읽기만 함).
