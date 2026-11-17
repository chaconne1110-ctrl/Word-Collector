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
CANDIDATE = {'field': '전기공학', 'term': 'current', 'count': 120, 'contexts': CONTEXTS}
ANSWER = {'id': 0, 'isTerm': True, 'englishTerm': 'current', 'koreanMeaning': '전류', 'pos': '명사',
          'englishDefinition': 'The movement of electric charge from one place to another.', 'koreanDefinition': '전하가 한 곳에서 다른 곳으로 움직이는 것.',
          'exampleSentence': 'When you switch on the lamp, a small current runs through its filament.',
          'exampleKo': '램프를 켜면 필라멘트에 작은 전류가 흐른다.',
          'relatedWords': [{'englishTerm': 'voltage', 'koreanMeaning': '전압'}, {'englishTerm': 'resistance', 'koreanMeaning': '저항'}]}
COPIED_EXAMPLE = {**ANSWER, 'exampleSentence': 'In a wire, electric current is the flow of electrons through a conductor.'}


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


class CopyCheck(unittest.TestCase):
    def test_eight_words_in_a_row_count_as_copied(self):
        source = ['Electric current is the flow of electrons through a conductor.']
        self.assertTrue(g.copies_source('So electric current is the flow of electrons through a wire.', source))
        self.assertFalse(g.copies_source('Current means charge moving through a conductor.', source))
        self.assertFalse(g.copies_source('the flow of electrons', source), 'short phrases are not copies')


class Extract(unittest.TestCase):
    def test_printed_page(self):
        self.assertEqual(g.printed_page_from_top_line('1.4. VOLTAGE AND CURRENT 21'), '21')
        self.assertEqual(g.printed_page_from_top_line('12 CHAPTER 1. BASIC AC THEORY'), '12')
        self.assertIsNone(g.printed_page_from_top_line('CHAPTER ONE'))

    def test_page_text_and_sentences(self):
        text = g.clean_page_text('The re-\nsistance of a wire\n opposes current flow. Ohm found it.')
        self.assertEqual(text, 'The resistance of a wire opposes current flow. Ohm found it.')
        self.assertEqual(list(g.split_sentences(text)), ['The resistance of a wire opposes current flow.'])

    def test_papers_stop_at_the_references(self):
        raw = [(1, 'Title\nThe threshold voltage of the transistor shifts with temperature.'),
               (2, 'Results agree with the model.\nReferences\n[1] A. Author, Some journal, 2020.'),
               (3, '[2] B. Author, Another journal.')]
        pages = g.page_texts(raw, paper=True)
        self.assertEqual([p['pdfPage'] for p in pages], [1, 2])
        self.assertNotIn('Author', pages[1]['text'])
        self.assertEqual(len(g.page_texts(raw, paper=False)), 3, 'textbooks keep every page')

    def test_candidates_skip_stopwords_and_keep_page(self):
        terms = set(g.candidate_terms('A resistor limits the electric current in the circuit.'))
        self.assertIn('electric current', terms)
        self.assertIn('resistor', terms)
        self.assertNotIn('the circuit', terms)
        self.assertNotIn('in', terms)
        pages = [{'pdfPage': n, 'printedPage': str(n - 10), 'text': 'Electric current is the flow of charge in a wire.'} for n in range(11, 20)]
        found = {c['term']: c for c in g.collect_candidates([('kuphaldt-lec-dc', 'textbook', pages)])}
        self.assertIn('electric current', found)
        self.assertEqual(found['electric current']['count'], 9)
        self.assertEqual(found['electric current']['contexts'][0]['pdfPage'], 11)
        self.assertLessEqual(len(found['electric current']['contexts']), g.MAX_CONTEXTS)

    def test_papers_use_lower_thresholds(self):
        pages = [{'pdfPage': n, 'printedPage': None, 'text': 'The gate oxide thickness controls the threshold voltage here.'} for n in (1, 2, 3)]
        self.assertIn('threshold voltage', {c['term'] for c in g.collect_candidates([('paper-1', 'paper', pages)])})
        self.assertNotIn('threshold voltage', {c['term'] for c in g.collect_candidates([('book', 'textbook', pages)])})

    def test_plurals_merge_and_definitions_come_first(self):
        pages = [{'pdfPage': n, 'printedPage': None, 'text': 'We measured the currents in each branch of the network today.'} for n in range(1, 4)]
        pages += [{'pdfPage': n, 'printedPage': None, 'text': 'Engineers measured the current in a branch every morning.'} for n in range(4, 9)]
        pages += [{'pdfPage': 9, 'printedPage': None, 'text': 'Current is the flow of electric charge through a conductor.'}]
        found = {c['term']: c for c in g.collect_candidates([('kuphaldt-lec-dc', 'textbook', pages)])}
        self.assertNotIn('currents', found)
        self.assertEqual(found['current']['count'], 9)
        self.assertTrue(any(c['pdfPage'] == 9 for c in found['current']['contexts']))
        self.assertTrue(g.defines('This effect is called mutual inductance.', 'mutual inductance'))
        self.assertFalse(g.defines('It is possible to measure current here.', 'current'))

    def test_sources_have_a_field_and_restricted_pages(self):
        sources = g.load_sources()
        self.assertTrue(all(s['field'] in g.FIELDS for s in sources))
        ac = next(s for s in sources if s['id'] == 'kuphaldt-lec-ac')
        self.assertEqual(g.restricted_pages(ac), {429, 430})
        self.assertEqual(g.source_file_name(ac), 'AC.pdf')
        self.assertEqual(g.source_file_name({'file': 'paper-01.pdf', 'url': 'https://doi.org/10.1/x'}), 'paper-01.pdf')


class Define(unittest.TestCase):
    def test_entry_is_written_anew_and_keeps_references_for_the_server(self):
        entry = g.entry_from_answer(CANDIDATE, ANSWER, 'gemini-4-hydrogen')
        self.assertEqual(entry['exampleEn'], ANSWER['exampleSentence'])
        self.assertEqual(entry['field'], '전기공학')
        self.assertEqual(entry['references'][0], {'sourceId': 'kuphaldt-lec-dc', 'pdfPage': 31, 'printedPage': '21'})

    def test_copied_or_bad_answers_are_not_kept(self):
        self.assertEqual(g.entry_from_answer(CANDIDATE, COPIED_EXAMPLE, 'm'), g.COPIED)
        copied_definition = {**ANSWER, 'englishDefinition': 'Electric current is the flow of electrons through a conductor.'}
        self.assertEqual(g.entry_from_answer(CANDIDATE, copied_definition, 'm'), g.COPIED)
        for change in [{'isTerm': False}, {'koreanMeaning': 'current'}, {'englishDefinition': '전하의 흐름'},
                       {'relatedWords': []}, {'pos': ''}, {'exampleSentence': ''}]:
            self.assertIsNone(g.entry_from_answer(CANDIDATE, {**ANSWER, **change}, 'm'), change)

    def test_copies_are_rewritten_once_then_dropped(self):
        resistor = {**CANDIDATE, 'term': 'resistor'}
        calls = []
        def ask(batch):
            calls.append(batch)
            if len(calls) == 1:
                return [{**COPIED_EXAMPLE, 'id': 0}, {**COPIED_EXAMPLE, 'id': 1}]
            return [{**ANSWER, 'id': 0}, {**COPIED_EXAMPLE, 'id': 1}]     # 다시 쓰기: 하나는 고쳐짐
        done = g.define_all([CANDIDATE, resistor], {}, ask=ask, model='m', log=lambda *_: None)
        self.assertEqual(len(calls), 2)
        self.assertTrue(all(item['rewrite'] for item in calls[1]))
        self.assertNotIn('rewrite', calls[0][0])
        self.assertEqual(done['전기공학|current']['en'], 'current')
        self.assertIsNone(done['전기공학|resistor'])

    def test_resumes_and_retries_unanswered(self):
        other = {**CANDIDATE, 'term': 'following circuit'}
        third = {**CANDIDATE, 'term': 'resistor'}
        semi = {**CANDIDATE, 'field': '반도체'}
        sent = []
        def ask(batch):
            sent.append([(item['field'], item['term']) for item in batch])
            return [ANSWER, {**ANSWER, 'id': 1, 'isTerm': False}]      # 세 번째 이후에는 답하지 않음
        saves = []
        done = g.define_all([CANDIDATE, other, third, semi], {}, ask=ask, model='m', save=lambda d: saves.append(dict(d)), log=lambda *_: None)
        self.assertEqual(set(done), {'전기공학|current', '전기공학|following circuit'})
        self.assertIsNone(done['전기공학|following circuit'])
        self.assertEqual(len(saves), 1)
        g.define_all([CANDIDATE, other, third, semi], done, ask=ask, model='m', log=lambda *_: None)
        self.assertEqual(sent[-1], [('전기공학', 'resistor'), ('반도체', 'current')], 'same word in another field is separate')

    def test_batch_sends_only_terms_fields_and_sentences(self):
        seen = []
        g.define_all([CANDIDATE], {}, ask=lambda b: seen.append(b) or [ANSWER], model='m', log=lambda *_: None)
        self.assertEqual(seen[0], [{'id': 0, 'term': 'current', 'field': '전기공학',
                                    'contexts': [{'i': 0, 'text': CONTEXTS[0]['text']}, {'i': 1, 'text': CONTEXTS[1]['text']}]}])


class Export(unittest.TestCase):
    def test_lookup_keys_per_field_and_sql(self):
        current = g.entry_from_answer(CANDIDATE, ANSWER, 'm')
        dark = g.entry_from_answer({**CANDIDATE, 'term': 'dark current', 'count': 3},
                                   {**ANSWER, 'englishTerm': 'dark current', 'koreanMeaning': '암전류, 전류'}, 'm')
        semi = g.entry_from_answer({**CANDIDATE, 'field': '반도체', 'term': 'drift current', 'count': 5},
                                   {**ANSWER, 'englishTerm': 'drift current', 'koreanMeaning': '드리프트 전류, 전류'}, 'm')
        lookup = g.build_lookup([dark, current, semi])
        self.assertEqual(lookup['전기공학|current']['en'], 'current')
        self.assertEqual(lookup['전기공학|암전류']['en'], 'dark current')
        self.assertNotIn('전기공학|전류', lookup, 'a Korean meaning shared by two terms of a field is not a key')
        self.assertEqual(lookup['반도체|전류']['en'], 'drift current', 'unique within its own field')
        sql = g.glossary_sql({'전기공학|ohm s law': {**current, 'en': "Ohm's law"}})
        self.assertIn('DELETE FROM glossary_terms;', sql)
        self.assertIn("'전기공학|ohm s law'", sql)
        self.assertIn("Ohm''s law", sql)
        payload = json.loads(sql.split("'전기공학|ohm s law', '")[1].rsplit("');", 1)[0].replace("''", "'"))
        self.assertEqual(payload['v'], 2)
        self.assertEqual(payload['references'][0]['pdfPage'], 31)
        self.assertNotIn('count', payload)


if __name__ == '__main__':
    unittest.main()
