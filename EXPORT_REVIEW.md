# CSV · XLSX 내보내기

이 기능은 main 4afd169의 HTML/JavaScript + Capacitor 8 앱을 대상으로 합니다. 기존 원격 feature/xlsx-export는 Flutter 계열이며 excel 의존성 추가만 있어 해당 브랜치를 변경하지 않았습니다.

## 사용

앱 홈의 **CSV·XLSX 내보내기** 버튼 → 전체/단어장 선택 → 열 구성 선택 → CSV 또는 XLSX로 저장합니다. 웹에서는 다운로드/공유, Android에서는 시스템의 파일 저장 창으로 사용자가 위치를 지정합니다. 오프라인 생성이며 API 연결은 필요 없습니다.

현재 기기·origin의 localStorage `lexicon-word-collector-v1`에서 `{courses, terms, saved}`를 읽습니다. 내보낼 때마다 다시 읽어 저장된 최신 검수 내용을 사용하며 원본을 수정하지 않습니다. 저장 내용이 없으면 앱 기본 예시 단어가 표시됩니다. 잘못된 JSON은 오류로 표시하고 기본 데이터로 덮어쓰지 않습니다. PC 브라우저는 휴대폰 WebView의 저장소와 별개입니다.

## 7열 매핑

CSV와 XLSX 모두 아래 순서로 고정합니다.

| 출력 열 | 필드 |
| --- | --- |
| 전공 | discipline |
| 단어장 이름 | courses[course][0], 매핑 없으면 course |
| 표제어 | en |
| 한글 뜻 | ko |
| 영어 정의 | enDef |
| 정의 한글해석 | koDef |
| 예문 | exampleEn (영어 예문) |

저장되지 않은 항목은 빈 칸입니다. exampleKo, pos, originalTerm, 도해, 참고 문맥, 이력은 출력하지 않습니다. 기존 저장 데이터와 API 연결은 변경하지 않았습니다.

## 구현

- `www/word-export.js`: 공유 행 매핑, CSV, 실제 OOXML XLSX 작성. 추가 패키지·CDN 없이 브라우저와 Node에서 사용 가능.
- `www/csv-export.js`: UI, 최신 저장 내용 읽기, 브라우저 다운로드/공유, Android 브리지 연결. 기존 Node CSV 진입점도 유지.
- `www/export.html`: 내보내기 화면.
- `www/export-menu.js`, `www/index.html`: 홈 진입 링크. 기존 app.js는 수정하지 않음.
- `WordExportPlugin.java`, `MainActivity.java`: Android ACTION_CREATE_DOCUMENT 저장 창. 광범위한 저장소 권한이나 추가 Capacitor 의존성 없음.

CSV는 UTF-8 BOM, CRLF, 따옴표/쉼표/개행 이스케이프를 사용합니다. 수식으로 해석될 수 있는 CSV 값 앞에는 작은따옴표를 추가합니다. XLSX는 모든 값을 텍스트 셀로 저장해 원문을 그대로 보존하며, 머리글 고정·자동 필터·줄바꿈·열 너비를 포함합니다. Excel 셀 최대 길이와 지원하지 않는 제어 문자는 오류로 알립니다. Android 파일은 24 MiB까지 지원하며 기존 앱 데이터는 변경하지 않습니다.

## 검증

```sh
node --test tests/csv-export.test.cjs tests/word-export.test.cjs
```

단위 테스트 6개 통과. 설치된 Playwright 환경에서는 다음을 실행합니다.

```sh
node tests/csv-browser.cjs
```

Linux Chromium 기본 경로는 /usr/bin/chromium이며 다른 환경에서는 CHROMIUM_PATH를 지정합니다. WC_TEST_ARTIFACTS를 지정하면 검증용 다운로드 파일을 해당 폴더에 보관합니다.

실제 정적 HTTP 서버와 Chromium으로 홈 링크, 단어장 필터, 두 열 구성, CSV/XLSX 다운로드, 최신 수정 반영, 손상된 저장 데이터 처리, 모바일 폭, Android 브리지 모의 저장/취소/실패를 검증했습니다. 다운로드한 두 파일을 Python csv 및 openpyxl 3.1.5로 다시 열어 7열과 한글·이모지·따옴표·CRLF·공백·수식 문자열이 예상대로 보존되는 것을 확인했습니다. 이 검증용 Python 패키지는 앱 런타임 의존성이 아닙니다.

## 남은 실기기 확인

이 환경에는 Android SDK가 없어 새 Java 플러그인의 Gradle 빌드 및 Android 시스템 저장 창의 실제 동작은 검증하지 않았습니다. Java API는 Capacitor 8 소스와 대조했습니다. APK를 업데이트하지 않은 상태에서는 화면이 최신 APK가 필요하다고 안내합니다.

Windows에서 작업 복사본에 반영 후:

```powershell
npm.cmd ci
npx.cmd cap sync android
$env:JAVA_HOME = Join-Path $env:USERPROFILE '.jdks\jbr-21.0.11'
Set-Location android
.\gradlew.bat :app:assembleDebug
```

휴대폰에서 CSV와 XLSX 각각 저장 위치 선택 → 파일 앱에서 실제 파일 생성 → Excel/스프레드시트에서 열기 → 7열·한글·예문 확인, 저장 취소와 기존 단어 유지도 확인해야 합니다. APK 설치는 동일 앱 ID/서명을 유지하는 업데이트 방식으로 진행합니다.
