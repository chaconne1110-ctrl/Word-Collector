import unittest

import review_dictionaries as review


class ReviewDictionariesTest(unittest.TestCase):
    def test_norm_ignores_spacing_marks_and_brackets(self):
        self.assertEqual(review.norm('전기^회로'), review.norm('전기 회로'))
        self.assertEqual(review.norm('송전-선'), '송전선')
        self.assertEqual(review.norm('자속 밀도 (B)'), '자속밀도')

    def test_english_parts_split_mixed_language_translations(self):
        self.assertEqual(review.english_parts('translocation##でんりゅう##转移'), {'translocation'})
        self.assertEqual(review.english_parts('Current; electric current'), {'current', 'electric current'})

    def test_same_term_allows_a_longer_form(self):
        self.assertTrue(review.same_term('current', 'electric current'))
        self.assertTrue(review.same_term('skin effect', 'skin effect'))
        self.assertFalse(review.same_term('current', 'commutation'))

    def test_confirmed_when_kterm_has_the_english_term_in_the_field(self):
        entry = {'field': '전기공학', 'en': 'skin effect', 'ko': '표피 효과'}
        kterm = [{'word': '표피^효과', 'field': '인공물 전기/전자', 'english': {'skin effect'}, 'source': 'x'}]
        self.assertEqual(review.judge(entry, [], kterm)[0], 'confirmed')

    def test_en_differs_when_the_field_term_is_for_other_english(self):
        entry = {'field': '전기공학', 'en': 'current', 'ko': '전류'}
        kterm = [{'word': '전류', 'field': '인공물 전기/전자', 'english': {'commutation'}, 'source': 'x'}]
        self.assertEqual(review.judge(entry, [], kterm)[0], 'en_differs')

    def test_exists_other_field_and_not_found(self):
        entry = {'field': '전기공학', 'en': 'skin effect', 'ko': '표피 효과'}
        self.assertEqual(review.judge(entry, [{'word': '표피^효과', 'field': '전기·전자', 'definition': ''}], [])[0], 'exists')
        self.assertEqual(review.judge(entry, [{'word': '표피^효과', 'field': '의학', 'definition': ''}], [])[0], 'other_field')
        self.assertEqual(review.judge(entry, [], [])[0], 'not_found')

    def test_api_refusals_are_errors_not_answers(self):
        self.assertTrue(review.api_error({'channel': {'returnCode': '022', 'return_object': '일일 요청 건 초과'}}))
        self.assertTrue(review.api_error({'error': {'error_code': '020'}}))
        self.assertFalse(review.api_error({'channel': {'returnCode': '1', 'return_object': '검색 결과가 없습니다.'}}))
        self.assertFalse(review.api_error({'channel': {'total': 3, 'item': []}}))

    def test_no_data_without_keys(self):
        self.assertIsNone(review.opendict_terms('전류', '', offline=False))
        self.assertIsNone(review.kterm_items('전류', '', offline=False))


if __name__ == '__main__':
    unittest.main()
