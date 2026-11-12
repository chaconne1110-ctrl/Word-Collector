# Word Collector: Windows와 AltStore로 iPhone에 설치하기

이 빌드는 iPhoneOS용 미서명 IPA입니다. Safari에서 다운로드만으로 앱 설치가 되지 않습니다.
본인 iPhone에서 AltStore Classic / AltServer for Windows로 개인 Apple ID 서명을 시도할 수 있습니다.
공식 AltStore 안내: https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows

1. Windows에 AltServer와 Apple 공식 iTunes/iCloud를 설치합니다.
2. USB로 iPhone 연결 후 기기 신뢰, AltServer에서 AltStore 설치.
3. iPhone 설정에서 개발자 모드를 활성화합니다.
4. GitHub 릴리스 v1.1.11-iphone-unsigned-* 에서 IPA를 다운로드합니다.
5. AltStore Classic My Apps > + 에서 IPA 파일을 선택해 개인 Apple ID로 서명하고 설치합니다.
6. 무료 Apple 계정은 일반적으로 7일마다 앱 서명을 갱신해야 합니다.

주의: iPhone 실기기 작동 검증은 아직 완료되지 않았습니다. Android 데이터는 iOS와 자동 동기화되지 않으며, JSON 백업에는 IndexedDB 사진이 없습니다. 삭제/초기화하지 마세요.
TestFlight 배포는 별도 Apple Developer Program 인증서·계정과 App Store Connect 설정이 필요합니다.
Apple 계정 비밀번호를 GitHub 소스나 ChatGPT에 입력하지 마세요.
