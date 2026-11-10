# PR #3 병합 충돌 해결

대상: https://github.com/chaconne1110-ctrl/Word-Collector/pull/3

- PR 브랜치: `feature/word-collector-mvp-20261104`
- 반영한 main: `e70c3ac38d362390cef05e04636e8230db55502d`
- 원인: 과거 Flutter AndroidManifest에 INTERNET 권한/앱 이름을 추가한 변경과, main의 Capacitor AndroidManifest 전환이 같은 파일에서 충돌했다.
- 해결: main을 PR 브랜치에 병합하고 Manifest는 main의 Capacitor 설정을 그대로 보존했다. App ID, FileProvider, INTERNET 권한, 기존 HTML/CSS/JS, 네 개 메뉴, 저장 데이터 구조는 변경하지 않았다.
- 추가 CI 문제: main에는 pubspec.yaml/Flutter 앱 진입점이 없는데 기존 mvp-android.yml은 flutter pub get/build를 실행했다. 현재 앱의 npm ci → Node 테스트 → Capacitor sync → JDK 21/Android Gradle debug 빌드로 전환했다. 과거 Flutter/Supabase 실험 소스는 현재 앱/배포에 연결하지 않았다.
- Pages: 기존 workflow는 작업 브랜치만 허용해 main에서 수동 실행해도 job이 건너뛰어졌다. main push/수동 실행도 허용했다. main에는 이 PR을 병합한 후 적용된다.

## 실행 결과

- Node/Worker/workerd/D1 테스트 40개 통과, 실패/건너뜀 0개.
- Pages 하위 경로를 재현한 Chromium 네 개 메뉴·HTTPS 모의 인증·결과 저장·기존 단어/북마크 보존 검사 통과.
- Manifest XML, App ID, webDir, server.url 없음 확인.
- 두 workflow YAML 파싱 및 Capacitor 빌드/main Pages 조건 검사 통과.
- npm ci, cap sync android 통과.
- Android assembleDebug 성공 (93 tasks; JDK 21, SDK 36, max-workers=2).
- 기존 앱/실기기에는 설치하지 않았다. 실제 Gemini·Supabase 실험 기능은 이번 작업에서 검증하지 않았다.
- main과 PR의 기존 실험 소스에 대한 기능 통합/운영 배포까지 완료했다는 의미는 아니다. 이 작업은 Git 충돌과 현재 앱 빌드 경로를 해결한다. PR 자체를 자동 병합하지 않는다.

## Pages 외부 권한 제한

기존 GitHub 인증으로 Pages 생성 API를 실제 요청했으나 Forbidden이었다. Pages 설정 화면도 접근하지 못했으며 사용할 수 있는 공유 브라우저 제어 도구가 없었다. 사용자 계정 로그인이나 관리자 권한을 대신 만들지 않았다.

저장소 관리자가 https://github.com/chaconne1110-ctrl/Word-Collector/settings/pages 에서 Source를 GitHub Actions로 선택한 뒤 Deploy Word Collector web workflow를 실행해야 한다. 공개 범위를 변경하거나 API 키를 새로 제공할 필요는 없다. 세부 절차는 WEB_DEPLOYMENT.md를 따른다.
