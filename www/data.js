// New installations start with the three notebooks chosen for testing (전력공학, 회로이론, 전기기기; 24 words each,
// the analysed evaluation words). Existing user records in localStorage are left untouched.
const seed = {
  "courses": {
    "notebook_300123d1-982c-49ca-95c2-fd617a58411a": [
      "전력공학",
      ""
    ],
    "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2": [
      "회로이론",
      ""
    ],
    "notebook_4763091f-b2c3-41c0-858f-033d125a560b": [
      "전기기기",
      ""
    ]
  },
  "terms": {
    "term_f04b5dae-4519-4249-a909-8cd04b7184ec": {
      "discipline": "전력공학",
      "en": "transmission line",
      "ko": "전송선, 송전선",
      "enDef": "A specialized cable or conductor structure designed to carry electrical power or high-frequency signals over a distance with minimal loss.",
      "koDef": "손실을 최소화하면서 먼 거리로 전력이나 고주파 신호를 전달하도록 설계된 특수 케이블이나 도체 구조입니다.",
      "exampleEn": "Matching the load impedance to the transmission line prevents signals from bouncing back.",
      "exampleKo": "부하 임피던스를 전송선에 정합시키면 신호가 되돌아 반사되는 것을 막을 수 있습니다.",
      "pos": "명사구",
      "related": "characteristic impedance\nreflection",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:43:53.753Z",
        "cached": true
      }
    },
    "term_49ee5395-6902-44eb-866a-5e67cd6b8d03": {
      "discipline": "전력공학",
      "en": "distribution line",
      "ko": "배전선, 배전 선로",
      "enDef": "A power line that carries electricity from a local substation to homes, businesses, and other end users.",
      "koDef": "지역 변전소에서 가정, 상가 및 기타 최종 사용자에게 전기를 전달하는 전력선.",
      "exampleEn": "A fallen tree branch damaged the overhead distribution line and caused a brief power outage.",
      "exampleKo": "쓰러진 나뭇가지가 가공 배전선을 손상시켜 짧은 정전을 일으켰다.",
      "pos": "명사구",
      "related": "transmission line\nsubstation",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:44:02.294Z",
        "cached": true
      }
    },
    "term_c214ad9c-de62-4f67-9b69-5ab210349d73": {
      "discipline": "전력공학",
      "en": "corona discharge",
      "ko": "코로나 방전",
      "enDef": "An electrical discharge that occurs when high voltage makes the air around a power line conduct electricity, often creating a faint blue glow and a hissing sound.",
      "koDef": "고전압으로 인해 전력선 주변의 공기가 전기를 통하게 될 때 발생하는 전기 방전으로, 종종 희미한 푸른 빛과 쉬익 하는 소리를 냅니다.",
      "exampleEn": "Engineers design thicker transmission lines to reduce power loss caused by corona discharge.",
      "exampleKo": "엔지니어들은 코로나 방전으로 인한 전력 손실을 줄이기 위해 더 굵은 송전선을 설계합니다.",
      "pos": "명사구",
      "related": "dielectric breakdown\ninsulator",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:44:11.731Z",
        "cached": false,
        "latencyMs": 7482
      }
    },
    "term_87741198-72eb-40b9-a0dc-2456e0a92a52": {
      "discipline": "전력공학",
      "en": "skin effect",
      "ko": "표피 효과",
      "enDef": "The tendency of alternating current to flow mostly near the outer surface of a conductor rather than through its center. This effect becomes stronger at higher frequencies.",
      "koDef": "교류 전류가 도체의 중심부보다는 주로 바깥쪽 표면 근처로 흐르려는 현상입니다. 이 효과는 주파수가 높아질수록 더 강해집니다.",
      "exampleEn": "Because of the skin effect, high-frequency cables are often made with many thin strands instead of one solid wire.",
      "exampleKo": "표피 효과 때문에 고주파 케이블은 하나의 굵은 선 대신 여러 가닥의 가는 선으로 만드는 경우가 많습니다.",
      "pos": "명사구",
      "related": "alternating current\neddy current",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:44:28.866Z",
        "cached": true
      }
    },
    "term_1462262d-10dc-48d6-a2fd-52ef01824ab1": {
      "discipline": "전력공학",
      "en": "Ferranti effect",
      "ko": "페란티 효과",
      "enDef": "A phenomenon in a long power transmission line where the voltage at the receiving end becomes higher than the voltage at the sending end when there is no electrical load or only a very light load.",
      "koDef": "긴 송전 선로에서 전기 부하가 없거나 매우 적을 때, 전기를 받는 쪽의 전압이 보내는 쪽의 전압보다 높아지는 현상입니다.",
      "exampleEn": "Long transmission lines often experience the Ferranti effect at night when power demand is very low.",
      "exampleKo": "긴 송전 선로는 전력 수요가 매우 낮은 밤에 종종 페란티 효과를 겪습니다.",
      "pos": "고유명사",
      "related": "reactive power\nshunt reactor",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:44:35.780Z",
        "cached": false,
        "latencyMs": 9716
      }
    },
    "term_da9b1809-972b-427e-8171-fa90ce9f7c1c": {
      "discipline": "전력공학",
      "en": "per-unit system",
      "ko": "단위법",
      "enDef": "A method of expressing electrical values like voltage, current, and power as ratios of chosen base values. It makes calculations easier in power systems that have different voltage levels.",
      "koDef": "전압, 전류, 전력 같은 전기적 값들을 정해진 기준값에 대한 비율로 나타내는 방법입니다. 서로 다른 전압 수준을 가진 전력 시스템에서 계산을 더 쉽게 만들어 줍니다.",
      "exampleEn": "Engineers use the per-unit system to simplify the analysis of large power networks with many transformers.",
      "exampleKo": "엔지니어들은 변압기가 많은 대규모 전력망의 분석을 단순화하기 위해 단위법을 사용합니다.",
      "pos": "명사구",
      "related": "base value\nimpedance",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:44:54.058Z",
        "cached": false,
        "latencyMs": 10545
      }
    },
    "term_ace1690b-c9c3-437a-89dd-5ca1bd31f1fb": {
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
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:45:12.504Z",
        "cached": true
      }
    },
    "term_f2882400-f2b9-46b3-8d97-aea7ae127d55": {
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
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:45:18.737Z",
        "cached": true
      }
    },
    "term_91e9b544-7061-4b40-84e9-a758b113bba3": {
      "discipline": "전력공학",
      "en": "protective relay",
      "ko": "보호 계전기",
      "enDef": "A safety device that detects abnormal electrical conditions and triggers a circuit breaker to prevent damage.",
      "koDef": "비정상적인 전기 상태를 감지하고 손상을 막기 위해 회로 차단기를 작동시키는 안전 장치입니다.",
      "exampleEn": "When a short circuit happens, the protective relay quickly disconnects the power.",
      "exampleKo": "단락이 발생하면 보호 계전기가 빠르게 전원을 차단합니다.",
      "pos": "명사구",
      "related": "circuit breaker\nfault",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:45:26.348Z",
        "cached": true
      }
    },
    "term_80976352-2766-439b-b6e6-b6e0815fde2c": {
      "discipline": "전력공학",
      "en": "overhead ground wire",
      "ko": "가공 지선",
      "enDef": "A metal wire placed above power transmission lines to catch lightning strikes and safely guide the electricity into the ground.",
      "koDef": "번개를 받아 전기를 땅으로 안전하게 흘려보내기 위해 송전선 위쪽에 설치하는 금속선입니다.",
      "exampleEn": "The overhead ground wire protected the transmission line from a direct lightning strike during the storm.",
      "exampleKo": "가공 지선이 폭풍우 속에서 송전선을 직접적인 번개로부터 보호했습니다.",
      "pos": "명사구",
      "related": "lightning arrester\ntransmission tower",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:45:35.987Z",
        "cached": false,
        "latencyMs": 8653
      }
    },
    "term_b719c83e-4821-4c7c-85fc-a3cd479638f7": {
      "discipline": "전력공학",
      "en": "insulation coordination",
      "ko": "절연 협조",
      "enDef": "The process of choosing the insulation strength of electrical equipment in a power system so that it can handle normal voltage and sudden high voltages safely.",
      "koDef": "전력 시스템의 전기 설비가 정상 전압과 갑작스러운 고전압을 안전하게 견딜 수 있도록 절연 강도를 선택하는 과정입니다.",
      "exampleEn": "Proper insulation coordination helps prevent power equipment from being damaged by lightning or switching surges.",
      "exampleKo": "적절한 절연 협조는 전력 설비가 번개나 개폐 서지로 인해 손상되는 것을 막는 데 도움이 됩니다.",
      "pos": "명사구",
      "related": "surge arrester\ndielectric strength",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:45:55.857Z",
        "cached": false,
        "latencyMs": 8871
      }
    },
    "term_db516c98-b91c-4f76-8c1b-21009304e58c": {
      "discipline": "전력공학",
      "en": "load flow analysis",
      "ko": "조류 계산, 전력 조류 해석",
      "enDef": "A calculation method used in power systems to find the voltage and power flowing through each part of an electrical grid under normal conditions.",
      "koDef": "정상 상태에서 전력망의 각 부분을 흐르는 전압과 전력을 찾기 위해 전력 시스템에서 사용하는 계산 방법입니다.",
      "exampleEn": "Engineers run a load flow analysis before adding a new power plant to make sure the transmission lines will not overload.",
      "exampleKo": "엔지니어들은 송전선이 과부하되지 않도록 새로운 발전소를 추가하기 전에 조류 계산을 실행합니다.",
      "pos": "명사구",
      "related": "reactive power\nbus voltage",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:46:13.811Z",
        "cached": false,
        "latencyMs": 8241
      }
    },
    "term_9dcf9af4-23ac-412f-86d2-3f2f2d7df81e": {
      "discipline": "전력공학",
      "en": "transient stability",
      "ko": "과도 안정도",
      "enDef": "The ability of a power system to stay balanced and keep running normally after a sudden disturbance, such as a short circuit or a lost generator.",
      "koDef": "단락이나 발전기 탈락 같은 갑작스러운 외란이 발생한 뒤에도 전력 시스템이 균형을 유지하고 정상적으로 계속 작동할 수 있는 능력입니다.",
      "exampleEn": "Engineers study transient stability to make sure the power grid does not collapse after a lightning strike.",
      "exampleKo": "엔지니어들은 낙뢰가 친 뒤에도 전력망이 붕괴하지 않도록 과도 안정도를 연구합니다.",
      "pos": "명사구",
      "related": "steady-state stability\nvoltage stability",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:46:31.829Z",
        "cached": false,
        "latencyMs": 6939
      }
    },
    "term_da8c5383-77ab-405b-bd06-c334b06e670a": {
      "discipline": "전력공학",
      "en": "phase modifying equipment",
      "ko": "조상 설비",
      "enDef": "Electrical equipment used in power systems to control voltage and improve efficiency by adjusting the phase difference between voltage and current.",
      "koDef": "전력 시스템에서 전압과 전류 사이의 위상 차이를 조절하여 전압을 제어하고 효율을 높이는 데 사용하는 전기 설비입니다.",
      "exampleEn": "The substation installed phase modifying equipment to keep the voltage stable during peak electricity demand.",
      "exampleKo": "변전소는 전력 수요가 가장 많은 시간대에 전압을 안정적으로 유지하기 위해 조상 설비를 설치했습니다.",
      "pos": "명사구",
      "related": "reactive power\npower factor",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:46:49.289Z",
        "cached": false,
        "latencyMs": 8161
      }
    },
    "term_8cbcfdd4-d5fd-40be-bb25-e44a71b8ac58": {
      "discipline": "전력공학",
      "en": "power factor correction",
      "ko": "역률 개선, 역률 보정",
      "enDef": "A method of improving the efficiency of an AC power system by reducing wasted electrical power. It usually uses capacitors to help voltage and current work together smoothly.",
      "koDef": "낭비되는 전력을 줄여 교류 전력 시스템의 효율을 높이는 방법입니다. 보통 전압과 전류가 함께 원활하게 작동하도록 커패시터를 사용합니다.",
      "exampleEn": "The factory installed capacitors for power factor correction to lower its electricity bills.",
      "exampleKo": "그 공장은 전기 요금을 낮추기 위해 역률 개선용 커패시터를 설치했습니다.",
      "pos": "명사구",
      "related": "reactive power\ncapacitor bank",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:47:07.542Z",
        "cached": false,
        "latencyMs": 8516
      }
    },
    "term_3131b443-13b1-40e9-9196-2fab87a30b03": {
      "discipline": "전력공학",
      "en": "high-voltage direct current (HVDC) transmission",
      "ko": "고압 직류 송전, 초고압 직류 송전",
      "enDef": "A method of sending large amounts of electrical power over long distances using direct current at very high voltage. It loses less energy than regular alternating current lines over very long distances or underwater.",
      "koDef": "매우 높은 전압의 직류를 사용하여 먼 거리로 많은 양의 전력을 보내는 방법입니다. 아주 먼 거리나 바닷속에서는 일반적인 교류 선로보다 에너지를 덜 잃습니다.",
      "exampleEn": "The country built a high-voltage direct current (HVDC) transmission line under the sea to connect two power grids.",
      "exampleKo": "그 나라는 두 전력망을 연결하기 위해 바닷속에 고압 직류 송전(HVDC) 선로를 건설했습니다.",
      "pos": "명사구",
      "related": "alternating current\nconverter station",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:47:24.601Z",
        "cached": false,
        "latencyMs": 8184
      }
    },
    "term_39082dda-9e6a-4d79-8adc-9c3b2fe44c6f": {
      "discipline": "전력공학",
      "en": "sag",
      "ko": "이도, 전선의 처짐",
      "enDef": "The distance that a power line hanging between two towers dips down below a straight line connecting the tops of the towers.",
      "koDef": "두 철탑 사이에 매달린 전력선이 철탑 꼭대기를 잇는 직선 아래로 처진 거리입니다.",
      "exampleEn": "Hot summer weather causes metal power lines to expand, which increases the sag between the towers.",
      "exampleKo": "무더운 여름 날씨로 금속 전력선이 늘어나면 철탑 사이의 이도가 커집니다.",
      "pos": "명사",
      "related": "span\ntension",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:47:41.112Z",
        "cached": false,
        "latencyMs": 10634
      }
    },
    "term_16491f57-35e4-48cb-9fce-51e37eb33798": {
      "discipline": "전력공학",
      "en": "suspension insulator",
      "ko": "현수 애자",
      "enDef": "A chain of insulating units that hangs from a power tower arm to hold up a high-voltage power line and block electricity from flowing into the tower.",
      "koDef": "철탑의 팔 부분에 매달려 고압 전력선을 지탱하고 전기가 철탑으로 흐르는 것을 막아 주는 절연 장치들의 연결체입니다.",
      "exampleEn": "Engineers added more discs to the suspension insulator so the line could safely carry higher voltage.",
      "exampleKo": "기술자들은 선로가 더 높은 전압을 안전하게 전달할 수 있도록 현수 애자에 원판들을 더 추가했습니다.",
      "pos": "명사구",
      "related": "pin insulator\nstrain insulator",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:48:00.847Z",
        "cached": false,
        "latencyMs": 8666
      }
    },
    "term_74d8122c-0660-4a81-95ca-fca25bcdf4d7": {
      "discipline": "전력공학",
      "en": "neutral grounding",
      "ko": "중성점 접지",
      "enDef": "The practice of connecting the neutral point of a power system, such as a transformer or generator, to the earth. This keeps voltage levels stable and helps safety devices quickly detect electrical faults.",
      "koDef": "변압기나 발전기 같은 전력 시스템의 중성점을 땅에 연결하는 것입니다. 이는 전압 수준을 안정적으로 유지하고 안전 장치가 전기 고장을 빠르게 감지하도록 돕습니다.",
      "exampleEn": "Proper neutral grounding prevents dangerous voltage surges when a fault occurs on a power line.",
      "exampleKo": "적절한 중성점 접지는 전력선에 고장이 발생했을 때 위험한 전압 급증을 막아 줍니다.",
      "pos": "명사구",
      "related": "ground fault\ngrounding resistance",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:48:17.368Z",
        "cached": false,
        "latencyMs": 7871
      }
    },
    "term_080440ab-4b83-4191-8709-50ad3760e53b": {
      "discipline": "전력공학",
      "en": "load factor",
      "ko": "부하율",
      "enDef": "The ratio of the average electrical load over a certain period to the peak load during that same period. It shows how steadily electricity is used over time.",
      "koDef": "일정 기간 동안의 평균 전기 부하를 같은 기간 동안의 최대 부하로 나눈 비율입니다. 이는 시간이 지남에 따라 전기가 얼마나 꾸준히 사용되는지를 보여 줍니다.",
      "exampleEn": "A high load factor means the power plant is supplying electricity steadily without big spikes in demand.",
      "exampleKo": "부하율이 높다는 것은 발전소가 수요의 큰 급증 없이 전기를 꾸준히 공급하고 있다는 뜻입니다.",
      "pos": "명사구",
      "related": "demand factor\ndiversity factor",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:48:34.278Z",
        "cached": false,
        "latencyMs": 6041
      }
    },
    "term_f9fc3b3d-e604-4e59-b811-f816088c6d2e": {
      "discipline": "전기기기",
      "en": "synchronous reactance",
      "ko": "동기 리액턴스",
      "enDef": "The total opposition to alternating current in a synchronous generator or motor during steady operation. It combines the opposition from the wire coils themselves and the magnetic effect caused by the current flowing in the machine.",
      "koDef": "정상 작동 중인 동기 발전기나 전동기에서 교류 전류의 흐름을 방해하는 전체적인 성질입니다. 이는 코일 자체의 방해 작용과 기계 내부에 흐르는 전류로 생기는 자기적 영향을 합친 것입니다.",
      "exampleEn": "Engineers measure the synchronous reactance of a generator to predict how much its voltage will drop when a heavy load is connected.",
      "exampleKo": "엔지니어들은 무거운 부하가 연결되었을 때 전압이 얼마나 떨어질지 예측하기 위해 발전기의 동기 리액턴스를 측정합니다.",
      "pos": "명사구",
      "related": "armature reaction\nleakage reactance",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:48:48.096Z",
        "cached": false,
        "latencyMs": 8952
      }
    },
    "term_0b192fe3-878e-40f2-b5e3-18dfc5d74961": {
      "discipline": "회로이론",
      "en": "transient phenomenon",
      "ko": "과도 현상",
      "enDef": "A temporary change in voltage or current in an electric circuit when a switch is turned on or off, or when the circuit condition suddenly changes. It lasts only for a short time before the circuit settles into a steady state.",
      "koDef": "스위치를 켜거나 끌 때 또는 회로 상태가 갑자기 변할 때 전기 회로에서 일어나는 전압이나 전류의 일시적인 변화입니다. 회로가 안정 상태에 자리 잡기 전까지 짧은 시간 동안만 지속됩니다.",
      "exampleEn": "When you flip the switch to turn on the motor, a brief transient phenomenon causes a sudden spike in current.",
      "exampleKo": "전동기를 켜기 위해 스위치를 올리면, 짧은 과도 현상으로 인해 전류가 갑자기 치솟습니다.",
      "pos": "명사구",
      "related": "steady state\ntime constant",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:49:06.764Z",
        "cached": false,
        "latencyMs": 10126
      }
    },
    "term_64c49480-8bdf-4559-b14b-b13ac5b5a301": {
      "discipline": "회로이론",
      "en": "symmetrical component",
      "ko": "대칭분, 대칭 좌표 성분",
      "enDef": "One of three balanced sets of phasors—positive, negative, and zero sequence—used to simplify the analysis of unbalanced three-phase power systems.",
      "koDef": "불평형 삼상 전력 계통의 해석을 단순화하기 위해 사용하는 정상분, 역상분, 영상분의 세 가지 평형 페이저 집합 중 하나입니다.",
      "exampleEn": "Engineers calculate symmetrical components to determine fault currents in an unbalanced grid.",
      "exampleKo": "엔지니어들은 불평형 전력망에서 고장 전류를 구하기 위해 대칭분을 계산합니다.",
      "pos": "명사구",
      "related": "phasor\nzero sequence",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:49:27.591Z",
        "cached": true
      }
    },
    "term_5d0f4e27-235a-45c1-a747-3c4119bd9e43": {
      "discipline": "전기안전공학",
      "en": "system earthing (TN, TT, IT)",
      "ko": "계통 접지 (TN, TT, IT)",
      "enDef": "The method of connecting an electrical power system and the metal cases of equipment to the ground to protect people from electric shock. The codes TN, TT, and IT show whether the power source and equipment are connected to the ground together, separately, or kept isolated.",
      "koDef": "사람을 감전으로부터 보호하기 위해 전력 계통과 설비의 금속 외함을 땅에 연결하는 방식입니다. TN, TT, IT라는 기호는 전원과 설비가 땅에 함께 연결되는지, 따로 연결되는지, 아니면 절연되어 있는지를 나타냅니다.",
      "exampleEn": "Engineers choose between TN, TT, and IT system earthing depending on the safety needs of a building.",
      "exampleKo": "기술자들은 건물의 안전 요구 사항에 따라 TN, TT, IT 계통 접지 중에서 선택합니다.",
      "pos": "명사구",
      "related": "protective earthing\nground fault",
      "referenceTranslation": "",
      "course": "notebook_300123d1-982c-49ca-95c2-fd617a58411a",
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
        "checkedAt": "2026-11-19T09:49:35.182Z",
        "cached": false,
        "latencyMs": 7842
      }
    },
    "term_06fcfdb0-7462-4956-8b9b-26167fa5ea1b": {
      "discipline": "회로이론",
      "en": "Kirchhoff's laws",
      "ko": "키르히호프의 법칙 (전류 법칙, 전압 법칙)",
      "enDef": "Two basic rules in electric circuits stating that the total current entering a junction equals the total current leaving it, and the total voltage around any closed loop is zero.",
      "koDef": "전기 회로에서 한 연결점에 들어오는 총 전류는 나가는 총 전류와 같으며, 닫힌 고리 둘레의 총 전압은 0이 된다는 두 가지 기본 법칙입니다.",
      "exampleEn": "Engineers use Kirchhoff's laws to calculate unknown currents and voltages in complex circuits.",
      "exampleKo": "공학자들은 복잡한 회로에서 모르는 전류와 전압을 계산하기 위해 키르히호프의 법칙을 사용합니다.",
      "pos": "고유명사",
      "related": "Ohm's law\nnodal analysis",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:43:52.039Z",
        "cached": false,
        "latencyMs": 12239
      }
    },
    "term_2a635501-6372-4a55-a849-04962f59742c": {
      "discipline": "회로이론",
      "en": "Thevenin's theorem",
      "ko": "테브난의 정리",
      "enDef": "A circuit rule stating that a complex electrical circuit can be replaced by a single voltage source and a single resistor connected in series.",
      "koDef": "복잡한 전기 회로를 하나의 전압원과 하나의 저항이 직렬로 연결된 회로로 바꿀 수 있다는 회로 법칙입니다.",
      "exampleEn": "By using Thevenin's theorem, we can easily calculate the current flowing through the load resistor.",
      "exampleKo": "테브난의 정리를 사용하면 부하 저항을 통해 흐르는 전류를 쉽게 계산할 수 있습니다.",
      "pos": "고유명사",
      "related": "Norton's theorem\nSuperposition theorem",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:44:13.718Z",
        "cached": false,
        "latencyMs": 8043
      }
    },
    "term_1ec7d0ae-006d-40b1-9739-b61d0c369459": {
      "discipline": "회로이론",
      "en": "Norton's theorem",
      "ko": "노턴의 정리",
      "enDef": "A circuit rule stating that a complex electrical circuit can be replaced by a single current source and a single resistor connected in parallel.",
      "koDef": "복잡한 전기 회로를 하나의 전류원과 하나의 저항이 병렬로 연결된 회로로 바꿀 수 있다는 회로 법칙입니다.",
      "exampleEn": "We used Norton's theorem to simplify the complicated circuit before calculating the load current.",
      "exampleKo": "부하 전류를 계산하기 전에 복잡한 회로를 간단하게 만들기 위해 노턴의 정리를 사용했습니다.",
      "pos": "고유명사",
      "related": "current source\nequivalent circuit",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:44:30.990Z",
        "cached": false,
        "latencyMs": 7909
      }
    },
    "term_54b6cf04-dbfa-4560-bd14-bf3cf2b45375": {
      "discipline": "회로이론",
      "en": "superposition theorem",
      "ko": "중첩의 정리",
      "enDef": "A circuit analysis rule stating that the total current or voltage in a linear circuit with multiple sources equals the sum of the effects caused by each source acting alone.",
      "koDef": "여러 전원이 있는 선형 회로의 총 전류나 전압은 각 전원이 단독으로 작용할 때 생기는 효과의 합과 같다는 회로 해석 법칙입니다.",
      "exampleEn": "Students often use the superposition theorem to solve complex circuits that have two or more batteries.",
      "exampleKo": "학생들은 두 개 이상의 배터리가 있는 복잡한 회로를 풀기 위해 종종 중첩의 정리를 사용한다.",
      "pos": "명사구",
      "related": "linear circuit\nThevenin's theorem",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:44:47.386Z",
        "cached": true
      }
    },
    "term_ac370632-0f9b-4f26-a631-e33990886646": {
      "discipline": "회로이론",
      "en": "maximum power transfer theorem",
      "ko": "최대 전력 전달 정리",
      "enDef": "A rule in electric circuits stating that a load gets the most power when its resistance equals the internal resistance of the power source.",
      "koDef": "부하의 저항이 전원의 내부 저항과 같을 때 부하가 가장 큰 전력을 얻는다는 전기 회로의 법칙입니다.",
      "exampleEn": "Engineers use the maximum power transfer theorem to make sure a speaker receives the most power from an amplifier.",
      "exampleKo": "공학자들은 스피커가 증폭기로부터 가장 많은 전력을 받도록 하기 위해 최대 전력 전달 정리를 사용합니다.",
      "pos": "명사구",
      "related": "load resistance\ninternal resistance",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:44:54.824Z",
        "cached": false,
        "latencyMs": 8254
      }
    },
    "term_d7602237-9dba-453b-8e4f-c0bd8b429613": {
      "discipline": "회로이론",
      "en": "impedance",
      "ko": "임피던스",
      "enDef": "The total opposition that an alternating current circuit offers to the flow of electricity, combining resistance and reactance.",
      "koDef": "교류 회로에서 저항과 리액턴스를 합쳐 전류의 흐름을 방해하는 전체적인 정도.",
      "exampleEn": "Matching the speaker impedance to the amplifier helps deliver clear sound without overheating.",
      "exampleKo": "스피커의 임피던스를 증폭기와 맞추면 과열 없이 깨끗한 소리를 전달하는 데 도움이 된다.",
      "pos": "명사",
      "related": "reactance\nresistance",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:45:11.077Z",
        "cached": true
      }
    },
    "term_4a89c7ba-f34d-4c95-91cc-c1d7dc359a3e": {
      "discipline": "회로이론",
      "en": "admittance",
      "ko": "어드미턴스",
      "enDef": "A measure of how easily alternating current flows through a circuit, equal to the reciprocal of impedance.",
      "koDef": "회로를 통해 교류 전류가 얼마나 쉽게 흐르는지를 나타내는 척도로, 임피던스의 역수입니다.",
      "exampleEn": "Admittance is measured in siemens and is especially useful when analyzing parallel AC circuits.",
      "exampleKo": "어드미턴스는 지멘스 단위로 측정되며 병렬 교류 회로를 해석할 때 특히 유용합니다.",
      "pos": "명사",
      "related": "impedance\nconductance",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:45:18.022Z",
        "cached": true
      }
    },
    "term_191b1765-dcbf-4948-afbb-f8b15bb11a86": {
      "discipline": "회로이론",
      "en": "phasor",
      "ko": "페이저",
      "enDef": "A complex number or rotating vector used to represent the amplitude and phase angle of a sinusoidal alternating-current signal.",
      "koDef": "정현파 교류 신호의 진폭과 위상각을 나타내기 위해 사용되는 복소수 또는 회전 벡터입니다.",
      "exampleEn": "Using phasor notation makes it much easier to add two alternating voltages of the same frequency.",
      "exampleKo": "페이저 표기법을 사용하면 주파수가 같은 두 교류 전압을 더하기가 훨씬 쉬워집니다.",
      "pos": "명사",
      "related": "impedance\nphase angle",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:45:24.237Z",
        "cached": true
      }
    },
    "term_650eef4e-aac0-4b84-b74a-34cac45d7cf7": {
      "discipline": "회로이론",
      "en": "resonance",
      "ko": "공진, 공명",
      "enDef": "A condition in an AC circuit where inductive and capacitive reactances cancel each other out, allowing maximum current or voltage at a specific frequency.",
      "koDef": "교류 회로에서 유도성 리액턴스와 용량성 리액턴스가 서로 상쇄되어 특정 주파수에서 최대 전류나 전압이 흐르게 되는 상태.",
      "exampleEn": "Radio receivers use resonance to tune in to a specific station's frequency.",
      "exampleKo": "라디오 수신기는 특정 방송국의 주파수에 맞추기 위해 공진을 이용한다.",
      "pos": "명사",
      "related": "reactance\nresonant frequency",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:45:33.596Z",
        "cached": true
      }
    },
    "term_86eec14f-6376-4245-bf6f-ef0744864c26": {
      "discipline": "회로이론",
      "en": "quality factor (Q factor)",
      "ko": "품질 계수 (Q 인자)",
      "enDef": "A number that shows how little energy a circuit loses compared to the energy it stores during resonance. A higher quality factor means the circuit has lower energy loss and selects a specific frequency more sharply.",
      "koDef": "공진 상태에서 회로가 저장하는 에너지에 비해 잃는 에너지가 얼마나 적은지를 나타내는 수치입니다. 품질 계수가 높을수록 회로의 에너지 손실이 적고 특정 주파수를 더 날카롭게 선택한다는 뜻입니다.",
      "exampleEn": "The engineer designed a filter with a high quality factor so it could pick out the exact radio frequency.",
      "exampleKo": "엔지니어는 정확한 라디오 주파수를 골라낼 수 있도록 품질 계수가 높은 필터를 설계했습니다.",
      "pos": "명사구",
      "related": "bandwidth\nresonant frequency",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:45:47.806Z",
        "cached": false,
        "latencyMs": 11590
      }
    },
    "term_62d5eacd-4b1c-45a8-ab2a-ad33bf6a1905": {
      "discipline": "회로이론",
      "en": "time constant",
      "ko": "시정수",
      "enDef": "In an electric circuit, it is the time it takes for the voltage or current to change by about 63% toward its final value. It shows how fast a circuit responds to a sudden change.",
      "koDef": "전기 회로에서 전압이나 전류가 최종 값의 약 63%까지 변하는 데 걸리는 시간입니다. 이는 회로가 갑작스러운 변화에 얼마나 빠르게 반응하는지를 보여줍니다.",
      "exampleEn": "Increasing the resistance in the circuit makes the time constant larger, so the capacitor charges more slowly.",
      "exampleKo": "회로의 저항을 높이면 시정수가 커져서 축전기가 더 느리게 충전됩니다.",
      "pos": "명사구",
      "related": "capacitance\ntransient response",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:46:09.875Z",
        "cached": false,
        "latencyMs": 9057
      }
    },
    "term_68ec2b53-109b-400a-b31f-197187c38079": {
      "discipline": "회로이론",
      "en": "transient phenomenon",
      "ko": "과도 현상",
      "enDef": "A temporary change in current or voltage that happens right after a circuit is switched on, switched off, or suddenly changed before it settles into a steady state.",
      "koDef": "회로가 켜지거나 꺼지거나 갑자기 변한 직후에, 안정된 상태에 자리 잡기 전까지 전류나 전압에 나타나는 일시적인 변화입니다.",
      "exampleEn": "When you flip the light switch, a brief transient phenomenon occurs in the circuit before the current becomes steady.",
      "exampleKo": "전등 스위치를 켜면 전류가 일정해지기 전에 회로에서 짧은 과도 현상이 일어납니다.",
      "pos": "명사구",
      "related": "steady state\nnatural response",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:46:29.437Z",
        "cached": false,
        "latencyMs": 6854
      }
    },
    "term_e8dcbfec-1fb9-443a-abba-859b4c349916": {
      "discipline": "회로이론",
      "en": "Laplace transform",
      "ko": "라플라스 변환",
      "enDef": "In circuit theory, it is a mathematical method that changes difficult time-based circuit equations into simpler equations that are easier to solve.",
      "koDef": "회로이론에서 시간에 따라 변하는 어려운 회로 방정식을 풀기 쉬운 더 간단한 방정식으로 바꾸어 주는 수학적 방법입니다.",
      "exampleEn": "Engineers use the Laplace transform to analyze how an electric circuit responds right after a switch is turned on.",
      "exampleKo": "공학자들은 스위치가 켜진 직후 전기 회로가 어떻게 반응하는지 분석하기 위해 라플라스 변환을 사용합니다.",
      "pos": "고유명사",
      "related": "transfer function\nfrequency domain",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:46:45.523Z",
        "cached": false,
        "latencyMs": 9356
      }
    },
    "term_73bfded6-18da-41dc-afef-72b403342ac8": {
      "discipline": "회로이론",
      "en": "transfer function",
      "ko": "전달 함수",
      "enDef": "A mathematical representation that describes the relationship between the input and output of a linear system.",
      "koDef": "선형 시스템의 입력과 출력 사이의 관계를 설명하는 수학적 표현입니다.",
      "exampleEn": "By analyzing the transfer function, we can predict how the filter will respond to different frequencies.",
      "exampleKo": "전달 함수를 분석함으로써 필터가 다양한 주파수에 어떻게 반응할지 예측할 수 있습니다.",
      "pos": "명사구",
      "related": "frequency response\ncontrol system",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:47:05.529Z",
        "cached": true
      }
    },
    "term_102fad9c-71d5-4701-9c1e-2b346d716ae6": {
      "discipline": "회로이론",
      "en": "two-port network",
      "ko": "2단자쌍 회로망 (2포트 네트워크)",
      "enDef": "An electrical circuit with two pairs of terminals, where one pair is for input signals and the other pair is for output signals. It is used to study how signals change as they pass through a circuit.",
      "koDef": "두 쌍의 단자를 가진 전기 회로로, 한 쌍은 입력 신호용이고 다른 한 쌍은 출력 신호용입니다. 신호가 회로를 통과하면서 어떻게 변하는지 연구하는 데 사용됩니다.",
      "exampleEn": "Engineers use a two-port network model to analyze how an amplifier changes an audio signal from input to output.",
      "exampleKo": "공학자들은 증폭기가 입력에서 출력으로 오디오 신호를 어떻게 변화시키는지 분석하기 위해 2단자쌍 회로망 모델을 사용합니다.",
      "pos": "명사구",
      "related": "hybrid parameter\ntransmission parameter",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:47:14.293Z",
        "cached": false,
        "latencyMs": 9745
      }
    },
    "term_d8bff669-c158-4e8c-8f6f-0b1c5f4d097b": {
      "discipline": "회로이론",
      "en": "symmetrical component",
      "ko": "대칭분, 대칭 좌표 성분",
      "enDef": "One of three balanced sets of phasors—positive, negative, and zero sequence—used to simplify the analysis of unbalanced three-phase power systems.",
      "koDef": "불평형 삼상 전력 계통의 해석을 단순화하기 위해 사용하는 정상분, 역상분, 영상분의 세 가지 평형 페이저 집합 중 하나입니다.",
      "exampleEn": "Engineers calculate symmetrical components to determine fault currents in an unbalanced grid.",
      "exampleKo": "엔지니어들은 불평형 전력망에서 고장 전류를 구하기 위해 대칭분을 계산합니다.",
      "pos": "명사구",
      "related": "phasor\nzero sequence",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:47:33.922Z",
        "cached": true
      }
    },
    "term_9becdc5c-2793-4adc-a8e9-1ba691a0865a": {
      "discipline": "회로이론",
      "en": "root-mean-square (RMS) value",
      "ko": "실효값 (제곱평균제곱근 값)",
      "enDef": "In electric circuits, it is the effective value of an alternating current or voltage that delivers the same average power to a resistor as a steady direct current or voltage.",
      "koDef": "전기 회로에서, 일정한 직류 전류나 전압과 같은 평균 전력을 저항에 전달하는 교류 전류나 전압의 유효한 값입니다.",
      "exampleEn": "A standard household wall outlet provides an AC voltage with a root-mean-square value of 220 volts.",
      "exampleKo": "일반적인 가정용 벽면 콘센트는 실효값이 220볼트인 교류 전압을 공급합니다.",
      "pos": "명사구",
      "related": "peak value\naverage power",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:47:43.579Z",
        "cached": false,
        "latencyMs": 9811
      }
    },
    "term_c70ab9e1-2735-483a-89a5-6bd6061ed4fb": {
      "discipline": "회로이론",
      "en": "reactive power",
      "ko": "무효 전력",
      "enDef": "Power in an alternating current circuit that moves back and forth between the source and components like inductors or capacitors without doing real work.",
      "koDef": "교류 회로에서 실제 일을 하지 않고 전원과 인덕터나 커패시터 같은 부품 사이를 오가는 전력입니다.",
      "exampleEn": "Adding capacitors to the factory system helped reduce reactive power and improve overall efficiency.",
      "exampleKo": "공장 시스템에 커패시터를 추가하는 것이 무효 전력을 줄이고 전체 효율을 높이는 데 도움이 되었습니다.",
      "pos": "명사구",
      "related": "active power\napparent power",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:48:02.513Z",
        "cached": true
      }
    },
    "term_2b3f4736-a753-46ab-bbff-d57fb9c4a448": {
      "discipline": "회로이론",
      "en": "Delta-wye (Δ-Y) transformation",
      "ko": "델타-와이 (Δ-Y) 변환",
      "enDef": "A method in electric circuits for changing a triangle-shaped connection of three parts into a Y-shaped connection, or the other way around, without changing how the rest of the circuit works.",
      "koDef": "전기 회로에서 나머지 회로의 동작을 바꾸지 않고 세 부품의 삼각형 모양 연결을 Y자 모양 연결로 바꾸거나 그 반대로 바꾸는 방법입니다.",
      "exampleEn": "We used the delta-wye (Δ-Y) transformation to simplify the complex resistor network and find the total resistance.",
      "exampleKo": "우리는 복잡한 저항 회로망을 단순화하고 전체 저항을 구하기 위해 델타-와이 (Δ-Y) 변환을 사용했습니다.",
      "pos": "명사구",
      "related": "equivalent resistance\nbridge circuit",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:48:10.928Z",
        "cached": false,
        "latencyMs": 7380
      }
    },
    "term_30ffb7e1-8124-495b-81df-7d1851fac254": {
      "discipline": "회로이론",
      "en": "Fourier series",
      "ko": "푸리에 급수",
      "enDef": "In circuit theory, it is a mathematical method that breaks down a complex repeating signal into a sum of simple sine and cosine waves.",
      "koDef": "회로이론에서 복잡한 반복 신호를 단순한 사인파와 코사인파의 합으로 분해하는 수학적 방법입니다.",
      "exampleEn": "Engineers use the Fourier series to analyze how a square wave voltage affects an electric circuit.",
      "exampleKo": "공학자들은 사각파 전압이 전기 회로에 어떤 영향을 미치는지 분석하기 위해 푸리에 급수를 사용합니다.",
      "pos": "고유명사",
      "related": "harmonic\nperiodic signal",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:48:27.723Z",
        "cached": false,
        "latencyMs": 7600
      }
    },
    "term_df6d5950-1c7e-42b1-83dd-934c016d19b4": {
      "discipline": "전기기기",
      "en": "back electromotive force (back EMF)",
      "ko": "역기전력",
      "enDef": "In an electric motor, it is a voltage generated by the spinning motion that opposes the main voltage supplying power to the motor.",
      "koDef": "전동기에서, 회전 운동에 의해 발생하여 전동기에 전력을 공급하는 주 전압에 반대 방향으로 작용하는 전압입니다.",
      "exampleEn": "As the electric motor spins faster, the back electromotive force increases and reduces the current flowing through it.",
      "exampleKo": "전동기가 더 빠르게 회전할수록 역기전력이 커져 전동기를 흐르는 전류가 줄어듭니다.",
      "pos": "명사구",
      "related": "armature current\nmagnetic flux",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:48:43.947Z",
        "cached": false,
        "latencyMs": 10917
      }
    },
    "term_f294f15d-2dfc-4541-a087-86b09b51f493": {
      "discipline": "전력공학",
      "en": "power factor correction",
      "ko": "역률 개선",
      "enDef": "A method in alternating current power systems that reduces wasted power and makes electricity use more efficient, usually by adding capacitors to the circuit.",
      "koDef": "교류 전력 시스템에서 보통 회로에 커패시터를 추가하여 낭비되는 전력을 줄이고 전기 사용을 더 효율적으로 만드는 방법입니다.",
      "exampleEn": "Factories often use power factor correction to lower their electricity bills and reduce energy waste.",
      "exampleKo": "공장들은 전기 요금을 낮추고 에너지 낭비를 줄이기 위해 역률 개선을 자주 사용합니다.",
      "pos": "명사구",
      "related": "apparent power\nactive power",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
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
        "checkedAt": "2026-11-19T09:49:03.268Z",
        "cached": false,
        "latencyMs": 10414
      }
    },
    "term_af6bfd8f-458c-4ad8-b71f-ce4d8cbfa5cc": {
      "discipline": "전기자기학",
      "en": "capacitance",
      "ko": "커패시턴스, 정전 용량",
      "enDef": "The ability of a component or system to store electric charge for a given applied voltage.",
      "koDef": "주어진 인가 전압에 대해 전하를 저장할 수 있는 부품이나 시스템의 능력.",
      "exampleEn": "The engineer selected a component with higher capacitance to smooth out fluctuations in the power supply.",
      "exampleKo": "엔지니어는 전원 공급 장치의 변동을 완화하기 위해 정전 용량이 더 큰 부품을 선택했다.",
      "pos": "명사",
      "related": "capacitor\ncharge",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:49:23.450Z",
        "cached": true
      }
    },
    "term_3508cba8-bf31-4d6b-9a4b-82d767f44d61": {
      "discipline": "전기자기학",
      "en": "self-inductance",
      "ko": "자체 인덕턴스, 자기 인덕턴스",
      "enDef": "The property of a coil or circuit to oppose changes in the electric current flowing through it by producing its own voltage.",
      "koDef": "코일이나 회로가 자체적인 전압을 만들어내어 그 안을 흐르는 전류의 변화에 저항하는 성질입니다.",
      "exampleEn": "A coil with high self-inductance slows down sudden changes in electric current.",
      "exampleKo": "자체 인덕턴스가 높은 코일은 전류의 급격한 변화를 늦춥니다.",
      "pos": "명사",
      "related": "mutual inductance\nmagnetic flux",
      "referenceTranslation": "",
      "course": "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:49:33.181Z",
        "cached": false,
        "latencyMs": 6876
      }
    },
    "term_8b869286-5e44-4c37-84ff-d860650141c3": {
      "discipline": "전기기기",
      "en": "synchronous generator",
      "ko": "동기 발전기",
      "enDef": "An alternating current generator whose rotor spins at the exact same speed as the rotating magnetic field of the stator.",
      "koDef": "회전자가 고정자의 회전 자기장과 정확히 같은 속도로 회전하며 교류 전기를 만들어 내는 발전기입니다.",
      "exampleEn": "Most large power plants use a synchronous generator to supply steady AC electricity to the grid.",
      "exampleKo": "대부분의 대형 발전소는 전력망에 안정적인 교류 전기를 공급하기 위해 동기 발전기를 사용합니다.",
      "pos": "명사구",
      "related": "rotor\nstator",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:43:51.535Z",
        "cached": true
      }
    },
    "term_fb6e5701-38ba-43a5-99cb-1674c7c8a01b": {
      "discipline": "전기기기",
      "en": "induction motor",
      "ko": "유도 전동기, 유도 모터",
      "enDef": "An alternating-current electric motor in which electric current in the rotor is created by magnetic induction from the stator.",
      "koDef": "고정자의 자기 유도에 의해 회전자에 전류가 생성되는 교류 전동기입니다.",
      "exampleEn": "Factories rely on the three-phase induction motor to drive conveyor belts and heavy fans.",
      "exampleKo": "공장에서는 컨베이어 벨트와 대형 팬을 구동하기 위해 3상 유도 전동기를 사용합니다.",
      "pos": "명사구",
      "related": "synchronous motor\nstator",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:44:00.266Z",
        "cached": true
      }
    },
    "term_d0ced9fe-66a9-4649-8a13-f96e9bc1e83c": {
      "discipline": "전기기기",
      "en": "transformer",
      "ko": "변압기",
      "enDef": "An electrical device that uses magnetic fields between coils to raise or lower alternating current voltage.",
      "koDef": "코일 사이의 자기장을 이용해 교류 전압을 높이거나 낮추는 전기 장치.",
      "exampleEn": "A phone charger uses a tiny transformer inside to step down the wall outlet voltage safely.",
      "exampleKo": "휴대전화 충전기는 내부에 있는 작은 변압기를 사용해 벽면 콘센트의 전압을 안전하게 낮춘다.",
      "pos": "명사",
      "related": "winding\ninductance",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:44:07.898Z",
        "cached": true
      }
    },
    "term_7fd526f4-a38e-48ab-9946-c2c1a8366212": {
      "discipline": "전기기기",
      "en": "synchronous speed",
      "ko": "동기 속도",
      "enDef": "The speed at which the rotating magnetic field moves inside an AC motor, determined by the power frequency and the number of poles.",
      "koDef": "교류 전동기 내부에서 회전 자기장이 움직이는 속도로, 전원 주파수와 극 수에 의해 결정됩니다.",
      "exampleEn": "An induction motor always runs slightly slower than its synchronous speed under load.",
      "exampleKo": "유도 전동기는 부하가 걸리면 항상 동기 속도보다 약간 느리게 회전합니다.",
      "pos": "명사구",
      "related": "rotor\nstator",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:44:14.627Z",
        "cached": true
      }
    },
    "term_23afaf70-fc59-4764-8a3c-0c0076a3ace0": {
      "discipline": "전기기기",
      "en": "slip",
      "ko": "슬립",
      "enDef": "The difference between the synchronous speed of the magnetic field and the actual speed of the rotor in an induction motor, usually expressed as a percentage.",
      "koDef": "유도 전동기에서 자기장의 동기 속도와 회전자의 실제 속도 간의 차이로, 보통 백분율로 나타냅니다.",
      "exampleEn": "When the load on an induction motor increases, the slip also increases slightly.",
      "exampleKo": "유도 전동기의 부하가 증가하면 슬립도 약간 증가합니다.",
      "pos": "명사",
      "related": "induction motor\nsynchronous speed",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:44:20.903Z",
        "cached": true
      }
    },
    "term_5b510db5-cf00-4049-9a38-f00e632f656d": {
      "discipline": "전기기기",
      "en": "armature reaction",
      "ko": "전기자 반작용",
      "enDef": "The effect in a motor or generator where the magnetic field created by current in the armature changes or weakens the main magnetic field.",
      "koDef": "전동기나 발전기에서 전기자에 흐르는 전류가 만든 자기장이 주 자기장을 변화시키거나 약화시키는 현상입니다.",
      "exampleEn": "Armature reaction can lower the voltage output of a generator when a heavy load is connected.",
      "exampleKo": "무거운 부하가 연결되면 전기자 반작용으로 인해 발전기의 출력 전압이 낮아질 수 있습니다.",
      "pos": "명사구",
      "related": "field winding\nmagnetic flux",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:44:29.338Z",
        "cached": false,
        "latencyMs": 8186
      }
    },
    "term_6b685275-b595-4e15-948f-1e10cf2c4271": {
      "discipline": "전기기기",
      "en": "commutator",
      "ko": "정류자",
      "enDef": "A rotary electrical switch in certain motors and generators that periodically reverses the current direction to keep the rotor spinning in one direction.",
      "koDef": "특정 모터와 발전기에서 회전자가 한 방향으로 계속 회전하도록 전류 방향을 주기적으로 바꾸는 회전식 전기 스위치.",
      "exampleEn": "The brushes press against the spinning commutator to deliver power to the motor's rotor.",
      "exampleKo": "브러시는 회전하는 정류자에 닿아 모터의 회전자에 전력을 전달한다.",
      "pos": "명사",
      "related": "brush\ndc motor",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:44:44.266Z",
        "cached": true
      }
    },
    "term_86d0b865-0c7e-44ec-b7ff-87dc20c03048": {
      "discipline": "전기기기",
      "en": "synchronous reactance",
      "ko": "동기 리액턴스",
      "enDef": "The total opposition to alternating current inside a synchronous machine, caused by both magnetic flux leakage in the coils and the magnetic effect of the armature current.",
      "koDef": "동기 기기 내부에서 교류 전류에 대한 전체적인 방해 작용으로, 코일의 자속 누설과 전기자 전류의 자기적 효과 모두에 의해 발생합니다.",
      "exampleEn": "Engineers measure the synchronous reactance of a generator to predict how much its voltage will drop under a heavy load.",
      "exampleKo": "엔지니어들은 큰 부하가 걸렸을 때 전압이 얼마나 떨어질지 예측하기 위해 발전기의 동기 리액턴스를 측정합니다.",
      "pos": "명사구",
      "related": "armature winding\nvoltage regulation",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:44:52.466Z",
        "cached": false,
        "latencyMs": 10420
      }
    },
    "term_f82716f9-88bd-4085-b3ab-45aa84884e48": {
      "discipline": "전기기기",
      "en": "short-circuit ratio",
      "ko": "단락비",
      "enDef": "In a synchronous generator, the ratio of the field current needed to produce rated voltage with no load connected to the field current needed to produce rated current during a short circuit.",
      "koDef": "동기 발전기에서 부하가 연결되지 않은 상태로 정격 전압을 만드는 데 필요한 계자 전류와 단락 상태에서 정격 전류를 만드는 데 필요한 계자 전류의 비율입니다.",
      "exampleEn": "A synchronous generator with a higher short-circuit ratio generally provides better voltage stability when the electrical load changes.",
      "exampleKo": "단락비가 더 높은 동기 발전기는 일반적으로 전기 부하가 변할 때 더 나은 전압 안정성을 제공합니다.",
      "pos": "명사구",
      "related": "voltage regulation\nfield current",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:45:11.364Z",
        "cached": false,
        "latencyMs": 9032
      }
    },
    "term_fe221976-cdb6-4332-bc9c-2d02cc9079bc": {
      "discipline": "전기기기",
      "en": "back electromotive force",
      "ko": "역기전력",
      "enDef": "A voltage created inside a spinning electric motor that opposes the incoming power supply voltage and limits the current.",
      "koDef": "회전하는 전동기 내부에서 생성되어 들어오는 전원 전압에 반대 방향으로 작용하고 전류를 제한하는 전압입니다.",
      "exampleEn": "As the motor spins faster, the back electromotive force increases and reduces the current drawn from the battery.",
      "exampleKo": "전동기가 더 빠르게 회전할수록 역기전력이 커져 배터리에서 끌어오는 전류가 줄어듭니다.",
      "pos": "명사구",
      "related": "starting current\ninduced voltage",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:45:26.808Z",
        "cached": false,
        "latencyMs": 7992
      }
    },
    "term_d3d3bae1-7e1a-4b17-afab-d59c990882b8": {
      "discipline": "전기기기",
      "en": "iron loss",
      "ko": "철손, 코어 손실",
      "enDef": "Energy lost as heat inside the metal core of an electric motor, generator, or transformer when a changing magnetic field passes through it.",
      "koDef": "변화하는 자기장이 통과할 때 전동기, 발전기 또는 변압기의 금속 코어 내부에서 열로 손실되는 에너지입니다.",
      "exampleEn": "Engineers use thin metal sheets in the transformer core to reduce iron loss.",
      "exampleKo": "엔지니어들은 철손을 줄이기 위해 변압기 코어에 얇은 금속판을 사용합니다.",
      "pos": "명사구",
      "related": "copper loss\nhysteresis loss",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:45:49.662Z",
        "cached": false,
        "latencyMs": 9692
      }
    },
    "term_787560ca-355e-4578-b3e7-9b8b6990d527": {
      "discipline": "전기기기",
      "en": "copper loss",
      "ko": "동손",
      "enDef": "Energy lost as heat when electric current flows through the copper wires or coils of a motor, generator, or transformer.",
      "koDef": "전동기, 발전기 또는 변압기의 구리선이나 코일에 전류가 흐를 때 열로 손실되는 에너지입니다.",
      "exampleEn": "Using thicker copper wires in a transformer helps reduce copper loss and improve efficiency.",
      "exampleKo": "변압기에 더 두꺼운 구리선을 사용하면 동손을 줄이고 효율을 높이는 데 도움이 됩니다.",
      "pos": "명사구",
      "related": "eddy current loss\nhysteresis loss",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:46:09.747Z",
        "cached": false,
        "latencyMs": 8198
      }
    },
    "term_3b0d58f0-2f5c-435f-a7bd-4278da8bad25": {
      "discipline": "전기기기",
      "en": "leakage reactance",
      "ko": "누설 리액턴스",
      "enDef": "In an electric motor or transformer, it is the opposition to alternating current caused by magnetic fields that leak out instead of passing through the other coils.",
      "koDef": "전동기나 변압기에서 자기장이 다른 코일을 통과하지 않고 밖으로 새어 나가면서 생기는 교류 전류에 대한 방해 작용입니다.",
      "exampleEn": "High leakage reactance in a transformer can cause the output voltage to drop when a heavy load is connected.",
      "exampleKo": "변압기에서 누설 리액턴스가 크면 무거운 부하가 연결될 때 출력 전압이 떨어질 수 있습니다.",
      "pos": "명사구",
      "related": "magnetizing reactance\nmagnetic flux",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:46:29.022Z",
        "cached": false,
        "latencyMs": 9106
      }
    },
    "term_48fe8bf7-47db-4d52-8e4f-33dd36724c8c": {
      "discipline": "전기기기",
      "en": "squirrel cage rotor",
      "ko": "농형 회전자",
      "enDef": "A rotating part of an induction motor made of metal bars shorted together at both ends, resembling an exercise wheel for small animals.",
      "koDef": "양 끝이 단락된 금속 막대들로 만들어져 작은 동물의 쳇바퀴와 비슷한 모양을 한 유도 전동기의 회전 부분.",
      "exampleEn": "The squirrel cage rotor is popular in industrial motors because it is simple, strong, and requires little maintenance.",
      "exampleKo": "농형 회전자는 구조가 단순하고 튼튼하며 유지 보수가 거의 필요 없어 산업용 전동기에서 인기가 높다.",
      "pos": "명사구",
      "related": "induction motor\nstator",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:46:48.265Z",
        "cached": true
      }
    },
    "term_02899b3d-ae5c-4548-8cdd-6b30feb75ba2": {
      "discipline": "전기기기",
      "en": "wound rotor",
      "ko": "권선형 회전자",
      "enDef": "A type of rotating part in an electric motor that uses insulated wire coils connected to external slip rings instead of solid metal bars.",
      "koDef": "전동기에서 단단한 금속 막대 대신 외부 슬립 링에 연결된 절연 도선 코일을 사용하는 회전 부분의 한 종류입니다.",
      "exampleEn": "A motor with a wound rotor allows engineers to add external resistance to control starting torque.",
      "exampleKo": "권선형 회전자를 가진 전동기는 엔지니어가 기동 토크를 제어하기 위해 외부 저항을 추가할 수 있게 해줍니다.",
      "pos": "명사구",
      "related": "squirrel cage rotor\nslip ring",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:46:54.982Z",
        "cached": true
      }
    },
    "term_d323ee87-e594-456c-9b4e-4ee2b9914087": {
      "discipline": "전기기기",
      "en": "percentage impedance",
      "ko": "백분율 임피던스, 퍼센트 임피던스",
      "enDef": "In an electrical machine such as a transformer, it is the percentage of the rated voltage needed to make the rated current flow when the output is short-circuited. It shows how much the machine's internal electrical opposition limits the current.",
      "koDef": "변압기와 같은 전기기기에서, 출력이 단락되었을 때 정격 전류가 흐르도록 하는 데 필요한 정격 전압의 백분율입니다. 이는 기기 내부의 전기적 방해 작용이 전류를 얼마나 제한하는지 보여 줍니다.",
      "exampleEn": "A transformer with a higher percentage impedance limits dangerous short-circuit currents more effectively.",
      "exampleKo": "백분율 임피던스가 더 높은 변압기는 위험한 단락 전류를 더 효과적으로 제한합니다.",
      "pos": "명사구",
      "related": "short-circuit current\nvoltage regulation",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:47:05.942Z",
        "cached": false,
        "latencyMs": 9001
      }
    },
    "term_e2f2dc09-2065-4ece-bb1f-526839e62ffb": {
      "discipline": "전기기기",
      "en": "voltage regulation",
      "ko": "전압 변동률, 전압 조정",
      "enDef": "A measure of how well a power supply or transformer keeps its output voltage steady when the connected load changes.",
      "koDef": "연결된 부하가 변할 때 전원 공급 장치나 변압기가 출력 전압을 얼마나 일정하게 유지하는지를 나타내는 척도입니다.",
      "exampleEn": "Good voltage regulation ensures that household appliances receive a stable voltage even when other devices turn on.",
      "exampleKo": "우수한 전압 조정 기능은 다른 기기가 켜져도 가전제품이 안정적인 전압을 공급받도록 보장합니다.",
      "pos": "명사구",
      "related": "transformer\nload",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:47:22.742Z",
        "cached": true
      }
    },
    "term_1cb5d7c0-6855-40a2-b396-b125b52b6bf7": {
      "discipline": "전기기기",
      "en": "hunting",
      "ko": "난조, 헌팅",
      "enDef": "In a synchronous motor or generator, it is an unwanted back-and-forth swing of the rotor speed around its steady synchronous speed, often caused by sudden changes in load.",
      "koDef": "동기 전동기나 발전기에서 회전자의 속도가 일정한 동기 속도 주위로 앞뒤로 원치 않게 흔들리는 현상으로, 주로 부하의 갑작스러운 변화에 의해 발생합니다.",
      "exampleEn": "When the factory load changed suddenly, the synchronous motor started hunting and made the power output unstable.",
      "exampleKo": "공장의 부하가 갑자기 변하자 동기 전동기가 난조를 일으키기 시작했고 전력 출력이 불안정해졌다.",
      "pos": "명사",
      "related": "damper winding\nsynchronizing torque",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
      "referenceSentence": "",
      "pron": "명사",
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
        "checkedAt": "2026-11-19T09:47:32.230Z",
        "cached": false,
        "latencyMs": 9232
      }
    },
    "term_378c9195-dae4-4cc7-b2d7-4643d4ff0a83": {
      "discipline": "전기기기",
      "en": "damper winding",
      "ko": "제동 권선, 댐퍼 권선",
      "enDef": "Short-circuited metal bars placed in the rotor of a synchronous machine to help start the motor and prevent unwanted speed swings.",
      "koDef": "전동기의 기동을 돕고 원치 않는 속도 흔들림을 막기 위해 동기 기기의 회전자에 설치하는 단락된 금속 막대입니다.",
      "exampleEn": "The damper winding keeps the synchronous generator running smoothly when the electrical load changes suddenly.",
      "exampleKo": "제동 권선은 전기 부하가 갑자기 변할 때도 동기 발전기가 부드럽게 작동하도록 유지해 줍니다.",
      "pos": "명사구",
      "related": "field winding\narmature winding",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:47:48.406Z",
        "cached": false,
        "latencyMs": 7930
      }
    },
    "term_dacea3d2-0800-43a3-9924-9d86b2dcd55f": {
      "discipline": "전기기기",
      "en": "starting torque",
      "ko": "기동 토크",
      "enDef": "The turning force produced by an electric motor at the moment it begins to rotate from a standstill.",
      "koDef": "전동기가 정지 상태에서 회전을 시작하는 순간에 발생시키는 회전력입니다.",
      "exampleEn": "Heavy machinery requires a motor with high starting torque to overcome initial inertia.",
      "exampleKo": "중장비는 초기 관성을 극복하기 위해 높은 기동 토크를 가진 전동기가 필요합니다.",
      "pos": "명사구",
      "related": "induction motor\nrotor",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:48:06.250Z",
        "cached": true
      }
    },
    "term_bc0c4127-ecc8-404b-974f-ec1867cc1bcd": {
      "discipline": "회로이론",
      "en": "reactive power",
      "ko": "무효 전력",
      "enDef": "Power in an alternating current circuit that moves back and forth between the source and components like inductors or capacitors without doing real work.",
      "koDef": "교류 회로에서 실제 일을 하지 않고 전원과 인덕터나 커패시터 같은 부품 사이를 오가는 전력입니다.",
      "exampleEn": "Adding capacitors to the factory system helped reduce reactive power and improve overall efficiency.",
      "exampleKo": "공장 시스템에 커패시터를 추가하는 것이 무효 전력을 줄이고 전체 효율을 높이는 데 도움이 되었습니다.",
      "pos": "명사구",
      "related": "active power\napparent power",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:48:13.584Z",
        "cached": true
      }
    },
    "term_12551293-1d10-4316-88dc-a2f7263a4e47": {
      "discipline": "회로이론",
      "en": "delta-wye transformation",
      "ko": "델타-와이 변환 (Δ-Y 변환), 삼각-성형 변환",
      "enDef": "A method in circuit analysis used to change a triangle-shaped (delta) network of three connected components into an equivalent Y-shaped (wye) network.",
      "koDef": "회로 해석에서 세 개의 연결된 부품으로 이루어진 삼각형 모양(델타) 회로를 그와 동등한 Y자 모양(와이) 회로로 바꾸는 데 사용하는 방법입니다.",
      "exampleEn": "We used a delta-wye transformation to simplify the complex resistor network and find the total current.",
      "exampleKo": "우리는 복잡한 저항 회로를 단순화하고 전체 전류를 구하기 위해 델타-와이 변환을 사용했습니다.",
      "pos": "명사구",
      "related": "equivalent circuit\nbridge circuit",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:48:19.529Z",
        "cached": false,
        "latencyMs": 8873
      }
    },
    "term_d36a4bc8-0933-4ba0-a34b-35cce04e3661": {
      "discipline": "전기자기학",
      "en": "hysteresis loop",
      "ko": "히스테리시스 루프, 이력 곡선",
      "enDef": "A closed curve on a graph that shows how a magnetic material's magnetization lags behind an external magnetic field as the field repeatedly increases and decreases.",
      "koDef": "외부 자기장이 반복적으로 증가하고 감소할 때 자성 물질의 자화가 자기장의 변화보다 뒤처지는 모습을 그래프에 나타낸 닫힌 곡선입니다.",
      "exampleEn": "The area inside the hysteresis loop shows how much energy is lost as heat in the transformer core.",
      "exampleKo": "히스테리시스 루프 안쪽의 넓이는 변압기 코어에서 열로 손실되는 에너지가 얼마나 되는지 보여 줍니다.",
      "pos": "명사구",
      "related": "coercivity\nremanence",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
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
        "checkedAt": "2026-11-19T09:48:35.746Z",
        "cached": false,
        "latencyMs": 8624
      }
    },
    "term_e410b049-dd72-40e5-84ba-a411752a150f": {
      "discipline": "전기자기학",
      "en": "Faraday's law of electromagnetic induction",
      "ko": "패러데이의 전자기 유도 법칙",
      "enDef": "A physical law stating that a changing magnetic field through a closed loop of wire produces an electric voltage in the wire. The size of the voltage depends on how quickly the magnetic field changes.",
      "koDef": "닫힌 도선 고리를 통과하는 자기장이 변할 때 도선에 전압이 발생한다는 물리 법칙입니다. 전압의 크기는 자기장이 얼마나 빠르게 변하는지에 따라 달라집니다.",
      "exampleEn": "A generator produces electricity based on Faraday's law of electromagnetic induction by spinning a magnet inside a coil of wire.",
      "exampleKo": "발전기는 도선 코일 안에서 자석을 회전시킴으로써 패러데이의 전자기 유도 법칙에 따라 전기를 만들어 냅니다.",
      "pos": "고유명사",
      "related": "Lenz's law\nmagnetic flux",
      "referenceTranslation": "",
      "course": "notebook_4763091f-b2c3-41c0-858f-033d125a560b",
      "referenceSentence": "",
      "pron": "고유명사",
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
        "checkedAt": "2026-11-19T09:48:50.684Z",
        "cached": false,
        "latencyMs": 9684
      }
    }
  },
  "saved": []
};
