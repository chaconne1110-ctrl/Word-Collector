"""개선된 추출(pdf_text.py)이 기존 추출(PyMuPDF 기본)보다 본문 낱말을 잃는 쪽이 있는지 모든 쪽에서 확인한다.

  python glossary/regression_check.py --pdf-dir DIR [--out glossary/out/extraction-audit]
      -> <out>/<id>.clean.txt      개선된 추출 글 (쪽 구분)
         <out>/<id>.clean.jsonl    쪽별 구조화 데이터 (파일, PDF 쪽, 인쇄 쪽, 글, 고친 내용)
         <out>/regression.json     자료별 요약: 낱말 보존율(기존 낱말 중 개선판에 남은 비율), 낮은 쪽 목록, 고친 내용 합계

보존율이 낮은 쪽은 사람이 원문과 대조해 '정당한 제거(머리글·그림 글자·숨은 글)'인지 '손실'인지 판정한다.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdf_text import extract_page, repeated_margin_lines  # noqa: E402
from extract_audit import load_sources  # noqa: E402

WORDS = re.compile(r'[A-Za-z]{3,}')


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf-dir', required=True)
    parser.add_argument('--out', default=str(Path(__file__).resolve().parent / 'out' / 'extraction-audit'))
    parser.add_argument('--ids', default=None)
    args = parser.parse_args(argv)
    out = Path(args.out)
    path = out / ('regression.json' if not args.ids else f'regression-{abs(hash(args.ids)) % 10**8}.json')
    summary = {}
    for source in load_sources():
        if args.ids and source['id'] not in args.ids.split(','):
            continue
        doc = pymupdf.open(Path(args.pdf_dir) / source['file'])
        margins = repeated_margin_lines(doc)
        totals, rows, low = Counter(), [], []
        kept_all = before_all = 0
        with (out / f'{source["id"]}.clean.jsonl').open('w', encoding='utf-8') as jsonl, \
                (out / f'{source["id"]}.clean.txt').open('w', encoding='utf-8') as txt:
            for index, page in enumerate(doc):
                before = page.get_text('text')
                after, changes = extract_page(page, margins)
                totals.update(changes)
                a = Counter(w.lower() for w in WORDS.findall(before))
                b = Counter(w.lower() for w in WORDS.findall(after))
                kept = sum((a & b).values())
                kept_all += kept
                before_all += sum(a.values())
                ratio = kept / max(1, sum(a.values()))
                if sum(a.values()) >= 40 and ratio < 0.9:
                    low.append((index + 1, round(ratio, 3), changes))
                jsonl.write(json.dumps({'file': source['file'], 'sourceId': source['id'], 'pdfPage': index + 1,
                                        'label': page.get_label() or None, 'text': after, 'changes': changes}, ensure_ascii=False) + '\n')
                txt.write(f'===== {source["file"]} | PDF page {index + 1} | label {page.get_label() or "-"} =====\n{after}\n')
        summary[source['id']] = {'pages': len(doc), 'wordRetention': round(kept_all / max(1, before_all), 4),
                                 'pagesBelow90': len(low), 'lowestPages': sorted(low, key=lambda x: x[1])[:12],
                                 'changes': dict(totals), 'marginLines': sorted(margins)[:12]}
        print(source['id'], summary[source['id']]['wordRetention'], 'pages<0.9:', len(low), dict(totals), flush=True)
        path.write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
