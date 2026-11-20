"""Review the server glossary against free Korean dictionaries (no Gemini, no cost).

Sources (licences checked 2026-11-20, recorded in rag/sources.json):
  - 온용어 (kli.korean.go.kr/term, 국립국어원 전문용어): searched by the Korean term
    (the API has no English search); only items with KOGL type 0 or 1 are used.
    Items carry the field and the English equivalent ('translation').
  - 우리말샘 (opendict.korean.go.kr, CC BY-SA 2.0 KR): searched by the Korean term;
    gives the field (cat) and definition. It has no English equivalents.
  - 특허 영한 기술용어 사전 (KIPRISPlus, no use restriction): optional extra signal
    via --patent FILE (EK_TRANS_DIC.txt, CP949); its quality is uneven, so it never
    decides a verdict on its own.

Each glossary entry (Korean meaning of an English term in a field) is classified:
  confirmed    온용어 lists this Korean term in the field with this English term
  en_differs   온용어 lists this Korean term in the field, but only for other English terms
  exists       the Korean term is a term of this field (우리말샘/온용어), English not given
  other_field  the Korean term exists only in other fields or as a general word
  not_found    no dictionary has this Korean term
  pending      a dictionary did not answer (온용어 allows only a limited number of
               requests per day): rerun later; answers are cached, so it continues
Nothing is regenerated. Writes glossary/out/review/report.json and report.csv.

Keys come from Windows user environment variables (never printed):
  NIKL_OPENDICT_KEY, NIKL_KTERM_KEY   (KRDICT_KEY is not needed for this review)
Responses are cached in glossary/out/review/cache/, so a rerun sends no request twice.

  python glossary/review_dictionaries.py [--limit N] [--offline] [--workers 4] [--patent FILE]
"""
import argparse, csv, hashlib, json, os, re, sys, threading, time, urllib.parse, urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'review')
CACHE = os.path.join(OUT, 'cache')
ENTRIES = os.path.join(OUT, 'server-entries.json')

# Dictionary field names (as the APIs return them) that fit each glossary field.
FIELDS = {
    '전기공학': ('전기', '전자', '물리', '통신', '기계', '에너지', '정보', '광학'),
    '반도체': ('전기', '전자', '물리', '화학', '화공', '재료', '공업', '광업', '금속', '정보', '기계', '광학'),
}


def env(name):
    value = os.environ.get(name)
    if not value and sys.platform == 'win32':
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as key:
                value = winreg.QueryValueEx(key, name)[0]
        except OSError:
            value = None
    return (value or '').strip()


def norm(text):
    """Compare Korean terms without spacing marks (^ and -), spaces or brackets."""
    text = re.sub(r'\([^)]*\)|\[[^]]*\]', '', str(text or ''))
    return re.sub(r'[\s^\-·ㆍ_]+', '', text).strip().lower()


def ko_variants(ko):
    """'전송선, 송전선' / '자속 밀도 (B)' -> each Korean term on its own."""
    parts = re.split(r'[,/;]|\s또는\s', str(ko or ''))
    return {norm(part) for part in parts if norm(part)}


def norm_en(text):
    return re.sub(r'[^a-z0-9]+', ' ', str(text or '').lower()).strip()


def english_parts(translation):
    """'translocation##でんりゅう##转移' / 'Current; electric current' -> English pieces."""
    parts = re.split(r'##|[;,/]', str(translation or ''))
    return {norm_en(part) for part in parts if re.search(r'[A-Za-z]', part) and norm_en(part)}


def read_cache(path):
    """Cached answer, or None when there is none. Parallel workers may remove or
    rewrite the same file at the same time; that is treated as "not cached"."""
    try:
        with open(path, encoding='utf-8') as handle:
            return json.load(handle)
    except (FileNotFoundError, PermissionError, json.JSONDecodeError):
        return None


def write_cache(path, data):
    """Write to a private temporary file, then swap it in, so a reader never sees half a file."""
    temporary = f'{path}.{os.getpid()}.{threading.get_ident()}.tmp'
    with open(temporary, 'w', encoding='utf-8') as handle:
        json.dump(data, handle, ensure_ascii=False)
    os.replace(temporary, path)


def fetch_json(url, source, offline):
    os.makedirs(os.path.join(CACHE, source), exist_ok=True)
    query = urllib.parse.urlsplit(url).query
    cache_id = '&'.join(part for part in query.split('&') if not part.startswith('key='))
    path = os.path.join(CACHE, source, hashlib.sha256(cache_id.encode()).hexdigest() + '.json')
    cached = read_cache(path)
    if cached is not None:
        if not api_error(cached):
            return cached
        # A refusal saved by an older version is not an answer: drop it and ask again
        # (or report the entry as pending when offline / limited). Another worker may
        # be removing or reading the same file at the same moment (on Windows an open
        # file cannot be removed), so a missing or busy file is fine: it is just not used.
        try:
            os.remove(path)
        except (FileNotFoundError, PermissionError):
            pass
    if offline or source in LIMITED:
        return None
    data = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'WordCollector-glossary-review'})
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.loads(response.read().decode('utf-8'))
            break
        except Exception:
            if attempt == 2:
                return None
            time.sleep(2 * (attempt + 1))
    if api_error(data):
        # A refusal (e.g. 022 daily limit, 020 unknown key) is not an answer: never
        # cache it and never treat it as "no result".
        LIMITED.add(source)
        return None
    write_cache(path, data)
    time.sleep(0.15)   # be gentle with the free public APIs
    return data


LIMITED = set()   # sources that refused this run (daily limit): not asked again until the next run


def api_error(data):
    """True for an API refusal: 온용어/우리말샘 return an error code instead of results."""
    if not isinstance(data, dict):
        return True
    if 'error' in data:
        return True
    code = str((data.get('channel') or {}).get('returnCode', '1')).strip()
    return code not in ('', '1')


def opendict_terms(ko, key, offline):
    """우리말샘 senses whose headword is exactly the Korean term (any field)."""
    if not key and not offline:
        return None
    query = urllib.parse.urlencode({'key': key, 'q': ko, 'req_type': 'json', 'advanced': 'y', 'method': 'exact', 'num': 100})
    data = fetch_json('https://opendict.korean.go.kr/api/search?' + query, 'opendict', offline)
    if data is None:
        return None
    found = []
    for item in (data.get('channel', {}).get('item') or []):
        if norm(item.get('word')) != norm(ko):
            continue
        for sense in item.get('sense') or []:
            found.append({'word': item.get('word', ''), 'field': sense.get('cat', '') or '', 'definition': sense.get('definition', '')})
    return found


def kterm_items(ko, key, offline):
    """온용어 items whose term is exactly the Korean term; only KOGL type 0 or 1."""
    if not key and not offline:
        return None
    query = urllib.parse.urlencode({'key': key, 'apiSearchWord': ko, 'num': 100})
    data = fetch_json('https://kli.korean.go.kr/term/api/search.do?' + query, 'kterm', offline)
    if data is None:
        return None
    objects = data.get('channel', {}).get('return_object')
    results = objects[0].get('resultlist') if isinstance(objects, list) and objects and isinstance(objects[0], dict) else []
    usable = []
    for item in results if isinstance(results, list) else []:
        if norm(item.get('word')) != norm(ko) or str(item.get('kr_gvrn_lcns_ty', '')).strip() not in ('0', '1'):
            continue
        usable.append({'word': item.get('word', ''),
                       'field': ' '.join(filter(None, [item.get('category_main', ''), item.get('category_sub', '')])),
                       'english': english_parts(item.get('translation')), 'source': item.get('source', '')})
    return usable


def fits_field(name, field):
    return any(part in str(name) for part in FIELDS.get(field, ()))


def plural_forms(word):
    """Regular English plurals of a word: diode -> diodes, loss -> losses,
    phase -> phases, switch -> switches, density -> densities."""
    forms = {word + 's'}
    if re.search(r'(s|x|z|ch|sh)$', word):
        forms.add(word + 'es')
    if re.search(r'[^aeiou]y$', word):
        forms.add(word[:-1] + 'ies')
    return forms


def same_word(a, b):
    return a == b or b in plural_forms(a) or a in plural_forms(b)


def same_term(a, b):
    """Same English term, allowing only plural forms: 'skin effect' ~ 'skin effects'.
    A longer compound is a different term ('semiconductor' != 'semiconductor laser',
    'current' != 'electric current'), so it never counts as confirmed."""
    if not a or not b:
        return False
    words_a, words_b = a.split(), b.split()
    return len(words_a) == len(words_b) and all(same_word(x, y) for x, y in zip(words_a, words_b))


def judge(entry, opendict, kterm):
    """Korean-first check of one glossary entry (see the module docstring)."""
    en = norm_en(re.sub(r'\([^)]*\)', '', entry['en']))
    kt_field = [row for row in (kterm or []) if fits_field(row['field'], entry['field'])]
    od_field = [row for row in (opendict or []) if fits_field(row['field'], entry['field'])]
    seen = [('온용어', row['word'], row['field'], ', '.join(sorted(row['english']))) for row in kt_field] + \
           [('우리말샘', row['word'], row['field'], '') for row in od_field]
    if any(same_term(en, other) for row in kt_field for other in row['english']):
        return 'confirmed', seen
    if any(row['english'] for row in kt_field):
        return 'en_differs', seen
    if kt_field or od_field:
        return 'exists', seen
    if kterm or opendict:
        others = [('온용어', row['word'], row['field'], ', '.join(sorted(row['english']))) for row in (kterm or [])] + \
                 [('우리말샘', row['word'], row['field'] or '일반어', '') for row in (opendict or [])]
        return 'other_field', others
    return 'not_found', []


def load_patent(path):
    """EK_TRANS_DIC.txt (tab-separated, CP949): English -> set of Korean translations."""
    index = defaultdict(set)
    if not path:
        return index
    with open(path, encoding='cp949', errors='replace') as handle:
        next(handle, None)
        for line in handle:
            parts = line.rstrip('\n').split('\t')
            if len(parts) == 2:
                index[norm_en(parts[0].replace('_', ' '))].add(norm(parts[1].replace('_', ' ')))
    return index


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0, help='review only the first N entries')
    parser.add_argument('--offline', action='store_true', help='use cached responses only (no requests)')
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--patent', default='', help='path to KIPRISPlus EK_TRANS_DIC.txt (optional)')
    args = parser.parse_args(argv)
    keys = {name: env(name) for name in ('NIKL_OPENDICT_KEY', 'NIKL_KTERM_KEY')}
    missing = [name for name, value in keys.items() if not value]
    if missing and not args.offline:
        print('Missing API keys (Windows user environment variables): ' + ', '.join(missing))
        return 2
    with open(ENTRIES, encoding='utf-8') as handle:
        entries = json.load(handle)
    if args.limit:
        entries = entries[:args.limit]
    patent = load_patent(args.patent)

    def review(entry):
        ko = re.sub(r'\([^)]*\)', '', entry['ko'].split(',')[0]).strip()
        opendict = opendict_terms(ko, keys['NIKL_OPENDICT_KEY'], args.offline)
        kterm = kterm_items(ko, keys['NIKL_KTERM_KEY'], args.offline)
        if opendict is None or kterm is None:
            # A dictionary did not answer (daily limit or network): finish on a later run.
            verdict, seen = 'pending', []
        else:
            verdict, seen = judge(entry, opendict, kterm)
        patent_ko = patent.get(norm_en(entry['en']), set())
        return {**{k: entry[k] for k in ('field', 'en', 'ko')}, 'checkedKo': ko, 'verdict': verdict,
                'patent': ('agrees' if patent_ko & ko_variants(entry['ko']) else 'differs') if patent_ko else '',
                'dictionary': ' / '.join(sorted({f'{word} ({source}, {field}{": " + english if english else ""})'
                                                 for source, word, field, english in seen}))[:600]}

    rows, counts = [], Counter()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:   # a few requests at a time (free public APIs)
        for index, row in enumerate(pool.map(review, entries), 1):
            rows.append(row)
            counts[row['verdict']] += 1
            if index % 250 == 0:
                print(index, dict(counts), flush=True)
    report = {'reviewed': len(rows), 'counts': dict(counts),
              'byField': {field: dict(Counter(r['verdict'] for r in rows if r['field'] == field)) for field in sorted({r['field'] for r in rows})},
              'patent': dict(Counter(r['patent'] or 'not covered' for r in rows)),
              'rows': rows}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'report.json'), 'w', encoding='utf-8') as handle:
        json.dump(report, handle, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'report.csv'), 'w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=['field', 'en', 'ko', 'checkedKo', 'verdict', 'patent', 'dictionary'])
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda r: (['en_differs', 'other_field', 'not_found', 'exists', 'confirmed', 'pending'].index(r['verdict']), r['field'], r['en'])))
    if LIMITED:
        print('Daily limit reached for: ' + ', '.join(sorted(LIMITED)) + ' (rerun later; cached answers are kept)')
    print(json.dumps({k: report[k] for k in ('reviewed', 'counts', 'byField', 'patent')}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
