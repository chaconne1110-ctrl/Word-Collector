import unittest

import review_dictionaries as review


class ReviewDictionariesTest(unittest.TestCase):
    def test_norm_ignores_spacing_marks_and_brackets(self):
        self.assertEqual(review.norm('전기^회로'), review.norm('전기 회로'))
        self.assertEqual(review.norm('송전-선'), '송전선')
        self.assertEqual(review.norm('자속 밀도 (B)'), '자속밀도')

    def test_ko_variants_split_alternatives(self):
        self.assertEqual(review.ko_variants('전송선, 송전선'), {'전송선', '송전선'})

    def test_ok_when_a_dictionary_term_matches_in_the_field(self):
        entry = {'field': '전기공학', 'en': 'transmission line', 'ko': '전송선, 송전선'}
        verdict, seen = review.judge(entry, [{'word': '송전-선', 'field': '전기·전자', 'origin': 'transmission line'}], [])
        self.assertEqual(verdict, 'ok')
        self.assertEqual(seen[0][0], '우리말샘')

    def test_mismatch_when_the_field_has_other_terms(self):
        entry = {'field': '전기공학', 'en': 'skin effect', 'ko': '피부 효과'}
        verdict, _ = review.judge(entry, [{'word': '표피^효과', 'field': '전기·전자', 'origin': 'skin effect'}], [])
        self.assertEqual(verdict, 'mismatch')

    def test_other_fields_are_ignored(self):
        entry = {'field': '전기공학', 'en': 'current', 'ko': '전류'}
        verdict, _ = review.judge(entry, [{'word': '해류', 'field': '해양', 'origin': 'current'}], [])
        self.assertEqual(verdict, 'unknown')

    def test_kterm_needs_the_english_term_in_its_origin(self):
        entry = {'field': '반도체', 'en': 'photoresist', 'ko': '감광제'}
        verdict, _ = review.judge(entry, [], [{'word': '감광제', 'field': '전기·전자', 'origin': 'photoresist'}])
        self.assertEqual(verdict, 'ok')
        verdict, _ = review.judge(entry, [], [{'word': '감광제', 'field': '전기·전자', 'origin': 'something else'}])
        self.assertEqual(verdict, 'unknown')

    def test_no_data_without_keys_and_offline_cache(self):
        self.assertIsNone(review.opendict_terms('current', '', offline=False))
        self.assertIsNone(review.kterm_items('전류', '', offline=False))


if __name__ == '__main__':
    unittest.main()
