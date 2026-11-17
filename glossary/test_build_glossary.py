"""python -m unittest discover -s glossary  (Gemini와 PDF 없이 실행되는 테스트)"""
import json
import subprocess
import unittest
from pathlib import Path

import build_glossary as g

CONTEXTS = [
    {'text': 'Electric current is the flow of electrons through a conductor.', 'sourceId': 'kuphaldt-lec-dc', 'pdfPage': 31, 'printedPage': '21'},
    {'text': 'The current is measured in amperes with an ammeter.', 'sourceId': 'kuphaldt-lec-dc', 'pdfPage': 40, 'printedPage': '30'},
]
CANDIDATE = {'term': 'current', 'count': 120, 'contexts': CONTEXTS}
ANSWER = {'id': 0, 'isTerm': True, 'englishTerm': 'current', 'koreanMeaning': '전류', 'pos': '명사',
          'englishDefinition': 'The flow of electric charge.', 'koreanDefinition': '전하의 흐름.',
          'exampleIndex': 0, 'exampleKo': '전류는 도체를 통한 전자의 흐름이다.',
          'relatedWords': [{'englishTerm': 'voltage', 'koreanMeaning': '전압'}, {'englishTerm': 'resistance', 'koreanMeaning': '저항'}]}


class LookupKey(unittest.TestCase):
    def test_matches_the_server_rule(self):
        self.assertEqual(g.lookup_key('  Dark-Current '), 'dark current')
        self.assertEqual(g.lookup_key('Ｏhm’s law'), 'ohm s law')
        self.assertEqual(g.lookup_key('전류'), '전류')

    def test_same_keys_as_cloudflare_glossary_mjs(self):
        samples = ['  Dark-Current ', 'Ohm’s law', 'RMS\tvoltage', '전류', 'AC/DC', 'ﬁlter']
        script = ("import {glossaryKey} from './cloudflare/glossary.mjs';"
                  f"console.log(JSON.stringify({json.dumps(samples)}.map(glossaryKey)));")
        root = Path(__file__).resolve().parent.parent
        out = subprocess.run(['node', '--input-type=module', '-e', script], cwd=root, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertEqual(json.loads(out.stdout), [g.lookup_key(s) for s in samples])


class Extract(unittest.TestCase):
    def test_printed_page(self):
        self.assertEqual(g.printed_page_from_top_line('1.4. VOLTAGE AND CURRENT 21'), '21')
        self.assertEqual(g.printed_page_from_top_line('12 CHAPTER 1. BASIC AC THEORY'), '12')
        self.assertIsNone(g.printed_page_from_top_line('CHAPTER ONE'))

    def test_page_text_and_sentences(self):
        text = g.clean_page_text('The re-\nsistance of a wire\n opposes current flow. Ohm found it.')
        self.assertEqual(text, 'The resistance of a wire opposes current flow. Ohm found it.')
        self.assertEqual(list(g.split_sentences(text)), ['The resistance of a wire opposes current flow.'])

    def test_candidates_skip_stopwords_and_keep_page(self):
        sentence = 'A resistor limits the electric current in the circuit.'
        terms = set(g.candidate_terms(sentence))
        self.assertIn('electric current', terms)
        self.assertIn('resistor', terms)
        self.assertNotIn('the circuit', terms)
        self.assertNotIn('in', terms)
        pages = [{'pdfPage': n, 'printedPage': str(n - 10), 'text': 'Electric current is the flow of charge in a wire. ' * 1}
                 for n in range(11, 20)]
        found = {c['term']: c for c in g.collect_candidates([('kuphaldt-lec-dc', pages)], min_single=5, min_multi=5)}
        self.assertIn('electric current', found)
        self.assertEqual(found['electric current']['count'], 9)
        self.assertEqual(found['electric current']['contexts'][0]['pdfPage'], 11)
        self.assertLessEqual(len(found['electric current']['contexts']), g.MAX_CONTEXTS)

    def test_plurals_merge_and_definitions_come_first(self):
        pages = [{'pdfPage': n, 'printedPage': None, 'text': 'We measured the currents in each branch of the network today.'}
                 for n in range(1, 4)]
        pages += [{'pdfPage': n, 'printedPage': None, 'text': 'Engineers measured the current in a branch every morning.'} for n in range(4, 9)]
        pages += [{'pdfPage': 9, 'printedPage': None, 'text': 'Current is the flow of electric charge through a conductor.'}]
        found = {c['term']: c for c in g.collect_candidates([('kuphaldt-lec-dc', pages)], min_single=5)}
        self.assertNotIn('currents', found)
        self.assertEqual(found['current']['count'], 9)
        self.assertTrue(any(c['pdfPage'] == 9 for c in found['current']['contexts']))
        self.assertTrue(g.defines('Electric current is the flow of charge.', 'electric current'))
        self.assertTrue(g.defines('This effect is called mutual inductance.', 'mutual inductance'))
        self.assertFalse(g.defines('It is possible to measure current here.', 'current'))

    def test_restricted_pages_from_sources(self):
        ac = next(s for s in g.load_sources() if s['id'] == 'kuphaldt-lec-ac')
        self.assertEqual(g.restricted_pages(ac), {429, 430})


class Define(unittest.TestCase):
    def test_entry_uses_a_real_textbook_sentence(self):
        entry = g.entry_from_answer(CANDIDATE, ANSWER, 'gemini-4-hydrogen')
        self.assertEqual(entry['exampleEn'], CONTEXTS[0]['text'])
        self.assertEqual((entry['pdfPage'], entry['printedPage']), (31, '21'))
        self.assertEqual(entry['relatedWords'][0], {'en': 'voltage', 'ko': '전압'})

    def test_bad_answers_are_dropped(self):
        for change in [{'isTerm': False}, {'exampleIndex': 5}, {'koreanMeaning': 'current'},
                       {'englishDefinition': '전하의 흐름'}, {'relatedWords': []}, {'pos': ''}]:
            self.assertIsNone(g.entry_from_answer(CANDIDATE, {**ANSWER, **change}, 'm'), change)

    def test_resumes_and_retries_unanswered(self):
        other = {'term': 'following circuit', 'count': 50, 'contexts': CONTEXTS}
        third = {'term': 'resistor', 'count': 40, 'contexts': CONTEXTS}
        sent = []
        def ask(batch):
            sent.append([item['term'] for item in batch])
            # 'resistor'에는 답하지 않음 -> 다음 실행 때 다시 묻는다
            return [ANSWER, {**ANSWER, 'id': 1, 'isTerm': False}]
        saves = []
        done = g.define_all([CANDIDATE, other, third], {}, ask=ask, model='m', save=lambda d: saves.append(dict(d)), log=lambda *_: None)
        self.assertEqual(set(done), {'current', 'following circuit'})
        self.assertIsNone(done['following circuit'])
        self.assertEqual(len(saves), 1)
        g.define_all([CANDIDATE, other, third], done, ask=ask, model='m', log=lambda *_: None)
        self.assertEqual(sent[-1], ['resistor'])
        self.assertEqual(sent[0][0], 'current')

    def test_batch_sends_only_terms_and_sentences(self):
        seen = []
        g.define_all([CANDIDATE], {}, ask=lambda b: seen.append(b) or [ANSWER], model='m', log=lambda *_: None)
        self.assertEqual(seen[0], [{'id': 0, 'term': 'current', 'contexts': [{'i': 0, 'text': CONTEXTS[0]['text']}, {'i': 1, 'text': CONTEXTS[1]['text']}]}])


class Export(unittest.TestCase):
    def test_lookup_keys_and_sql(self):
        current = g.entry_from_answer(CANDIDATE, ANSWER, 'm')
        dark = g.entry_from_answer({**CANDIDATE, 'term': 'dark current', 'count': 3},
                                   {**ANSWER, 'englishTerm': 'dark current', 'koreanMeaning': '암전류, 전류'}, 'm')
        lookup = g.build_lookup([dark, current])
        self.assertEqual(lookup['current']['en'], 'current')
        self.assertEqual(lookup['dark current']['en'], 'dark current')
        self.assertEqual(lookup['암전류']['en'], 'dark current')
        self.assertNotIn('전류', lookup, 'a Korean meaning shared by two terms is not a key')
        sql = g.glossary_sql({'ohm s law': {**current, 'en': "Ohm's law"}})
        self.assertIn('DELETE FROM glossary_terms;', sql)
        self.assertIn("'ohm s law'", sql)
        self.assertIn("Ohm''s law", sql)
        payload = json.loads(sql.split("'ohm s law', '")[1].rsplit("');", 1)[0].replace("''", "'"))
        self.assertEqual(payload['v'], 1)
        self.assertNotIn('count', payload)


if __name__ == '__main__':
    unittest.main()
