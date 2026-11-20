"""Apply glossary/corrections.json: merge duplicate entries and fix listed meanings.

Used two ways (same rules, so a later rebuild keeps the fixes):
  - build_glossary.py export calls apply_to_lookup() before writing glossary.sql;
  - `python glossary/apply_corrections.py server` turns the read-only export of the
    live table (out/review/server-glossary.raw.json) into a small SQL file that
    rewrites only the affected keys (out/review/fix.sql). No API, no Gemini.
"""
import copy, json, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'review')


def norm_en(text):
    return re.sub(r'[^a-z0-9]+', ' ', str(text or '').lower()).strip()


def load_corrections(path=os.path.join(HERE, 'corrections.json')):
    with open(path, encoding='utf-8') as handle:
        data = json.load(handle)
    return {(item['field'], norm_en(item['en'])): item for item in data['overrides']}


def fix_entry(entry, override):
    entry = copy.deepcopy(entry)
    for old, new in override.get('replace', []):
        for key in ('ko', 'koDef', 'exampleKo'):
            if isinstance(entry.get(key), str):
                entry[key] = entry[key].replace(old, new)
    for key in ('ko', 'pos'):
        if override.get(key):
            entry[key] = override[key]
    return entry


def apply_to_lookup(lookup, corrections, key_of=lambda text: norm_en(text)):
    """lookup: {'field|key': entry}. Returns (new lookup, report). Entries are compared
    by identity of their JSON text, so the same rules work on live rows and on export."""
    groups = defaultdict(dict)                 # (field, en) -> {entry_json: [keys]}
    entries = {}
    for full, entry in lookup.items():
        field = full.split('|', 1)[0]
        text = json.dumps(entry, ensure_ascii=False, sort_keys=True)
        entries[text] = entry
        groups[(field, norm_en(entry['en']))].setdefault(text, []).append(full)
    new = dict(lookup)
    report = {'merged_groups': 0, 'removed_entries': 0, 'fixed': [], 'dropped_keys': [], 'added_keys': []}
    for (field, en), members in groups.items():
        override = corrections.get((field, en))
        if len(members) < 2 and not override:
            continue
        main_key = f'{field}|{key_of(en)}'
        canonical_text = next((text for text, keys in members.items() if main_key in keys), None) or \
            max(members, key=lambda text: len(members[text]))
        canonical = fix_entry(entries[canonical_text], override or {})
        keys = {key for group_keys in members.values() for key in group_keys}
        drop = set((override or {}).get('dropKeys', []))
        for key in keys - drop:
            new[key] = canonical
        for key in drop & keys:
            del new[key]
            report['dropped_keys'].append(key)
        for key in (override or {}).get('addKeys', []):
            if key not in new or new[key] is not canonical:
                new[key] = canonical
                report['added_keys'].append(key)
        if len(members) > 1:
            report['merged_groups'] += 1
            report['removed_entries'] += len(members) - 1
        if override:
            report['fixed'].append(f"{field}|{en}: {canonical['ko']}")
    return new, report


def server_fix(raw_path=os.path.join(OUT, 'server-glossary.raw.json')):
    rows = json.load(open(raw_path, encoding='utf-8'))[0]['results']
    lookup = {row['lookup_key']: json.loads(row['entry_json']) for row in rows}
    from build_glossary import lookup_key           # same key rule as the export
    new, report = apply_to_lookup(lookup, load_corrections(), key_of=lookup_key)
    quote = lambda value: "'" + str(value).replace("'", "''") + "'"
    lines = []
    for key in sorted(set(lookup) | set(new)):
        if key not in new:
            lines.append(f'DELETE FROM glossary_terms WHERE lookup_key = {quote(key)};')
        elif key not in lookup or new[key] != lookup[key]:
            payload = json.dumps(new[key], ensure_ascii=False, separators=(',', ':'))
            lines.append(f'INSERT OR REPLACE INTO glossary_terms (lookup_key, entry_json) VALUES ({quote(key)}, {quote(payload)});')
    with open(os.path.join(OUT, 'fix.sql'), 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    entries_before = len({json.dumps(e, ensure_ascii=False, sort_keys=True) for e in lookup.values()})
    entries_after = len({json.dumps(e, ensure_ascii=False, sort_keys=True) for e in new.values()})
    report.update({'sql_statements': len(lines), 'keys_before': len(lookup), 'keys_after': len(new),
                   'entries_before': entries_before, 'entries_after': entries_after})
    return report


if __name__ == '__main__':
    sys.path.insert(0, HERE)
    if sys.argv[1:] == ['server']:
        print(json.dumps(server_fix(), ensure_ascii=False, indent=1))
    else:
        print(__doc__)
