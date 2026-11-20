"""Offline quality check of the server glossary (no API, no Gemini, no cost).

Reads glossary/out/review/server-glossary.raw.json (a read-only export of the
D1 table glossary_terms) and flags entries whose Korean meaning looks wrong by
rule only. Each entry can get several flags; 'needs fix' = entries with at
least one strong flag. Writes glossary/out/review/offline-report.json / .csv.

Strong flags (very likely wrong):
  untranslated   the Korean meaning is the English word itself (only Latin letters)
  definition     the 'meaning' is a sentence or explanation, not a term
  empty          no Korean meaning
  conflict       the same English term has different Korean meanings in one field
Weak flags (worth a look, often fine):
  mixed_script   Latin letters inside the Korean meaning (e.g. 'MOS 트랜지스터')
  long           more than 20 characters
"""
import csv, json, os, re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'review')
STRONG = ('untranslated', 'definition', 'empty', 'conflict')


def norm_en(text):
    return re.sub(r'[^a-z0-9]+', ' ', str(text or '').lower()).strip()


def norm_ko(text):
    return re.sub(r'[\s·ㆍ\-()\[\]]+', '', str(text or ''))


def first_ko(text):
    return re.split(r'[,/;]', str(text or ''))[0].strip()


def flags_for(entry):
    ko = str(entry.get('ko') or '').strip()
    flags = []
    if not ko:
        return ['empty']
    if not re.search(r'[가-힣]', ko):
        flags.append('untranslated')
    if re.search(r'(이다|입니다|합니다|하는 것|되는 것|을 말한다|를 말한다|[.。])\s*$', ko) or len(ko) > 40:
        flags.append('definition')
    if re.search(r'[A-Za-z]', ko) and re.search(r'[가-힣]', ko):
        flags.append('mixed_script')
    if len(ko) > 20 and 'definition' not in flags:
        flags.append('long')
    return flags


def main():
    with open(os.path.join(OUT, 'server-glossary.raw.json'), encoding='utf-8') as handle:
        rows = json.load(handle)[0]['results']
    entries = {}
    for row in rows:
        field = row['lookup_key'].split('|', 1)[0]
        entry = json.loads(row['entry_json'])
        entries.setdefault((field, entry['en'], entry['ko']), {**entry, 'field': field})
    entries = list(entries.values())
    by_en = defaultdict(set)
    for entry in entries:
        by_en[(entry['field'], norm_en(entry['en']))].add(norm_ko(first_ko(entry['ko'])))
    report = []
    for entry in entries:
        flags = flags_for(entry)
        if len(by_en[(entry['field'], norm_en(entry['en']))]) > 1:
            flags.append('conflict')
        report.append({'field': entry['field'], 'en': entry['en'], 'ko': entry['ko'], 'flags': ','.join(flags),
                       'needsFix': any(flag in STRONG for flag in flags)})
    counts = Counter(flag for row in report for flag in row['flags'].split(',') if flag)
    summary = {'entries': len(report), 'needsFix': sum(row['needsFix'] for row in report),
               'needsFixByField': dict(Counter(row['field'] for row in report if row['needsFix'])),
               'worthALook': sum(1 for row in report if row['flags'] and not row['needsFix']),
               'flags': dict(counts)}
    with open(os.path.join(OUT, 'offline-report.json'), 'w', encoding='utf-8') as handle:
        json.dump({'summary': summary, 'rows': report}, handle, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, 'offline-report.csv'), 'w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=['field', 'en', 'ko', 'flags', 'needsFix'])
        writer.writeheader()
        writer.writerows(sorted(report, key=lambda r: (not r['needsFix'], r['field'], r['en'])))
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
