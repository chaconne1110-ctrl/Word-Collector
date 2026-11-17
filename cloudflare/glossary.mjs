// Textbook glossary (교재 단어집): terms prepared ahead of time from the
// registered textbooks by glossary/build_glossary.py and stored in D1
// (glossary_terms). An analysis request looks here first; only a miss calls Gemini.
//
// Used only when the glossary's sense is the one asked for:
//  - 전공 의미 with an electrical major (the textbooks are electric circuits),
//  - no reference sentence (a reference sentence needs Gemini to read its
//    context and translate it),
//  - the app shows glossary results (X-WC-Glossary: 1, sent by v5.2 and later).
// The example sentence is the textbook's own sentence, so the evidence is the
// textbook page itself; meanings and definitions were written by AI when the
// glossary was built, and the evidence note says so.
import {RAG_CATALOG} from './rag-catalog.mjs';
import {ELECTRICAL_FIELD, EVIDENCE_VERSION} from './rag.mjs';

export const GLOSSARY_MODEL = 'textbook-glossary';
const GLOSSARY_NOTE = '이 단어는 교재 단어집에서 바로 찾았어요. 예문은 교재 원문이고, 뜻·정의·해석은 단어집을 만들 때 AI가 정리한 내용이에요.';

// Same rule as lookup_key() in glossary/build_glossary.py (checked by its tests).
export function glossaryKey(text) {
  return String(text || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// The typed form first, then simple English singulars (resistors -> resistor).
export function glossaryKeys(word) {
  const key = glossaryKey(word);
  if (!key) return [];
  const keys = [key];
  if (/^[a-z ]+$/.test(key) && key.length > 3) {
    if (key.endsWith('ies')) keys.push(key.slice(0, -3) + 'y');
    if (/(s|x|ch|sh)es$/.test(key)) keys.push(key.slice(0, -2));
    if (key.endsWith('s') && !key.endsWith('ss')) keys.push(key.slice(0, -1));
  }
  return [...new Set(keys)];
}

export function glossaryApplies(input) {
  return Boolean(input.legacy) && !input.autoSubject && input.meaningMode === 'major' &&
    ELECTRICAL_FIELD.test(input.majorField || '') && !String(input.referenceText || '').trim();
}

const text = (value, max) => typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null;

function validEntry(value) {
  if (!value || value.v !== 1) return null;
  const entry = {en: text(value.en, 120), ko: text(value.ko, 200), pos: text(value.pos, 20),
    enDef: text(value.enDef, 600), koDef: text(value.koDef, 600),
    exampleEn: text(value.exampleEn, 300), exampleKo: text(value.exampleKo, 600)};
  if (Object.values(entry).some(field => field === null)) return null;
  const source = RAG_CATALOG.sources.find(item => item.id === value.sourceId);
  if (!source || !Number.isInteger(value.pdfPage) || value.pdfPage < 1 || source.restrictedPdfPages.includes(value.pdfPage)) return null;
  const related = (Array.isArray(value.relatedWords) ? value.relatedWords : [])
    .map(word => ({en: text(word?.en, 120), ko: text(word?.ko, 120)})).filter(word => word.en && word.ko).slice(0, 2);
  return {...entry, relatedWords: related, source, pdfPage: value.pdfPage,
    printedPage: typeof value.printedPage === 'string' && /^\d{1,4}$/.test(value.printedPage) ? value.printedPage : null};
}

// Returns the stored entry for the word, or null (not in the glossary, the
// table does not exist yet, or the stored entry is malformed).
export async function lookupGlossary(input, db) {
  if (!db) return null;
  const keys = glossaryKeys(input.word);
  if (!keys.length) return null;
  try {
    const {results = []} = await db.prepare(
      `SELECT lookup_key, entry_json FROM glossary_terms WHERE lookup_key IN (${keys.map((_, i) => '?' + (i + 1)).join(',')})`)
      .bind(...keys).all();
    for (const key of keys) {
      const row = results.find(item => item.lookup_key === key);
      if (!row) continue;
      try { const entry = validEntry(JSON.parse(row.entry_json)); if (entry) return entry; } catch { /* skip */ }
    }
  } catch { /* no glossary table yet: Gemini analyses the word */ }
  return null;
}

// Response in the same shape as a Gemini analysis for the app.
export function glossaryResponse(entry, input, {withEvidence = false} = {}) {
  const {source} = entry;
  const discipline = String(input.majorField || '').trim().replace(/과$/, '') || RAG_CATALOG.field;
  return {en: entry.en, ko: entry.ko, discipline, pos: entry.pos, enDef: entry.enDef, koDef: entry.koDef,
    exampleEn: entry.exampleEn, exampleKo: entry.exampleKo, exampleSource: 'textbook',
    relatedWords: entry.relatedWords, course: input.selectedSubject, model: GLOSSARY_MODEL, source: 'glossary',
    ...(withEvidence ? {evidence: {version: EVIDENCE_VERSION, status: 'found',
      message: '교재 단어집에서 찾은 단어예요. 예문이 실린 교재 쪽을 확인할 수 있어요.',
      checkedAt: new Date().toISOString(), catalogVersion: RAG_CATALOG.catalogVersion, explanation: null, limitation: '',
      sources: [{sourceId: source.id, title: source.title, author: source.author, edition: source.edition, url: source.url,
        license: source.license, licenseUrl: source.licenseUrl, checkedAt: source.checkedAt,
        quotes: [{text: entry.exampleEn, verified: true, pdfPage: entry.pdfPage, printedPage: entry.printedPage}]}],
      notes: [GLOSSARY_NOTE], cached: true, glossary: true}} : {})};
}
