import unittest

import apply_corrections as fix


def entry(en, ko, **extra):
    return {'en': en, 'ko': ko, 'koDef': extra.get('koDef', ''), 'exampleKo': extra.get('exampleKo', ''), 'pos': extra.get('pos', '명사')}


class ApplyCorrectionsTest(unittest.TestCase):
    def test_duplicates_merge_into_the_entry_with_the_plain_key(self):
        main, plural = entry('refractive index', '굴절률'), entry('refractive index', '굴절률', koDef='x')
        lookup = {'반도체|refractive index': main, '반도체|refractive indices': plural}
        new, report = fix.apply_to_lookup(lookup, {})
        self.assertIs(new['반도체|refractive indices'], new['반도체|refractive index'])
        self.assertEqual(new['반도체|refractive index']['koDef'], '')
        self.assertEqual((report['merged_groups'], report['removed_entries']), (1, 1))

    def test_override_fixes_meaning_text_and_keys(self):
        good = entry('electrically-short dipole', '전기적 단축 다이폴', exampleKo='전기적 단축 다이폴은 짧다.')
        bad = entry('electrically-short dipole', '전기적 단소 다이폴')
        lookup = {'전기공학|electrically short dipole': good, '전기공학|전기적 단축 다이폴': good,
                  '전기공학|electrically short dipole esd': bad, '전기공학|전기적 단소 다이폴': bad}
        corrections = {('전기공학', 'electrically short dipole'): {
            'ko': '전기적으로 짧은 다이폴', 'replace': [['전기적 단축 다이폴', '전기적으로 짧은 다이폴']],
            'dropKeys': ['전기공학|전기적 단축 다이폴', '전기공학|전기적 단소 다이폴'], 'addKeys': ['전기공학|전기적으로 짧은 다이폴']}}
        new, _ = fix.apply_to_lookup(lookup, corrections)
        self.assertNotIn('전기공학|전기적 단소 다이폴', new)
        self.assertNotIn('전기공학|전기적 단축 다이폴', new)
        merged = new['전기공학|electrically short dipole']
        self.assertEqual(merged['ko'], '전기적으로 짧은 다이폴')
        self.assertEqual(merged['exampleKo'], '전기적으로 짧은 다이폴은 짧다.')
        self.assertIs(new['전기공학|전기적으로 짧은 다이폴'], merged)
        self.assertIs(new['전기공학|electrically short dipole esd'], merged)
        self.assertEqual(good['ko'], '전기적 단축 다이폴', 'the input entry is not changed in place')

    def test_corrections_file_is_valid(self):
        corrections = fix.load_corrections()
        self.assertIn(('전기공학', 'electrically short dipole'), corrections)
        for item in corrections.values():
            for key in item.get('dropKeys', []) + item.get('addKeys', []):
                self.assertTrue(key.startswith(item['field'] + '|'), key)


class ExportCsvTest(unittest.TestCase):
    def test_csv_lists_the_corrected_entries_like_the_sql(self):
        import csv, json, tempfile
        from pathlib import Path
        import build_glossary as build
        entry = {'en': 'electrically-short dipole', 'ko': '전기적 단축 다이폴', 'pos': '명사구', 'enDef': 'd', 'koDef': 'k',
                 'exampleEn': 'e', 'exampleKo': '전기적 단축 다이폴은 짧다.', 'field': '전기공학',
                 'references': [{'sourceId': 's', 'pdfPage': 1}], 'model': 'm', 'builtAt': 't', 'term': 'electrically short dipole',
                 'aliases': [], 'count': 3, 'relatedWords': []}
        with tempfile.TemporaryDirectory() as tmp:
            saved = build.OUT
            build.OUT = Path(tmp)
            try:
                (Path(tmp) / 'glossary.json').write_text(json.dumps({'terms': {'x': entry}}, ensure_ascii=False), encoding='utf-8')
                build.command_export(None)
                rows = list(csv.reader((Path(tmp) / 'glossary.csv').open(encoding='utf-8-sig')))
                sql = (Path(tmp) / 'glossary.sql').read_text(encoding='utf-8')
            finally:
                build.OUT = saved
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][2], '전기적으로 짧은 다이폴')
        self.assertEqual(rows[1][7], '전기적으로 짧은 다이폴은 짧다.')
        self.assertIn('전기적으로 짧은 다이폴', sql)
        self.assertNotIn('단축', ''.join(rows[1]))


if __name__ == '__main__':
    unittest.main()
