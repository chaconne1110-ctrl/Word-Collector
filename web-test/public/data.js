const seed = {
  "courses": {
    "electromagnetics": [
      "전자기학",
      "Electromagnetics"
    ],
    "circuit-theory": [
      "회로이론",
      "Circuit Theory"
    ],
    "electrical-machines": [
      "전기기기",
      "Electrical Machinery"
    ],
    "semiconductor": [
      "반도체공학",
      "Semiconductor"
    ]
  },
  "terms": {
    "term_skin_effect": {
      "course": "electromagnetics",
      "en": "Skin Effect",
      "ko": "표피 효과",
      "formula": "δ = √(2ρ / ωμ)",
      "pron": "noun · [skɪn ɪˈfɛkt]",
      "koDef": "교류(AC) 전류가 도체를 흐를 때 내부 유도 기전력으로 인해 중심부 저항이 증가하여 전류가 도체 표면 근처로 집중되는 현상.",
      "enDef": "The tendency of an alternating electric current (AC) to become distributed within a conductor such that the current density is largest near the surface and decreases exponentially with greater depths.",
      "exampleEn": "\"At microwave frequencies, the skin effect confines RF current to a microscopic outer layer, requiring silver plating on copper waveguides to minimize attenuation.\"",
      "exampleKo": "마이크로파 대역에서는 표피 효과로 인해 RF 전류가 미세한 도체 표면층으로만 흘러 감쇠를 줄이기 위해 구리 도파관에 은도금을 적용합니다."
    },
    "term_permittivity": {
      "course": "electromagnetics",
      "en": "Permittivity",
      "ko": "유전율",
      "formula": "ε [F/m]",
      "pron": "noun · [pɜːrmɪˈtɪvəti]",
      "koDef": "매질이 전기장에 반응하여 유전 분극을 일으키는 정도를 나타내는 물성값으로, 전하 축적 및 전계 형성 성능을 결정합니다.",
      "enDef": "The capability of an insulating material to polarize under an electric field and thereby reduce the total field, measuring electrical energy storage capacity per unit volume.",
      "exampleEn": "\"By replacing standard air with high-k dielectric material of superior permittivity, engineers significantly enlarged the capacitance while reducing chip area.\"",
      "exampleKo": "표준 공기 대신 고유전율(High-k) 절연 재료를 도입함으로써 엔지니어들은 반도체 면적을 줄이면서도 정전용량을 크게 확대할 수 있었습니다."
    },
    "term_lorentz_force": {
      "course": "electromagnetics",
      "en": "Lorentz Force",
      "ko": "로런츠 힘",
      "formula": "F = q(E + v × B)",
      "pron": "noun · [ˈlɔːrənts fɔːrs]",
      "koDef": "전자기장 내에서 운동하는 하전 입자가 받는 전기적 힘(qE)과 자기적 힘(qv×B)의 벡터적 총합.",
      "enDef": "The total force exerted on a point charge moving through space that contains both an electric field (E) and a magnetic field (B).",
      "exampleEn": "\"The magnetic component of the Lorentz force acts perpendicular to velocity, bending particle trajectories into circular orbits inside synchrotrons without changing their kinetic energy.\"",
      "exampleKo": "로렌츠 힘의 자기력 성분은 속도 벡터에 수직으로 작용하여 운동 에너지를 바꾸지 않으면서 싱크로트론 내부 입자들을 원형 궤도로 편향시킵니다."
    },
    "term_permeability": {
      "course": "electromagnetics",
      "en": "Permeability",
      "ko": "투자율",
      "formula": "μ [H/m]",
      "pron": "noun · [ˌpɜːrmiəˈbɪləti]",
      "koDef": "어떤 물질이 자기장에 반응하여 자화될 때, 자기력선속을 얼마나 쉽게 통과시키고 형성할 수 있는지를 나타내는 척도.",
      "enDef": "The measure of the ability of a material to support the formation of a magnetic field within itself, expressed as the ratio of magnetic flux density (B) to magnetic field strength (H).",
      "exampleEn": "\"Ferromagnetic transformer cores possess ultra-high relative permeability, concentrating magnetic flux paths and dramatically improving mutual inductance efficiency.\"",
      "exampleKo": "강자성 변압기 코어는 매우 높은 비투자율을 가져 자기력선속 경로를 밀집시키고 상호 인덕턴스 효율을 비약적으로 개선합니다."
    },
    "term_poynting_vector": {
      "course": "electromagnetics",
      "en": "Poynting Vector",
      "ko": "포인팅 벡터",
      "formula": "S = E × H",
      "pron": "noun · [ˈpɔɪntɪŋ ˈvɛktər]",
      "koDef": "전자기파가 공간을 전파할 때 단위 시간당 단위 면적을 통과하여 전달되는 전자기 에너지의 흐름 방향과 크기를 나타내는 벡터.",
      "enDef": "The vector representing the directional energy flux density (rate of energy transfer per unit area) of an electromagnetic field.",
      "exampleEn": "\"By integrating the time-averaged Poynting vector over the sphere encompassing an antenna, radio engineers compute its total radiated power and beam efficiency.\"",
      "exampleKo": "안테나를 감싸는 구면에 걸쳐 시간 평균 포인팅 벡터를 적분함으로써 무선 공학자들은 총 방사 전력과 빔 효율을 산출합니다."
    },
    "term_resonance_frequency": {
      "course": "circuit-theory",
      "en": "Resonance Frequency",
      "ko": "공진 주파수",
      "formula": "f₀ = 1 / (2π√LC)",
      "pron": "noun · [ˈrɛzənəns ˈfriːkwənsi]",
      "koDef": "유도 리액턴스와 용량 리액턴스가 상쇄되어 회로의 임피던스가 최소화되고 최대 전류가 흐르는 특정 주파수.",
      "enDef": "The frequency at which the inductive reactance and capacitive reactance of an electrical circuit are equal in magnitude.",
      "exampleEn": "At the resonance frequency, the impedance of a series RLC circuit drops to its minimum resistive value.",
      "exampleKo": "공진 주파수에서 직렬 RLC 회로의 임피던스는 최소 순저항 값으로 떨어진다."
    },
    "term_impedance": {
      "course": "circuit-theory",
      "en": "Impedance",
      "ko": "임피던스",
      "formula": "Z [Ω]",
      "pron": "noun · [ɪmˈpiːdəns]",
      "koDef": "교류 회로에서 전류의 흐름을 방해하는 총 저항 성분으로, 저항과 리액턴스의 벡터 합성값."
    },
    "term_transient_response": {
      "course": "circuit-theory",
      "en": "Transient Response",
      "ko": "과도 현상",
      "formula": "v(t) = V₀e^(-t/RC)",
      "pron": "noun · [ˈtrænziənt rɪˈspɒns]",
      "koDef": "회로의 스위칭이나 급격한 외부 변화 시 새로운 정상 상태에 도달하기 전까지 일시적으로 나타나는 전압 및 전류 응답."
    },
    "term_quality_factor": {
      "course": "circuit-theory",
      "en": "Quality Factor",
      "ko": "양호도 (Q값)",
      "formula": "Q = ω₀L / R",
      "pron": "noun · [ˈkwɑːləti ˈfæktər]",
      "koDef": "공진 회로의 선택도와 에너지 손실 특성을 나타내는 지표로, 대역폭 대비 주파수 선택 첨예도를 결정하는 지수."
    }
  },
  "saved": [
    "term_quality_factor",
    "term_transient_response",
    "term_impedance",
    "term_resonance_frequency",
    "term_lorentz_force",
    "term_skin_effect"
  ]
};
