# Word Collector — 현재 수정 가능한 Android 앱 소스

> **작업 브랜치:** `feature/ai-photo-generation-20261111`  
> **운영 확인:** 2026-11-11 (KST), Android 단어 분석 및 AI 사진 생성 성공 (사용자 실기기 확인).  
> **안전 원칙:** `main`은 변경하지 않으며, 개발 브랜치에서 소스 파일을 수정하고 검증합니다.

## 현재 동작과 개발 상태

- HTML/CSS/JavaScript + Capacitor 8 기반 Android 앱, 앱 ID: `com.yechan.wordcollector`
- 전공 단어장 관리, 단어 추가·수정, 북마크, 플래시카드
- Cloudflare Worker + D1 인증형 Gemini 단어 분석 및 이미지 생성
- 텍스트 분석: **1인 하루 100회 / 전체 하루 1,500회**
- AI 이미지 생성: **1인 하루 100회 / 전체 하루 1,500회** (텍스트 분석과 **별도 집계**)
- 이미지 생성 모델: `gemini-3.1-flash-lite-image`; 정사각형 이미지 한 장을 요청하고 앱은 JPG로 저장
- 저장된 AI 이미지는 단말 IndexedDB에 보관해 플래시카드에서 오프라인 재표시
- 실제 모바일 이미지 생성: 최초 Google API HTTP 400 오류를 `generationConfig.imageConfig`로 수정한 후 성공

**아직 남은 과제:** 현재 JSON 백업/복원은 이미지 저장소(IndexedDB)를 포함하지 않습니다. APK 삭제, 기기 변경, 앱 데이터 초기화 전에는 이미지를 별도 보존해야 합니다. GitHub Actions는 디버그 서명 APK를 생성하며 정식 배포 서명/기존 APK와의 덮어쓰기 호환성은 보장되지 않습니다.

## 수정할 주요 소스

| 수정 목적 | 위치 |
|---|---|
| 홈, 단어장, 플래시카드 표시·동작 | `www/index.html`, `www/words.html`, `www/flashcard.html`, `www/app.js` |
| 단어 분석 화면 및 검수·사진 미리보기 | `www/quick_capture/code.html`, `www/quick_capture/analysis.js` |
| Cloudflare API 요청과 Android 보안 토큰 처리 | `www/analysis-api.js` |
| 이미지 저장 및 JPG 변환 | `www/photo-store.js` |
| 서버 Gemini 텍스트·이미지 생성, 인증 및 사용량 제한 | `cloudflare/worker.mjs` |
| Cloudflare D1 이미지 사용량 테이블 및 제한 | `cloudflare/migrations/0002_image_daily_limits.sql` |
| Worker 이미지 API 회귀 테스트 | `cloudflare/image.test.mjs`, `cloudflare/worker.test.mjs` |
| Android 네이티브 프로젝트 | `android/`, `capacitor.config.json` |
| 자동 테스트·APK 빌드 및 공개 테스트판 | `.github/workflows/build-wordcollector-photo-preview.yml` |
| Cloudflare 배포 기록·안전 절차 | `cloudflare/PHOTO_GENERATION_ROLLOUT.md` |

과거 Flutter 및 Supabase 실험 파일(`lib/`, `supabase/`)은 현재 Capacitor APK의 실행 경로와 다릅니다. 이력을 지우거나 현재 앱 소스로 혼동하지 마세요.

## GitHub에서 직접 수정하는 방법

1. [개발 브랜치](https://github.com/chaconne1110-ctrl/Word-Collector/tree/feature/ai-photo-generation-20261111)를 엽니다.
2. 위 표에서 파일을 선택합니다.
3. 우측 연필 아이콘 **Edit this file**로 수정합니다.
4. **Commit changes**에서 현재 개발 브랜치에 커밋합니다. `main`을 선택하지 마세요.
5. 해당 브랜치의 [Draft Pull Request #10](https://github.com/chaconne1110-ctrl/Word-Collector/pull/10)에서 변경 내용을 검토합니다. 사용자 승인 없이 `main`으로 병합하지 않습니다.

Windows VS Code / Codex에서도 브랜치를 체크아웃해 수정할 수 있습니다.

```powershell
git clone https://github.com/chaconne1110-ctrl/Word-Collector.git
cd Word-Collector
git switch feature/ai-photo-generation-20261111
npm ci
node --test tests/*.test.cjs server/test/*.test.cjs cloudflare/*.test.mjs
npx.cmd cap sync android
```

Android SDK/JDK가 구성된 PC에서는 `cd android` 후 `.\gradlew.bat assembleDebug`로 디버그 APK를 빌드할 수 있습니다. GitHub Actions에서도 자동 테스트와 APK 빌드를 수행합니다.

## Cloudflare 운영 환경

**운영 Worker:** `word-collector-api`  
**D1:** `word-collector-db` (binding: `DB`)  
**마지막 이미지 HTTP 400 수정 및 성공한 서버 버전:** `0e0be96b-15c9-4bef-883d-7a05263dc8cd`

설정값:

- `ENABLE_LIVE_ANALYSIS=true`
- `ENABLE_IMAGE_GENERATION=true`
- `GEMINI_API_KEY`는 **Cloudflare Secret**으로만 관리, GitHub·클라이언트·환경 설정 JSON에 절대 기록하지 않습니다.
- `cloudflare/wrangler.photo.example.jsonc`는 수정 가능한 **공개 설정 템플릿**입니다. 실제 D1 ID와 환경에 맞게 로컬 파일로 복사하십시오.
- 배포 전에 `cloudflare/PHOTO_GENERATION_ROLLOUT.md`를 확인하십시오. **이미 운영 D1에 적용된 0001/0002 마이그레이션을 무심코 재실행하지 마세요.**
- Worker 소스 변경은 GitHub 업로드만으로 운영 서버에 자동 반영되지 않습니다. 버전 업로드 → 비밀키·바인딩 확인 → 프리뷰 점검 → 명시적 운영 배포를 따릅니다.

## 보안과 데이터 보호

- 테스터 토큰은 Android Keystore 기반 저장소에서 관리합니다. 토큰·Google API 키·선불 결제 정보는 커밋하지 마세요.
- 단어장/북마크 사용자 데이터와 실제 AI 생성 JPG는 **GitHub에 자동 업로드되지 않습니다**. 소스코드만 버전 관리합니다.
- 이미지 API는 추가 과금이 발생하므로 테스트에서는 소량의 단어만 수동으로 생성하십시오.
- 기존 앱을 삭제하기 전에는 JSON 백업을 보존하고, 이미지 백업은 현재 별도 과제임을 인지하십시오.

## 검증 링크

- [이미지 수정 코드 자동 테스트 및 APK 빌드 성공](https://github.com/chaconne1110-ctrl/Word-Collector/actions/runs/42877147133)
- [코드 변경 검토 — PR #10](https://github.com/chaconne1110-ctrl/Word-Collector/pull/10)
