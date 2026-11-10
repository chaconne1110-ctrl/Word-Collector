# Word Collector AI 사진 생성 — 운영 배포 절차

> 현재 운영 Worker: `word-collector-api` / 기존 D1: `word-collector-db`.
> 기존 단어 분석은 계속 유지합니다. 이번 이미지 기능만 별도 활성화합니다.
> **마이그레이션 `0001_global_daily_quota_1500.sql`을 실제 운영 D1에 실행하지 마세요.**
> 운영 D1은 최초 GitHub schema와 다르고 이미 1500회 트리거가 설정돼 있습니다.

## 1. D1에 이미지 사용량 기록 추가

PowerShell 기존 작업 폴더:
```powershell
Set-Location "C:\Users\yecha\Desktop\WordCollector_Worker_Recovery\quota1500"
Invoke-WebRequest "https://raw.githubusercontent.com/chaconne1110-ctrl/Word-Collector/feature/ai-photo-generation-20261111/cloudflare/migrations/0002_image_daily_limits.sql" -OutFile ".\image_daily_limits.sql"
npx.cmd wrangler d1 execute word-collector-db --remote --file ".\image_daily_limits.sql"
npx.cmd wrangler d1 execute word-collector-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%image%' ORDER BY name;"
```
두 테이블 (`global_daily_image_usage`, `tester_daily_image_usage`) 생성 확인. 기존 데이터는 삭제하거나 변경하지 않음.

## 2. 새 Worker 테스트 버전 업로드

```powershell
Copy-Item ".\worker.mjs" ".\worker.before-photo.mjs" -ErrorAction Stop
Invoke-WebRequest "https://raw.githubusercontent.com/chaconne1110-ctrl/Word-Collector/feature/ai-photo-generation-20261111/cloudflare/worker.mjs" -OutFile ".\worker.mjs"
$cfg = Get-Content ".\wrangler.jsonc" -Raw | ConvertFrom-Json
if (!$cfg.vars) { $cfg | Add-Member -NotePropertyName "vars" -NotePropertyValue @{} -Force }
$cfg.vars | Add-Member -NotePropertyName "ENABLE_LIVE_ANALYSIS" -NotePropertyValue "true" -Force
$cfg.vars | Add-Member -NotePropertyName "ENABLE_IMAGE_GENERATION" -NotePropertyValue "true" -Force
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "wrangler.jsonc"),
  ($cfg | ConvertTo-Json -Depth 12),
  (New-Object System.Text.UTF8Encoding($false))
)
node --check ".\worker.mjs"
npx.cmd wrangler versions upload --config wrangler.jsonc --keep-vars --strict --preview-alias photos
```
업로드만으로 현재 운영 트래픽은 바뀌지 않습니다. 업로드 출력에 Secret Name이 없으면 아직 비밀키가 빠진 테스트 버전입니다.

## 3. 새 버전에 기존 비밀키 설정 (값 공개 금지)

```powershell
npx.cmd wrangler versions secret put GEMINI_API_KEY --name word-collector-api
```
기존 Gemini API 키를 프롬프트에서만 입력합니다. GitHub나 채팅에 키를 쓰지 마세요. 이 명령으로 **새 버전 ID**가 생성됩니다. 위의 단순 업로드 버전 ID가 아니라 이 신규 버전을 확인해야 합니다.

```powershell
npx.cmd wrangler versions view <NEW_VERSION_ID> --name word-collector-api
curl.exe -sS https://<NEW_SHORT_VERSION_ID>-word-collector-api.yechan-lim-elec.workers.dev/health
```
`GEMINI_API_KEY`, `env.DB`, `ENABLE_LIVE_ANALYSIS=true`, `ENABLE_IMAGE_GENERATION=true` 와 응답 `dailyGlobalLimit:1500`, `imageGenerationEnabled:true`가 보여야 합니다. 실제 Gemini 이미지 생성 성공까지는 공개 Health로 검증되지 않습니다.

## 4. 운영 전환

모든 버전 설정을 확인한 뒤에만:
```powershell
npx.cmd wrangler versions deploy "<NEW_VERSION_ID>@100%" --name word-collector-api --yes
curl.exe -sS https://word-collector-api.yechan-lim-elec.workers.dev/health
```
작동 중인 v1.1.9 앱에서 전공 단어 1개를 대상으로 수동 사진 생성을 눌러 실물 검증합니다. 에러가 나면 오류 문자열 및 Cloudflare의 Logs만 공유하고 비밀키와 테스터 토큰은 공유하지 마세요.

## 비용·저장 정책

- 텍스트 분석은 종전 **100회/테스터, 1500회/전체** 유지.
- 이미지 별도 **100회/테스터, 1500회/전체**. 실패한 Google 요청도 제한 횟수에 포함.
- 이미지 모델: `gemini-3.1-flash-lite-image`, 별도 유료 요금 발생. 버튼을 누를 때만 호출.
- 성공한 사진은 앱의 IndexedDB에 JPG로 저장, 기존 도해는 그대로 유지.
- **백업 JSON v1에는 JPG가 포함되지 않습니다.** 앱 삭제 또는 데이터 초기화 전 이미지 내보내기 별도 구현 필요.
- **디버그 APK 서명이 달라질 수 있으므로 기존 앱 삭제 전 반드시 단어/북마크 백업 확인.**
- 실제 Android+Gemini 유료 이미지 요청은 배포 후 수동 검증 필요.
