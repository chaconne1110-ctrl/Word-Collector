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

    def test_same_term_allows_only_plural_forms(self):
        self.assertTrue(review.same_term('skin effect', 'skin effect'))
        self.assertTrue(review.same_term('skin effect', 'skin effects'))
        self.assertTrue(review.same_term('switch', 'switches'))
        for one, many in [('diode', 'diodes'), ('phase', 'phases'), ('loss', 'losses'), ('bus', 'buses'),
                          ('density', 'densities'), ('gas', 'gases'), ('process', 'processes'), ('box', 'boxes')]:
            self.assertTrue(review.same_term(one, many), (one, many))
            self.assertTrue(review.same_term(many, one), (many, one))
            self.assertTrue(review.same_term('power ' + one, 'power ' + many), one)
        self.assertFalse(review.same_term('diode', 'diod'))
        self.assertFalse(review.same_term('phase', 'phasor'))
        self.assertFalse(review.same_term('current', 'commutation'))
        # A longer compound is a different term, in either direction.
        self.assertFalse(review.same_term('semiconductor', 'semiconductor laser'))
        self.assertFalse(review.same_term('semiconductor laser', 'semiconductor'))
        self.assertFalse(review.same_term('current', 'electric current'))

    def test_compound_in_dictionary_is_not_confirmed(self):
        entry = {'en': 'semiconductor', 'ko': '반도체 레이저', 'field': '반도체'}
        kterm = [{'word': '반도체 레이저', 'field': '전기·전자', 'english': {'semiconductor laser'}, 'source': ''}]
        verdict, _ = review.judge(entry, [], kterm)
        self.assertNotEqual(verdict, 'confirmed')

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

    def test_cached_refusal_from_an_older_run_is_not_a_result(self):
        import json, os, tempfile, hashlib, urllib.parse
        with tempfile.TemporaryDirectory() as tmp:
            saved = review.CACHE
            review.CACHE = tmp
            try:
                url = 'https://kli.korean.go.kr/term/api/search.do?key=SECRET&apiSearchWord=x'
                os.makedirs(os.path.join(tmp, 'kterm'))
                cache_id = 'apiSearchWord=x'
                path = os.path.join(tmp, 'kterm', hashlib.sha256(cache_id.encode()).hexdigest() + '.json')
                with open(path, 'w', encoding='utf-8') as handle:
                    json.dump({'channel': {'returnCode': '022', 'return_object': '일일 요청 건 초과'}}, handle)
                self.assertIsNone(review.fetch_json(url, 'kterm', offline=True))   # pending, not "no result"
                self.assertFalse(os.path.exists(path))
                good = {'channel': {'returnCode': '1', 'return_object': [{'resultlist': []}]}}
                with open(path, 'w', encoding='utf-8') as handle:
                    json.dump(good, handle)
                self.assertEqual(review.fetch_json(url, 'kterm', offline=True), good)
            finally:
                review.CACHE = saved

    def test_parallel_workers_removing_the_same_refusal_do_not_crash(self):
        import json, os, tempfile, hashlib
        from concurrent.futures import ThreadPoolExecutor
        with tempfile.TemporaryDirectory() as tmp:
            saved = review.CACHE
            review.CACHE = tmp
            try:
                url = 'https://kli.korean.go.kr/term/api/search.do?key=SECRET&apiSearchWord=y'
                os.makedirs(os.path.join(tmp, 'kterm'))
                path = os.path.join(tmp, 'kterm', hashlib.sha256(b'apiSearchWord=y').hexdigest() + '.json')
                for _ in range(20):
                    with open(path, 'w', encoding='utf-8') as handle:
                        json.dump({'channel': {'returnCode': '022'}}, handle)
                    with ThreadPoolExecutor(8) as pool:
                        results = list(pool.map(lambda _: review.fetch_json(url, 'kterm', offline=True), range(8)))
                    self.assertEqual(results, [None] * 8)    # pending, never a crash or a result
                    if os.path.exists(path):                    # every worker found it busy: the next run removes it
                        self.assertIsNone(review.fetch_json(url, 'kterm', offline=True))
                    self.assertFalse(os.path.exists(path))
                # The file vanishing between the check and the read is also "not cached".
                self.assertIsNone(review.read_cache(path))
                with open(path, 'w', encoding='utf-8') as handle:
                    handle.write('{"channel": ')          # half-written file
                self.assertIsNone(review.read_cache(path))
                review.write_cache(path, {'channel': {'total': 0}})
                self.assertEqual(review.read_cache(path), {'channel': {'total': 0}})
                self.assertEqual([name for name in os.listdir(os.path.dirname(path)) if name.endswith('.tmp')], [])
            finally:
                review.CACHE = saved

    def test_locked_cache_file_never_stops_the_review(self):
        import os, tempfile
        from unittest import mock
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, 'answer.json')
            calls = []
            def busy(src, dst):
                calls.append(dst)
                raise PermissionError(32, 'file is being used by another process')
            with mock.patch.object(review.os, 'replace', busy), mock.patch.object(review.time, 'sleep'):
                self.assertFalse(review.write_cache(path, {'channel': {'total': 1}}))   # skipped, no exception
            self.assertEqual(len(calls), 5)
            self.assertEqual(os.listdir(tmp), [])                                       # no leftover temp file
            # Busy only briefly: the retry succeeds.
            real_replace, state = os.replace, {'n': 0}
            def busy_once(src, dst):
                state['n'] += 1
                if state['n'] == 1:
                    raise PermissionError(32, 'busy')
                real_replace(src, dst)
            with mock.patch.object(review.os, 'replace', busy_once), mock.patch.object(review.time, 'sleep'):
                self.assertTrue(review.write_cache(path, {'channel': {'total': 2}}))
            self.assertEqual(review.read_cache(path), {'channel': {'total': 2}})
            self.assertEqual(os.listdir(tmp), ['answer.json'])

    def test_fetch_returns_the_answer_even_if_it_cannot_be_cached(self):
        import io, json, tempfile
        from unittest import mock
        answer = {'channel': {'returnCode': '1', 'return_object': [{'resultlist': []}]}}
        class Response(io.BytesIO):
            def __enter__(self): return self
            def __exit__(self, *a): return False
        with tempfile.TemporaryDirectory() as tmp:
            saved = review.CACHE
            review.CACHE = tmp
            try:
                with mock.patch.object(review.urllib.request, 'urlopen', lambda *a, **k: Response(json.dumps(answer).encode())),                      mock.patch.object(review.os, 'replace', mock.Mock(side_effect=PermissionError(32, 'busy'))),                      mock.patch.object(review.time, 'sleep'):
                    self.assertEqual(review.fetch_json('https://kli.korean.go.kr/term/api/search.do?key=K&apiSearchWord=z', 'kterm', offline=False), answer)
            finally:
                review.CACHE = saved

    def test_no_data_without_keys(self):
        self.assertIsNone(review.opendict_terms('전류', '', offline=False))
        self.assertIsNone(review.kterm_items('전류', '', offline=False))


if __name__ == '__main__':
    unittest.main()
