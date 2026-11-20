// Evaluation app: Word Collector_추가 전문가 평가표
// First visit shows the notebook "평가 단어 목록" with every word of the evaluation
// form, analysed by Word Collector (analysis server V11.17) (전공 의미, major = the word's 분류).
// After the first change the app keeps its own data under its own storage key.
const seed = {
 "courses": {
  "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6": [
   "평가 단어 목록",
   ""
  ]
 },
 "terms": {
  "term_c4dd125a-ffbd-4f1a-83f3-139214752b67": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:43:51.754Z",
    "cached": true
   }
  },
  "term_9de76424-8eaa-4f5f-9519-432763497016": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:44:01.458Z",
    "cached": true
   }
  },
  "term_f86d1fe9-a81d-42b7-9d07-4c7461cce2e7": {
   "discipline": "전기기기",
   "en": "leakage reactance",
   "ko": "누설 리액턴스",
   "enDef": "The opposition to alternating current in a coil caused by a part of the magnetic field that escapes instead of reaching the other coil.",
   "koDef": "한 코일에서 생긴 자기장의 일부가 다른 코일에 닿지 않고 빠져나가면서 교류 전류의 흐름을 방해하는 정도입니다.",
   "exampleEn": "The engineer measured the leakage reactance of the transformer to check how much voltage drops under load.",
   "exampleKo": "엔지니어는 부하가 걸렸을 때 전압이 얼마나 떨어지는지 확인하기 위해 변압기의 누설 리액턴스를 측정했습니다.",
   "pos": "명사구",
   "related": "magnetizing reactance\nwinding resistance",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:44:09.446Z",
    "cached": false,
    "latencyMs": 10293
   }
  },
  "term_3ef9ffe5-8533-4a3c-836b-29196d9bdd29": {
   "discipline": "전기기기",
   "en": "percentage impedance",
   "ko": "퍼센트 임피던스",
   "enDef": "The voltage drop inside an electrical machine, such as a transformer, when rated current flows, shown as a percentage of its rated voltage.",
   "koDef": "변압기와 같은 전기기기에서 정격 전류가 흐를 때 내부에서 생기는 전압 강하를 정격 전압에 대한 백분율로 나타낸 값입니다.",
   "exampleEn": "Knowing the percentage impedance of a transformer helps engineers calculate how much current will flow during a short circuit.",
   "exampleKo": "변압기의 퍼센트 임피던스를 알면 단락 사고가 일어났을 때 전류가 얼마나 흐를지 계산하는 데 도움이 됩니다.",
   "pos": "명사구",
   "related": "short-circuit current\nvoltage regulation",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:44:29.276Z",
    "cached": false,
    "latencyMs": 8920
   }
  },
  "term_8d6ca308-9375-4513-aa86-bd96b5e11982": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:44:45.364Z",
    "cached": true
   }
  },
  "term_6c351a06-f7d1-4c21-ab14-b810d998a0e2": {
   "discipline": "전기기기",
   "en": "hunting",
   "ko": "난조",
   "enDef": "The unwanted back-and-forth swing in the rotation speed of a synchronous motor or generator as it tries to settle after a sudden change in load.",
   "koDef": "갑작스러운 부하 변화 이후 동기 전동기나 동기 발전기가 안정되려고 하면서 회전 속도가 앞뒤로 불필요하게 흔들리는 현상입니다.",
   "exampleEn": "A sudden drop in load caused hunting in the synchronous generator, making its output power unsteady.",
   "exampleKo": "갑작스러운 부하 감소로 동기 발전기에 난조가 발생하여 출력 전력이 불안정해졌습니다.",
   "pos": "명사",
   "related": "damper winding\nsynchronous speed",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:44:53.709Z",
    "cached": false,
    "latencyMs": 11818
   }
  },
  "term_610075f7-9e8e-4885-bd87-29fe253b2f11": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:45:13.286Z",
    "cached": true
   }
  },
  "term_0417376c-9ec0-4d03-9ec6-9b3fc96c9bf8": {
   "discipline": "전력공학",
   "en": "per-unit system",
   "ko": "단위법",
   "enDef": "A method in power engineering that expresses electrical quantities like voltage, current, and power as fractions of chosen base values. It makes analyzing complex power networks with different voltage levels much simpler.",
   "koDef": "전압, 전류, 전력 같은 전기량을 정해진 기준값에 대한 비율로 나타내는 전력공학의 방법입니다. 서로 다른 전압 수준을 가진 복잡한 전력망을 훨씬 간단하게 분석할 수 있게 해 줍니다.",
   "exampleEn": "Engineers use the per-unit system to simplify calculations across transformers with different voltage ratings.",
   "exampleKo": "엔지니어들은 정격 전압이 다른 변압기들이 포함된 계산을 단순화하기 위해 단위법을 사용합니다.",
   "pos": "명사구",
   "related": "base value\nrated voltage",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:45:20.512Z",
    "cached": false,
    "latencyMs": 9846
   }
  },
  "term_22511b65-f103-4db7-8ad0-3f73410d22d7": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:45:46.619Z",
    "cached": true
   }
  },
  "term_4323dedc-4fb7-4720-9811-6fa946449119": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:45:56.039Z",
    "cached": true
   }
  },
  "term_951b6ff6-eaf6-4207-818a-d94528dd5f3e": {
   "discipline": "회로이론",
   "en": "quality factor",
   "ko": "품질 계수, Q 인자",
   "enDef": "A number that shows how well a circuit or oscillator stores energy compared to how much energy it loses in each cycle. A higher value means less energy is lost as heat and the circuit responds more sharply to a specific frequency.",
   "koDef": "회로나 진동자가 한 주기마다 잃는 에너지에 비해 에너지를 얼마나 잘 저장하는지를 나타내는 숫자입니다. 값이 클수록 열로 잃는 에너지가 적고, 회로가 특정 주파수에 더 날카롭게 반응합니다.",
   "exampleEn": "In a radio receiver, a resonant circuit with a high quality factor helps pick out one station cleanly without interference from nearby frequencies.",
   "exampleKo": "라디오 수신기에서 품질 계수가 높은 공진 회로는 주변 주파수의 간섭 없이 한 방송국을 깔끔하게 골라내는 데 도움을 줍니다.",
   "pos": "명사구",
   "related": "bandwidth\nresonant frequency",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:46:04.619Z",
    "cached": false,
    "latencyMs": 11252
   }
  },
  "term_d777132a-2c7e-42b1-8bd2-2a4be6de1a2d": {
   "discipline": "회로이론",
   "en": "time constant",
   "ko": "시정수",
   "enDef": "A measure of how fast an electric circuit responds to a sudden change in voltage or current. It is the time needed for the voltage or current to complete about 63 percent of its total change.",
   "koDef": "전기 회로가 전압이나 전류의 갑작스러운 변화에 얼마나 빠르게 반응하는지를 나타내는 척도입니다. 전압이나 전류가 전체 변화량의 약 63퍼센트에 도달하는 데 걸리는 시간입니다.",
   "exampleEn": "A circuit with a larger time constant takes longer for its voltage to settle after a switch is closed.",
   "exampleKo": "시정수가 더 큰 회로는 스위치를 닫은 뒤 전압이 안정되는 데 시간이 더 오래 걸립니다.",
   "pos": "명사구",
   "related": "transient response\nRC circuit",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:46:25.727Z",
    "cached": false,
    "latencyMs": 8652
   }
  },
  "term_8cc713e2-f5df-4280-b22d-e07ba8e5ac46": {
   "discipline": "회로이론",
   "en": "two-port network",
   "ko": "2포트 회로망, 2단자쌍 회로망",
   "enDef": "An electrical circuit with two pairs of terminals, one for input and one for output, used to study how signals or power pass through the circuit.",
   "koDef": "입력용과 출력용으로 각각 하나씩 두 쌍의 단자를 가진 전기 회로로, 신호나 전력이 회로를 어떻게 통과하는지 연구하는 데 사용됩니다.",
   "exampleEn": "Engineers model an amplifier as a two-port network to easily calculate its input and output voltages.",
   "exampleKo": "공학자들은 입력 전압과 출력 전압을 쉽게 계산하기 위해 증폭기를 2포트 회로망으로 모델링합니다.",
   "pos": "명사구",
   "related": "transfer function\nequivalent circuit",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:46:41.966Z",
    "cached": false,
    "latencyMs": 8791
   }
  },
  "term_3a6ef6f1-3bad-45be-a9f1-4589fa898bd6": {
   "discipline": "회로이론",
   "en": "Fourier series",
   "ko": "푸리에 급수",
   "enDef": "A mathematical method that breaks down any repeating wave into a sum of simple sine and cosine waves. In circuit theory, it helps analyze how a circuit responds to complex signals at different frequencies.",
   "koDef": "반복되는 모든 파형을 단순한 사인파와 코사인파의 합으로 분해하는 수학적 방법입니다. 회로이론에서는 다양한 주파수에서 회로가 복잡한 신호에 어떻게 반응하는지 분석하는 데 도움을 줍니다.",
   "exampleEn": "We can use a Fourier series to find the frequency components of a square wave entering the circuit.",
   "exampleKo": "회로에 입력되는 사각파의 주파수 성분을 찾기 위해 푸리에 급수를 사용할 수 있습니다.",
   "pos": "고유명사",
   "related": "harmonic\nsuperposition theorem",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:46:59.480Z",
    "cached": false,
    "latencyMs": 10285
   }
  },
  "term_e702aed3-38c0-49f7-8927-aa54929e0fc1": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:47:17.260Z",
    "cached": true
   }
  },
  "term_372e051f-6547-4418-a097-ed88b330a4c8": {
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
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:47:27.012Z",
    "cached": true
   }
  },
  "term_e8664177-d59d-4415-8a5c-8f3ecf949022": {
   "discipline": "전기안전공학",
   "en": "touch voltage",
   "ko": "접촉 전압",
   "enDef": "The voltage between a metal object that a person touches and the ground where the person is standing, usually when an electrical fault occurs.",
   "koDef": "보통 전기 고장이 발생했을 때 사람이 만지는 금속 물체와 그 사람이 서 있는 땅 사이에 걸리는 전압입니다.",
   "exampleEn": "Proper grounding helps keep touch voltage at a safe level so workers do not get an electric shock.",
   "exampleKo": "적절한 접지는 작업자가 감전되지 않도록 접촉 전압을 안전한 수준으로 유지하는 데 도움이 됩니다.",
   "pos": "명사구",
   "related": "step voltage\ngrounding",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:47:36.424Z",
    "cached": false,
    "latencyMs": 8664
   }
  },
  "term_3ad4e3d5-3682-4c52-bd70-d6760a059b00": {
   "discipline": "전기안전공학",
   "en": "step voltage",
   "ko": "보폭 전압",
   "enDef": "The voltage difference between a person's two feet when walking on the ground near a fallen power line or an electrical fault. Because current spreads through the ground, one foot can be at a higher voltage than the other, causing electricity to flow through the body.",
   "koDef": "끊어진 전선이나 전기 고장 지점 근처의 땅 위를 걸을 때 사람의 두 발 사이에 생기는 전압 차이입니다. 전류가 땅을 통해 퍼져 나가기 때문에 한쪽 발이 다른 쪽 발보다 더 높은 전압에 놓여 몸을 통해 전류가 흐를 수 있습니다.",
   "exampleEn": "If a power line falls on the ground, taking small shuffling steps can reduce the dangerous step voltage between your feet.",
   "exampleKo": "전선이 땅에 떨어졌을 때 발을 끌며 작게 움직이면 두 발 사이의 위험한 보폭 전압을 줄일 수 있습니다.",
   "pos": "명사구",
   "related": "ground fault\ngrounding",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:47:52.288Z",
    "cached": false,
    "latencyMs": 8389
   }
  },
  "term_1f81f8ea-e156-476f-95da-9455958d2b74": {
   "discipline": "전기안전공학",
   "en": "leakage current",
   "ko": "누설 전류",
   "enDef": "An unwanted electric current that flows through insulation or across a surface to the ground or another conductor instead of staying in its intended path. In electrical safety, it can cause electric shock or fire if it becomes too large.",
   "koDef": "원래 흐르도록 설계된 경로에 머물지 않고 절연체나 표면을 통해 땅이나 다른 도체로 흘러나가는 원치 않는 전류입니다. 전기안전 분야에서는 이 전류가 너무 커지면 감전이나 화재를 일으킬 수 있습니다.",
   "exampleEn": "A ground-fault circuit interrupter quickly shuts off the power when it detects dangerous leakage current.",
   "exampleKo": "누전 차단기는 위험한 누설 전류를 감지하면 즉시 전원을 차단합니다.",
   "pos": "명사구",
   "related": "insulation resistance\nground fault",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:48:09.366Z",
    "cached": false,
    "latencyMs": 8701
   }
  },
  "term_1bdc4fc7-750f-4d43-bbdf-e85bd6b7ff82": {
   "discipline": "전기안전공학",
   "en": "earth resistance",
   "ko": "접지 저항",
   "enDef": "The resistance between a building's grounding system and the earth around it. It shows how easily unwanted or fault electricity can flow safely into the ground.",
   "koDef": "건물의 접지 시스템과 그 주변의 땅 사이에 있는 저항입니다. 원치 않는 전기나 고장 전류가 얼마나 쉽게 땅으로 안전하게 흘러 들어갈 수 있는지를 보여 줍니다.",
   "exampleEn": "Regularly testing the earth resistance helps ensure that fault currents can safely flow into the ground without causing electric shock.",
   "exampleKo": "접지 저항을 정기적으로 측정하면 감전을 일으키지 않고 고장 전류가 땅으로 안전하게 흐를 수 있는지 확인하는 데 도움이 됩니다.",
   "pos": "명사구",
   "related": "grounding\nfault current",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:48:28.460Z",
    "cached": false,
    "latencyMs": 7586
   }
  },
  "term_d9a644b7-861b-4444-a4b5-e3a39a169102": {
   "discipline": "전기안전공학",
   "en": "surge protective device (SPD)",
   "ko": "서지 보호 장치",
   "enDef": "A safety device installed in an electrical system to protect equipment from sudden, brief spikes in voltage, such as those caused by lightning or switching. It safely diverts the excess electrical energy away from sensitive devices to the ground.",
   "koDef": "낙뢰나 개폐 등으로 인해 발생하는 갑작스럽고 짧은 전압 급상승으로부터 장비를 보호하기 위해 전기 설비에 설치하는 안전 장치입니다. 과도한 전기 에너지를 민감한 장치에서 떼어내 땅으로 안전하게 흘려보냅니다.",
   "exampleEn": "We installed a surge protective device at the main power panel to keep our computers safe during thunderstorms.",
   "exampleKo": "우리는 뇌우가 칠 때 컴퓨터를 안전하게 보호하기 위해 주 분전반에 서지 보호 장치를 설치했습니다.",
   "pos": "명사구",
   "related": "lightning arrester\ncircuit breaker",
   "referenceTranslation": "",
   "course": "notebook_de379ea0-dfe4-4e14-b7a4-024035cd24c6",
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
    "checkedAt": "2026-11-19T09:48:45.465Z",
    "cached": false,
    "latencyMs": 10086
   }
  }
 },
 "saved": []
};
