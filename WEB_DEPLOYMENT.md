# Word Collector 웹 배포

배포 완료 후 기본 주소: **https://chaconne1110-ctrl.github.io/Word-Collector/**

이 주소는 GitHub Pages의 기본 배포 대상이다. 커밋/푸시만으로 공개 사이트가 활성화됐다고 가정하지 않는다. Actions의 배포 성공과 주소 접속을 확인해야 한다. 기존 앱 UI와 `www`를 그대로 배포하며 APK, Gemini 키, 테스터 코드, Worker 서버 소스는 웹 배포 파일에 포함하지 않는다.

## 최초 활성화

1. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택한다.
2. **Settings → Environments → github-pages**에 배포 브랜치 제한이 있다면 `feature/cloudflare-gemini35`를 허용한다. 기존 제한을 모두 해제하지 않는다.
3. **Actions → Deploy Word Collector web → Run workflow**에서 `feature/cloudflare-gemini35`를 선택하여 실행한다. 최초 push 때 이미 성공했다면 다시 실행할 필요 없다.
4. 성공한 실행의 `github-pages` 배포 주소를 열어 홈 화면을 확인한다. 기본 주소는 위 링크이며 커스텀 도메인이 설정되어 있으면 Actions가 반환한 주소를 사용한다.

GitHub 요금제/저장소 공개 범위가 Pages를 지원해야 한다. Pages를 활성화하기 위해 저장소를 임의로 공개로 변경하지 않는다. 이 작업에서는 GitHub 설정 API가 Forbidden이므로 활성화 상태와 원격 Actions 결과를 읽지 못했다.

이후 해당 작업 브랜치에서 `www` 또는 배포 workflow가 변경되어 push되면 자동 배포한다. main과 기존 Android 앱 배포는 변경하지 않는다.

## Gemini 분석 연결

웹 화면과 Gemini 분석 서버는 별도 배포다. 웹앱의 단어 추가 → **AI 서버 · 테스터 인증**에서 Cloudflare HTTPS를 선택하고 발급받은 테스터 코드를 등록한다. Gemini API 키를 입력하지 않는다.

Worker CORS에 `https://chaconne1110-ctrl.github.io`를 정확한 출처로 추가했다. **이 Worker 변경도 운영에 배포되어야 웹에서 분석 요청이 가능하다.** 기존 `CLOUDFLARE_GEMINI_VALIDATION.md`의 배포 절차를 따른다. 인증·개인 100회/전체 1,000회 제한·모델 고정은 유지된다.

기존 로컬 서버와 APK의 저장 단어는 브라우저 사이트로 자동 이전되지 않는다. 필요한 경우 기존 앱의 백업을 내보내고 웹앱의 백업·복원 기능으로 가져온다. 기존 앱 삭제나 데이터 초기화는 필요 없다. 웹에서 입력한 테스터 코드는 화면을 떠나면 지워진다.

## 검증 범위

- 공개 웹 주소의 CORS preflight 및 비허용 출처 차단을 Worker 단위 테스트로 확인한다.
- GitHub Pages의 `/Word-Collector/` 하위 경로를 로컬로 재현하여 홈·단어 추가·북마크·출력 이동과 분석 결과 저장을 검사한다. Gemini 응답은 모의 응답이다.
- Pages 운영 배포, 실제 접속, 운영 Worker 변경 반영, 실제 Gemini 분석은 각각 원격 확인이 필요하며 로컬 검사 통과로 대체하지 않는다.

현재 실행 결과: Worker 테스트 14개 통과, Pages 하위 경로의 Chromium 메뉴·인증·저장 회귀 검사 통과, workflow YAML 검사 통과. 공개 주소 접속은 실행 환경 프록시의 CONNECT 403으로 차단되어 확인하지 못했다. GitHub 설정 API도 Forbidden이므로 Pages 활성화와 Actions 배포 성공을 확인 완료로 표시하지 않는다.
