# Word Collector 웹 프로토타입

웹 배포 대상 주소: **https://chaconne1110-ctrl.github.io/Word-Collector/**

최초 GitHub Pages 활성화와 배포 확인 방법은 저장소의 [WEB_DEPLOYMENT.md](../WEB_DEPLOYMENT.md)를 참고하세요. 배포 완료 전에는 위 주소가 열리지 않을 수 있습니다. 기존 화면과 데이터 저장 방식은 유지됩니다.

압축을 풀고 `stitch_ui_ux` 폴더에서 터미널을 연 뒤 로컬 서버를 실행하세요.

- Windows에서 Python을 설치한 경우 `py -m http.server 8000`
- macOS 또는 Linux에서 `python3 -m http.server 8000`

브라우저에서 `http://localhost:8000`을 열면 단어장 목록부터 시작합니다. 브라우저에 동일한 주소로 접속하면 단어 수정과 북마크 상태가 유지됩니다. 기존 디자인은 Tailwind CDN과 Google Fonts를 사용하므로 미리보기에 인터넷 연결이 필요합니다.

전자기학 5개와 회로이론 4개는 내보내기 파일에 들어 있던 예시 단어입니다. 전기기기와 반도체공학 단어장은 원본에 실제 단어 데이터가 없어 빈 목록으로 열립니다. 카드 뒷면은 원본에 포함된 예문과 도해를 사용합니다.

수정 범위는 홈, 단어 목록, 북마크, 플래시카드, 단어 수정과 그 사이의 이동입니다. 단어 추가, 출력, AI 분석은 내보내기에 포함된 별도 화면입니다. 데이터는 브라우저에 저장됩니다.
