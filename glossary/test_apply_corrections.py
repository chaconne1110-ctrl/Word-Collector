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


if __name__ == '__main__':
    unittest.main()
