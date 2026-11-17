import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSources, ensureStore, checkSearch, pagesSql, printedPageFromTopLine, sha256, RegisterError} from './register.mjs';

const PDF = Buffer.from('%PDF-1.4 fake textbook');
const source = {id: 'kuphaldt-lec-dc', title: 'Lessons In Electric Circuits, Volume I - DC', license: 'CC BY 4.0',
  edition: 'Fifth Edition', sha256: sha256(PDF)};
const store = {name: 'fileSearchStores/word-collector-electrical-v1-abc'};
const meta = (id, hash) => [{key: 'source_id', stringValue: id}, {key: 'sha256', stringValue: hash}];

function fakeAi({docs = [], operation = {done: true}, uploadError, afterUpload = 'STATE_ACTIVE', stores = [], query} = {}) {
  const calls = {uploads: [], deletes: [], creates: []};
  const pager = items => (async function* () { yield* items; })();
  const ai = {calls,
    fileSearchStores: {
      list: () => pager(stores),
      create: async ({config}) => { calls.creates.push(config); return {name: 'fileSearchStores/new', displayName: config.displayName}; },
      get: async () => ({activeDocumentsCount: '2', pendingDocumentsCount: '0', failedDocumentsCount: '0'}),
      uploadToFileSearchStore: async params => {
        calls.uploads.push(params);
        if (uploadError) throw new Error(uploadError);
        docs.push({name: store.name + '/documents/new', state: afterUpload, customMetadata: params.config.customMetadata});
        return operation;
      },
      documents: {
        list: () => pager([...docs]),
        delete: async ({name}) => { calls.deletes.push(name); docs = docs.filter(doc => doc.name !== name); }
      }
    },
    operations: {get: async ({operation: op}) => ({...op, done: true})},
    models: {generateContent: async () => query}};
  return ai;
}
const run = (ai, extra = {}) => registerSources({ai, store, sources: [source], readPdf: async () => PDF, log: () => {}, wait: async () => {}, ...extra});

test('an already registered, active file is not uploaded again (duplicate prevention)', async () => {
  const ai = fakeAi({docs: [{name: 'd1', state: 'STATE_ACTIVE', customMetadata: meta(source.id, source.sha256)}]});
  const [result] = await run(ai);
  assert.equal(ai.calls.uploads.length, 0);
  assert.deepEqual([result.uploaded, result.document], [false, 'd1']);
});

test('a new file is uploaded once with source metadata, waited for, and checked ACTIVE', async () => {
  const ai = fakeAi({operation: {done: false, name: 'op1'}});
  const [result] = await run(ai);
  assert.equal(ai.calls.uploads.length, 1);
  const {config} = ai.calls.uploads[0];
  assert.equal(config.displayName, source.title);
  assert.equal(config.mimeType, 'application/pdf');
  assert.deepEqual(config.customMetadata.slice(0, 2), meta(source.id, source.sha256));
  assert.equal(result.uploaded, true);
});

test('a failed earlier copy is deleted and uploaded again', async () => {
  const ai = fakeAi({docs: [{name: 'bad', state: 'STATE_FAILED', customMetadata: meta(source.id, source.sha256)}]});
  await run(ai);
  assert.deepEqual(ai.calls.deletes, ['bad']);
  assert.equal(ai.calls.uploads.length, 1);
});

test('upload failure, indexing error, inactive document and a changed file each report a clear cause', async () => {
  await assert.rejects(run(fakeAi({uploadError: 'PERMISSION_DENIED'})), error => error instanceof RegisterError && error.code === 'UPLOAD_FAILED' && /PERMISSION_DENIED/.test(error.message));
  await assert.rejects(run(fakeAi({operation: {done: true, error: {message: 'unsupported file'}}})), error => error.code === 'UPLOAD_FAILED' && /unsupported file/.test(error.message));
  await assert.rejects(run(fakeAi({afterUpload: 'STATE_FAILED'})), error => error.code === 'INDEX_NOT_ACTIVE');
  await assert.rejects(run(fakeAi(), {readPdf: async () => Buffer.from('other bytes')}), error => error.code === 'SOURCE_CHANGED');
  let clock = 0;
  const slow = fakeAi({operation: {done: false}});
  slow.operations.get = async ({operation}) => operation;
  await assert.rejects(registerSources({ai: slow, store, sources: [source], readPdf: async () => PDF, log: () => {},
    wait: async () => { clock += 5000; }, timeoutMs: 10000, now: () => clock}), error => error.code === 'INDEX_TIMEOUT');
});

test('the store is reused by name, created when missing, and duplicates by name are refused', async () => {
  assert.equal((await ensureStore(fakeAi({stores: [{name: 'fileSearchStores/a', displayName: 'wc'}]}), 'wc', () => {})).name, 'fileSearchStores/a');
  const ai = fakeAi();
  await ensureStore(ai, 'wc', () => {});
  assert.deepEqual(ai.calls.creates, [{displayName: 'wc', embeddingModel: 'models/gemini-embedding-2'}]);
  await assert.rejects(ensureStore(fakeAi({stores: [{name: 'a', displayName: 'wc'}, {name: 'b', displayName: 'wc'}]}), 'wc', () => {}),
    error => error.code === 'STORE_DUPLICATE');
});

test('search readiness needs citations that map to a registered source', async () => {
  const sources = [source, {...source, id: 'kuphaldt-lec-ac'}];
  const ok = await checkSearch({ai: fakeAi({query: {candidates: [{groundingMetadata: {groundingChunks: [
    {retrievedContext: {text: 'Current is...', pageNumber: 31, customMetadata: meta(source.id, source.sha256)}}]}}]}}), store, sources});
  assert.deepEqual(ok.citedSources, [source.id]);
  assert.equal(ok.pageNumbers, true);
  await assert.rejects(checkSearch({ai: fakeAi({query: {candidates: [{groundingMetadata: {groundingChunks: []}}]}}), store, sources}),
    error => error.code === 'NO_CITATIONS');
  const failing = fakeAi();
  failing.models.generateContent = async () => { throw new Error('HTTP 503'); };
  await assert.rejects(checkSearch({ai: failing, store, sources}), error => error.code === 'SEARCH_FAILED');
});

test('page text for quote checks: printed page numbers and SQL with normalised text', () => {
  assert.equal(printedPageFromTopLine('1.4.   VOLTAGE AND CURRENT   21'), '21');
  assert.equal(printedPageFromTopLine('22  CHAPTER 1.   BASIC AC THEORY'), '22');
  assert.equal(printedPageFromTopLine('Contents'), null);
  const sql = pagesSql("kuphaldt-lec-dc", [{pdfPage: 31, printedPage: '21', text: "Electrons' flow is the current."}, {pdfPage: 2, printedPage: null, text: 'ii'}]);
  assert.match(sql, /^DELETE FROM rag_pages WHERE source_id = 'kuphaldt-lec-dc';/);
  assert.match(sql, /VALUES \('kuphaldt-lec-dc', 31, '21', 'electronsflowisthecurrent'\);/);
  assert.match(sql, /VALUES \('kuphaldt-lec-dc', 2, NULL, 'ii'\);/);
});

test('Markdown sources: folder hash (contentSha256), skipped files, one text document per source', async () => {
  const {mkdtemp, mkdir, writeFile} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const pathMod = await import('node:path');
  const {readMarkdownSource} = await import('./register.mjs');
  const dir = await mkdtemp(pathMod.join(tmpdir(), 'md-'));
  await mkdir(pathMod.join(dir, 'book', 'appendix'), {recursive: true});
  await writeFile(pathMod.join(dir, 'book', '05-thin-films.md'), '# Thin films\nAtomic layer deposition grows one layer at a time.\n');
  await writeFile(pathMod.join(dir, 'book', 'appendix', 'further-reading.md'), '- A book, 2020.\n');
  const md = {id: 'semi', title: 'Semiconductor intro', license: 'CC BY-NC-SA 4.0', edition: 'master', format: 'markdown', dir: 'book',
    skipFiles: ['appendix/further-reading.md']};
  const read = await readMarkdownSource(md, dir);
  md.contentSha256 = read.hash;
  assert.equal(read.mimeType, 'text/plain');
  assert.deepEqual(read.pages.map(page => [page.pdfPage, page.printedPage]), [[1, '05-thin-films.md']], 'reading list is not uploaded or used for quotes');
  assert.ok(read.bytes.toString('utf8').includes('Atomic layer deposition'));
  const ai = fakeAi();
  const [result] = await registerSources({ai, store, sources: [md], readPdf: async () => read, log: () => {}, wait: async () => {}});
  assert.equal(result.uploaded, true);
  assert.equal(ai.calls.uploads[0].config.mimeType, 'text/plain');
  assert.equal(ai.calls.uploads[0].config.customMetadata.find(item => item.key === 'sha256').stringValue, read.hash);
  // A changed folder is refused, like a changed PDF.
  await writeFile(pathMod.join(dir, 'book', '05-thin-films.md'), 'changed');
  const changed = await readMarkdownSource(md, dir);
  await assert.rejects(registerSources({ai: fakeAi(), store, sources: [md], readPdf: async () => changed, log: () => {}, wait: async () => {}}),
    error => error.code === 'SOURCE_CHANGED');
  await assert.rejects(readMarkdownSource(md, ''), error => error.code === 'PDF_DIR_REQUIRED');
});

test('sources.json: every registered source has a hash for its format', async () => {
  const {readFile} = await import('node:fs/promises');
  const catalog = JSON.parse(await readFile(new URL('./sources.json', import.meta.url), 'utf8'));
  for (const s of catalog.sources.filter(x => x.register)) {
    if (s.format === 'markdown') assert.match(s.contentSha256 || '', /^[0-9a-f]{64}$/, s.id + ' contentSha256');
    else assert.match(s.sha256 || '', /^[0-9a-f]{64}$/, s.id + ' sha256');
  }
});
