# GitHub main UI 그대로 + Gemini 3.5 Flash-Lite

기준 UI는 GitHub `main` 커밋 `2ab34b7`의 **HTML·CSS·JavaScript/Capacitor 앱**입니다. 홈·단어 추가·북마크·출력의 4개 메뉴와 기존 CSV/XLSX 선택 출력 기능을 사용합니다. `feature/ui-ux` / `feature/flutter-gemini35`의 3개 메뉴 Flutter 앱과 별개입니다. Flutter UI를 재구성한 소스는 이 변경에 포함하지 않습니다.

## 보존·변경 사항

- 홈 `www/index.html`, 출력 `www/_6/code.html`, 기존 스타일·폰트·이미지는 main과 동일합니다. 단어 추가 화면에는 통신 스크립트 한 개만 추가합니다.
- 검수 필드에 전공을 추가하여 기존 7열 출력의 전공 값도 저장합니다. 품사·예문 번역은 분석/검수에 유지하고 CSV/XLSX 7열에는 포함하지 않습니다.
- 한국어·영어 입력, 참고 문장 우선 의미 분석, 저장된 단어와 뜻·정의에 따른 자동 분류를 Gemini 한 번으로 요청합니다. 자동 분류에서는 저장 단어가 있는 후보를 비교합니다. 직접 고른 과목은 저장 위치로 유지합니다.
- 모델은 `gemini-3.5-flash-lite` 고정입니다. API 키는 PC `server/.env`에만 저장합니다. 다른 모델·예제 분석으로 자동 대체하거나 자동 재시도하지 않습니다.
- 기존 `lexicon-word-collector-v1` 저장소, 북마크·도해·수정·출력 기능을 유지하며 저장 단어에 요청 모델 ID도 기록합니다. 참고 문장은 DB에 새로 저장하지 않습니다.
- `capacitor.config.json`의 앱 ID `com.yechan.wordcollector`, `webDir: www`를 유지하고 `server.url`을 추가하지 않습니다. 앱은 포함된 웹 파일로 열리고 AI 요청만 PC 서버로 보냅니다. PC 연결 없이 기존 단어 열람·수정·출력이 가능합니다.
- 현재 Flutter 앱 `com.example.word_collector`의 SQLite와 이 앱 저장소는 서로 다릅니다. 두 앱을 삭제하지 않으며, Flutter에 새로 저장한 단어가 자동으로 넘어오는 기능은 이번 변경에 없습니다.

## 1. 기존 Capacitor 프로젝트에서 코드 받기

새 폴더를 만들 필요 없이 기존 `WordCollector_GitHub_Upload`를 사용합니다. 원본 ZIP·백업·Flutter 작업 폴더는 보관합니다.

```powershell
Set-Location "$env:USERPROFILE\Desktop\WordCollector_GitHub_Upload"
git status --short
git fetch origin
git switch -c feature/main-gemini35 --track origin/feature/main-gemini35
npm.cmd ci
```

브랜치 변경이 수정 파일 때문에 막히면 강제로 덮어쓰지 말고 변경 목록을 확인·보관하세요. 이미 브랜치가 있으면 `git switch feature/main-gemini35`를 사용합니다. API 키가 포함된 파일을 Git에 추가하지 않습니다.

## 2. 기존 키를 비공개로 옮기고 서버 시작

기존 8787 서버 창에서 Ctrl+C로 서버를 종료합니다. Flutter 앱 실행 창은 q로 종료할 수 있습니다. 새 프로젝트의 서버도 같은 포트를 쓰므로 이전 서버와 동시에 실행하지 않습니다.

이미 입력한 본인 키를 재사용하려면 PC에서 파일을 복사합니다. 키 내용은 화면·채팅에 표시하지 않습니다. 대상 `.env`가 있으면 덮어쓰지 않습니다.

```powershell
$wcOldEnv = "$env:USERPROFILE\Desktop\WordCollector_Review_ui-ux\server\.env"
$wcNewEnv = Join-Path (Get-Location) 'server\.env'
if ((Test-Path -LiteralPath $wcOldEnv) -and -not (Test-Path -LiteralPath $wcNewEnv)) {
    Copy-Item -LiteralPath $wcOldEnv -Destination $wcNewEnv
}
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\server\start-server.ps1
```

키 파일이 없다면 실행 스크립트가 화면에 보이지 않게 키를 입력받습니다. Node.js 22 이상이 필요합니다. 키는 server/.env에서 읽으며 실제 `.env`는 Git에서 제외합니다. 서버 콘솔은 열어둡니다.

PC Chrome에서 `http://127.0.0.1:8787`을 열면 **GitHub main의 4개 메뉴 UI**가 표시됩니다. 이 브라우저 저장소는 휴대폰의 저장소와 별개입니다. `/health`는 키를 공개하거나 Gemini를 호출하지 않고 모델·서버 상태를 확인합니다.

## 3. 실제 휴대폰 앱 빌드

다른 PowerShell 창에서:

```powershell
Set-Location "$env:USERPROFILE\Desktop\WordCollector_GitHub_Upload"
npx.cmd cap sync android
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s R3CWC0718EW reverse tcp:8787 tcp:8787
```

Android Studio에서 **File → Open → `WordCollector_GitHub_Upload\android`**를 열고 연결된 `SM S926N`을 선택한 다음 ▶를 누릅니다. 이 프로젝트는 Capacitor이므로 실행 명령은 Android Studio 빌드/설치입니다. 기존 Flutter 앱을 여는 명령과 구분하세요.

Capacitor의 내장 Native HTTP를 이용해 PC의 `127.0.0.1:8787`에 요청합니다. 키를 APK에 넣지 않습니다. Android debug에만 로컬 HTTP 허용 설정을 추가했으며, 일반 외부 HTTP 허용이나 WebView 전체 Mixed Content 허용은 추가하지 않습니다. USB를 다시 연결하거나 adb를 재시작했다면 reverse 명령을 다시 실행합니다.

아래 두 가지를 구분하세요.

- 앱 안에 포함된 화면: `www`를 `cap sync`로 복사하여 표시합니다. PC 서버가 꺼져도 저장된 내용과 화면은 열립니다.
- PC 서버의 화면: PC Chrome에서 `http://127.0.0.1:8787`을 연 경우입니다. 앱의 `server.url`로 이 화면을 불러오는 구성은 아닙니다.

## 실제로 확인할 항목

1. 휴대폰에서 4개 하단 메뉴가 보이는지 확인합니다.
2. 단어 추가에서 와전류·자동 분류·자기장 참고 문장을 입력하고 영어 표제어/뜻/전공/정의/예문/추천 근거를 검수합니다.
3. 추천과 다른 저장 과목으로 바꾸고 텍스트를 수정한 뒤 저장합니다. 선택한 단어장과 재실행 후 유지 여부를 확인합니다.
4. Transformer·기존 과목 전기기기·자연어 처리 참고 문장을 입력해 문장에 맞는 뜻과 고정된 저장 위치를 확인합니다.
5. 출력에서 실제 저장 단어와 7개 열 중 일부를 선택하여 CSV/XLSX를 저장합니다.

개발 검증은 Node 단위/모의 테스트, main UI 파일 동일성, Chromium의 실제 화면 분석→검수→저장→CSV/XLSX 다운로드로 수행합니다. Gemini는 모의 응답이므로 실제 언어·분류 품질은 위 절차로 확인해야 합니다. 작업 환경에는 Android SDK·실기기가 없어 새 APK/Native HTTP 경로의 실기기 검증은 Windows에서 필요합니다. 기존 Flutter에서 사용자가 확인한 실제 3.5 성공과 이번 Capacitor 앱의 실제 검증은 구분합니다.

HTTPS 배포·외부 테스터 인증·호출 한도는 이번 범위에 포함하지 않습니다.
