"""PDF 텍스트 추출 정확도 검사 (Word Collector 단어집용).

등록 자료 PDF를 PyMuPDF(주)와 pypdf(비교용)로 쪽마다 추출하고, 자동으로 찾을 수 있는
추출 문제를 모든 쪽에서 센다. 사람이 원문 그림과 대조할 쪽도 고른다.

  python glossary/extract_audit.py profile --pdf-dir DIR [--out glossary/out/extraction-audit]
      -> <out>/<id>.raw.txt          PyMuPDF 원문 추출 (쪽 구분, 수정 없음)
         <out>/<id>.pages.jsonl      쪽별 구조화 데이터 (파일, PDF 쪽, 인쇄 쪽, 글자 수, 검사 수치)
         <out>/profile.json          PDF별 요약 (스캔 여부, 다단, 특수문자, 자동 검출 수치)
         <out>/visual_pages.json     원문 대조용으로 고른 쪽 (본문/용어/수식/표·그림/후반부)
  python glossary/extract_audit.py render --pdf-dir DIR --id ID --page N [--clip x0,y0,x1,y1] [--dpi 110]
      -> 원문 대조용 쪽 그림(PNG)과 같은 영역의 PyMuPDF 추출 글자

자동 검출은 "의심"을 세는 것이며, 오류 판정은 원문 그림과 대조한 쪽에서만 한다.
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import pymupdf

HERE = Path(__file__).resolve().parent
SOURCES = HERE.parent / 'rag' / 'sources.json'

SPECIALS = 'ΩμΔλεσρ±≤≥×÷√∞∫∑πθφωαβγ°≈≠→⁻⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉'
LIGATURES = 'ﬀﬁﬂﬃﬄﬅﬆ'
LONG_WORD = re.compile(r'\b[a-z]{4,}[A-Z]?[a-z]+(?:[A-Z][a-z]+){1,}\b|\b[a-z]{26,}\b')   # 붙은 단어 의심
SPACED_LETTERS = re.compile(r'\b(?:[A-Za-z] ){4,}[A-Za-z]\b')                           # 글자 사이 공백 의심
LOOSE_DIACRITIC = re.compile(r'[A-Za-z][¨´`ˆ˜¸][A-Za-z]')                               # "Universit¨at"
HYPHEN_BREAK = re.compile(r'[a-z]-\n[a-z]')
EQUATION_HINT = re.compile(r'[=∫∑√±≤≥]|\b[A-Za-z]\s*\(\s*[a-z]\s*\)|\d\s*[×x]\s*10')


def load_sources():
    """PDF 자료 (file이 없으면 원문 주소의 파일 이름, build_glossary.py와 같은 규칙)."""
    sources = []
    for s in json.loads(SOURCES.read_text(encoding='utf-8'))['sources']:
        if s.get('format') == 'markdown':
            continue
        name = s.get('file') or (s['url'].rsplit('/', 1)[-1] if s.get('url', '').lower().endswith('.pdf') else None)
        if name:
            sources.append({**s, 'file': name})
    return sources


def page_metrics(page, text_pymupdf: str, text_pypdf: str):
    words = text_pymupdf.split()
    blocks = [b for b in page.get_text('blocks') if b[6] == 0 and b[4].strip()]
    width = page.rect.width
    # 다단 편집: 본문 블록의 왼쪽 끝이 페이지 폭의 서로 다른 두 구간(왼쪽 절반, 오른쪽 절반)에 고르게 있음
    lefts = [b[0] for b in blocks if (b[2] - b[0]) < width * 0.55 and len(b[4]) > 80]
    two_column = len(lefts) >= 4 and sum(x > width * 0.45 for x in lefts) >= 2 and sum(x < width * 0.3 for x in lefts) >= 2
    images = len(page.get_images(full=False))
    a, b = Counter(re.findall(r'[A-Za-z]{3,}', text_pymupdf.lower())), Counter(re.findall(r'[A-Za-z]{3,}', text_pypdf.lower()))
    overlap = sum((a & b).values()) / max(1, max(sum(a.values()), sum(b.values())))
    return {
        'chars': len(text_pymupdf), 'words': len(words), 'blocks': len(blocks), 'images': images,
        'twoColumn': two_column,
        'specials': sum(text_pymupdf.count(ch) for ch in SPECIALS),
        'ligatures': sum(text_pymupdf.count(ch) for ch in LIGATURES),
        'replacement': text_pymupdf.count('�') + len(re.findall(r'\(cid:\d+\)', text_pymupdf)),
        'privateUse': sum(1 for ch in text_pymupdf if 0xE000 <= ord(ch) <= 0xF8FF),
        'mergedWords': LONG_WORD.findall(text_pymupdf)[:5],
        'spacedLetters': SPACED_LETTERS.findall(text_pymupdf)[:3],
        'looseDiacritics': LOOSE_DIACRITIC.findall(text_pymupdf)[:3],
        'hyphenBreaks': len(HYPHEN_BREAK.findall(text_pymupdf)),
        'equationHints': len(EQUATION_HINT.findall(text_pymupdf)),
        'pypdfAgreement': round(overlap, 3),
        'figureOrTable': len(re.findall(r'\b(Figure|Fig\.|Table)\s*[\d.]+', text_pymupdf)),
    }


def language_of(text: str) -> str:
    letters = [ch for ch in text if ch.isalpha()]
    if not letters:
        return 'none'
    latin = sum(ch.isascii() for ch in letters) / len(letters)
    return 'English (Latin script)' if latin > 0.9 else f'mixed (Latin {latin:.0%})'


def profile(args):
    from pypdf import PdfReader
    import logging
    logging.getLogger('pypdf').setLevel(logging.ERROR)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    old = lambda name: json.loads((out / name).read_text(encoding='utf-8')) if (out / name).exists() and args.ids else {}
    summary, visual = old('profile.json'), old('visual_pages.json')
    for source in load_sources():
        if args.ids and source['id'] not in args.ids.split(','):
            continue
        path = Path(args.pdf_dir) / source['file']
        if not path.exists():
            print('missing', path)
            continue
        doc = pymupdf.open(path)
        reader = PdfReader(str(path))
        rows, raw_parts = [], []
        for index, page in enumerate(doc):
            text = page.get_text('text', sort=False)
            text_pypdf = reader.pages[index].extract_text() or ''
            metrics = page_metrics(page, text, text_pypdf)
            first_line = next((line for line in text.splitlines() if line.strip()), '')
            rows.append({'file': source['file'], 'sourceId': source['id'], 'pdfPage': index + 1,
                         'label': page.get_label() or None, 'firstLine': first_line[:120], **metrics})
            raw_parts.append(f'===== {source["file"]} | PDF page {index + 1} | label {page.get_label() or "-"} =====\n{text}')
        (out / f'{source["id"]}.raw.txt').write_text('\n'.join(raw_parts), encoding='utf-8')
        with (out / f'{source["id"]}.pages.jsonl').open('w', encoding='utf-8') as handle:
            for row in rows:
                handle.write(json.dumps(row, ensure_ascii=False) + '\n')
        # 머리글·바닥글 반복: 여러 쪽의 첫 줄/끝 줄에 같은 글이 반복되는지 (숫자 제거 후)
        firsts = Counter(re.sub(r'\d+', '#', r['firstLine']).strip() for r in rows if r['firstLine'])
        repeated_header = [(line, count) for line, count in firsts.most_common(3) if count >= max(3, len(rows) * 0.2)]
        empty = [r['pdfPage'] for r in rows if r['chars'] < 30]
        image_only = [r['pdfPage'] for r in rows if r['chars'] < 30 and r['images'] > 0]
        summary[source['id']] = {
            'file': source['file'], 'title': source['title'], 'pages': len(rows),
            'textBased': len(image_only) <= max(2, len(rows) * 0.05),
            'imageOnlyPages': image_only[:20], 'emptyPages': len(empty),
            'language': language_of(' '.join(raw_parts[: min(40, len(raw_parts))])),
            'twoColumnPages': sum(r['twoColumn'] for r in rows),
            'pageLabels': rows[min(20, len(rows) - 1)]['label'],
            'specialChars': sum(r['specials'] for r in rows), 'ligatures': sum(r['ligatures'] for r in rows),
            'replacementChars': sum(r['replacement'] for r in rows), 'privateUseChars': sum(r['privateUse'] for r in rows),
            'pagesWithMergedWords': sum(bool(r['mergedWords']) for r in rows),
            'pagesWithSpacedLetters': sum(bool(r['spacedLetters']) for r in rows),
            'pagesWithLooseDiacritics': sum(bool(r['looseDiacritics']) for r in rows),
            'hyphenBreaks': sum(r['hyphenBreaks'] for r in rows),
            'equationPages': sum(r['equationHints'] >= 5 for r in rows),
            'figureTablePages': sum(r['figureOrTable'] > 0 for r in rows),
            'pypdfAgreementMedian': statistics.median(r['pypdfAgreement'] for r in rows if r['chars'] >= 200) if any(r['chars'] >= 200 for r in rows) else None,
            'lowAgreementPages': [r['pdfPage'] for r in rows if r['chars'] >= 200 and r['pypdfAgreement'] < 0.85][:15],
            'repeatedHeaders': repeated_header,
            'mergedWordExamples': [(r['pdfPage'], r['mergedWords'][:2]) for r in rows if r['mergedWords']][:5],
            'spacedLetterExamples': [(r['pdfPage'], r['spacedLetters'][:1]) for r in rows if r['spacedLetters']][:3],
            'looseDiacriticExamples': [(r['pdfPage'], r['looseDiacritics'][:2]) for r in rows if r['looseDiacritics']][:3],
        }
        visual[source['id']] = choose_visual_pages(rows, source)
        print(source['id'], json.dumps({k: summary[source['id']][k] for k in ('pages', 'textBased', 'twoColumnPages', 'replacementChars', 'pagesWithMergedWords', 'pypdfAgreementMedian')}, ensure_ascii=False))
    (out / 'profile.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding='utf-8')
    (out / 'visual_pages.json').write_text(json.dumps(visual, ensure_ascii=False, indent=1), encoding='utf-8')


def choose_visual_pages(rows, source):
    """원문 대조용 5쪽: 본문 위주, 용어 많은 쪽, 수식 많은 쪽, 표·그림 설명, 후반부 복잡한 쪽(+ 자동 검출 문제 쪽)."""
    skip = set(source.get('skipPages', []))
    for element in source.get('restrictedElements', []):
        skip.update(element.get('pdfPages', []))
    body = [r for r in rows if r['chars'] >= 600 and r['pdfPage'] not in skip and r['pdfPage'] > 2] or rows
    picks = {}
    def take(reason, candidates, key):
        for row in sorted(candidates, key=key):
            if row['pdfPage'] not in picks:
                picks[row['pdfPage']] = reason
                return
    take('body text', [r for r in body if r['equationHints'] <= 1 and r['figureOrTable'] == 0], lambda r: -r['words'])
    take('many technical terms', body, lambda r: -(r['specials'] + r['words'] / 50))
    take('equations/symbols', body, lambda r: -(r['equationHints'] * 3 + r['specials']))
    take('table/figure captions', [r for r in body if r['figureOrTable']], lambda r: -r['figureOrTable'])
    late = [r for r in body if r['pdfPage'] > len(rows) * 0.6]
    take('late, complex layout', late or body, lambda r: -(r['blocks'] + r['twoColumn'] * 20))
    for row in rows:                              # 자동 검출에 걸린 쪽은 하나 더
        if (row['mergedWords'] or row['replacement'] or row['looseDiacritics']) and row['pdfPage'] not in picks and row['pdfPage'] not in skip:
            picks[row['pdfPage']] = 'automatic check flagged'
            break
    return [{'pdfPage': page, 'reason': reason} for page, reason in sorted(picks.items())]


def render(args):
    source = next(s for s in load_sources() if s['id'] == args.id)
    doc = pymupdf.open(Path(args.pdf_dir) / source['file'])
    page = doc[args.page - 1]
    clip = pymupdf.Rect(*map(float, args.clip.split(','))) if args.clip else page.rect
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    png = out / f'{args.id}-p{args.page}{"-clip" if args.clip else ""}.png'
    page.get_pixmap(dpi=args.dpi, clip=clip).save(png)
    print('page size', [round(v) for v in page.rect], 'label', page.get_label() or '-')
    print('image', png)
    print('----- PyMuPDF text in this area -----')
    print(page.get_text('text', clip=clip))


def focus_clip(page, reason):
    """원문 대조 영역: 쪽 높이의 45%. 수식·기호 쪽은 기호가 가장 많은 블록, 표·그림 쪽은 그림 설명 블록, 그 밖에는 본문 첫 큰 블록 주변."""
    blocks = [b for b in page.get_text('blocks') if b[6] == 0 and b[4].strip()]
    rect = page.rect
    height = rect.height * 0.45
    if not blocks:
        return pymupdf.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + height)
    def score(block):
        text = block[4]
        if 'equation' in reason or 'symbol' in reason:
            return len(EQUATION_HINT.findall(text)) * 3 + sum(text.count(ch) for ch in SPECIALS)
        if 'table' in reason or 'figure' in reason:
            return len(re.findall(r'\b(Figure|Fig\.|Table)\s*[\d.]+', text)) * 100 + len(text) / 100
        if 'flagged' in reason:
            return len(LONG_WORD.findall(text)) * 10 + len(LOOSE_DIACRITIC.findall(text)) * 10 + len(SPACED_LETTERS.findall(text)) * 10
        return len(text)
    best = max(blocks, key=score)
    center = (best[1] + best[3]) / 2
    top = max(rect.y0, min(center - height / 2, rect.y1 - height))
    return pymupdf.Rect(rect.x0, top, rect.x1, top + height)


def render_batch(args):
    """visual_pages.json(또는 --pages)의 쪽마다 대조 영역 그림(PNG)과 같은 영역의 PyMuPDF·pypdf 추출 글자를 만든다."""
    from pypdf import PdfReader
    import logging
    logging.getLogger('pypdf').setLevel(logging.ERROR)
    source = next(s for s in load_sources() if s['id'] == args.id)
    path = Path(args.pdf_dir) / source['file']
    doc = pymupdf.open(path)
    picks = json.loads((Path(args.audit) / 'visual_pages.json').read_text(encoding='utf-8')).get(args.id, [])
    if args.pages:
        picks = [{'pdfPage': int(p), 'reason': 'added for coverage'} for p in args.pages.split(',')] + \
                ([] if args.only_added else picks)
    out = Path(args.audit) / 'renders'
    out.mkdir(parents=True, exist_ok=True)
    for pick in picks:
        page = doc[pick['pdfPage'] - 1]
        clip = focus_clip(page, pick['reason'])
        png = out / f'{args.id}-p{pick["pdfPage"]}.png'
        page.get_pixmap(dpi=args.dpi, clip=clip).save(png)
        text = page.get_text('text', clip=clip)
        print(f'##### {args.id} PDF p{pick["pdfPage"]} (label {page.get_label() or "-"}) [{pick["reason"]}] clip y={clip.y0:.0f}-{clip.y1:.0f} -> {png.name}')
        print(text[: args.chars])
        print()


def main(argv=None):
    parser = argparse.ArgumentParser(description='PDF 텍스트 추출 정확도 검사')
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('profile')
    p.add_argument('--pdf-dir', required=True)
    p.add_argument('--out', default=str(HERE / 'out' / 'extraction-audit'))
    p.add_argument('--ids', default=None, help='이 자료만 검사하고 기존 결과에 더한다 (쉼표로 구분)')
    r = sub.add_parser('render')
    r.add_argument('--pdf-dir', required=True)
    r.add_argument('--id', required=True)
    r.add_argument('--page', type=int, required=True)
    r.add_argument('--clip', default=None)
    r.add_argument('--dpi', type=int, default=110)
    r.add_argument('--out', default=str(HERE / 'out' / 'extraction-audit' / 'renders'))
    b = sub.add_parser('batch')
    b.add_argument('--pdf-dir', required=True)
    b.add_argument('--id', required=True)
    b.add_argument('--pages', default=None, help='추가로 대조할 쪽 (쉼표로 구분)')
    b.add_argument('--only-added', action='store_true')
    b.add_argument('--dpi', type=int, default=100)
    b.add_argument('--chars', type=int, default=1400)
    b.add_argument('--audit', default=str(HERE / 'out' / 'extraction-audit'))
    args = parser.parse_args(argv)
    {'profile': profile, 'render': render, 'batch': render_batch}[args.command](args)


if __name__ == '__main__':
    main()
