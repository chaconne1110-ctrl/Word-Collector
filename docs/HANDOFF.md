# Word Collector 인수인계 안내 (V11.21)

이 문서와 이 저장소(소스 + 전체 Git 기록)만 있으면 개발을 이어갈 수 있도록 정리했다.
자세한 기술 설명은 USB `Word Collector\` 폴더의 기술 상세 보고서(PDF)에 있다.

## 1. 지금 상태 (2026-11-22)

| 항목 | 내용 |
|---|---|
| 최신 브랜치 | `V11.21` (이 소스) |
| 남은 브랜치 | `V11.21`, `main`(웹 배포 설정), 교수 평가용 6개, `archive/worker-recovery-20261111`(원래 서버 설정 복구 자료) |
| 보존 태그 | `pages-v2.3-three-notebooks` (웹 /v2.3-three-notebooks/가 쓰는 커밋), 그 밖의 예전 태그들 |
| 분석 서버 | **새 서버** `word-collector-api-v3` (이 소스, 평가용 앱 6개, 웹 /v3/) · **원래 서버** `word-collector-api` (2026-11-20 금요일 상태로 고정, 웹 기본 주소만 사용) |
| 웹 | https://chaconne1110-ctrl.github.io/Word-Collector/ — 기본 주소, `/eval/<과목>/` 6개, `/v2.3-three-notebooks/`, `/v3/`(= V11.21과 같은 앱) |
| 서버 단어집 | 6,208개(전기공학 3,324, 반도체 2,884), 검색 키 13,978개 |

## 2. 꼭 지킬 것

1. **교수 평가용 브랜치 6개는 지우지 않는다.** 화면은 그대로 두고, 기능 변경만 최신 브랜치를 따른다.
2. **원래 서버(`word-collector-api`, D1 `word-collector-db`)는 바꾸지 않는다.** 새 작업은 새 서버(`-v3`)에만 배포한다.
3. **비밀값은 저장소에 넣지 않는다.** Gemini 키, 중계 서버 비밀값, 국어사전 키는 Cloudflare Secret / Windows 사용자 환경 변수에만 둔다.
4. **웹은 커밋 번호로 고정 배포한다.** 브랜치를 만들어도 웹은 바뀌지 않는다(5장).
5. Gemini를 부르는 작업(재분석·재생성)은 비용이 생기므로 소유자 확인 후에만 한다.

## 3. 처음 준비

필요한 것: Git, Node.js 22 이상, npm, Python 3.11 이상, (APK를 만들 때) JDK 21 + Android SDK, (iOS) macOS + Xcode.

```bash
git clone <이 저장소 또는 압축을 푼 폴더> Word-Collector
cd Word-Collector
git checkout V11.21
npm ci                                   # Capacitor 등
npx -y playwright@1.55.1 install chromium   # 브라우저 테스트용 (또는 Edge 경로를 CHROMIUM_PATH로 지정)
python -m pip install -r glossary/requirements.txt   # 단어집 도구 (pymupdf, pypdf)
```

## 4. 실행과 테스트

```bash
# PC에서 앱 열기: www/index.html 을 브라우저로 열거나 로컬 서버 사용
node server/server.cjs            # 로컬 개발 서버 (모의/실제 분석 서버 선택 가능)

# 단위 테스트 (225개)
node --test tests/*.test.cjs server/test/*.test.cjs cloudflare/*.test.mjs relay/*.test.mjs rag/*.test.mjs
# 브라우저 테스트 (21개 파일, 유료 API 호출 없음)
for f in tests/*-browser.cjs; do CHROMIUM_PATH="<chromium 또는 msedge 경로>" node "$f"; done
# Python 테스트 (49개)
cd glossary && python -m unittest
```

GitHub Actions(`.github/workflows/regression-tests.yml`)가 `v*`·`V*` 브랜치를 올릴 때마다 단위·브라우저 테스트를 돌린다.

## 5. 배포

### 5.1 분석 서버 (Cloudflare Worker)
```bash
npx wrangler@4 login
npx wrangler@4 deploy -c cloudflare/deploy/wrangler.v3.jsonc --keep-vars      # 새 서버
# 비밀값을 처음 넣을 때만:
npx wrangler@4 secret put GEMINI_API_KEY      -c cloudflare/deploy/wrangler.v3.jsonc
npx wrangler@4 secret put GEMINI_RELAY_SECRET -c cloudflare/deploy/wrangler.v3.jsonc
```
배포 후 확인: `impedance`(전공 의미, 전기공학)는 `model: textbook-glossary`, 단어집에 없는 단어(예: 페란티)는 요청 헤더 `X-WC-Models: gemini-4-hydrogen`을 넣었을 때 `gemini-4-hydrogen`으로 답하면 정상이다.
원래 서버 설정은 `cloudflare/deploy/wrangler.original.jsonc` (배포 금지, 기록용).

### 5.2 Gemini 중계 서버 (Google Cloud Run)
서비스 `word-collector-gemini-relay` (us-central1, 프로젝트 `gen-lang-client-0225521593`). 코드는 `relay/`, 설정 방법은 `relay/README.md`. 비밀값 `RELAY_SECRET`은 Cloud Run 환경 변수와 각 Worker의 `GEMINI_RELAY_SECRET`이 같아야 한다.

### 5.3 웹 (GitHub Pages)
`main` 브랜치의 `.github/workflows/deploy-requested-chat-priority-snapshot.yml`이 주소마다 **정확한 커밋 번호**를 고정해 사이트를 조립한다. 웹을 바꾸려면 그 파일에서 해당 주소의 커밋 번호(두 군데: `ref:`와 확인 줄)를 바꿔 `main`에 올린다. `/v3/`와 `/v2.3-three-notebooks/`는 배포할 때 저장소 키와 캐시 접두어를 그 주소 전용으로 바꿔 다른 앱과 데이터가 섞이지 않는다. 평가용 6개 주소의 커밋은 소유자 요청 없이 바꾸지 않는다.

### 5.4 Android APK
Capacitor 8 (`npx cap sync android` → `android/`에서 Gradle 빌드). 앱 ID는 `com.yechan.wordcollector`. 기존 v3 테스트 APK는 빌드 설정이 앱 ID를 `com.yechan.wordcollector.v3`로 바꿔 만든 것이다. GitHub에서 빌드한 디버그 APK는 빌드마다 서명 키가 달라 업데이트로 설치되지 않으므로, 업데이트 설치가 필요하면 고정 서명 키를 GitHub 비밀값으로 만들어 써야 한다.

## 6. 데이터와 도구

| 위치 | 내용 |
|---|---|
| `www/` | 앱 전체 (HTML·CSS·JS, PWA). `www/data.js` = 첫 실행 단어장 3개(72개 단어) |
| `cloudflare/` | 서버 코드 `worker.mjs`, D1 구조 `schema.sql`·`migrations/`, 배포 설정 `deploy/` |
| `relay/` | Cloud Run 중계 서버 |
| `rag/` | 자료·저작권 기록 `sources.json`, 참고 자료 화면 생성 `build-references.mjs` |
| `glossary/` | 단어집 구축 `build_glossary.py`, 사전 대조 `review_dictionaries.py`, 교정 `corrections.json`·`apply_corrections.py` |
| `docs/first-run-evidence-sources.md` | 첫 실행 단어 중 "근거 있음" 27개의 실제 출처 |
| `android/`, `ios/` 빌드 설정 | Capacitor 네이티브 프로젝트, 로고 원본 `assets/branding/` |

- 단어집 교정: `glossary/corrections.json`에 추가 → `python glossary/apply_corrections.py server` → `glossary/out/review/fix.sql`을 새 서버 D1(`word-collector-db-v3`)에 `wrangler d1 execute --remote --file`로 반영.
- 사전 검토: `python glossary/review_dictionaries.py --patent <EK_TRANS_DIC.txt>` (키: `NIKL_KTERM_KEY`, `NIKL_OPENDICT_KEY`, `KRDICT_KEY` 환경 변수). 온용어는 하루 약 1,400건까지만 답한다. 특허 영한 용어사전(EK_TRANS_DIC.txt)은 공공데이터포털에서 받는다.
- `glossary/out/`(캐시·보고서·내려받은 파일)는 Git에 올리지 않는다.

## 7. 소유자 PC에만 있는 것 (이 저장소 밖)

- 작업 스케줄러 `USB-Claude-Backup`(30분마다 USB 백업), `WordCollector-Glossary-Review`(매일 사전 검토): `C:\scripts\`의 PowerShell 스크립트.
- USB(볼륨 이름 DEVUSB): `Word Collector\`(대화 기록, Git 번들, 기술 보고서), `General\`(일반 설정·스크립트), `start.bat`.
