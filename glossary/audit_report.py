"""검사 결과 정리: 오류 검사표(CSV)와 PDF별 요약표를 만든다.

  python glossary/audit_report.py [--audit glossary/out/extraction-audit]
      -> <audit>/error_checklist.csv   오류마다: 파일, PDF 쪽, 원문, 추출 결과, 유형, 심각도, 수정 후 상태
         <audit>/pdf_summary.csv       PDF마다: 전체 쪽, 대조 쪽, 오류 수(심각도별), 판정, 낱말 보존율
"""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent

# 원문 대조 오류 -> 재검사 사례 (retest.json의 source/page/note와 맞춘다)
UNFIXABLE = {'unextractable'}


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--audit', default=str(HERE / 'out' / 'extraction-audit'))
    args = parser.parse_args(argv)
    audit = Path(args.audit)
    findings = json.loads((audit / 'findings.json').read_text(encoding='utf-8'))
    retest = json.loads((audit / 'retest.json').read_text(encoding='utf-8'))
    profile = json.loads((audit / 'profile.json').read_text(encoding='utf-8'))
    regression = {}
    for path in sorted(audit.glob('regression*.json')):
        regression.update(json.loads(path.read_text(encoding='utf-8')))
    retest_by_page = {}
    for case in retest:
        retest_by_page.setdefault((case['source'], case['page']), []).append(case)

    rows = []
    for error in findings['errors']:
        if error['severity'] == 'none':
            continue
        cases = retest_by_page.get((error['source'], error['page']), [])
        if error['severity'] in UNFIXABLE:
            status = 'not fixed: needs OCR (not performed)'
        elif cases:
            verdicts = {c['verdict'] for c in cases}
            status = 'fixed (re-extracted and compared)' if verdicts == {'fixed'} else \
                'not fixed (re-extracted and compared)' if 'fixed' not in verdicts else 'partly fixed (re-extracted and compared)'
        else:
            status = 'not re-tested individually (same rule as a re-tested case)'
        rows.append({'file': profile.get(error['source'], {}).get('file', error['source']), 'source': error['source'],
                     'pdfPage': error['page'], 'original (checked on the rendered page)': error['original'],
                     'extracted (PyMuPDF, before)': error['extracted'], 'type': error['type'],
                     'severity': error['severity'], 'after improved extraction': status})
    with (audit / 'error_checklist.csv').open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    summary = []
    for source, pages in findings['checked'].items():
        counts = Counter(r['severity'] for r in rows if r['source'] == source)
        info = profile.get(source, {})
        if counts['critical'] or counts['major'] >= 3:
            verdict = 'usable after fixes (improved extraction)'
        elif counts['major'] or counts['minor']:
            verdict = 'usable after fixes (improved extraction)' if counts['major'] else 'usable'
        else:
            verdict = 'usable'
        summary.append({'file': info.get('file', source), 'source': source, 'pages': info.get('pages'),
                        'textBased': info.get('textBased'), 'twoColumnPages': info.get('twoColumnPages'),
                        'pagesChecked': len(pages), 'checkedPages': ' '.join(map(str, pages)),
                        'critical': counts['critical'], 'major': counts['major'], 'minor': counts['minor'],
                        'unextractable': counts['unextractable'], 'verdict(sample-based)': verdict,
                        'wordRetentionAfterFix': regression.get(source, {}).get('wordRetention')})
    with (audit / 'pdf_summary.csv').open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(summary[0]))
        writer.writeheader()
        writer.writerows(summary)
    print(len(rows), 'errors;', len(summary), 'PDFs')


if __name__ == '__main__':
    main()
