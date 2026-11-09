# Flutter Word Collector — Gemini 연결 (Windows)

대상: `feature/ui-ux`의 Flutter 앱을 기준으로 만든 `feature/flutter-gemini35` 작업 브랜치입니다. 기존 HTML·Capacitor `main`과 별개입니다. `cap sync` 명령을 이 Flutter 프로젝트에 실행하지 않습니다. 앱 ID는 기존 Flutter 설정인 `com.example.word_collector`를 유지합니다. 기존 Capacitor 앱 `com.yechan.wordcollector`와 구분하세요.

## 포함된 동작

단어 추가 → Gemini 분석 → 검수 → 선택한 단어장에 기기 저장. 모델은 `gemini-3.5-flash-lite`로 고정합니다. 실패 시 다른 모델이나 예제 응답으로 바꾸지 않습니다. Gemini 요청은 분석 버튼을 누를 때 한 번이며, 저장은 API를 추가 호출하지 않습니다.

자동 분류는 각 단어장에 실제 저장된 표제어·뜻·정의를 비교 자료로 보냅니다. 검수 화면에서 추천 단어장을 변경해도 분석 텍스트는 유지됩니다. 직접 선택한 단어장은 저장 위치이며, 참고 문장을 가장 우선하여 의미를 분석하도록 요청합니다. 참고 문장은 분석 요청과 검수 화면에서만 사용하고 단어 DB에 저장하지 않습니다. 단어가 없는 후보는 그 사실을 밝힌 임시 추천으로 표시합니다.

저장 필드는 전공, 단어장 이름, 표제어, 한글 뜻, 영어 정의, 정의 한글해석, 영어 예문입니다. 추가 설명과 분석 모델 ID는 별도 내부 필드입니다. SQLite 버전 1에서 2로 업그레이드할 때 기존 단어·수정 내용·북마크를 보존합니다. 기존 필드가 비어 있으면 빈칸을 유지합니다. PDF 추출·이미지 생성·서버 동기화·외부 배포는 이번 범위에 포함하지 않습니다. Flutter 원격 UI 브랜치에는 CSV/XLSX 파일 생성 구현이 없으므로, 이 변경은 별도 Capacitor 내보내기 코드를 Flutter에 포팅한 통합본을 뜻하지 않습니다.

## 1. 현재 작업 폴더에 코드 받기

Flutter 실행 중인 PowerShell에서는 `q`로 종료합니다. 새 PowerShell에서:

```powershell
Set-Location "$env:USERPROFILE\Desktop\WordCollector_Review_ui-ux"
git status --short
```

수정 파일이 있다면 보관한 후 전환합니다. 아래 stash는 변경 내용을 삭제하지 않고 Git에 임시 보관합니다. 기존에 `.env`에 저장된 키는 `.gitignore`에 따라 stash 대상에서 제외됩니다. `git stash pop`으로 나중에 복원할 때 공용 파일의 충돌을 검토하세요.

```powershell
git stash push --include-untracked -m "before-gemini35-integration"
git fetch origin
git switch -c feature/flutter-gemini35 --track origin/feature/flutter-gemini35
flutter pub get
```

이미 이 작업 브랜치를 만든 경우에는 `git switch feature/flutter-gemini35`로 이동합니다. 위 작업으로 가상 휴대폰의 저장 데이터가 지워지지는 않습니다. 앱을 삭제하거나 앱 데이터를 초기화하지 마세요. 연결된 저장소 본체 `WordCollector_All_Review`도 그대로 유지하세요.

## 2. PC 서버 시작과 키 저장

Node.js 22 이상이 필요합니다. 서버는 별도 npm 패키지 설치 없이 동작합니다.

```powershell
node --version
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\server\start-server.ps1
```

처음에는 키 입력을 요청합니다. 본인 API 키를 붙여넣고 Enter를 누르세요. 화면에 키가 보이지 않아도 정상입니다. 키는 이 프로젝트의 `server/.env`에만 저장되고 Git에서 제외됩니다. 채팅·APK·Dart 코드에 키를 넣지 않습니다. 기존 `server/.env`에 키를 저장했다면 바로 시작합니다. 키를 변경할 때는 같은 명령 맨 끝에 `-SetKey`를 추가합니다. `ExecutionPolicy Bypass`는 이 실행 프로세스에만 적용하며 Windows의 전역 정책을 바꾸지 않습니다.

서버 창은 켜둡니다. 브라우저에서 아래 주소를 열어 `ok: true`, `model: gemini-3.5-flash-lite`를 확인할 수 있습니다. 이 확인은 Gemini를 호출하지 않습니다.

```text
http://127.0.0.1:8787/health
```

서버는 `server/.env`의 키를 우선 사용하고, 해당 설정이 없을 때만 프로세스의 `GEMINI_API_KEY`를 사용합니다. 바탕화면이나 예전 프로젝트의 `.env`를 자동으로 읽지 않습니다. `GEMINI_MODEL` 환경변수로 모델을 바꾸지 않습니다. 키가 없으면 분석을 성공한 것처럼 보여주지 않고 오류를 안내합니다.

## 3. 가상 휴대폰에서 실행

Android Studio의 가상 휴대폰을 켜고 **다른 PowerShell 창**에서:

```powershell
Set-Location "$env:USERPROFILE\Desktop\WordCollector_Review_ui-ux"
flutter devices
flutter run -d emulator-5554
```

기기 ID가 다르면 실제 목록에 나온 ID를 사용하세요. 가상 휴대폰은 `http://10.0.2.2:8787`로 PC의 로컬 서버에 접근합니다. HTTP 허용은 Android debug manifest에만 추가했습니다. 실험용 debug 빌드를 대상으로 하며, HTTPS 외부 배포는 별도 작업입니다.

실물 Android 휴대폰 USB 테스트는 다음처럼 PC 서버 포트를 전달할 수 있습니다. 연결 기기가 여럿이면 adb 명령에 `-s 실제기기ID`를 추가하고 Flutter에도 해당 기기 ID를 지정하세요.

```powershell
$wcAdb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $wcAdb reverse tcp:8787 tcp:8787
flutter run -d 실제기기ID --dart-define=WORDCOLLECTOR_API_URL=http://127.0.0.1:8787
```

이 로컬 API 구성은 분석할 때 PC 서버 연결이 필요합니다. 이미 저장한 단어·북마크·수정은 기기에 남습니다. PC 없이 신규 AI 분석을 제공하려면 추후 HTTPS 서버가 필요합니다. Chrome은 기존 SQLite 초기화가 지원되지 않는 별도 문제이므로 이번 실행 대상은 Android입니다.

## 4. 실제 Gemini 및 휴대폰 확인 항목

- `와전류` + 자동 분류: 영어 표제어·한국어 뜻·정의·예문과 추천 근거 확인.
- 추천과 다른 단어장으로 바꾸고 한국어 뜻/예문 수정 → 검수 확인 → 저장. 선택한 단어장 목록·플래시카드에서 수정한 내용 확인.
- `Transformer` + 직접 `전기기기` 선택 + 자연어 처리 참고 문장: AI 구조의 뜻으로 분석되고 저장 위치는 전기기기인지 확인.
- `Transformer` + 변압기 참고 문장: 앞 사례와 뜻이 구분되는지 확인.
- 앱 종료·재실행 후 새 단어와 기존 수정·북마크 유지 확인.
- PC 서버를 종료한 상태에서 분석: 입력은 유지되고 연결 실패가 표시되는지 확인.

모의 테스트는 응답 형식·전달 데이터·오류 처리·검수 화면·DB 보존을 검사합니다. 실제 Gemini의 번역·정의 정확도와 분류 품질은 위 실제 요청으로 별도 검수해야 합니다. 이 개발 환경에는 API 키가 없으므로 실호출 통과를 주장하지 않습니다.

## 개발 검증

```powershell
node --test server/test/server.test.cjs
flutter analyze
flutter test
```

단위/모의 테스트에서 실제 Gemini 호출은 하지 않습니다. `sqflite_common_ffi`는 DB 업그레이드·재실행 저장 검증을 위한 개발 의존성이며 Android 런타임에는 사용하지 않습니다.
