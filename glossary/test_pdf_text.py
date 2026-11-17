"""pdf_text.py 규칙 테스트 (테스트용 PDF를 PyMuPDF로 만들어 확인). python -m unittest discover -s glossary"""
import unittest

import pymupdf

import build_glossary as g
from pdf_text import extract_page, is_equation_line, repeated_margin_lines


def page_with(*items, height=792):
    """items: (x, y, text, size, extra kwargs) -> PDF 한 쪽."""
    doc = pymupdf.open()
    page = doc.new_page(width=612, height=height)
    for x, y, text, size, *extra in items:
        page.insert_text((x, y), text, fontsize=size, fontname='helv', **(extra[0] if extra else {}))
    return doc, page


def width(text, size):
    return pymupdf.get_text_length(text, fontname='helv', fontsize=size)


class Superscripts(unittest.TestCase):
    def test_exponent_after_a_number_is_marked(self):
        base = 'Avogadro number = 6.02 x 10'
        x = 72 + width(base, 10)
        doc, page = page_with((72, 300, base, 10), (x, 296.3, '23', 7), (x + width('23', 7) + 3, 300, 'per mole', 10))
        text, changes = extract_page(page)
        self.assertIn('6.02 x 10^23 per mole', text)
        self.assertEqual(changes.get('exponentsMarked'), 1)

    def test_unit_exponent_and_negative_sign(self):
        base = 'density 5.5 cm'
        x = 72 + width(base, 10)
        doc, page = page_with((72, 300, base, 10), (x, 296.3, '-3', 7), (x + width('-3', 7) + 3, 300, 'for oxygen.', 10))
        self.assertIn('5.5 cm^-3 for oxygen.', extract_page(page)[0])

    def test_footnote_mark_after_a_word_is_removed(self):
        base = 'specific harmonics'
        x = 72 + width(base, 10)
        doc, page = page_with((72, 300, base, 10), (x, 296.3, '10', 7), (x + width('10', 7) + 3, 300, 'of the signal.', 10))
        text, changes = extract_page(page)
        self.assertIn('specific harmonics of the signal.', text)
        self.assertEqual(changes.get('footnoteMarksRemoved'), 1)

    def test_degree_sign(self):
        base = 'heated to 1250'
        x = 72 + width(base, 10)
        doc, page = page_with((72, 300, base, 10), (x, 296.3, 'o', 7), (x + width('o', 7) + 0.5, 300, 'C under oxygen.', 10))
        self.assertIn('heated to 1250°C under oxygen.', extract_page(page)[0])


class InvisibleAndMargins(unittest.TestCase):
    def test_white_text_and_vertical_stamp_are_removed(self):
        doc, page = page_with((72, 300, 'the current value of', 10), (72 + width('the current value of', 10), 300, '.', 6, {'color': (1, 1, 1)}),
                              (72 + width('the current value of.', 10) + 1, 300, 'vDC must be high.', 10),
                              (590, 700, 'Downloaded from https://example.org', 8, {'rotate': 90}))
        text, changes = extract_page(page)
        self.assertIn('the current value of vDC must be high.', text)
        self.assertNotIn('Downloaded', text)
        self.assertGreaterEqual(changes.get('verticalLinesRemoved', 0), 1)

    def test_running_headers_and_page_numbers(self):
        doc = pymupdf.open()
        for number in range(1, 6):
            page = doc.new_page(width=612, height=792)
            page.insert_text((72, 60), f'{number}   CHAPTER 1. BASIC CONCEPTS OF ELECTRICITY', fontsize=10, fontname='helv')
            page.insert_text((72, 200), f'Body text sentence number {number} about electric current.', fontsize=10, fontname='helv')
        margins = repeated_margin_lines(doc)
        text, changes = extract_page(doc[2], margins)
        self.assertEqual(text, 'Body text sentence number 3 about electric current.')
        self.assertEqual(changes.get('headerFooterRemoved'), 1)

    def test_diacritic_and_copyright(self):
        from collections import Counter
        from pdf_text import _fix_characters
        doc, page = page_with((72, 300, 'Technische Universit¨at Dresden', 10))
        self.assertIn('Technische Universität Dresden', extract_page(page)[0])
        # the test font cannot draw U+20DD, so the copyright rule is checked on the string
        self.assertEqual(_fix_characters('⃝c K. Kikkeri; c⃝Sevenchw', Counter()), '© K. Kikkeri; ©Sevenchw')


class Spacing(unittest.TestCase):
    def test_space_restored_from_the_gap(self):
        doc, page = page_with((72, 300, 'on and off', 10), (72 + width('on and off', 10) + 3, 300, 'to a load.', 10))
        self.assertIn('on and off to a load.', extract_page(page)[0])

    def test_equation_lines(self):
        self.assertTrue(is_equation_line('E(z) = 1/(4πε) ∫ ρ dρ'))
        self.assertFalse(is_equation_line('Electric current is the flow of charge.'))


class Slides(unittest.TestCase):
    def test_bullet_lines_become_sentences(self):
        pages = g.page_texts([(7, ' Verifies correctness of design and of test procedure\n Expensive\nMay comprise:')], paper=False, slides=True)
        self.assertEqual(pages[0]['text'], 'Verifies correctness of design and of test procedure.')
        self.assertEqual(list(g.split_sentences(pages[0]['text'])), ['Verifies correctness of design and of test procedure.'])


if __name__ == '__main__':
    unittest.main()
