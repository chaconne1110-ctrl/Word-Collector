// Evaluation app: 전기자기학 교수님 평가표
// First visit shows the notebook "평가 단어 목록" with every word of the evaluation
// form, analysed by Word Collector (analysis server V11.17) (전공 의미, major = the word's 분류).
// After the first change the app keeps its own data under its own storage key.
const seed = {
 "courses": {
  "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c": [
   "평가 단어 목록",
   ""
  ]
 },
 "terms": {
  "term_3f3f2863-2688-4b78-8513-1b368e135234": {
   "discipline": "전기자기학",
   "en": "Coulomb's law",
   "ko": "쿨롱의 법칙",
   "enDef": "A physical law that describes the electric force between two charged objects. The force gets stronger as the charges increase and weaker as the distance between them increases.",
   "koDef": "두 대전된 물체 사이의 전기력을 설명하는 물리 법칙입니다. 이 힘은 전하량이 커질수록 강해지고, 두 물체 사이의 거리가 멀어질수록 약해집니다.",
   "exampleEn": "Using Coulomb's law, we can calculate the force between two charged particles.",
   "exampleKo": "쿨롱의 법칙을 사용하면 두 대전된 입자 사이의 힘을 계산할 수 있습니다.",
   "pos": "고유명사",
   "related": "electric charge\nelectric field",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:43:51.466Z",
    "cached": false,
    "latencyMs": 10712
   }
  },
  "term_28b0fd4a-b0b1-450a-aebb-d38346765e60": {
   "discipline": "전기자기학",
   "en": "electric field intensity",
   "ko": "전기장 세기, 전계 강도",
   "enDef": "The strength of an electric field at a specific point, defined as the electric force per unit positive charge.",
   "koDef": "특정 지점에서의 전기장의 세기로, 단위 양전하당 작용하는 전기력으로 정의된다.",
   "exampleEn": "The electric field intensity increases as you move closer to a charged object.",
   "exampleKo": "대전된 물체에 가까워질수록 전기장 세기가 커진다.",
   "pos": "명사구",
   "related": "electric field\nelectric potential",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:44:11.489Z",
    "cached": true
   }
  },
  "term_a796ac49-9f21-45c3-8145-4a78c0d6a9db": {
   "discipline": "전기자기학",
   "en": "electric flux density",
   "ko": "전속 밀도",
   "enDef": "A measure of the strength of an electric field per unit area, taking into account the material's permittivity.",
   "koDef": "물질의 유전율을 고려하여 단위 면적당 전기장의 세기를 나타낸 척도입니다.",
   "exampleEn": "We can calculate the electric flux density by multiplying the electric field by the permittivity of the medium.",
   "exampleKo": "전기장에 매질의 유전율을 곱하여 전속 밀도를 계산할 수 있습니다.",
   "pos": "명사구",
   "related": "electric field\npermittivity",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:44:19.715Z",
    "cached": true
   }
  },
  "term_21875f42-0e17-404c-a753-ea83601aa0f2": {
   "discipline": "전기자기학",
   "en": "Gauss's law",
   "ko": "가우스 법칙",
   "enDef": "A fundamental law of electromagnetism stating that the total electric flux passing through any closed surface is proportional to the electric charge enclosed within it.",
   "koDef": "임의의 닫힌 표면을 통과하는 총 전기 선속이 그 내부에 포함된 전하량에 비례한다는 전자기학의 기본 법칙입니다.",
   "exampleEn": "We can use Gauss's law to easily calculate the electric field around a charged sphere.",
   "exampleKo": "가우스 법칙을 사용하면 대전된 구 주위의 전기장을 쉽게 계산할 수 있습니다.",
   "pos": "고유명사",
   "related": "electric flux\nMaxwell's equations",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
   "referenceSentence": "",
   "pron": "고유명사",
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
    "checkedAt": "2026-11-19T09:44:28.844Z",
    "cached": true
   }
  },
  "term_0e29d600-d393-44c5-b09b-5a8d023f63bb": {
   "discipline": "전기자기학",
   "en": "electric potential",
   "ko": "전위",
   "enDef": "The amount of electric potential energy per unit charge at a specific point in an electric field, measured in volts.",
   "koDef": "전기장 내의 특정 지점에서 단위 전하당 갖는 전기적 위치 에너지의 양으로, 볼트 단위로 측정됩니다.",
   "exampleEn": "Current flows from a region of higher electric potential to a region of lower electric potential.",
   "exampleKo": "전류는 전위가 높은 영역에서 전위가 낮은 영역으로 흐릅니다.",
   "pos": "명사구",
   "related": "voltage\nelectric field",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:44:36.293Z",
    "cached": true
   }
  },
  "term_5528eebb-e3af-4bf7-acd9-b8a0526f1eef": {
   "discipline": "전기자기학",
   "en": "permittivity",
   "ko": "유전율",
   "enDef": "A physical property of a material that measures how easily an electric field can form inside it.",
   "koDef": "물질 내부에 전기장이 얼마나 쉽게 형성될 수 있는지를 측정하는 물질의 물리적 특성입니다.",
   "exampleEn": "Engineers choose insulating materials with high permittivity when designing compact capacitors.",
   "exampleKo": "엔지니어들은 소형 커패시터를 설계할 때 유전율이 높은 절연 재료를 선택합니다.",
   "pos": "명사",
   "related": "dielectric\ncapacitance",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:44:43.252Z",
    "cached": true
   }
  },
  "term_8689b4f8-183f-42d3-88fb-6e9b5d007e63": {
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
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:44:52.155Z",
    "cached": true
   }
  },
  "term_ea225842-dc1c-40a9-88ef-ead1aa14eb21": {
   "discipline": "전기자기학",
   "en": "boundary condition",
   "ko": "경계 조건",
   "enDef": "A rule that describes how electric or magnetic fields must behave at the surface where two different materials meet.",
   "koDef": "서로 다른 두 물질이 만나는 표면에서 전기장이나 자기장이 어떻게 행동해야 하는지를 설명하는 규칙입니다.",
   "exampleEn": "Engineers apply the boundary condition at a metal surface to calculate how much of an electromagnetic wave reflects back.",
   "exampleKo": "공학자들은 전자기파가 얼마나 반사되는지 계산하기 위해 금속 표면에 경계 조건을 적용합니다.",
   "pos": "명사구",
   "related": "electric field\nconductor",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:44:58.260Z",
    "cached": true
   }
  },
  "term_1c092404-412f-475d-8349-38b817754181": {
   "discipline": "전기자기학",
   "en": "method of images",
   "ko": "영상법",
   "enDef": "A problem-solving technique in electromagnetism that replaces a conducting surface with imaginary electric charges behind it. This makes it much easier to calculate the electric field and electric potential in front of the surface.",
   "koDef": "도체 표면을 그 뒤쪽에 있는 가상의 전하로 대체하여 푸는 전자기학의 문제 해결 기법입니다. 이를 통해 표면 앞쪽의 전기장과 전위를 훨씬 쉽게 계산할 수 있습니다.",
   "exampleEn": "We can use the method of images to find the electric field created by a point charge near a grounded metal plate.",
   "exampleKo": "우리는 접지된 금속판 근처의 점전하가 만드는 전기장을 구하기 위해 영상법을 사용할 수 있습니다.",
   "pos": "명사구",
   "related": "point charge\nelectrostatic induction",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:45:06.708Z",
    "cached": false,
    "latencyMs": 10097
   }
  },
  "term_a382582f-ff07-439b-b11b-cb7a0d822244": {
   "discipline": "전기자기학",
   "en": "Biot-Savart law",
   "ko": "비오-사바르 법칙",
   "enDef": "A law in electromagnetism that explains how a steady electric current creates a magnetic field around it. The magnetic field gets stronger when the current is larger and weaker as the distance from the wire increases.",
   "koDef": "일정한 전류가 그 주위에 자기장을 어떻게 만들어내는지를 설명하는 전자기학의 법칙입니다. 자기장은 전류가 클수록 강해지고 전선으로부터의 거리가 멀어질수록 약해집니다.",
   "exampleEn": "Engineers use the Biot-Savart law to calculate the magnetic field produced by a current-carrying wire.",
   "exampleKo": "공학자들은 전류가 흐르는 전선이 만들어내는 자기장을 계산하기 위해 비오-사바르 법칙을 사용합니다.",
   "pos": "고유명사",
   "related": "Ampere's law\nmagnetic flux density",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:45:25.326Z",
    "cached": false,
    "latencyMs": 8124
   }
  },
  "term_e5301b85-bc42-42d9-9379-44fb6f1f5120": {
   "discipline": "전기자기학",
   "en": "Ampère's circuital law",
   "ko": "앙페르의 주회 법칙, 앙페르의 회로 법칙",
   "enDef": "A law in electromagnetism that relates the magnetic field around a closed loop to the electric current passing through that loop. The stronger the current inside the loop, the stronger the magnetic field around it.",
   "koDef": "닫힌 고리 주위의 자기장과 그 고리를 통과하는 전류 사이의 관계를 설명하는 전자기학의 법칙입니다. 고리 내부의 전류가 강할수록 주위의 자기장도 강해집니다.",
   "exampleEn": "You can use Ampère's circuital law to easily calculate the magnetic field around a long, straight wire carrying a steady current.",
   "exampleKo": "일정한 전류가 흐르는 긴 직선 도선 주위의 자기장을 쉽게 계산하기 위해 앙페르의 주회 법칙을 사용할 수 있습니다.",
   "pos": "고유명사",
   "related": "magnetic field\nFaraday's law",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:45:47.894Z",
    "cached": false,
    "latencyMs": 7472
   }
  },
  "term_74fe01b3-c950-4280-9e63-b66345ba070d": {
   "discipline": "전기자기학",
   "en": "magnetic flux density",
   "ko": "자속 밀도",
   "enDef": "The amount of magnetic flux passing through a unit area perpendicular to the magnetic field.",
   "koDef": "자기장에 수직인 단위 면적을 통과하는 자속의 양.",
   "exampleEn": "The magnetic flux density near the center of the coil was measured in teslas.",
   "exampleKo": "코일 중심 부근의 자속 밀도는 테슬라 단위로 측정되었다.",
   "pos": "명사구",
   "related": "magnetic flux\nmagnetic field",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:46:04.008Z",
    "cached": true
   }
  },
  "term_77404b94-cd67-436e-809a-b635b1a79cc3": {
   "discipline": "전기자기학",
   "en": "permeability",
   "ko": "투자율",
   "enDef": "A measure of how easily a material can support the formation of a magnetic field within itself.",
   "koDef": "물질이 내부에 자기장을 얼마나 쉽게 형성할 수 있는지를 나타내는 척도입니다.",
   "exampleEn": "Iron has a high magnetic permeability, making it ideal for transformer cores.",
   "exampleKo": "철은 자기 투자율이 높아 변압기 철심에 이상적입니다.",
   "pos": "명사",
   "related": "magnetic field\npermittivity",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:46:12.332Z",
    "cached": true
   }
  },
  "term_6964cff9-31ad-4725-a106-ec69cb68e6a0": {
   "discipline": "전기자기학",
   "en": "reluctance",
   "ko": "자기저항",
   "enDef": "The opposition that a material or magnetic circuit offers to the flow of magnetic flux.",
   "koDef": "물질이나 자기 회로가 자속의 흐름에 대해 나타내는 저항.",
   "exampleEn": "Air gaps in a transformer core increase the overall reluctance of the magnetic path.",
   "exampleKo": "변압기 철심의 공극은 자기 경로의 전체 자기저항을 증가시킨다.",
   "pos": "명사",
   "related": "magnetic flux\npermeability",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:46:20.695Z",
    "cached": true
   }
  },
  "term_7bad370c-2f88-4ade-b1b9-e59b5b622f6b": {
   "discipline": "전기자기학",
   "en": "hysteresis loop",
   "ko": "히스테리시스 루프, 자기 이력 곡선",
   "enDef": "A closed curve on a graph that shows how the magnetization of a material lags behind a changing external magnetic field. The area inside the loop represents the energy lost as heat during each magnetic cycle.",
   "koDef": "외부 자기장이 변할 때 물질의 자화가 어떻게 뒤따라가는지를 보여주는 그래프 위의 닫힌 곡선입니다. 이 곡선 안쪽의 넓이는 한 번의 자기 순환 동안 열로 손실되는 에너지를 나타냅니다.",
   "exampleEn": "Engineers choose magnetic materials with a narrow hysteresis loop for transformers to reduce energy loss.",
   "exampleKo": "엔지니어들은 에너지 손실을 줄이기 위해 변압기에 좁은 히스테리시스 루프를 가진 자성 재료를 선택합니다.",
   "pos": "명사구",
   "related": "coercivity\nremanence",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:46:31.555Z",
    "cached": false,
    "latencyMs": 9491
   }
  },
  "term_745e141e-6dae-4d5d-9241-1d024b5d4118": {
   "discipline": "전기자기학",
   "en": "Faraday's law of electromagnetic induction",
   "ko": "패러데이의 전자기 유도 법칙",
   "enDef": "A physical law stating that a changing magnetic field through a closed loop creates a voltage around it. The faster the magnetic field changes, the stronger the induced voltage becomes.",
   "koDef": "닫힌 고리를 통과하는 자기장이 변할 때 그 주위에 전압이 만들어진다는 물리 법칙입니다. 자기장이 더 빠르게 변할수록 유도되는 전압이 더 강해집니다.",
   "exampleEn": "Electric generators work based on Faraday's law of electromagnetic induction by spinning a magnet near a coil of wire.",
   "exampleKo": "발전기는 전선 코일 근처에서 자석을 회전시킴으로써 패러데이의 전자기 유도 법칙을 바탕으로 작동합니다.",
   "pos": "고유명사",
   "related": "Lenz's law\nelectromotive force",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:46:50.690Z",
    "cached": false,
    "latencyMs": 7957
   }
  },
  "term_7ff2867d-d74e-4b80-b1b1-dbff87b5d22c": {
   "discipline": "전기자기학",
   "en": "self-inductance",
   "ko": "자체 인덕턴스, 자기 유도 계수",
   "enDef": "A property of an electric circuit or coil that opposes any change in the electric current flowing through it. When the current changes, the circuit creates its own voltage to resist that change.",
   "koDef": "회로나 코일에 흐르는 전류의 변화에 저항하는 성질입니다. 전류가 변할 때 회로는 그 변화에 맞서기 위해 스스로 전압을 만들어냅니다.",
   "exampleEn": "A coil with high self-inductance resists sudden changes in electric current.",
   "exampleKo": "자체 인덕턴스가 높은 코일은 전류의 갑작스러운 변화에 저항합니다.",
   "pos": "명사",
   "related": "inductor\nelectromotive force",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:47:08.156Z",
    "cached": false,
    "latencyMs": 9744
   }
  },
  "term_f286f810-3080-4252-b942-b3f095f1a17a": {
   "discipline": "전기자기학",
   "en": "displacement current",
   "ko": "변위 전류",
   "enDef": "A quantity that acts like an electric current in empty space or an insulator when an electric field is changing.",
   "koDef": "전기장이 변할 때 빈 공간이나 절연체에서 전류처럼 작용하는 물리량.",
   "exampleEn": "Displacement current explains how a capacitor can pass an alternating current without electrons crossing the gap.",
   "exampleKo": "변위 전류는 전자가 틈을 건너지 않고도 커패시터가 교류를 통과시킬 수 있는 원리를 설명합니다.",
   "pos": "명사구",
   "related": "electric field\ncapacitor",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:47:27.519Z",
    "cached": true
   }
  },
  "term_adf63b51-9cce-4543-a8ec-257b9a71b7b1": {
   "discipline": "전기자기학",
   "en": "Poynting vector",
   "ko": "포인팅 벡터",
   "enDef": "A vector quantity that represents the directional energy flux density of an electromagnetic field, calculated as the cross product of the electric and magnetic fields.",
   "koDef": "전자기장의 방향성 에너지 선속 밀도를 나타내는 벡터량으로, 전기장과 자기장의 외적으로 계산된다.",
   "exampleEn": "The Poynting vector shows the direction in which electromagnetic energy travels through space.",
   "exampleKo": "포인팅 벡터는 전자기 에너지가 공간을 통해 이동하는 방향을 보여준다.",
   "pos": "명사구",
   "related": "electromagnetic field\npower density",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:47:35.982Z",
    "cached": true
   }
  },
  "term_b8611033-a658-4fa0-a2ea-d6a2126a8666": {
   "discipline": "전기자기학",
   "en": "Maxwell's equations",
   "ko": "맥스웰 방정식",
   "enDef": "A set of four fundamental equations in electromagnetism that describe how electric and magnetic fields are created and how they interact with each other.",
   "koDef": "전기장과 자기장이 어떻게 만들어지고 서로 어떻게 상호작용하는지를 설명하는 전자기학의 네 가지 기본 방정식입니다.",
   "exampleEn": "Maxwell's equations show that light is actually an electromagnetic wave made of changing electric and magnetic fields.",
   "exampleKo": "맥스웰 방정식은 빛이 실제로 변하는 전기장과 자기장으로 이루어진 전자기파라는 것을 보여줍니다.",
   "pos": "고유명사",
   "related": "electromagnetic wave\nLorentz force",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:47:44.995Z",
    "cached": false,
    "latencyMs": 7921
   }
  },
  "term_9798e6e4-daa8-43f7-8274-aef5a0ca2c69": {
   "discipline": "전기기기",
   "en": "iron loss",
   "ko": "철손",
   "enDef": "Energy lost as heat in the iron core of an electric machine, such as a transformer or motor, when the magnetic field inside it changes.",
   "koDef": "변압기나 전동기와 같은 전기기기 내부의 자기장이 변할 때 철심에서 열로 손실되는 에너지입니다.",
   "exampleEn": "Engineers use thin metal sheets to reduce iron loss in a transformer.",
   "exampleKo": "엔지니어들은 변압기의 철손을 줄이기 위해 얇은 금속판을 사용합니다.",
   "pos": "명사구",
   "related": "copper loss\neddy current loss",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:48:01.245Z",
    "cached": false,
    "latencyMs": 8581
   }
  },
  "term_a324ca5a-ccd0-4c4e-8496-3571d06ed4e9": {
   "discipline": "전력공학",
   "en": "corona discharge",
   "ko": "코로나 방전",
   "enDef": "An electrical discharge that occurs when a strong electric field around a high-voltage conductor ionizes the surrounding air. It often produces a faint glow, a hissing noise, and energy loss in power lines.",
   "koDef": "고전압 도체 주위의 강한 전기장이 주변 공기를 이온화할 때 발생하는 전기 방전입니다. 이는 종종 희미한 빛, 쉬 하는 소리, 그리고 전력선의 에너지 손실을 만들어 냅니다.",
   "exampleEn": "Engineers try to reduce corona discharge on high-voltage transmission lines to prevent power loss.",
   "exampleKo": "엔지니어들은 전력 손실을 막기 위해 고전압 송전선에서 코로나 방전을 줄이려고 노력합니다.",
   "pos": "명사구",
   "related": "dielectric breakdown\ntransmission line",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:48:17.967Z",
    "cached": false,
    "latencyMs": 8426
   }
  },
  "term_2632585d-a092-445e-887c-683199f698ee": {
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
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:48:35.113Z",
    "cached": true
   }
  },
  "term_42bfe661-aeb6-4177-94b0-3a94dca1d2fd": {
   "discipline": "전기안전공학",
   "en": "electrostatic discharge (ESD)",
   "ko": "정전기 방전",
   "enDef": "A sudden flow of electricity between two objects with different electric charges when they touch or get very close. In electrical safety engineering, it is a major hazard because it can damage sensitive electronic parts or create sparks that cause fires.",
   "koDef": "서로 다른 전하를 띤 두 물체가 닿거나 매우 가까워질 때 갑자기 전기가 흐르는 현상입니다. 전기안전공학에서는 민감한 전자 부품을 손상시키거나 화재를 일으키는 불꽃을 만들 수 있기 때문에 주요 위험 요소입니다.",
   "exampleEn": "Workers wear special wrist straps to prevent electrostatic discharge from damaging computer chips.",
   "exampleKo": "작업자들은 정전기 방전이 컴퓨터 칩을 손상시키는 것을 막기 위해 특수 손목띠를 착용합니다.",
   "pos": "명사구",
   "related": "grounding\narc flash",
   "referenceTranslation": "",
   "course": "notebook_59be3367-d6e9-4fa1-ba2b-cbdbf7c5c64c",
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
    "checkedAt": "2026-11-19T09:48:44.408Z",
    "cached": false,
    "latencyMs": 8956
   }
  }
 },
 "saved": []
};
