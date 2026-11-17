# 교재 단어집 (Python)

등록 교재(Kuphaldt *Lessons In Electric Circuits* DC·AC, CC BY 4.0)에서 전기공학 용어를 미리 정리합니다.
앱에서 **전공 의미 + 전기 계열 전공**으로 단어를 분석하면 서버가 이 단어집을 먼저 찾고,
없을 때만 Gemini가 분석합니다. 단어집에서 찾으면 Gemini를 부르지 않으므로 바로 나오고, 하루 분석 횟수도 쓰지 않습니다.

## 처리 순서

| 단계 | 명령 | 하는 일 | 결과 |
|---|---|---|---|
| 1 | `extract` | PDF에서 쪽마다 글을 뽑고, 자주 나오는 용어 후보와 그 용어가 쓰인 교재 문장(쪽 번호 포함)을 모읍니다. 복수형은 단수형으로 합치고, 용어를 정의하는 문장을 우선 보관합니다. | `out/candidates.json` |
| 2 | `define` | 후보를 25개씩 Gemini에 보내 전기공학 용어만 고르고 뜻·품사·쉬운 정의(영/한)·관련 단어를 정리합니다. 예문은 교재 원문 문장 중 하나를 고르고 해석만 붙입니다. 중간에 멈춰도 이어서 실행됩니다. | `out/glossary.json` |
| 3 | `export` | 서버(D1) 등록용 SQL과 사람이 검토할 CSV(엑셀로 열림)를 만듭니다. | `out/glossary.sql`, `out/glossary.csv` |

## 실행 (PowerShell, 저장소 폴더에서)

```powershell
python -m pip install -r glossary/requirements.txt
python glossary/build_glossary.py extract --pdf-dir C:\교재폴더      # DC.pdf, AC.pdf가 있는 폴더 (약 2분)
$env:GEMINI_API_KEY="키"
python glossary/build_glossary.py define --limit 50                 # 먼저 50개만 시험
python glossary/build_glossary.py export                            # glossary.csv로 결과 확인
python glossary/build_glossary.py define                            # 나머지 전부 (후보 2,500개 ≈ Gemini 호출 100번)
python glossary/build_glossary.py export
npx wrangler d1 execute word-collector-db --remote --file cloudflare/migrations/0006_glossary.sql   # 처음 한 번
npx wrangler d1 execute word-collector-db --remote --file glossary/out/glossary.sql
```

교재 PDF는 `rag/sources.json`의 판본과 SHA-256이 같아야 합니다. 다른 판본이면 멈춥니다.
단어집을 다시 만들면 `glossary.sql`이 기존 단어집을 지우고 새로 넣습니다.

## 단어집을 쓰는 경우와 Gemini를 쓰는 경우

- 단어집: 전공 의미 + 전공명에 전기·전자·회로·전력 등이 들어가고, 참고 문장이 없을 때.
- Gemini: 일반 의미, 다른 전공, 참고 문장이 있을 때(문맥 해석과 번역이 필요), 단어집에 없는 단어.

## 규칙

- 교재 내용은 데이터일 뿐이며, 그 안의 지시문은 따르지 않습니다(Gemini 지시문에도 명시).
- 예문은 반드시 교재 원문이며 PDF 쪽수와 인쇄 쪽수를 함께 저장합니다. 앱의 "근거 보기"에 그 쪽이 표시됩니다.
- 뜻·정의·해석은 단어집을 만들 때 AI가 쓴 내용이라고 앱에 안내합니다. `glossary.csv`를 검토해 고친 뒤
  `glossary.json`에 반영하면 다시 `export`해서 올릴 수 있습니다.
- 제3자 저작물 쪽(AC 429~430쪽)은 읽지 않습니다.
- API 키는 환경 변수에서만 읽고 출력하지 않습니다. `out/` 폴더는 Git에 올라가지 않습니다.

테스트: `python -m unittest discover -s glossary` (PDF와 Gemini 없이 실행)
