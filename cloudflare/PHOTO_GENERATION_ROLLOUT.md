# AI 학습 사진 — 현재 운영 상태 및 후속 배포

> 2026-11-11 KST 기록. 이 문서는 이미 운영 서버에 적용된 개발 결과를 관리하기 위한 것입니다.

## 운영 검증 기록

| 항목 | 운영 확인 |
|---|---|
| Cloudflare Worker | `word-collector-api` |
| 현재 검증된 Worker version | `0e0be96b-15c9-4bef-883d-7a05263dc8cd` |
| 직전 Worker version | `a38584e5-4d21-4b90-9ef2-8c6d95817ba3` (이미지 요청 HTTP 400 오류) |
| 이미지 추가 전 기준 version | `e7abf9ab-2b2a-4338-a100-d4fb675823c2` (정상 텍스트 분석) |
| D1 database | `word-collector-db`, binding `DB` |
| `GEMINI_API_KEY` | Cloudflare secret, 값은 소스에 없음 |
| `ENABLE_LIVE_ANALYSIS` | `true` |
| `ENABLE_IMAGE_GENERATION` | `true` |
| 단어 분석 | 100회/테스터/일, 1,500회/전체/일 |
| 이미지 생성 | 100회/테스터/일, 1,500회/전체/일 (별도 집계) |
| API 검증 | 운영 `/health` 정상, 앱에서 단어 분석·사진 생성 성공 |

- 최초 이미지 생성 요청은 Google HTTP 400으로 실패했습니다.
- 원인 후보였던 잘못된 `generationConfig.responseFormat.image` 구성을 `generationConfig.imageConfig`로 수정했습니다.
- 수정 버전을 운영 트래픽 100%에 배포한 후, **사용자가 Android 앱에서 실제 사진 생성 성공을 확인**했습니다.
- GitHub 변경 브랜치: `feature/ai-photo-generation-20261111`. 코드 버전은 운영 수정본을 반영합니다.
- 사진 출력은 앱 내에서 단어별 JPG로 압축되어 IndexedDB에 저장됩니다. 이미지 자체와 로컬 단어장은 GitHub 저장소에 자동 저장되지 않습니다.

## 중요한 배포 안전 조건

**현재 이미지 관련 SQL은 운영 D1에 이미 적용 완료**입니다. 따라서 다음 작업에서 아래 파일을 **다시 실행할 필요가 없습니다**:

- `cloudflare/migrations/0001_global_daily_quota_1500.sql` — 운영 DB의 현재 스키마와 차이가 있으므로 실행하지 마세요.
- `cloudflare/migrations/0002_image_daily_limits.sql` — 2026-11-11 생성 완료. 수정이 필요하다면 현존하는 테이블과 트리거부터 조회해 점검하세요.

운영 중인 테이블·트리거·테스터 정보·기존 사용량 데이터를 삭제하지 마세요.

## 후속 Worker 소스 수정 및 배포 방법

1. GitHub 개발 브랜치에서 `cloudflare/worker.mjs`를 수정하고 커밋합니다. `main`은 유지합니다.
2. `cloudflare/wrangler.photo.example.jsonc`를 `cloudflare/wrangler.local.jsonc`로 복사해 기존 D1 ID를 채웁니다. `wrangler.local.jsonc`는 Git 제외 대상입니다.
3. 로컬에서 `node --check cloudflare/worker.mjs`와 `node --test cloudflare/*.test.mjs`로 점검합니다.
4. 기존 Worker를 바로 덮어쓰지 말고 **새 버전을 업로드**합니다.
5. 새 버전에서 `GEMINI_API_KEY` secret, `DB` binding, 분석 및 사진 활성화 변수를 조회하고, Preview `/health`를 확인합니다. 버전에 secret이 있으면 재발급/재입력하지 마세요.
6. 정상 확인 후에만 명시적으로 운영 배포합니다. 배포 결과와 롤백 가능한 직전 버전 ID를 기록합니다.
7. 앱에서 실제 사진 1장 생성 및 같은 단어 재열기(저장 재사용)를 별도 테스트합니다. 실제 API 호출은 과금되고 이미지 사용량도 증가할 수 있습니다.

### PowerShell 예시 (프로젝트 저장소 루트)

```powershell
Copy-Item .\cloudflare\wrangler.photo.example.jsonc .\cloudflare\wrangler.local.jsonc
# 여기서 cloudflare/wrangler.local.jsonc에 기존 D1 database_id를 입력
node --check .\cloudflare\worker.mjs
node --test .\cloudflare\image.test.mjs .\cloudflare\worker.test.mjs

npx.cmd wrangler versions upload --config .\cloudflare\wrangler.local.jsonc --keep-vars --strict --preview-alias photos-review
# 새 업로드의 Worker Version ID를 기록
npx.cmd wrangler versions view <NEW_VERSION_ID> --config .\cloudflare\wrangler.local.jsonc
curl.exe -sS https://photos-review-word-collector-api.yechan-lim-elec.workers.dev/health

# 운영 배포는 미리보기 확인을 마친 뒤에만:
npx.cmd wrangler versions deploy "<NEW_VERSION_ID>@100%" --config .\cloudflare\wrangler.local.jsonc --yes
```

`<NEW_VERSION_ID>`는 새 업로드에서 실제로 표시된 ID로 교체합니다. 운영 배포는 실사용자 요청에 영향을 미칩니다. API 키나 테스터 토큰을 명령 인자·문서·GitHub 이슈·채팅에 붙여넣지 마세요.

## 출시 전 해결할 남은 작업

- 백업 JSON v1에 IndexedDB JPG가 포함되지 않으므로 **사진 백업/복원 기능** 추가.
- 실제 사용량과 지출을 모니터링하고, 이미지 생성 건수에 맞춰 선불 충전 잔액 관리.
- 디버그 빌드의 서명/정식 릴리스 업그레이드 경로 검증.
- 테스트 결과를 보존하되, 단어장·북마크 데이터를 잃는 설치/삭제 방식은 피할 것.

이미지와 텍스트 사용량은 **각각** 개인 100회/일, 전체 1,500회/일이며, 200명에게 각 100회가 보장된다는 뜻은 아닙니다. 전체 한도가 먼저 소진되면 추가 생성은 차단됩니다.
