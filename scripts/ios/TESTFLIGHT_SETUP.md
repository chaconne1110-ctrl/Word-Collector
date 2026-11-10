# Word Collector 아이폰 TestFlight 설치

GitHub Actions에서 macOS/Xcode를 이용해 실제 iPhone용 IPA를 서명하고 TestFlight에 업로드합니다. **현재 Apple 배포 서명 자격증명은 아직 구성되지 않아, iPhone 설치용 빌드는 생성되지 않았습니다.**

## 필요 조건
1. Apple Developer Program 가입 및 배포 권한.
2. Apple Developer에서 `com.yechan.wordcollector` Bundle ID 등록, App Store Connect에 Word Collector 앱 생성.
3. Apple Distribution 배포 인증서와 개인 키가 든 .p12 및 비밀번호, 동일 App ID의 App Store Connect .mobileprovision 프로파일.
4. App Store Connect API 키(.p8), Key ID, Issuer ID.

## GitHub 설정
저장소 → Settings → Secrets and variables → Actions

Secrets:
- `IOS_DISTRIBUTION_P12_BASE64`: .p12 파일의 Base64 인코딩
- `IOS_DISTRIBUTION_P12_PASSWORD`: .p12 비밀번호
- `IOS_APPSTORE_PROFILE_BASE64`: .mobileprovision Base64 인코딩
- `IOS_TEAM_ID`: Apple Team ID
- `APPSTORE_API_PRIVATE_KEY`: AuthKey_*.p8 파일 내용 전체

Variables:
- `APPSTORE_API_KEY_ID`: App Store Connect API Key ID
- `APPSTORE_ISSUER_ID`: App Store Connect Issuer ID

Windows PowerShell 인코딩 예제:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\certificate.p12'))
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\profile.mobileprovision'))
```

**인증서·개인키·비밀번호를 GitHub 코드, 이슈, 채팅에 보내지 마세요.** GitHub Secrets에만 등록하십시오.

## 배포 및 iPhone 설치
1. GitHub 설정이 완료되면 `feature/ai-photo-generation-20261111` 브랜치의 `scripts/ios/` 파일을 수정하여 커밋합니다.
2. GitHub Actions에서 `iPhone TestFlight signed build`의 최신 실행을 확인합니다. 미설정 자격증명이 있으면 `testflight` Job은 건너뜁니다.
3. 서명 및 업로드가 성공해도 Apple의 빌드 처리 완료가 필요합니다. App Store Connect의 TestFlight에서 베타 그룹에 빌드를 지정해 초대합니다.
4. iPhone에 Apple TestFlight 앱을 설치한 후 해당 초대를 수락하면 Word Collector를 다운로드할 수 있습니다. 외부 테스터에게는 첫 빌드 베타 심사가 필요할 수 있습니다.

`workflow_dispatch`는 기본 브랜치에 워크플로 파일이 존재해야 실행할 수 있으므로, main 병합 없이 계속 개발할 때는 작업 브랜치의 push로 실행하십시오.

TestFlight용 IPA는 Safari에서 내려받는 것만으로 설치할 수 없습니다. Ad Hoc 배포를 선택하려면 별도의 등록 기기 UDID와 Ad Hoc 서명이 필요합니다.

Android 프로젝트, 기존 데이터와 main 브랜치는 변경하지 않습니다. Android와 iOS 간 데이터 자동 동기화는 제공하지 않으며, AI 사진(IndexedDB)은 JSON 백업에 포함되지 않습니다.
