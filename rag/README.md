# 전기공학 자료 근거 (RAG) — 자료 등록 안내

단어 분석 때 등록된 전기공학 교재에서 근거를 찾아 "근거 보기"에 보여 줍니다.
모델 재학습이 아니라 **Gemini File Search**로 저장 자료를 검색합니다.

## 구성

| 부분 | 파일 | 하는 일 |
|---|---|---|
| 자료 목록 | `rag/sources.json` | 제목·저자·원문 URL·라이선스·판(版)·확인일·파일 해시·제외 요소 |
| 자료 등록 (관리자, 1회) | `rag/register.mjs` | File Search 저장소 만들기/재사용 → PDF 업로드(중복 방지) → 색인 완료 확인 → 시험 검색 → 쪽별 원문 텍스트(D1) |
| 질문 처리 (매 분석) | `cloudflare/rag.mjs` | 단어·전공·참고 문장으로 검색 → 근거 판정·원문 대조 → `evidence` |
| 화면 | `www/evidence.js` | 검수 화면과 플래시카드의 "근거 보기" |

사용자가 단어를 분석할 때는 PDF를 올리지 않습니다. 검색은 기존 분석과 같은 경로(Worker → 미국 중계 서버 → `generateContent`)로 하고, API 키는 서버(Cloudflare 비밀값)에만 있습니다.

## 등록 자료와 라이선스 (2026-11-17 확인)

| 자료 | 라이선스 | 판 | 비고 |
|---|---|---|---|
| Lessons In Electric Circuits, Volume I - DC (Tony R. Kuphaldt) | CC BY 4.0 (PDF 부록 A-3.1) | 5판, 2021-11-06 최종 수정 | 등록 |
| Lessons In Electric Circuits, Volume II - AC (Tony R. Kuphaldt) | CC BY 4.0 (PDF 부록 A-3.1) | 6판, 2021-11-06 최종 수정 | 등록. 그림 13.10·13.11(PDF 429–430쪽)은 Westclox History 허가 자료라 CC BY 아님 → 인용하지 않음 |
| University Physics Volume 2 (OpenStax) | CC BY-NC-SA 4.0 (프로젝트 소유자 확인, 여기서는 재확인 못 함) | – | 이용 조건이 달라 등록하지 않음 |

앱 표시 방식(2026-11-17 변경): 앱은 자료 원문·자료명·저자·쪽수·링크·라이선스를 **보여 주지 않습니다.** 등록 자료를 참고해 AI가 새로 쓴 설명만 보여 주고(원문과 연속 8단어 이상 같으면 버림), 원문을 앱에 싣지 않으므로 CC BY의 출처 표시 조건이 적용되지 않습니다. 어떤 자료의 몇 쪽을 근거로 했는지는 서버 기록(D1 `rag_cache`, 단어집 `references`)에만 남습니다.

## 논문 추가하기 (전기 10편, 반도체 10편 예정)

논문마다 `sources.json`의 `sources`에 아래처럼 한 항목을 넣고, 같은 `id`로 `cloudflare/rag-catalog.mjs`에도 추가합니다
(테스트가 두 목록이 같은지 확인합니다). 저작권 정보는 **서버와 이 저장소에만 기록**하며 앱에는 표시하지 않습니다.
앱에는 등록 자료를 참고해 AI가 새로 쓴 뜻·정의·예문과 설명만 나가고, 자료 원문·제목·쪽수·링크·라이선스는 나가지 않습니다
(원문과 연속 8단어 이상 같은 AI 문장은 버림).

```json
{
  "id": "paper-elec-01",                 // 영문 소문자·숫자·하이픈
  "register": true,                      // RAG에 쓸 수 있다고 확인된 것만 true
  "type": "paper",
  "field": "전기공학",                   // 또는 "반도체"
  "file": "paper-elec-01.pdf",           // --pdf-dir 폴더 안의 파일 이름
  "title": "...", "authors": "...", "journal": "...", "year": 2024,
  "doi": "10.xxxx/...", "url": "https://doi.org/10.xxxx/...",
  "license": "CC BY 4.0", "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "licenseEvidence": "라이선스를 확인한 곳 (논문 첫 쪽 표기, 출판사 페이지 등)",
  "publisherTerms": "텍스트 마이닝·AI 서비스 이용에 대한 출판사 조건 (확인 결과)",
  "copyright": "© 2024 저자 (논문 표기 그대로)",
  "checkedAt": "YYYY-MM-DD",
  "sha256": "...", "sizeBytes": 0, "pdfPages": 0,
  "restrictedElements": []               // 제3자 저작물 그림·표가 있는 쪽 {"pdfPages": [..], "description": ".."}
}
```

논문을 넣으면 Claude에게 "논문 확인해줘"라고 요청하세요. 각 논문의 라이선스와 출판사 조건을 다시 확인하고 위 항목을 채웁니다.

## Markdown 자료

`"format": "markdown"` 자료(예: GitHub 반도체 교재)는 `--pdf-dir` 폴더 안의 `"dir"` 폴더에서 읽는다. 폴더 전체 해시
(`contentSha256`, 단어집 프로그램과 같은 계산)로 판본을 확인하고, `skipFiles`를 뺀 .md 파일을 한 문서(text/plain)로 묶어
등록한다. 원문 대조용 쪽 데이터는 파일 하나를 한 쪽으로 만든다(PDF 쪽 = 파일 순번, 인쇄 쪽 = 파일 경로).

## 처음 등록하기

준비물: Node.js 22 이상, Worker와 **같은 Google 프로젝트**의 Gemini API 키, `wrangler` 로그인(D1 등록용).

```bash
# 1) D1 표 만들기 (한 번)
npx wrangler d1 execute word-collector-db --remote --file cloudflare/migrations/0005_rag_evidence.sql

# 2) 등록 스크립트 (키는 화면에 출력되지 않습니다)
cd rag
npm install
GEMINI_API_KEY=여기에_키 node register.mjs --d1
#   Windows PowerShell:  $env:GEMINI_API_KEY="여기에_키"; node register.mjs --d1
```

스크립트가 하는 일과 출력:
1. 저장소 `word-collector-electrical-v1`을 찾고, 없으면 만듭니다 (같은 이름이 2개면 중단).
2. 각 PDF를 내려받아 SHA-256을 `sources.json`과 비교합니다. 다르면 원문이 바뀐 것이므로 중단합니다 → 라이선스 재확인 후 `sources.json` 갱신.
3. 같은 해시의 문서가 이미 **활성(ACTIVE)** 이면 업로드를 건너뜁니다 (중복 방지). 실패(FAILED)한 이전 등록은 지우고 다시 올립니다.
4. 색인이 끝날 때까지 기다리고(최대 20분), 활성 상태를 확인합니다.
5. 실제 File Search 시험 검색("What is electric current?")에서 등록 자료 인용이 돌아오는지 확인합니다 → `검색 준비 완료` 출력.
6. PDF 쪽별 원문 텍스트를 `rag/out/rag-pages.sql`로 만들고 `--d1`이면 D1에 넣습니다 (원문 대조·쪽수 확인용).
7. 마지막 줄의 `RAG_FILE_SEARCH_STORE = fileSearchStores/...` 값을 Worker 설정(vars)에 넣고 배포합니다.

상태만 다시 확인: `node register.mjs --check-only`

### 실패했을 때 (출력의 앞부분 코드)

| 코드 | 원인 / 할 일 |
|---|---|
| `NO_API_KEY` | `GEMINI_API_KEY` 환경변수를 설정하세요 |
| `DOWNLOAD_FAILED` | 원문 주소 접속 실패. `--pdf-dir 폴더`로 미리 받은 PDF를 쓸 수 있습니다 |
| `SOURCE_CHANGED` | 원문 파일이 바뀜. 라이선스·내용 확인 후 `sources.json` 해시 갱신 |
| `UPLOAD_FAILED` | 업로드/색인 오류 (메시지에 Google 오류 포함: 권한, 용량, 파일 형식 등) |
| `INDEX_TIMEOUT` / `STILL_INDEXING` | 색인 진행 중. 잠시 후 `--check-only` |
| `INDEX_NOT_ACTIVE` / `STORE_HAS_FAILED_DOCUMENTS` | 색인 실패. 다시 실행하면 실패 문서를 지우고 재업로드 |
| `NO_CITATIONS` / `SEARCH_FAILED` | 시험 검색에서 등록 자료 인용이 없음/검색 오류 |
| `D1_IMPORT_FAILED` | 0005 마이그레이션 적용 여부, `wrangler login` 확인 |

## 질문 처리 규칙 (`cloudflare/rag.mjs`)

- 대상: **전공 의미 + 전기/전자/회로/전력 분야**일 때만 검색합니다. 일반 의미·다른 분야는 `자료 근거 미확인`.
- 최신 규정·안전 기준(KEC, NEC, IEC, "안전 기준", "규정" 등)이 들어간 입력은 교재(2021년 판)를 근거로 쓰지 않습니다 (`outdated_source`).
- 근거 판정은 모델 판단만으로 하지 않습니다. 검색된 원문 안에 **그 단어 그대로**(예: `dark current`)가 있어야 합니다. `current` 일반 설명만 있으면 "관련 근거를 찾지 못했어요".
- 자료명·저자·URL·라이선스는 등록 목록(`rag-catalog.mjs`)에서 가져옵니다. 모델이 쓴 출처·쪽수는 쓰지 않습니다.
- 원문 구절은 API가 돌려준 검색 원문에서 고르고, D1의 쪽별 원문에 **실제로 있을 때만** 근거로 기록합니다(쪽수 `PDF n쪽 · 인쇄 쪽수 m쪽` 포함). 이 기록은 서버(`rag_cache`)에만 남고 앱에는 보내지 않습니다.
- 시간 제한 20초, 재시도는 네트워크 오류·5xx만 1회. 실패하면 분석은 그대로 성공하고 근거는 `자료 검색 실패 · 자료 근거 미확인`.
- 캐시: (단어, 의미 기준, 전공, 참고 문장, 저장소, 자료 목록 버전, 모델)마다 따로, 30일. 실패는 캐시하지 않습니다.
- 인터넷 검색은 아직 없습니다. 연결 지점: `evidenceFallbacks` 배열 (근거가 없을 때 차례로 호출).

## 사용량·응답 시간 보기

```bash
npx wrangler d1 execute word-collector-db --remote --command "SELECT usage_date, status, request_count, cached_count, total_ms / max(request_count,1) AS avg_ms, max_ms FROM rag_usage ORDER BY usage_date DESC, status"
```

## 비용 (공식 문서 기준)

색인할 때 임베딩 비용(1회), 저장은 무료, 검색 시 임베딩 무료, 검색된 원문은 일반 입력 토큰으로 과금. 분석 1회마다 검색 요청이 1회 추가됩니다 (캐시 적중 시 없음).
