# Cloudflare Gemini 연결 수정 · 통합 검증

## 작업 기준과 변경

- 시작 커밋: `b3e5701d9385c2ea48d81f0ae6eab683c6f049f0`. 원격 작업 브랜치와 `refs/pull/8/head`가 같은 커밋임을 확인했다.
- 작업 브랜치: `feature/cloudflare-gemini35`. main, feature/ui-ux, PR #7은 수정하지 않는다.
- Workers fetch는 `follow`, `manual`만 지원한다. `error`는 요청 생성 시 TypeError를 발생시킨다. 공식 문서: https://developers.cloudflare.com/workers/runtime-apis/request/#properties
- 시작 커밋의 `redirect: 'manual'`을 유지했다. 3xx는 `GEMINI_REDIRECT`로 거부하며 Location을 따라가지 않는다. 네트워크 예외 메시지나 upstream 본문은 응답/로그로 노출하지 않는다.
- 모델 `gemini-3.5-flash-lite`, 프롬프트, JSON 스키마, 분석 결과 필드를 유지한다. 자동 재시도·모델 변경 없이 승인된 분석 요청당 Gemini fetch 최대 한 번이다.
- `/internal/quota-test`를 제거했다. D1 테스트는 로컬 workerd에서만 수행한다.
- `cloudflare/schema.sql`은 테이블과 제한 트리거를 추가하며 기존 데이터를 삭제하지 않는다. D1 batch의 두 INSERT/UPDATE가 하나의 트랜잭션이므로 전체 한도 거부 시 개인 사용량도 롤백된다. 실패한 Gemini 분석도 승인된 시도 1회로 계산한다. 한국시간 날짜별 버킷이 바뀌므로 자정에 삭제 작업이 필요 없다.
- 앱 기본 서버는 Cloudflare HTTPS다. 기존 단어 추가 화면에 접을 수 있는 서버/인증 설정만 추가했다. 인증 코드는 마스킹 입력하고 등록 후 입력칸을 비우며 메모리에만 보관한다. 화면 이동/새로고침 후 다시 등록해야 한다. 단어·백업·localStorage에는 넣지 않는다. PC 로컬 모드는 별도로 선택하며 테스터 코드를 로컬 서버에 보내지 않는다.
- App ID `com.yechan.wordcollector`, webDir `www`, server.url 없음, 기존 네 개 메뉴와 저장/출력 구조를 유지했다. Flutter 설정/코드는 변경하지 않았다.

## 검증과 실행 방법

Node 24, Python 3, Chromium과 Java 21 런타임이 기본 환경에 있었다. 컴파일러가 없어 공식 Temurin JDK 21.0.9+10을 SHA256 검증 후 checkout 외부에 설치하고, Google 공식 저장소의 체크섬으로 확인한 Android CLI로 Platform 36과 Build Tools를 설치했다. 브라우저 도구와 Workers 도구는 앱 의존성을 바꾸지 않도록 checkout 외부에 설치했다.

```sh
npm ci
npm install --prefix /workspace/.word-collector-tools --save-exact playwright@1.58.2 wrangler@4.50.0
export NODE_PATH=/workspace/.word-collector-tools/node_modules
node --test tests/*.test.cjs server/test/*.test.cjs cloudflare/worker.test.mjs cloudflare/runtime.test.cjs
python3 -m http.server 8000 --bind 127.0.0.1 --directory www
# 별도 터미널, 같은 저장소에서:
NODE_PATH=/workspace/.word-collector-tools/node_modules node tests/cloud-integration-browser.cjs
NODE_PATH=/workspace/.word-collector-tools/node_modules node tests/export-screen-browser.cjs
npx cap sync android
```

Miniflare `4.20251118.1`의 실제 workerd/D1에서 인증 없는 요청의 호출 차단, 개인 99회/전체 999회 상태의 동시 요청, 각 상한 초과 차단과 트랜잭션 롤백, 날짜 버킷 분리, 3xx 비추적, 요청당 한 번의 모의 Gemini fetch를 검증했다. 별도 단위 테스트로 한국시간 자정 전후 날짜를 확인한다. 이는 Cloudflare 원격 D1 검증이나 실제 Google Gemini 통신 성공을 뜻하지 않는다.

Chromium 통합 검사는 HTTPS 요청을 모의 응답으로 대체한다. 네 개 메뉴, 한영 혼합 입력·참고 문장 전달, 직접 선택한 저장 위치, 결과 저장, 기존 데이터 보존, 인증 코드 비영속화를 검증한다. 기존 출력 화면 테스트는 선택 단어·7개 항목·최신 편집·CSV/XLSX 다운로드를 검증한다.

`tests/csv-browser.cjs`는 현재 홈에 없는 `[data-word-export-link]`를 찾는 기존 테스트다. 실제 홈은 `[data-path="print"]`를 사용한다. 이 낡은 테스트의 실패는 성공으로 계산하지 않는다. 현재 출력 화면과 새 통합 테스트로 회귀 검증한다.

## 최종 실행 결과

| 검사 | 결과 |
|---|---|
| JavaScript 파일 구문 검사, git diff 공백 검사 | 통과 |
| 기존·추가 Node/Worker/workerd/D1 테스트 | 36개 통과, 실패·건너뜀 0 |
| 새 HTTPS/인증/네 개 메뉴/저장 회귀 브라우저 검사 | 통과 (서버 응답 모의) |
| 기존 선택 출력 CSV/XLSX 브라우저 검사 | 통과 |
| 기존 csv-browser.cjs | 실패: 제거된 홈 링크 선택자 대기 시간 초과 |
| Capacitor Android sync | 통과 |
| Android assembleDebug | 통과, 실기기 설치는 하지 않음 |
| 실제 Gemini·운영 D1·운영 Worker | 미검증 |

Android 검증에는 `JAVA_HOME=/workspace/.wc-jdk`, `ANDROID_HOME=/workspace/.android-sdk`, `ANDROID_USER_HOME=/workspace/.android`, `GRADLE_USER_HOME=/workspace/.gradle`을 사용했다. JVM에 상속된 HTTPS 프록시와 시스템 CA truststore를 지정했으며 TLS 검증을 끄지 않았다. APK는 검사용 debug 서명이므로 기존 설치 앱에 덮어쓸 수 있다고 가정하면 안 된다. 생성 APK와 서명 키는 커밋하지 않는다.

변경 파일: `.gitignore`, `cloudflare/worker.mjs`, `cloudflare/worker.test.mjs`, `cloudflare/schema.sql`, `cloudflare/runtime.test.cjs`, `cloudflare/wrangler.example.jsonc`, `www/analysis-api.js`, `www/quick_capture/analysis.js`, `www/quick_capture/code.html`, `server/test/main-ui.test.cjs`, `server/test/cloud-client.test.cjs`, `tests/cloud-integration-browser.cjs`, 이 보고서. Android 소스, capacitor.config.json, 앱 패키지 의존성/lockfile은 변경하지 않았다.

## 미검증 및 외부 제한

- Gemini API 키, Cloudflare 계정 인증, 테스터 운영 인증 코드는 이 환경에 없다. 실제 Gemini 호출은 수행하지 않았다. 모델의 실제 제공 여부와 운영 프로젝트 권한도 미검증이다. 모델을 바꿔서 검사하지 않는다.
- 운영 Worker `/health` 요청은 클라우드 네트워크 프록시의 CONNECT 403으로 차단됐다. 운영 배포의 버전/동작을 확인하지 못했다.
- GitHub API는 Forbidden이다. PR 제목/설명 편집은 불가하지만, 작업 브랜치 push와 PR #8 head SHA 일치 여부는 Git으로 확인할 수 있다.
- 사용자 PC·기존 APK·서명 키·Android 실기기는 조작하지 않았다. 앱 삭제, 데이터 초기화, 운영 사용량 초기화는 하지 않는다.

## Windows 사용자: 운영 반영 및 실제 요청 한 번 검사

아래는 **운영자가 자신의 PC에서 실행**하는 절차다. 이 문서를 저장한 것만으로 배포되지는 않는다. 이미 Wrangler 설정이 있다면 기존 DB·라우트·vars·secrets 설정을 보존하면서 그 설정을 사용한다. 예제는 단일 Worker/DB용이며 다른 바인딩이 있는 운영 설정을 대체하지 않는다.

1. PowerShell에서 저장소 폴더로 이동한다. 작업 중인 파일이 있으면 먼저 보관한다.

```powershell
git switch feature/cloudflare-gemini35
git pull --ff-only origin feature/cloudflare-gemini35
npm ci
npx wrangler@4.50.0 login
```

2. 기존 설정 파일이 없는 경우만 다음을 실행한다.

```powershell
Copy-Item cloudflare\wrangler.example.jsonc cloudflare\wrangler.local.jsonc
notepad cloudflare\wrangler.local.jsonc
```

Cloudflare 대시보드 → Storage & databases → D1 → **기존 연결 DB**의 이름과 UUID를 확인하여 두 `REPLACE_...` 값만 바꾸고 저장한다. 새 DB를 만들거나 기존 DB를 삭제하지 않는다. 설정의 Worker 이름은 기존 `word-collector-api`다. 이 로컬 파일은 Git에서 제외된다.

3. 가능하면 대시보드에서 기존 D1 백업/복원 지점을 확인한다. 추가 스키마를 적용한 뒤 Worker를 배포한다. 기존 테스터/사용량을 삭제하지 않는다.

```powershell
npx wrangler@4.50.0 d1 execute DB --remote --file cloudflare/schema.sql --config cloudflare/wrangler.local.jsonc
npx wrangler@4.50.0 deploy --config cloudflare/wrangler.local.jsonc --keep-vars
```

기존 Secret `GEMINI_API_KEY`는 유지한다. 키가 실제로 없을 때만 아래 명령의 숨김 프롬프트에서 입력한다. 키를 명령 인자나 채팅에 붙여넣지 않는다.

```powershell
npx wrangler@4.50.0 secret put GEMINI_API_KEY --config cloudflare/wrangler.local.jsonc
```

4. 비과금 상태 확인:

```powershell
Invoke-RestMethod https://word-collector-api.yechan-lim-elec.workers.dev/health
```

status가 `disabled-for-review`이면 Cloudflare 대시보드 → 해당 Worker → Settings → Variables and Secrets에서 일반 변수 `ENABLE_LIVE_ANALYSIS`를 문자열 `true`로 설정한다.

`ok: true`, `model: gemini-3.5-flash-lite`, `status: live`는 서버 설정 상태일 뿐 실제 Gemini 성공이 아니다. `/internal/quota-test` POST는 404여야 한다.

5. Android Studio의 **SDK Manager**에서 Android SDK Platform 36, Build Tools 36.0.0을 설치하고 JDK 21을 사용한다. 저장소 루트에서:

```powershell
npx cap sync android
npx cap open android
```

기존 설치 앱과 **같은 서명 키**로 APK를 빌드하고 업데이트 설치한다. debug 키 또는 다른 PC의 키가 다르면 덮어쓰기가 불가능하다. 이때 기존 앱을 삭제하지 말고 원래 서명 키를 확보한다. 먼저 앱의 백업 기능으로 데이터를 내보내 보관한다. 서명 키나 백업 파일을 Git에 추가하지 않는다.

6. 앱의 단어 추가 → **AI 서버 · 테스터 인증**을 펼친다. Cloudflare HTTPS를 선택하고 기존에 안전하게 발급받은 테스터 코드를 등록한다. Gemini 키를 입력하지 않는다. 직접 선택 모드에서 전기기기를 선택하고 `Transformer`, 참고 문장 `The transformer steps down AC voltage.`를 입력한 뒤 **AI 분석 시작을 한 번만** 누른다. 자동 재시도하지 않는다. 결과의 영어 표제어·한국어 뜻·정의·예문을 검토하고 저장 위치를 확인한다. 오류 시 상태 코드/안전한 오류 코드만 공유하고 토큰·키·원문 네트워크 덤프는 공유하지 않는다.

운영 D1 동시성·실기기·실제 Gemini 결과 확인은 위 배포 이후 별도로 기록해야 한다. 실제 호출이 실패하면 모델을 바꾸지 말고 Google 프로젝트의 해당 모델 사용 권한/키 설정과 배포 버전을 확인한다.
