// Glossary (단어집): terms prepared ahead of time from the registered material
// (textbooks and papers, per field) by glossary/build_glossary.py and stored in
// D1 (glossary_terms, key "field|term"). An analysis request looks here first;
// only a miss calls Gemini.
//
// Used only when the glossary's sense is the one asked for:
//  - 전공 의미 with a major of a registered field (전기공학, 반도체; see rag.mjs),
//  - no reference sentence (a reference sentence needs Gemini to read its
//    context and translate it),
//  - the app shows glossary results (X-WC-Glossary: 1).
// Meanings, definitions and examples were written by AI with the material as
// reference only (never copied). Which material and pages were used is kept in
// the stored entry (references) for the server; the app is never sent the
// material's text, titles or copyright information.
import {EVIDENCE_VERSION, fieldsFor} from './rag.mjs';
import {RAG_CATALOG} from './rag-catalog.mjs';

export const GLOSSARY_MODEL = 'textbook-glossary';
const GLOSSARY_VERSION = 2;
const GLOSSARY_NOTE = '뜻·정의·예문은 등록 자료를 참고해 AI가 정리한 내용이에요.';

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
    fieldsFor(input.majorField).length > 0 && !String(input.referenceText || '').trim();
}

const text = (value, max) => typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null;

function validEntry(value) {
  if (!value || value.v !== GLOSSARY_VERSION || typeof value.field !== 'string') return null;
  const entry = {en: text(value.en, 120), ko: text(value.ko, 200), pos: text(value.pos, 20),
    enDef: text(value.enDef, 600), koDef: text(value.koDef, 600),
    exampleEn: text(value.exampleEn, 300), exampleKo: text(value.exampleKo, 600)};
  if (Object.values(entry).some(field => field === null)) return null;
  const related = (Array.isArray(value.relatedWords) ? value.relatedWords : [])
    .map(word => ({en: text(word?.en, 120), ko: text(word?.ko, 120)})).filter(word => word.en && word.ko).slice(0, 2);
  return {...entry, relatedWords: related, field: value.field};
}

// Returns the stored entry for the word in the fields matching the major, or
// null (not in the glossary, the table does not exist yet, or malformed).
export async function lookupGlossary(input, db) {
  if (!db) return null;
  const keys = fieldsFor(input.majorField).flatMap(field => glossaryKeys(input.word).map(key => field + '|' + key));
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

// Response in the same shape as a Gemini analysis for the app (no material text,
// titles or copyright information).
export function glossaryResponse(entry, input, {withEvidence = false} = {}) {
  const discipline = String(input.majorField || '').trim().replace(/과$/, '') || entry.field;
  return {en: entry.en, ko: entry.ko, discipline, pos: entry.pos, enDef: entry.enDef, koDef: entry.koDef,
    exampleEn: entry.exampleEn, exampleKo: entry.exampleKo,
    relatedWords: entry.relatedWords, course: input.selectedSubject, model: GLOSSARY_MODEL, source: 'glossary',
    ...(withEvidence ? {evidence: {version: EVIDENCE_VERSION, status: 'found',
      message: '등록 자료로 미리 정리한 단어집에서 찾은 단어예요.',
      checkedAt: new Date().toISOString(), catalogVersion: RAG_CATALOG.catalogVersion, explanation: null, limitation: '',
      sources: [], notes: [GLOSSARY_NOTE], cached: true, glossary: true}} : {})};
}
