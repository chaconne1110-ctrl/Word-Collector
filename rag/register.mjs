#!/usr/bin/env node
// Registers the textbooks in rag/sources.json in a Gemini File Search store and
// prepares the page text used to check quotes. Admin-only; run when setting up
// or when a source changes. Users' word analyses never upload anything.
//
//   cd rag && npm install
//   GEMINI_API_KEY=... node register.mjs [--pdf-dir DIR] [--d1] [--check-only]
//
// See rag/README.md. The API key is read from the environment and never printed.
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeForMatch} from '../cloudflare/rag.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EMBEDDING_MODEL = 'models/gemini-embedding-2';
const CHECK_MODEL = 'gemini-4-hydrogen';
const INDEX_TIMEOUT_MS = 20 * 60 * 1000;
const POLL_MS = 5000;

export class RegisterError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const metaValue = (doc, key) => (doc.customMetadata || []).find(item => item.key === key)?.stringValue;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function collect(pager) {
  const items = [];
  for await (const item of await pager) items.push(item);
  return items;
}

export async function ensureStore(ai, displayName, log) {
  const stores = await collect(ai.fileSearchStores.list());
  const existing = stores.filter(store => store.displayName === displayName);
  if (existing.length > 1) throw new RegisterError('STORE_DUPLICATE', `"${displayName}" 이름의 저장소가 ${existing.length}개입니다. 하나만 남겨 주세요: ${existing.map(s => s.name).join(', ')}`);
  if (existing.length) { log(`저장소 사용: ${existing[0].name}`); return existing[0]; }
  const store = await ai.fileSearchStores.create({config: {displayName, embeddingModel: EMBEDDING_MODEL}});
  log(`저장소 생성: ${store.name}`);
  return store;
}

async function waitForOperation(ai, operation, label, {wait = sleep, timeoutMs = INDEX_TIMEOUT_MS, now = Date.now} = {}) {
  const deadline = now() + timeoutMs;
  while (!operation.done) {
    if (now() > deadline) throw new RegisterError('INDEX_TIMEOUT', `${label}: ${Math.round(timeoutMs / 60000)}분 안에 색인이 끝나지 않았습니다. 잠시 후 --check-only로 상태를 확인하세요.`);
    await wait(POLL_MS);
    operation = await ai.operations.get({operation});
  }
  if (operation.error) {
    throw new RegisterError('UPLOAD_FAILED', `${label}: ${operation.error.message || JSON.stringify(operation.error)}`);
  }
  return operation;
}

// Uploads each source once. A document whose sha256 matches and is ACTIVE is
// skipped (no duplicates); FAILED copies are removed and uploaded again.
export async function registerSources({ai, store, sources, readPdf, log, wait, timeoutMs, now}) {
  const results = [];
  for (const source of sources) {
    const bytes = await readPdf(source);
    const hash = sha256(bytes);
    if (hash !== source.sha256) {
      throw new RegisterError('SOURCE_CHANGED', `${source.id}: 파일 해시가 sources.json과 다릅니다 (${hash}). 원문이 바뀌었으면 라이선스를 다시 확인한 뒤 sources.json을 갱신하세요.`);
    }
    let docs = await collect(ai.fileSearchStores.documents.list({parent: store.name}));
    const same = docs.filter(doc => metaValue(doc, 'sha256') === hash);
    for (const doc of same.filter(doc => doc.state === 'STATE_FAILED')) {
      log(`${source.id}: 실패한 이전 등록 삭제 ${doc.name}`);
      await ai.fileSearchStores.documents.delete({name: doc.name, config: {force: true}});
    }
    const ready = same.find(doc => doc.state === 'STATE_ACTIVE');
    if (ready) {
      log(`${source.id}: 이미 등록됨 (${ready.name}) - 업로드 생략`);
      results.push({sourceId: source.id, sha256: hash, document: ready.name, state: ready.state, uploaded: false});
      continue;
    }
    if (same.some(doc => doc.state === 'STATE_PENDING')) {
      throw new RegisterError('STILL_INDEXING', `${source.id}: 같은 파일의 색인이 아직 진행 중입니다. 잠시 후 다시 실행하세요.`);
    }
    log(`${source.id}: 업로드 및 색인 시작 (${(bytes.length / 1048576).toFixed(1)} MB)`);
    let operation;
    try {
      operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: new Blob([bytes], {type: 'application/pdf'}), fileSearchStoreName: store.name,
        config: {displayName: source.title, mimeType: 'application/pdf', customMetadata: [
          {key: 'source_id', stringValue: source.id}, {key: 'sha256', stringValue: hash},
          {key: 'license', stringValue: source.license}, {key: 'edition', stringValue: source.edition}]}});
    } catch (error) {
      throw new RegisterError('UPLOAD_FAILED', `${source.id}: ${error?.message || error}`);
    }
    await waitForOperation(ai, operation, source.id, {wait, timeoutMs, now});
    docs = await collect(ai.fileSearchStores.documents.list({parent: store.name}));
    const active = docs.find(doc => metaValue(doc, 'sha256') === hash && doc.state === 'STATE_ACTIVE');
    if (!active) {
      const failed = docs.find(doc => metaValue(doc, 'sha256') === hash);
      throw new RegisterError('INDEX_NOT_ACTIVE', `${source.id}: 업로드 후 문서 상태가 ${failed?.state || '없음'}입니다.`);
    }
    for (const old of docs.filter(doc => metaValue(doc, 'source_id') === source.id && metaValue(doc, 'sha256') !== hash)) {
      log(`${source.id}: 이전 버전 문서가 남아 있습니다 (${old.name}). 확인 후 삭제하세요.`);
    }
    log(`${source.id}: 등록 완료 (${active.name})`);
    results.push({sourceId: source.id, sha256: hash, document: active.name, state: active.state, uploaded: true});
  }
  return results;
}

// Search readiness: a real File Search query must return citations that map to
// a registered source (custom metadata source_id).
export async function checkSearch({ai, store, sources, question = 'What is electric current?'}) {
  const fetched = await ai.fileSearchStores.get({name: store.name});
  const counts = {active: Number(fetched.activeDocumentsCount || 0), pending: Number(fetched.pendingDocumentsCount || 0),
    failed: Number(fetched.failedDocumentsCount || 0)};
  if (counts.failed) throw new RegisterError('STORE_HAS_FAILED_DOCUMENTS', `색인 실패 문서 ${counts.failed}개가 있습니다.`);
  if (counts.active < sources.length) throw new RegisterError('NOT_READY', `활성 문서 ${counts.active}개 / 필요 ${sources.length}개 (대기 ${counts.pending}개)`);
  let response;
  try {
    response = await ai.models.generateContent({model: CHECK_MODEL, contents: question,
      config: {tools: [{fileSearch: {fileSearchStoreNames: [store.name]}}]}});
  } catch (error) {
    throw new RegisterError('SEARCH_FAILED', `시험 검색 실패: ${error?.message || error}`);
  }
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const ids = new Set(sources.map(source => source.id));
  const cited = chunks.map(chunk => chunk.retrievedContext).filter(Boolean)
    .map(context => (context.customMetadata || []).find(item => item.key === 'source_id')?.stringValue)
    .filter(id => ids.has(id));
  if (!cited.length) throw new RegisterError('NO_CITATIONS', '시험 검색에서 등록 자료 인용이 반환되지 않았습니다.');
  const pageNumbers = chunks.some(chunk => chunk.retrievedContext?.pageNumber);
  return {counts, citedSources: [...new Set(cited)], chunkCount: chunks.length, pageNumbers};
}

// Printed page number from the page's top line ("1.4. VOLTAGE AND CURRENT 21"
// or "12 CHAPTER 1. BASIC AC THEORY"); null when there is none.
export function printedPageFromTopLine(line) {
  const text = String(line || '').trim();
  const match = /^(\d{1,4})\s+\S/.exec(text) || /\S\s+(\d{1,4})$/.exec(text);
  return match ? match[1] : null;
}

export function pagesSql(sourceId, pages) {
  const quote = value => "'" + String(value).replace(/'/g, "''") + "'";
  const lines = [`DELETE FROM rag_pages WHERE source_id = ${quote(sourceId)};`];
  for (const page of pages) {
    lines.push(`INSERT INTO rag_pages (source_id, pdf_page, printed_page, norm_text) VALUES (${quote(sourceId)}, ${page.pdfPage}, ${page.printedPage == null ? 'NULL' : quote(page.printedPage)}, ${quote(normalizeForMatch(page.text))});`);
  }
  return lines.join('\n') + '\n';
}

async function extractPages(bytes) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({data: new Uint8Array(bytes), isEvalSupported: false, disableFontFace: true}).promise;
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    const items = content.items.filter(item => typeof item.str === 'string');
    const top = Math.max(...items.map(item => item.transform[5]), -Infinity);
    const topLine = items.filter(item => Math.abs(item.transform[5] - top) < 2)
      .sort((a, b) => a.transform[4] - b.transform[4]).map(item => item.str).join(' ');
    pages.push({pdfPage: number, printedPage: printedPageFromTopLine(topLine), text: items.map(item => item.str).join(' ')});
  }
  return pages;
}

async function main(argv) {
  const args = new Set(argv.filter(arg => arg.startsWith('--')));
  const pdfDirIndex = argv.indexOf('--pdf-dir');
  const pdfDir = pdfDirIndex >= 0 ? argv[pdfDirIndex + 1] : '';
  const log = message => console.log(message);
  if (!process.env.GEMINI_API_KEY) {
    throw new RegisterError('NO_API_KEY', 'GEMINI_API_KEY 환경변수가 없습니다. Worker와 같은 프로젝트의 키를 설정하세요 (키 값은 출력하지 않습니다).');
  }
  const catalog = JSON.parse(await readFile(path.join(HERE, 'sources.json'), 'utf8'));
  const sources = catalog.sources.filter(source => source.register);
  const {GoogleGenAI} = await import('@google/genai');
  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  const cache = new Map();
  const readPdf = async source => {
    if (cache.has(source.id)) return cache.get(source.id);
    let bytes;
    if (pdfDir || source.file) {
      // Papers are not downloaded: they are read from the folder (source.file).
      if (!pdfDir) throw new RegisterError('PDF_DIR_REQUIRED', `${source.id}: --pdf-dir 폴더에 ${source.file} 파일이 필요합니다.`);
      bytes = await readFile(path.join(pdfDir, source.file || path.basename(new URL(source.url).pathname)));
    } else {
      log(`${source.id}: 다운로드 ${source.url}`);
      const response = await fetch(source.url, {signal: AbortSignal.timeout(180000)});
      if (!response.ok) throw new RegisterError('DOWNLOAD_FAILED', `${source.id}: HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    cache.set(source.id, bytes);
    return bytes;
  };

  const store = await ensureStore(ai, catalog.storeDisplayName, log);
  const documents = args.has('--check-only') ? [] : await registerSources({ai, store, sources, readPdf, log});
  const check = await checkSearch({ai, store, sources});
  log(`검색 준비 완료: 활성 문서 ${check.counts.active}개, 시험 검색 인용 ${check.chunkCount}건 (${check.citedSources.join(', ')}), API 쪽수 정보 ${check.pageNumbers ? '있음' : '없음'}`);

  if (!args.has('--check-only')) {
    await mkdir(path.join(HERE, 'out'), {recursive: true});
    const sqlFile = path.join(HERE, 'out', 'rag-pages.sql');
    let sql = '';
    for (const source of sources) {
      const pages = await extractPages(await readPdf(source));
      if (pages.length !== source.pdfPages) log(`${source.id}: 경고 - 쪽 수 ${pages.length} (sources.json ${source.pdfPages})`);
      sql += pagesSql(source.id, pages);
      log(`${source.id}: 쪽별 원문 텍스트 ${pages.length}쪽 준비`);
    }
    await writeFile(sqlFile, sql);
    await writeFile(path.join(HERE, 'registry.json'), JSON.stringify({storeName: store.name,
      storeDisplayName: catalog.storeDisplayName, registeredAt: new Date().toISOString(), documents}, null, 2) + '\n');
    if (args.has('--d1')) {
      const run = spawnSync('npx', ['-y', 'wrangler@4', 'd1', 'execute', 'word-collector-db', '--remote', '--file', sqlFile],
        {stdio: 'inherit', shell: process.platform === 'win32'});
      if (run.status !== 0) throw new RegisterError('D1_IMPORT_FAILED', '쪽별 원문 텍스트를 D1에 넣지 못했습니다. 0005 마이그레이션 적용과 wrangler 로그인을 확인하세요.');
      log('D1 쪽별 원문 텍스트 등록 완료');
    } else {
      log(`D1 등록 명령: npx wrangler d1 execute word-collector-db --remote --file ${sqlFile}`);
    }
  }
  log(`Worker 설정값 RAG_FILE_SEARCH_STORE = ${store.name}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error instanceof RegisterError ? error.message : `UNEXPECTED: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
