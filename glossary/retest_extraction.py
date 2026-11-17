"""원문 대조에서 오류가 나온 쪽을 개선된 추출(pdf_text.py)로 다시 추출해, 수정 전후를 같은 원문 구절과 비교한다.

  python glossary/retest_extraction.py --pdf-dir DIR [--out glossary/out/extraction-audit]
      -> <out>/retest.json, <out>/retest.md  (오류마다: 원문(눈으로 확인한 것), 수정 전, 수정 후, 판정)

판정은 원문 구절의 핵심 문자열(expect)이 수정 후 글에 그대로 있는지, 오류 문자열(bad)이 사라졌는지로 한다.
expect/bad는 원문 그림을 보고 적은 것이며, 그림에 없는 글은 넣지 않았다.
"""
from __future__ import annotations

import argparse
import unicodedata
import json
import sys
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdf_text import extract_page, repeated_margin_lines  # noqa: E402
from extract_audit import load_sources  # noqa: E402

# (자료, PDF 쪽, 원문에서 확인한 핵심 구절(expect), 잘못 추출된 구절(bad), 설명)
CASES = [
    ('kuphaldt-model-plc', 133, ['6.02214076 × 10^23 per mole', '(mol^-1)', '× 10^4 Coulombs'], ['× 1023 per', '× 104 Coulombs'], 'exponent 10²³'),
    ('kuphaldt-model-dc2dc', 174, ['× 10^23 per mole'], ['× 1023 per'], 'exponent 10²³'),
    ('kuphaldt-model-prot-relay', 60, ['× 10^23 per mole'], ['× 1023 per'], 'exponent 10²³'),
    ('kuphaldt-model-breaker', 66, ['× 10^23 per mole'], ['× 1023 per'], 'exponent 10²³'),
    ('ellingson-em-vol2', 79, ['1.5 × 10^8 m/s'], ['1.5 × 108 m/s'], 'exponent 10⁸'),
    ('gerlach-thermal-oxidation-2016', 8, ['4.6 ⋅ 10^22 O-atoms/cm^3'], ['⋅1022 O-atoms'], 'exponent 10²²'),
    ('gerlach-thermal-oxidation-2016', 5, ['1250°C'], ['1250∘C'], 'degree sign'),
    ('gerlach-thermal-oxidation-2016', 9, ['5.5 ⋅ 10^16 cm^-3', '19.4 ⋅ 10^16 cm^-3'], ['⋅1016 cm'], 'exponent in table'),
    ('basu-lithography-review-2025', 5, ['(hv/dose)^1/2'], ['(hv/dose)1/2'], 'exponent 1/2'),
    ('kuphaldt-model-dc2dc', 40, ['on and oﬀ to a load', 'specific harmonics of'], ['oﬀto', 'harmonics10'], 'space after ligature; footnote mark'),
    ('kuphaldt-lec-ac', 329, ['Y-∆ conﬁguration', 'the ∆ loop'], ['∆conﬁguration', '∆loop'], 'space after Δ'),
    ('kuphaldt-lec-ac', 60, ['36.8052 volts ∠-20.5018°', 'lagging the 15 volt (0° phase reference) by 20.5018°'], ['volts̸', '20.5018o'], 'angle and degree'),
    ('kuphaldt-lec-ac', 277, ['Subtracting ∠0° is equivalent to adding ∠180°'], ['Subtracting̸'], 'angle and degree'),
    ('kuphaldt-lec-dc', 404, ['hydrogen ions (H)^+ to form water'], ['(H)+to'], 'superscript charge'),
    ('gerlach-thermal-oxidation-2016', 1, ['Technische Universität Dresden', 'Bärlappsenke', 'Gerald Gerlach and Karl Maser'], ['Universit¨at', 'Gerlach1'], 'diacritic; affiliation marks'),
    ('gerlach-thermal-oxidation-2016', 5, [], ['Downloaded from https://onlinelibrary.wiley.com'], 'vertical Wiley stamp'),
    # Springer: original subscripts (E_i, P_rated, C_L, T_in, S_1, U_DC, v_DC) come out flattened, like every other source
    ('jarvinen-renewable-energy-systems', 115, ['plant capacity, Prated', 'capacity factor, Cf', 'Ei = Prated × Cf × 8760 h'], ['upper E Subscript', 'upper P Subscript r a t e d', 'Baseline'], 'hidden MathSpeak'),
    ('jarvinen-renewable-energy-systems', 391, ['optimal angle of attack is 7.5° and CL = 1.031'], ['upper C Subscript upper L'], 'hidden MathSpeak'),
    ('jarvinen-renewable-energy-systems', 513, ['the fuel is preheated to Tin'], ['upper T Subscript i n', 'StartLayout', 'ModifyingAbove'], 'hidden MathSpeak'),
    ('lehtonen-power-generation-ch8', 9, ['An AC voltage of U = 230 V'], ['upper U = 230', 'ModifyingAbove'], 'hidden MathSpeak'),
    ('lehtonen-power-generation-ch8', 24, ['when switch S1 is on and switch S2 is off, output voltage is +UDC'], ['upper S 1 is on', 'Subscript upper D upper C'], 'hidden MathSpeak'),
    ('mahr-inverter-based-power-systems', 35, ['the current value of vDC must be'], ['v_{\\text{DC}}', 'ofv_', 'of.vDC'], 'hidden LaTeX; white dot'),
    ('mahr-inverter-based-power-systems', 140, [], ['\\bALT{}', '\\renewcommand'], 'hidden LaTeX'),
    ('kuphaldt-lec-dc', 30, ['pipe back to the pond'], ['CHAPTER 1. BASIC CONCEPTS OF ELECTRICITY'], 'running header'),
    ('ellingson-em-vol1', 107, ['© K. Kikkeri'], ['⃝c K. Kikkeri'], 'copyright sign'),
    # Not fixable by text rules (expected to stay): recorded to show what remains
    ('ellingson-em-vol1', 113, [], ['4πǫ'], 'integral as Z / epsilon as ǫ (font mapping) - not fixed'),
    ('nogami-interconnects-2023', 7, [], ['Cð1'], 'equation font mapping - not fixed'),
    ('kuphaldt-model-plc', 60, ['turbine_RPM'], ['turbine RPM'], 'underscore drawn as a rule - not fixed'),
    ('kuphaldt-lec-dc', 376, [], [], 'table structure - not fixed (label/number lines removed instead)'),
]


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf-dir', required=True)
    parser.add_argument('--out', default=str(Path(__file__).resolve().parent / 'out' / 'extraction-audit'))
    args = parser.parse_args(argv)
    sources = {s['id']: s for s in load_sources()}
    docs, margins, results = {}, {}, []
    for source_id, number, expect, bad, note in CASES:
        if source_id not in docs:
            docs[source_id] = pymupdf.open(Path(args.pdf_dir) / sources[source_id]['file'])
            margins[source_id] = repeated_margin_lines(docs[source_id])
        page = docs[source_id][number - 1]
        before = page.get_text('text')
        after, changes = extract_page(page, margins[source_id])
        flat = lambda text: ' '.join(unicodedata.normalize('NFKC', text).split())
        found = [e for e in expect if flat(e) in flat(after)]
        remaining_bad = [b for b in bad if flat(b) in flat(after)]
        bad_before = [b for b in bad if flat(b) in flat(before)]
        fixed = len(found) == len(expect) and not remaining_bad
        results.append({'source': source_id, 'page': number, 'note': note, 'expect': expect, 'bad': bad,
                        'badBefore': bad_before, 'expectFoundAfter': found, 'badRemainingAfter': remaining_bad,
                        'verdict': 'fixed' if fixed and (expect or bad) else ('not fixed' if (expect or bad) else 'not applicable'),
                        'changes': changes})
        print(f"{'OK ' if fixed else 'NO '} {source_id} p{number} [{note}] found {len(found)}/{len(expect)}, bad left {remaining_bad}")
    out = Path(args.out)
    (out / 'retest.json').write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
