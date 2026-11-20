// Evaluation app: 회로이론 교수님 평가표
// First visit shows the notebook "평가 단어 목록" with every word of the evaluation
// form, analysed by Word Collector (analysis server V11.17) (전공 의미, major = the word's 분류).
// After the first change the app keeps its own data under its own storage key.
const seed = {
 "courses": {
  "notebook_9798d1b4-4125-4ea7-8428-3a93386554e2": [
   "평가 단어 목록",
   ""
  ]
 },
 "terms": {
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
  }
 },
 "saved": []
};
