// Evaluation app: 전기안전공학 교수님 평가표
// First visit shows the notebook "평가 단어 목록" with every word of the evaluation
// form, analysed by Word Collector (analysis server V11.17) (전공 의미, major = the word's 분류).
// After the first change the app keeps its own data under its own storage key.
const seed = {
 "courses": {
  "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e": [
   "평가 단어 목록",
   ""
  ]
 },
 "terms": {
  "term_d512513f-455f-4283-9b85-86e95c3d449d": {
   "discipline": "전기안전공학",
   "en": "electric shock",
   "ko": "감전",
   "enDef": "A painful or dangerous physical reaction caused when electric current passes through a person's body.",
   "koDef": "전류가 사람의 몸을 통과할 때 발생하는 고통스럽거나 위험한 신체적 반응.",
   "exampleEn": "Always turn off the main power breaker before repairing an outlet to avoid an electric shock.",
   "exampleKo": "감전을 피하기 위해 콘센트를 수리하기 전에는 항상 주 전원 차단기를 끄세요.",
   "pos": "명사구",
   "related": "grounding\ncircuit breaker",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "textbook-glossary",
   "evidence": {
    "version": 1,
    "status": "found",
    "message": "등록 자료로 미리 정리한 단어집에서 찾은 단어예요.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 등록 자료를 참고해 AI가 정리한 내용이에요."
    ],
    "checkedAt": "2026-11-19T09:43:51.245Z",
    "cached": true
   }
  },
  "term_2efd6745-b3de-4c24-b7d5-0ee25bf600cf": {
   "discipline": "전기안전공학",
   "en": "let-go current",
   "ko": "가수 전류",
   "enDef": "The highest amount of electric current a person can touch and still let go of the source on their own using their muscles.",
   "koDef": "사람이 전원에 닿았을 때 스스로 근육을 움직여 손을 뗄 수 있는 최대 전류량.",
   "exampleEn": "Staying below the let-go current is important so a worker can pull their hand away from a live wire.",
   "exampleKo": "작업자가 전류가 흐르는 전선에서 손을 뗄 수 있도록 가수 전류 이하로 유지하는 것이 중요하다.",
   "pos": "명사구",
   "related": "leakage current\ncircuit breaker",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:44:00.862Z",
    "cached": false,
    "latencyMs": 8697
   }
  },
  "term_a15e0834-7573-41d7-bf5d-58e226207083": {
   "discipline": "전기안전공학",
   "en": "ventricular fibrillation current",
   "ko": "심실세동 전류",
   "enDef": "An electric current passing through the heart that is strong enough to make the heart beat irregularly and dangerously instead of pumping blood.",
   "koDef": "심장을 통과할 때 피를 펌프질하는 대신 심장이 불규칙하고 위험하게 뛰게 만들 정도로 강한 전류.",
   "exampleEn": "Safety devices are designed to cut off power before a ventricular fibrillation current can pass through a worker's body.",
   "exampleKo": "안전장치는 심실세동 전류가 작업자의 몸을 통과하기 전에 전력을 차단하도록 설계된다.",
   "pos": "명사구",
   "related": "leakage current\nbody resistance",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:44:18.049Z",
    "cached": false,
    "latencyMs": 8394
   }
  },
  "term_71b03e75-7f9d-4dfd-83ca-22b91e6b28db": {
   "discipline": "전기안전공학",
   "en": "touch voltage",
   "ko": "접촉 전압",
   "enDef": "The electrical voltage between a faulty metal object and the ground when a person touches that object while standing on the ground.",
   "koDef": "땅에 서 있는 사람이 고장 난 금속 물체를 만질 때, 그 물체와 땅 사이에 걸리는 전압.",
   "exampleEn": "Proper grounding helps keep touch voltage at a safe level so workers do not get shocked.",
   "exampleKo": "적절한 접지는 작업자가 감전되지 않도록 접촉 전압을 안전한 수준으로 유지하는 데 도움이 됩니다.",
   "pos": "명사구",
   "related": "step voltage\ngrounding",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:44:35.279Z",
    "cached": false,
    "latencyMs": 7693
   }
  },
  "term_79039adf-756e-47bb-b4e4-53312bf4a0c1": {
   "discipline": "전기안전공학",
   "en": "step voltage",
   "ko": "보폭 전압",
   "enDef": "The voltage difference between a person's two feet when they stand or walk on the ground near a fallen power line or a lightning strike.",
   "koDef": "땅에 떨어진 전선이나 번개 근처의 땅 위에 서 있거나 걸을 때 사람의 두 발 사이에 생기는 전압 차이.",
   "exampleEn": "Walking away from a downed power line with very small steps helps reduce the danger of step voltage.",
   "exampleKo": "쓰러진 전선에서 아주 작은 보폭으로 걸어 나오면 보폭 전압의 위험을 줄이는 데 도움이 됩니다.",
   "pos": "명사구",
   "related": "grounding\nleakage current",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:44:52.318Z",
    "cached": false,
    "latencyMs": 7010
   }
  },
  "term_9727f1ac-f90e-415b-8a91-c608954adbe7": {
   "discipline": "전기안전공학",
   "en": "residual current device (RCD)",
   "ko": "누전 차단기",
   "enDef": "A safety device that quickly turns off electricity when it detects current leaking out of a circuit, helping prevent electric shock.",
   "koDef": "회로 밖으로 전류가 새는 것을 감지하면 전기를 빠르게 차단하여 감전을 예방하는 안전 장치.",
   "exampleEn": "Make sure a residual current device (RCD) is installed in the bathroom to protect people from electric shock.",
   "exampleKo": "사람들을 감전으로부터 보호하기 위해 욕실에 누전 차단기(RCD)가 설치되어 있는지 확인하세요.",
   "pos": "명사구",
   "related": "circuit breaker\ngrounding",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:45:10.192Z",
    "cached": false,
    "latencyMs": 9310
   }
  },
  "term_8013aca4-020e-4e10-87bc-b8c368114fd0": {
   "discipline": "전기안전공학",
   "en": "leakage current",
   "ko": "누설 전류",
   "enDef": "Electric current that accidentally flows outside its intended path, such as through damaged insulation or to the ground.",
   "koDef": "손상된 절연체를 통하거나 땅으로 흐르는 것처럼 의도된 경로 밖으로 우연히 새어 나오는 전류.",
   "exampleEn": "Damaged wires in old appliances can cause leakage current, which increases the risk of electric shock.",
   "exampleKo": "오래된 가전제품의 손상된 전선은 누설 전류를 일으킬 수 있으며, 이는 감전의 위험을 높인다.",
   "pos": "명사구",
   "related": "insulation resistance\ngrounding",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:45:27.044Z",
    "cached": false,
    "latencyMs": 7976
   }
  },
  "term_bdcee6e3-c0f9-4681-b1aa-fd7820435075": {
   "discipline": "전기안전공학",
   "en": "insulation resistance",
   "ko": "절연 저항",
   "enDef": "The electrical resistance of a protective covering that prevents electricity from leaking out of wires or equipment.",
   "koDef": "전선이나 장비 밖으로 전기가 새어 나가는 것을 막는 보호 덮개의 전기적 저항.",
   "exampleEn": "Technicians measure the insulation resistance of the cable to make sure it is safe to use.",
   "exampleKo": "기술자들은 케이블을 사용해도 안전한지 확인하기 위해 절연 저항을 측정한다.",
   "pos": "명사구",
   "related": "dielectric strength\ngrounding",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:45:50.294Z",
    "cached": false,
    "latencyMs": 8733
   }
  },
  "term_08d5dc03-d57f-49ac-9efa-941aa5b34966": {
   "discipline": "전기안전공학",
   "en": "earth resistance",
   "ko": "접지 저항",
   "enDef": "The electrical resistance between a grounding rod or system and the surrounding soil. It measures how easily unwanted electricity can safely flow into the ground.",
   "koDef": "접지봉이나 접지 시스템과 주변 토양 사이의 전기적 저항입니다. 이는 불필요한 전기가 땅으로 얼마나 쉽게 안전하게 흐를 수 있는지를 측정합니다.",
   "exampleEn": "The technician checked the earth resistance to make sure the building was safe from lightning.",
   "exampleKo": "기술자는 건물이 번개로부터 안전한지 확인하기 위해 접지 저항을 점검했습니다.",
   "pos": "명사구",
   "related": "grounding electrode\nground fault",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:46:10.301Z",
    "cached": false,
    "latencyMs": 6399
   }
  },
  "term_6115f327-124b-4879-a8ad-591f3a259f6c": {
   "discipline": "전기안전공학",
   "en": "system earthing (TN, TT, IT)",
   "ko": "계통 접지 (TN, TT, IT)",
   "enDef": "A safety method of connecting an electrical power system to the ground. It is divided into TN, TT, and IT types depending on how the power source and exposed metal parts of equipment are grounded.",
   "koDef": "안전을 위해 전력 시스템을 땅에 연결하는 방법입니다. 전원과 장비의 노출된 금속 부분이 어떻게 접지되는지에 따라 TN, TT, IT 유형으로 나뉩니다.",
   "exampleEn": "Engineers choose the right type of system earthing (TN, TT, IT) to protect people from electric shock when installing a building's wiring.",
   "exampleKo": "기술자들은 건물의 배선을 설치할 때 사람들을 감전으로부터 보호하기 위해 알맞은 계통 접지 (TN, TT, IT) 방식을 선택합니다.",
   "pos": "명사구",
   "related": "protective earthing\nequipotential bonding",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:46:28.620Z",
    "cached": false,
    "latencyMs": 14490
   }
  },
  "term_de81ab60-a06f-425e-bf9b-1fac7a8f5422": {
   "discipline": "전기안전공학",
   "en": "protective conductor (PE)",
   "ko": "보호 도체 (PE)",
   "enDef": "A safety wire that connects the metal outer parts of electrical equipment to the ground. If an electrical fault happens, it safely carries the dangerous current to the ground to prevent electric shock.",
   "koDef": "전기 장비의 금속 외함 부분을 땅에 연결하는 안전 전선입니다. 전기 고장이 발생하면 감전을 막기 위해 위험한 전류를 땅으로 안전하게 흘려보냅니다.",
   "exampleEn": "Always check that the protective conductor (PE) is firmly connected to the metal case of the washing machine.",
   "exampleKo": "세탁기의 금속 외함에 보호 도체(PE)가 단단히 연결되어 있는지 항상 확인하세요.",
   "pos": "명사구",
   "related": "equipotential bonding\nground fault",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:46:52.037Z",
    "cached": false,
    "latencyMs": 13366
   }
  },
  "term_b4727185-839f-41bb-9c1f-41e4310a76bb": {
   "discipline": "전기안전공학",
   "en": "equipotential bonding",
   "ko": "등전위 본딩",
   "enDef": "A safety method that connects metal parts of electrical equipment and nearby pipes together with wires so they stay at the same electrical voltage. This prevents dangerous voltage differences that could cause electric shock.",
   "koDef": "전기 장비의 금속 부분과 주변 배관들을 전선으로 서로 연결하여 같은 전압을 유지하게 하는 안전 방법입니다. 이는 감전을 일으킬 수 있는 위험한 전압 차이를 막아 줍니다.",
   "exampleEn": "Equipotential bonding is required in bathrooms to keep metal pipes and electrical appliances at the same voltage.",
   "exampleKo": "금속 배관과 전기 기기가 같은 전압을 유지하도록 하기 위해 욕실에는 등전위 본딩이 필요합니다.",
   "pos": "명사구",
   "related": "potential difference\nearthing",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:47:14.323Z",
    "cached": false,
    "latencyMs": 7960
   }
  },
  "term_062053a3-0601-4f4d-8b2a-e6c4e2954a06": {
   "discipline": "전기안전공학",
   "en": "double insulation",
   "ko": "이중 절연",
   "enDef": "A safety design that uses two separate layers of protective covering around electrical parts so users do not get an electric shock even if the first layer breaks.",
   "koDef": "첫 번째 층이 손상되더라도 사용자가 감전되지 않도록 전기 부품 주위에 두 개의 분리된 보호 덮개 층을 사용하는 안전 설계.",
   "exampleEn": "Many handheld power tools use double insulation so they do not need a grounding wire.",
   "exampleKo": "많은 휴대용 전동 공구는 접지선이 필요 없도록 이중 절연을 사용합니다.",
   "pos": "명사구",
   "related": "dielectric strength\nground fault",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:47:31.475Z",
    "cached": false,
    "latencyMs": 6710
   }
  },
  "term_f4d22010-5003-4490-8ddf-fbc8cea940b2": {
   "discipline": "전기안전공학",
   "en": "safety extra-low voltage (SELV)",
   "ko": "안전 초저전압 (SELV)",
   "enDef": "An electrical system that keeps voltage so low and safely separated from high-voltage lines that touching it will not cause a dangerous electric shock.",
   "koDef": "전압을 매우 낮게 유지하고 고전압 선로와 안전하게 분리하여, 사람이 만져도 위험한 감전을 일으키지 않는 전기 시스템입니다.",
   "exampleEn": "Bathroom lights often use safety extra-low voltage (SELV) so people stay safe from electric shock even in wet areas.",
   "exampleKo": "욕실 조명은 젖은 공간에서도 사람들이 감전으로부터 안전할 수 있도록 안전 초저전압(SELV)을 자주 사용합니다.",
   "pos": "명사구",
   "related": "protective extra-low voltage (PELV)\nsafety isolating transformer",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:47:46.336Z",
    "cached": false,
    "latencyMs": 7970
   }
  },
  "term_2530b6c6-cf5f-46c2-9201-e11bad235dde": {
   "discipline": "전기안전공학",
   "en": "surge protective device (SPD)",
   "ko": "서지 보호 장치 (SPD)",
   "enDef": "A safety device that protects electrical equipment from sudden, short-lasting high voltages, such as from lightning. It limits the voltage and safely sends the extra electrical current to the ground.",
   "koDef": "번개 등으로 인해 갑자기 짧은 시간 동안 발생하는 높은 전압으로부터 전기 장비를 보호하는 안전 장치입니다. 전압을 제한하고 여분의 전류를 땅으로 안전하게 흘려보냅니다.",
   "exampleEn": "We installed a surge protective device (SPD) in the main electrical panel to keep our computers safe during thunderstorms.",
   "exampleKo": "뇌우가 칠 때 컴퓨터를 안전하게 보호하기 위해 주 배전반에 서지 보호 장치(SPD)를 설치했습니다.",
   "pos": "명사구",
   "related": "lightning arrester\novervoltage",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:48:02.443Z",
    "cached": false,
    "latencyMs": 15273
   }
  },
  "term_5b1b4089-7e6d-4bdf-8ff7-785d9594e2df": {
   "discipline": "전기안전공학",
   "en": "arc flash",
   "ko": "아크 플래시",
   "enDef": "A sudden, dangerous release of bright light and extreme heat caused by electricity jumping through the air between conductors.",
   "koDef": "도체 사이의 공기를 통해 전기가 튀면서 발생하는 갑작스럽고 위험한 밝은 빛과 극심한 열의 방출.",
   "exampleEn": "Workers must wear protective clothing to stay safe from an arc flash when repairing high-voltage equipment.",
   "exampleKo": "작업자들은 고전압 장비를 수리할 때 아크 플래시로부터 안전을 지키기 위해 보호복을 입어야 합니다.",
   "pos": "명사구",
   "related": "short circuit\nground fault",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:48:27.461Z",
    "cached": false,
    "latencyMs": 6869
   }
  },
  "term_66fee44e-bc94-4dbc-ba65-6ad3236dab88": {
   "discipline": "전기안전공학",
   "en": "Lockout/Tagout (LOTO)",
   "ko": "잠금 및 표지 부착 (LOTO)",
   "enDef": "A safety procedure that turns off electrical equipment and puts locks and warning tags on the power switches so nobody can turn the electricity back on by mistake during repair or maintenance.",
   "koDef": "수리나 유지보수 중에 아무도 실수로 전기를 다시 켜지 못하도록 전기 장비의 전원을 끄고 전원 스위치에 잠금장치와 경고 표지를 붙이는 안전 절차.",
   "exampleEn": "Before repairing the electrical panel, the technician followed the Lockout/Tagout (LOTO) procedure to keep the power off safely.",
   "exampleKo": "기술자는 전기 배전반을 수리하기 전에 전원을 안전하게 차단 상태로 유지하기 위해 잠금 및 표지 부착(LOTO) 절차를 따랐습니다.",
   "pos": "명사구",
   "related": "circuit breaker\nde-energization",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:48:42.736Z",
    "cached": false,
    "latencyMs": 7908
   }
  },
  "term_b44f0d47-1cd7-4c09-a4f1-25076a042303": {
   "discipline": "전기안전공학",
   "en": "explosion-proof construction",
   "ko": "방폭 구조",
   "enDef": "A special design for electrical equipment that prevents sparks or heat inside the device from igniting flammable gas or dust in the surrounding air.",
   "koDef": "장치 내부의 불꽃이나 열이 주변 공기 중의 불이 붙기 쉬운 가스나 먼지에 불을 붙이는 것을 막아 주는 전기 장비의 특수한 설계입니다.",
   "exampleEn": "Workers must use equipment with explosion-proof construction inside chemical factories where flammable gas may leak.",
   "exampleKo": "작업자들은 불이 붙기 쉬운 가스가 샐 수 있는 화학 공장 안에서 방폭 구조가 적용된 장비를 사용해야 합니다.",
   "pos": "명사구",
   "related": "intrinsic safety\nhazardous area",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:48:56.635Z",
    "cached": false,
    "latencyMs": 7796
   }
  },
  "term_7477392b-913b-485e-97e5-97615e5ad730": {
   "discipline": "전기안전공학",
   "en": "hazardous area classification",
   "ko": "위험장소 구분",
   "enDef": "The process of dividing workplaces into zones based on how likely flammable gases, vapors, or dust are to be present and cause an explosion. This helps engineers choose safe electrical equipment for each area.",
   "koDef": "가연성 가스, 증기 또는 먼지가 존재하여 폭발을 일으킬 가능성이 얼마나 높은지에 따라 작업장을 구역으로 나누는 과정입니다. 이는 엔지니어가 각 구역에 맞는 안전한 전기 장비를 선택하는 데 도움을 줍니다.",
   "exampleEn": "Before installing new lights in the chemical plant, engineers must complete a hazardous area classification.",
   "exampleKo": "화학 공장에 새 조명을 설치하기 전에, 엔지니어들은 위험장소 구분을 완료해야 합니다.",
   "pos": "명사구",
   "related": "explosive atmosphere\nignition source",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:49:14.398Z",
    "cached": false,
    "latencyMs": 12679
   }
  },
  "term_2af2551a-0b66-4af4-ada2-66cafe228dcc": {
   "discipline": "전기안전공학",
   "en": "electrostatic discharge (ESD)",
   "ko": "정전기 방전 (ESD)",
   "enDef": "A sudden flow of static electricity between two objects with different electrical charges, which can create sparks, damage sensitive electronic parts, or cause fires and explosions in hazardous areas.",
   "koDef": "서로 다른 전하를 띤 두 물체 사이에서 정전기가 갑자기 흐르는 현상으로, 불꽃을 일으키거나 민감한 전자 부품을 손상시키며 위험 장소에서는 화재나 폭발을 유발할 수 있습니다.",
   "exampleEn": "Workers must wear grounding wrist straps so that electrostatic discharge does not damage circuit boards or ignite flammable vapors.",
   "exampleKo": "작업자들은 정전기 방전이 회로 기판을 손상시키거나 가연성 증기에 불을 붙이지 않도록 접지 손목 스트랩을 착용해야 합니다.",
   "pos": "명사구",
   "related": "static electricity\nignition source",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:49:34.703Z",
    "cached": false,
    "latencyMs": 8561
   }
  },
  "term_aaac1638-3155-4107-9cd7-735654431a1c": {
   "discipline": "전력공학",
   "en": "fault current",
   "ko": "고장 전류",
   "enDef": "An abnormally high electric current that flows through a circuit when a short circuit or other fault occurs.",
   "koDef": "단락이나 기타 고장이 발생했을 때 회로를 통해 흐르는 비정상적으로 높은 전류.",
   "exampleEn": "Protective relays detect the fault current and quickly disconnect the power.",
   "exampleKo": "보호 계전기는 고장 전류를 감지하고 신속하게 전원을 차단한다.",
   "pos": "명사구",
   "related": "short circuit\ncircuit breaker",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "textbook-glossary",
   "evidence": {
    "version": 1,
    "status": "found",
    "message": "등록 자료로 미리 정리한 단어집에서 찾은 단어예요.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 등록 자료를 참고해 AI가 정리한 내용이에요."
    ],
    "checkedAt": "2026-11-19T09:49:48.195Z",
    "cached": true
   }
  },
  "term_afbdac2e-4c2f-4c08-baf2-6afcd4b7e7fa": {
   "discipline": "전력공학",
   "en": "circuit breaker",
   "ko": "회로 차단기, 차단기",
   "enDef": "An automatic safety switch that stops the flow of electricity when the current becomes dangerously high. Unlike a fuse, it can be reset and used again after tripping.",
   "koDef": "전류가 위험할 정도로 높아졌을 때 전기의 흐름을 자동으로 멈추는 안전 스위치입니다. 퓨즈와 달리 차단된 후에도 재설정하여 다시 사용할 수 있습니다.",
   "exampleEn": "When too many heaters were plugged in at once, the circuit breaker tripped to prevent overheating.",
   "exampleKo": "한꺼번에 너무 많은 히터를 꽂자 과열을 막기 위해 회로 차단기가 내려갔습니다.",
   "pos": "명사구",
   "related": "fuse\novercurrent",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "textbook-glossary",
   "evidence": {
    "version": 1,
    "status": "found",
    "message": "등록 자료로 미리 정리한 단어집에서 찾은 단어예요.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 등록 자료를 참고해 AI가 정리한 내용이에요."
    ],
    "checkedAt": "2026-11-19T09:49:52.303Z",
    "cached": true
   }
  },
  "term_5e4cecc7-4526-4d72-95a7-d898ff504a3d": {
   "discipline": "전력공학",
   "en": "overhead ground wire",
   "ko": "가공지선",
   "enDef": "A wire placed at the top of power line towers above the main electricity cables and connected to the ground. It catches lightning strikes and safely carries the extra electricity into the earth to protect the power lines.",
   "koDef": "전력선 철탑의 주 전력 케이블 위쪽 꼭대기에 설치되어 땅에 연결되는 전선입니다. 이는 낙뢰를 받아 여분의 전기를 땅으로 안전하게 흘려보내 전력선을 보호합니다.",
   "exampleEn": "Engineers installed an overhead ground wire at the top of the transmission tower to prevent lightning damage.",
   "exampleKo": "엔지니어들은 번개 피해를 막기 위해 송전탑 꼭대기에 가공지선을 설치했습니다.",
   "pos": "명사구",
   "related": "lightning arrester\ntransmission tower",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:49:56.621Z",
    "cached": false,
    "latencyMs": 12793
   }
  },
  "term_6c46c298-2434-4595-b695-59f397c5917a": {
   "discipline": "전력공학",
   "en": "neutral grounding",
   "ko": "중성점 접지",
   "enDef": "A method of connecting the neutral point of a transformer or generator to the ground in an electrical power system. It helps keep voltage levels stable and allows safety devices to quickly detect and stop electrical faults.",
   "koDef": "전력 계통에서 변압기나 발전기의 중성점을 땅에 연결하는 방법입니다. 이는 전압 수준을 안정적으로 유지하고 안전 장치가 전기 고장을 빠르게 감지하여 차단할 수 있도록 도와줍니다.",
   "exampleEn": "Engineers use neutral grounding in substations to prevent dangerous voltage spikes during a fault.",
   "exampleKo": "엔지니어들은 고장 발생 시 위험한 전압 급등을 막기 위해 변전소에서 중성점 접지를 사용합니다.",
   "pos": "명사구",
   "related": "ground fault\nprotective relay",
   "referenceTranslation": "",
   "course": "notebook_3ef7d3ab-ce59-47e2-be18-baa1cbdb382e",
   "referenceSentence": "",
   "pron": "명사구",
   "analysisModel": "gemini-4-hydrogen",
   "evidence": {
    "version": 1,
    "status": "disabled",
    "message": "자료 검색이 아직 설정되지 않았어요. 자료 근거 미확인 상태입니다.",
    "limitation": "",
    "explanation": null,
    "sources": [],
    "notes": [
     "뜻·정의·예문은 AI가 만든 내용이에요. 자료 근거 설명은 등록 자료를 참고해 AI가 쓴 요약이에요."
    ],
    "checkedAt": "2026-11-19T09:50:13.797Z",
    "cached": false,
    "latencyMs": 10025
   }
  }
 },
 "saved": []
};
