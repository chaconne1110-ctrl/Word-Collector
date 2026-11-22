# "AI로 더 정확하게 고르기" 배포 안내 (V11.22)

PDF·사진에서 단어 찾기 화면에서, 기기에서 읽은 영어 글을 분석 서버로 보내 **Gemini가 전공 용어와 여러 단어로 된 용어**(예: plasmonic effect, chemical vapor deposition)를 고르게 하는 기능입니다. 코드는 준비됐고, **소유자가 비용을 확인한 뒤 서버를 배포하고 켜야** 동작합니다. 켜기 전까지 앱 버튼은 "아직 사용할 수 없어요"라고 안내하고, 기존 기능은 그대로 동작합니다.

## 동작

| 항목 | 내용 |
|---|---|
| 요청 | `POST /api/scan-terms` (`word-collector-api-v3`만) · 본문 `{text, mode: "all"\|"major", field?}` |
| 보내는 것 | 기기에서 읽은 **영어 글만** (최대 12,000자). 사진·PDF 파일은 보내지 않음 |
| 사용자 동의 | 버튼을 누르면 "읽은 글이 서버로 전송되고, 하루 분석 1회가 쓰여요" 확인 창 |
| 모델 | 단어 분석과 같은 `gemini-4-hydrogen`, 같은 중계 서버, 생각 수준 medium |
| 하루 횟수 | 요청 1번 = 단어 분석 1회 (기기당 200회 안에서). 실패하면 개인 횟수는 돌려줌 |
| 지어낸 단어 막기 | Gemini가 고른 용어 중 **보낸 글에 실제로 있는 것만** 돌려줌. 횟수·원문 문장은 서버가 글에서 직접 찾음 |
| 켜고 끄기 | 환경 변수 `ENABLE_SCAN_TERMS=true`일 때만 동작 (없으면 503, 횟수·Gemini 사용 없음) |

## 바뀐 파일

- 서버: `cloudflare/scan-terms.mjs`(새 파일: 입력 검사·Gemini 지시문·용어 확인), `cloudflare/worker.mjs`(경로 추가, `pickScanTerms`), `cloudflare/scan-terms.test.mjs`(테스트)
- 앱: `www/analysis-api.js`(`WordCollectorAI.scanTerms`), `www/quick_capture/scan.html`·`scan.js`(버튼, "AI 추천" 목록)
- 원래 서버(`word-collector-api`)와 기존 `/api/analyze`, `/api/image`는 바뀌지 않음

## 배포 (소유자)

```bash
git checkout V11.22            # 또는 이 변경이 합쳐진 브랜치
node --check cloudflare/worker.mjs
node --test cloudflare/*.test.mjs
npx wrangler@4 deploy -c cloudflare/deploy/wrangler.v3.jsonc --keep-vars
```

배포만 해서는 **꺼진 상태**입니다(`wrangler.v3.jsonc`에 `ENABLE_SCAN_TERMS`가 없음). 켜려면 둘 중 하나:

1. Cloudflare 대시보드 → Workers → `word-collector-api-v3` → Settings → Variables에 `ENABLE_SCAN_TERMS` = `true` 추가 (다시 배포할 때 `--keep-vars`로 유지됨), 또는
2. `cloudflare/deploy/wrangler.v3.jsonc`의 `vars`에 `"ENABLE_SCAN_TERMS": "true"`를 넣고 다시 배포

끄려면 그 값을 지우거나 `false`로 바꾸면 됩니다(코드 되돌리기 필요 없음).

배포 후 확인: 앱에서 PDF나 사진을 읽고 "AI로 더 정확하게 고르기" → "AI 추천" 목록이 나오면 정상.

## 비용 어림

요청 1번에 Gemini 호출 1번입니다. Google 가격표(gemini-4-hydrogen의 입력·출력 토큰 단가)로 계산하세요.

- 입력: 지시문 약 600토큰 + 보낸 글(영어 약 4글자 = 1토큰, 최대 12,000자 ≈ 3,000토큰)
- 출력: 용어 목록 최대 80개 ≈ 수백~1,000토큰 + 생각(thinking) 토큰
- 한 장짜리 사진은 보통 글이 1,000~3,000자라 입력 1,000토큰 안팎입니다.
- 하루 최대 사용량은 기존 단어 분석 한도(기기당 200회, 전체 1,500회)에 함께 묶입니다.
