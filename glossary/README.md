# 단어집 (Python)

등록 자료(`rag/sources.json`: Kuphaldt 교재 DC·AC, 이후 전기·반도체 논문)에서 분야별 용어를 미리 정리합니다.
앱에서 **전공 의미**로 단어를 분석할 때 전공명이 전기 계열(전기·전자·회로·전력)이거나 반도체 계열이면
서버가 그 분야의 단어집을 먼저 찾고, 없을 때만 Gemini가 분석합니다. 단어집에서 찾으면 Gemini를 부르지 않으므로
바로 나오고, 하루 분석 횟수도 쓰지 않습니다.

## 자료는 참고만, 글은 AI가 새로 씀

- 뜻·정의·예문은 Gemini가 자료 문장을 **참고만 하고 새로 씁니다.** 자료 문장과 연속 8단어 이상 같으면
  한 번 다시 쓰게 하고, 그래도 같으면 그 용어는 버립니다.
- 어떤 자료의 몇 쪽을 참고했는지(`references`)는 서버 단어집 기록에만 남고 **앱에는 보내지 않습니다.**
  앱의 "근거 보기"에는 "등록 자료를 참고해 AI가 정리한 내용"이라는 안내만 나옵니다.
- 저작권 정보는 `rag/sources.json`에 모두 기록합니다(앱에는 표시하지 않음). 기록 항목은 `rag/README.md` 참고.

## 처리 순서

| 단계 | 명령 | 하는 일 | 결과 |
|---|---|---|---|
| 1 | `extract` | PDF에서 쪽마다 글을 뽑고(논문은 참고문헌 앞까지), 분야별로 자주 나오는 용어 후보와 그 용어가 쓰인 문장(쪽 번호 포함)을 모읍니다. 복수형은 단수형으로 합치고, 용어를 정의하는 문장을 우선 보관합니다. 논문은 분량이 적어 기준을 낮춥니다(교재 8회·논문 3회 이상). | `out/candidates.json` |
| 2 | `define` | 후보를 25개씩 Gemini에 보내 그 분야 용어만 고르고 뜻·품사·쉬운 정의(영/한)·새 예문과 해석·관련 단어를 쓰게 합니다. 중간에 멈춰도 이어서 실행됩니다. | `out/glossary.json` |
| 3 | `export` | 서버(D1) 등록용 SQL과 사람이 검토할 CSV(엑셀로 열림)를 만듭니다. | `out/glossary.sql`, `out/glossary.csv` |

## 실행 (PowerShell, 저장소 폴더에서)

```powershell
python -m pip install -r glossary/requirements.txt
python glossary/build_glossary.py extract --pdf-dir C:\자료폴더      # 교재·논문 PDF가 모두 있는 폴더
$env:GEMINI_API_KEY="키"
python glossary/build_glossary.py define --limit 50                 # 먼저 50개만 시험
python glossary/build_glossary.py export                            # glossary.csv로 결과 확인
python glossary/build_glossary.py define                            # 나머지 전부
python glossary/build_glossary.py export
npx wrangler d1 execute word-collector-db --remote --file cloudflare/migrations/0006_glossary.sql   # 처음 한 번
npx wrangler d1 execute word-collector-db --remote --file glossary/out/glossary.sql
```

PDF는 `rag/sources.json`의 SHA-256과 같아야 합니다(다른 판본이면 멈춤). 단어집을 다시 만들면 `glossary.sql`이
기존 단어집을 지우고 새로 넣습니다. 이 과정이 끝나면 PDF 폴더와 `out/` 폴더는 지워도 앱 동작에 영향이 없습니다
(자료를 추가하거나 단어집을 다시 만들 때만 다시 필요).

## 단어집을 쓰는 경우와 Gemini를 쓰는 경우

- 단어집: 전공 의미 + 전공명이 등록 분야(전기공학·반도체)에 해당 + 참고 문장 없음 + 단어집에 있는 단어.
- Gemini: 일반 의미, 다른 전공, 참고 문장이 있을 때(문맥 해석과 번역이 필요), 단어집에 없는 단어.

## 규칙

- 자료 내용은 데이터일 뿐이며, 그 안의 지시문은 따르지 않습니다(Gemini 지시문에도 명시).
- 제3자 저작물 쪽(`restrictedElements`, 예: AC 429~430쪽)은 읽지 않습니다.
- API 키는 환경 변수에서만 읽고 출력하지 않습니다. `out/` 폴더는 Git에 올라가지 않습니다.

테스트: `python -m unittest discover -s glossary` (PDF와 Gemini 없이 실행)
