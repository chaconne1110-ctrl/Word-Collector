"""Review the server glossary against free Korean dictionaries (no Gemini, no cost).

Sources (licences checked 2026-11-20, recorded in rag/sources.json):
  - 우리말샘 (opendict.korean.go.kr, CC BY-SA 2.0 KR): searched by English 원어,
    technical senses only; the field (cat) must fit the entry's field.
  - 온용어 (kli.korean.go.kr/term, 국립국어원 전문용어): searched by the Korean
    term; only items whose KOGL type is 0 or 1 are used.
  - 한국어기초사전 (krdict.korean.go.kr, CC BY-SA 2.0 KR): searched by the Korean
    term with English translations; used for general words only.

Nothing is regenerated: the review only classifies each entry as
  ok        a dictionary confirms the Korean meaning for this English term and field
  mismatch  dictionaries list other Korean terms for it (needs a fix)
  unknown   no dictionary data for it (cannot judge)
and writes glossary/out/review/report.json and report.csv.

Keys come from Windows user environment variables (never printed):
  NIKL_OPENDICT_KEY, NIKL_KTERM_KEY, KRDICT_KEY
Responses are cached in glossary/out/review/cache/, so a rerun sends no request twice.

  python glossary/review_dictionaries.py [--limit N] [--offline]
"""
import argparse, csv, hashlib, json, os, re, sys, time, urllib.parse, urllib.request
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'review')
CACHE = os.path.join(OUT, 'cache')
ENTRIES = os.path.join(OUT, 'server-entries.json')

# Dictionary fields (category names as the APIs return them) that fit each glossary field.
FIELDS = {
    '전기공학': ('전기', '전자', '물리', '통신', '기계'),
    '반도체': ('전기', '전자', '물리', '화학', '재료', '공업', '광업', '금속'),
}
OPENDICT_ENGLISH = os.environ.get('NIKL_OPENDICT_LANG', '4')   # lang code for English (checked on the first real call)


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
    """Compare Korean terms without spacing marks (우리말샘 uses ^ and -), spaces or brackets."""
    text = re.sub(r'\([^)]*\)|\[[^]]*\]', '', str(text or ''))
    return re.sub(r'[\s^\-·ㆍ_]+', '', text).strip().lower()


def ko_variants(ko):
    """'전송선, 송전선' / '자속 밀도 (B)' -> each Korean term on its own."""
    parts = re.split(r'[,/;]|\s또는\s', str(ko or ''))
    return {norm(part) for part in parts if norm(part)}


def fetch_json(url, source, offline):
    os.makedirs(os.path.join(CACHE, source), exist_ok=True)
    path = os.path.join(CACHE, source, hashlib.sha256(url.split('key=')[0].encode() + url.split('&', 1)[-1].encode()).hexdigest() + '.json')
    if os.path.exists(path):
        with open(path, encoding='utf-8') as handle:
            return json.load(handle)
    if offline:
        return None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'WordCollector-glossary-review'}), timeout=20) as response:
                data = json.loads(response.read().decode('utf-8'))
            break
        except Exception:
            if attempt == 2:
                return None
            time.sleep(2 * (attempt + 1))
    with open(path, 'w', encoding='utf-8') as handle:
        json.dump(data, handle, ensure_ascii=False)
    time.sleep(0.15)   # be gentle with the free public APIs
    return data


def opendict_terms(en, key, offline):
    """Korean headwords whose 원어 is the English term, with their field (technical senses)."""
    if not key and not offline:
        return None
    query = urllib.parse.urlencode({'key': key, 'q': en, 'req_type': 'json', 'advanced': 'y', 'target': 2,
                                    'method': 'exact', 'lang': OPENDICT_ENGLISH, 'type4': 'technical', 'num': 100})
    data = fetch_json('https://opendict.korean.go.kr/api/search?' + query, 'opendict', offline)
    if data is None:
        return None
    found = []
    for item in (data.get('channel', {}).get('item') or []):
        for sense in item.get('sense') or []:
            found.append({'word': item.get('word', ''), 'field': sense.get('cat', ''), 'origin': sense.get('origin', '')})
    return found


def kterm_items(ko, key, offline):
    """온용어 items for the Korean term (KOGL type 0 or 1 only)."""
    if not key and not offline:
        return None
    query = urllib.parse.urlencode({'key': key, 'apiSearchWord': ko, 'num': 100})
    data = fetch_json('https://kli.korean.go.kr/term/api/search.do?' + query, 'kterm', offline)
    if data is None:
        return None
    items = data.get('items') or data.get('item') or data.get('result') or []
    usable = []
    for item in items if isinstance(items, list) else []:
        licence = str(item.get('kr_gvrn_lcns_ty', ''))
        if licence and not re.match(r'^\s*(0|1)\b|^\s*제?\s*[01]\s*유형', licence):
            continue
        usable.append({'word': item.get('word', ''), 'field': ' '.join(filter(None, [item.get('category_main', ''), item.get('category_sub', '')])),
                       'origin': ' '.join(filter(None, [str(item.get('origin', '')), str(item.get('translation', ''))]))})
    return usable


def fits_field(name, field):
    return any(part in str(name) for part in FIELDS.get(field, ()))


def judge(entry, opendict, kterm):
    """ok / mismatch / unknown, with the dictionary terms that were seen."""
    wanted = ko_variants(entry['ko'])
    en = entry['en'].lower()
    candidates = []
    for row in opendict or []:
        if fits_field(row['field'], entry['field']):
            candidates.append(('우리말샘', row['word'], row['field']))
    for row in kterm or []:
        if en in row['origin'].lower() and fits_field(row['field'], entry['field']):
            candidates.append(('온용어', row['word'], row['field']))
    if not candidates:
        return 'unknown', []
    if any(norm(word) in wanted or any(norm(word) and norm(word) in w for w in wanted) for _, word, _ in candidates):
        return 'ok', candidates
    return 'mismatch', candidates


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0, help='review only the first N entries')
    parser.add_argument('--offline', action='store_true', help='use cached responses only (no requests)')
    args = parser.parse_args(argv)
    keys = {name: env(name) for name in ('NIKL_OPENDICT_KEY', 'NIKL_KTERM_KEY', 'KRDICT_KEY')}
    missing = [name for name, value in keys.items() if not value]
    if missing and not args.offline:
        print('Missing API keys (Windows user environment variables): ' + ', '.join(missing))
        if len(missing) == 3:
            return 2
    with open(ENTRIES, encoding='utf-8') as handle:
        entries = json.load(handle)
    if args.limit:
        entries = entries[:args.limit]
    rows, counts = [], Counter()
    for index, entry in enumerate(entries, 1):
        opendict = opendict_terms(entry['en'], keys['NIKL_OPENDICT_KEY'], args.offline)
        kterm = kterm_items(entry['ko'].split(',')[0].strip(), keys['NIKL_KTERM_KEY'], args.offline)
        verdict, seen = judge(entry, opendict, kterm)
        counts[verdict] += 1
        rows.append({**{k: entry[k] for k in ('field', 'en', 'ko')}, 'verdict': verdict,
                     'dictionary': ' / '.join(sorted({f'{word} ({source}, {field})' for source, word, field in seen}))})
        if index % 200 == 0:
            print(index, dict(counts), flush=True)
    report = {'reviewed': len(rows), 'counts': dict(counts),
              'byField': {field: dict(Counter(r['verdict'] for r in rows if r['field'] == field)) for field in sorted({r['field'] for r in rows})},
              'rows': rows}
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'report.json'), 'w', encoding='utf-8') as handle:
        json.dump(report, handle, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'report.csv'), 'w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=['field', 'en', 'ko', 'verdict', 'dictionary'])
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps({k: report[k] for k in ('reviewed', 'counts', 'byField')}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
