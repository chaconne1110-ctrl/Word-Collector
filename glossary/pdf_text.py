"""PDF 쪽 텍스트 추출 (단어집용, 개선판).

PyMuPDF의 글자 단위 정보(rawdict: 글자 위치·크기·기준선·색)로 줄을 다시 만들어, 원문 대조 검사
(glossary/out/extraction-audit/findings.json)에서 확인된 추출 오류를 고친다. 원문에 없는 글을
추측해서 넣지 않으며, 고친 내용은 쪽마다 changes에 센다.

고치는 것                                                         근거(원문 대조에서 확인한 오류)
- 접근성 대체 글(ActualText) 무시: 화면에 그려진 글자 대신 PDF 태그의 대체 글이 추출되던 문제.
  Springer의 수식 낭독문("upper P Subscript r a t e d"), LaTeX 원본("v_{\\text{DC}}")    Järvinen, Lehtonen, Mahr
- 보이지 않는 글자 제거: 흰색 글자, 한자리에 3개 이상 겹쳐 찍힌 글자.                     Mahr(흰 마침표)
- 위첨자: 기준선이 올라간 작은 글자. 숫자·괄호·단위 뒤의 숫자·부호는 지수("10^23",
  "cm^-3", "(hv/dose)^1/2", "(H)^+"), 숫자 뒤의 o/∘는 "°", 낱말 뒤의 숫자는 각주 번호라 지운다.
                                                                   Kuphaldt, Gerlach, Ellingson, Basu
- 띄어쓰기: 글자 사이 간격이 글자 크기의 18% 이상인데 공백이 없으면 띄어 쓴다.         "oﬀto", "∆conﬁguration"
- 분리된 발음 기호: "Universit¨at" -> "Universität".                                  Gerlach
- 각도 기호: 결합 문자 U+0338 조각을 앞 글자 뒤의 "∠"로 (낱말 단위 추출 위치 사용).       Kuphaldt AC
- 저작권 기호 "⃝c"/"c⃝" -> "©", 글자 대응이 없는 기호(U+FFFD) 제거.                      Ellingson, Lehtonen
- 세로로 쓴 줄(여백 도장) 제거, 위·아래 여백(쪽 높이 14%)의 반복 줄·쪽 번호·대문자 머리글 제거.
- 그림 속 글자 묶음(4줄 이상, 85% 이상이 1~2낱말이고 문장 부호로 끝나지 않는 블록) 제거.

고치지 못하는 것(기록만): 그림으로 그려진 수식(OCR 필요), 표의 칸 구조, 분수·근호 구조,
수식 글꼴의 잘못된 문자 대응(Ellingson ∫ -> "Z", Nogami "=" -> "¼"), 선으로 그린 밑줄, 아래첨자
(평탄화: "E_R1" -> "ER1"). is_equation_line()은 기호가 많은 수식 조각 줄을 표시한다.
"""
from __future__ import annotations

import re
import unicodedata
from collections import Counter

import pymupdf

FLAGS = pymupdf.TEXT_PRESERVE_LIGATURES | pymupdf.TEXT_PRESERVE_WHITESPACE | pymupdf.TEXT_IGNORE_ACTUALTEXT
WHITE = 0xFFFFFF
OVERLAP = 0.12               # 다음 글자까지의 거리 / 글자 크기 (보통 글자는 0.25 이상)
SPACE_GAP = 0.18
SUPER_SHIFT = 0.15
MARGIN = 0.14
SPACING_DIACRITICS = {'¨': '̈', '´': '́', '`': '̀', 'ˆ': '̂', '˜': '̃', '¸': '̧', 'ˇ': '̌'}
UNIT_BEFORE_EXPONENT = re.compile(r'(?:^|[\s/·⋅(])(?:[kMGTmµμnpc]?(?:m|s|g|A|V|W|K|J|C|F|H|Hz|Ω|eV|mol|cm|nm|mm|µm|h|L))$')
HEADING_WITH_PAGE = re.compile(r'^(?:\d{1,4}\s+[A-Z0-9][A-Z0-9 .,:;’\'&()\-–]{3,}|[A-Z0-9][A-Z0-9 .,:;’\'&()\-–]{3,}\s+\d{1,4})$')


def _invisible_marks(line):
    """줄의 글자마다 (span, char, invisible). 흰색 글자, 한자리에 3개 이상 겹쳐 찍힌 글자는 보이지 않는 글자."""
    marks = []
    for span in line['spans']:
        chars = span['chars']
        # 흰 글자는 1~2글자짜리 조각만 숨은 글자로 본다 (색 배경 위의 흰 본문 글은 보이는 글이다)
        white_fragment = span['color'] == WHITE and len(''.join(c['c'] for c in chars).strip()) <= 2
        for index, char in enumerate(chars):
            c = char['c']
            if white_fragment and c.strip():
                marks.append([span, char, True])
                continue
            following = chars[index + 1]['bbox'][0] if index + 1 < len(chars) else span['bbox'][2]
            narrow = (following - char['bbox'][0]) < OVERLAP * span['size']
            neutral = not c.strip() or unicodedata.combining(c) or ord(c) == 0x338
            marks.append([span, char, None if neutral else ('overlap' if narrow else False)])
    index = 0
    while index < len(marks):                       # 겹친 글자는 3개 이상 이어질 때만 (낱개 ¨, ∘ 등은 보이는 글자)
        if marks[index][2] == 'overlap':
            end = index
            while end < len(marks) and marks[end][2] in ('overlap', None):
                end += 1
            run = [m for m in marks[index:end] if m[2] == 'overlap']
            for m in run:
                m[2] = len(run) >= 3
            index = end
        else:
            index += 1
    return [(span, char, bool(flag)) for span, char, flag in marks]


def _assemble_line(line, angle_after, changes):
    marks = _invisible_marks(line)
    visible = [(span, char) for span, char, hidden in marks if not hidden]
    if not visible:
        return ''
    sizes = Counter(round(span['size'], 1) for span, _ in visible)
    main = sizes.most_common(1)[0][0]
    base_y = Counter(round(span['origin'][1], 1) for span, _ in visible if round(span['size'], 1) == main).most_common(1)[0][0]
    out, prev = '', None
    after_hidden = after_exponent = False
    groups = []                                      # 같은 span의 연속 글자 묶음 (위첨자 판정 단위)
    for span, char, hidden in marks:
        if groups and groups[-1][0] is span and groups[-1][2] == hidden:
            groups[-1][1].append(char)
        else:
            groups.append([span, [char], hidden])
    for span, chars, hidden in groups:
        if hidden:
            changes['invisibleCharsRemoved'] += len(chars)
            after_hidden = True
            continue
        text = ''.join(c['c'] for c in chars)
        shift = (base_y - span['origin'][1]) / main
        if span['size'] < main * 0.9 and (shift > SUPER_SHIFT or span['flags'] & 1) and text.strip():
            sup = text.strip().replace('−', '-').replace('–', '-')
            before = out.rstrip()
            after_exponent = False
            if re.search(r'\^[-+]$', before) and re.fullmatch(r'\d+(?:[./]\d+)?', sup):
                out = before + sup
                after_exponent = True
            elif re.fullmatch(r'[o∘◦°]', sup) and re.search(r'\d$', before):
                out = before + '°'
                changes['degreeSigns'] += 1
            elif re.fullmatch(r'-?\+?\d+(?:[./]\d+)?|[-+]', sup) and (re.search(r'[\d)\]]$', before) or UNIT_BEFORE_EXPONENT.search(before)):
                out = before + '^' + sup
                changes['exponentsMarked'] += 1
                after_exponent = True
            elif re.fullmatch(r'\d{1,3}', sup) and re.search(r'[A-Za-z.,;:]$', before):
                out = before
                changes['footnoteMarksRemoved'] += 1
            else:
                out += sup
            prev, after_hidden = chars[-1], False
            continue
        for char in chars:
            c = char['c']
            if ord(c) == 0x338:
                continue
            if c == '�':
                changes['unmappedGlyphsRemoved'] += 1
                continue
            if prev is not None and c != ' ' and out and not out.endswith((' ', '∠')):
                gap = char['bbox'][0] - prev['bbox'][2]
                if (after_hidden and c.isalnum() and out[-1].isalnum()) or (after_exponent and c.isalpha()) or \
                        (gap > SPACE_GAP * main and out[-1] not in '([{/-‐' and c not in ')]},.;:/-‐%'):
                    out += ' '
                    changes['spacesRestored'] += 1
            out += c
            after_hidden = after_exponent = False
            if id(char) in angle_after:
                out += ' ∠'
                changes['angleSigns'] += 1
            prev = char
    return out


def _fix_characters(text, changes):
    def combine(match):
        changes['diacriticsCombined'] += 1
        return match.group(1) + unicodedata.normalize('NFC', match.group(3) + SPACING_DIACRITICS[match.group(2)])
    text = re.sub(r'([A-Za-z])([¨´`ˆ˜¸ˇ])([A-Za-z])', combine, text)
    text = re.sub(r'(\s|^)¨([A-Za-z])', lambda m: m.group(1) + unicodedata.normalize('NFC', m.group(2) + '̈'), text)
    text = re.sub(r'∠\s+(?=[-−\d])', '∠', text)
    for bad in ('⃝c', 'c⃝'):
        if bad in text:
            changes['copyrightSigns'] += text.count(bad)
            text = text.replace(bad, '©')
    return text


def _angle_positions(page, data):
    """각도 기호(U+0338 사선 조각) 자리 -> 그 앞 글자. 글자 단위 정보에는 일부만 남으므로 낱말 단위 추출
    ('words', 예: "Subtracting̸")에서 기호가 붙은 낱말의 마지막 보이는 글자를 앞 글자로 삼는다."""
    chars = [c for block in data['blocks'] for line in block.get('lines', []) for span in line['spans']
             for c in span['chars'] if c['c'].strip() and ord(c['c']) != 0x338]
    after = set()
    for x0, y0, x1, y1, word, *_ in page.get_text('words', flags=FLAGS):
        if '̸' not in word:
            continue
        prefix = word.split('̸')[0]
        same_row = [c for c in chars if y0 - 1 <= (c['bbox'][1] + c['bbox'][3]) / 2 <= y1 + 1]
        inside = [c for c in same_row if c['bbox'][0] >= x0 - 1 and c['bbox'][2] <= x1 + 1.5]
        left = [c for c in same_row if c['bbox'][2] <= x0 + 1]
        pick = inside if prefix.strip() else left
        if pick:
            after.add(id(max(pick, key=lambda c: c['bbox'][2])))
    return after


def _is_label_block(lines) -> bool:
    if len(lines) < 4:
        return False
    short = sum(1 for line in lines if len(line.split()) <= 2 and not line.rstrip().endswith(('.', ':', ';', '?', '!')))
    return short >= len(lines) * 0.85


def is_equation_line(line: str) -> bool:
    """수식 조각 줄(글자보다 기호·숫자가 많은 줄) - 단어집 문장에서 빼는 데 쓴다."""
    stripped = line.strip()
    if not stripped:
        return False
    letters = sum(ch.isalpha() and ch.isascii() for ch in stripped)
    return letters < len(stripped) * 0.45


def _to_visual(data, page):
    """회전된 쪽(예: 90° 회전 슬라이드)의 글자 좌표를 화면에 보이는 방향으로 바꾼다
    (rawdict 좌표는 회전 전 기준이라 가로 글이 세로로 나아가는 것처럼 보인다)."""
    if not page.rotation:
        return data
    matrix = page.rotation_matrix
    turn = pymupdf.Matrix(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0)
    for block in data['blocks']:
        block['bbox'] = tuple(pymupdf.Rect(block['bbox']) * matrix)
        for line in block.get('lines', []):
            line['bbox'] = tuple(pymupdf.Rect(line['bbox']) * matrix)
            direction = pymupdf.Point(line['dir']) * turn
            line['dir'] = (direction.x, direction.y)
            for span in line['spans']:
                span['bbox'] = tuple(pymupdf.Rect(span['bbox']) * matrix)
                span['origin'] = tuple(pymupdf.Point(span['origin']) * matrix)
                for char in span['chars']:
                    char['bbox'] = tuple(pymupdf.Rect(char['bbox']) * matrix)
    return data


def page_lines(page, changes=None):
    """쪽 -> [(줄 글, 줄 위쪽 y)] (화면에 보이는 방향의 좌표)."""
    changes = changes if changes is not None else Counter()
    data = _to_visual(page.get_text('rawdict', flags=FLAGS), page)
    angle_after = _angle_positions(page, data)
    rows = []
    for block in data['blocks']:
        if block.get('type') != 0:
            continue
        block_rows = []
        for line in block['lines']:
            if abs(line['dir'][1]) > 0.5:                 # 세로로 쓴 줄(여백 도장)
                changes['verticalLinesRemoved'] += 1
                continue
            text = _fix_characters(_assemble_line(line, angle_after, changes), changes).strip()
            if text:
                block_rows.append((text, line['bbox'][1]))
        if _is_label_block([r[0] for r in block_rows]):
            changes['labelBlocksRemoved'] += 1
            continue
        rows += block_rows
    return rows


def _is_margin_heading(text):
    letters = [ch for ch in text if ch.isalpha()]
    return bool(HEADING_WITH_PAGE.match(text)) or re.fullmatch(r'[\divxlcIVXLC]+', text) is not None or \
        (len(letters) >= 6 and all(ch.isupper() for ch in letters) and len(text.split()) >= 2)


def repeated_margin_lines(doc, share=0.2):
    """여러 쪽의 위·아래 여백에 반복되는 줄(숫자는 #으로 바꿔 비교) -> 머리글·바닥글."""
    counts = Counter()
    for page in doc:
        height = page.rect.height
        counts.update({re.sub(r'\d+', '#', text) for text, y in page_lines(page) if y < height * MARGIN or y > height * (1 - MARGIN)})
    limit = max(3, len(doc) * share)
    return {line for line, count in counts.items() if count >= limit}


def extract_page(page, margin_lines=frozenset()):
    """쪽 -> (글, changes). margin_lines: repeated_margin_lines(doc)의 결과(없으면 쪽 번호·대문자 머리글만 지운다)."""
    changes = Counter()
    height = page.rect.height
    out = []
    for text, y in page_lines(page, changes):
        if (y < height * MARGIN or y > height * (1 - MARGIN)) and (re.sub(r'\d+', '#', text) in margin_lines or _is_margin_heading(text)):
            changes['headerFooterRemoved'] += 1
            continue
        out.append(text)
    text = re.sub(r'∠\s+(?=[-−\d])', '∠', '\n'.join(out))       # 줄 끝의 ∠와 다음 줄의 각도 값
    return text, dict(changes)
