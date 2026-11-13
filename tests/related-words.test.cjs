const test = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
const fs = require('node:fs');
const {createServer} = require('../server/server.cjs');

const base = {
  englishTerm:'capacitor', koreanMeaning:'축전기', specialization:'전기공학', notebookName:'전기',
  englishDefinition:'A device that stores charge.', koreanDefinition:'전하를 저장하는 장치.',
  exampleSentence:'The capacitor stores charge.', exampleKo:'축전기는 전하를 저장한다.', pos:'noun',
  explanation:'전하 저장 소자.', recommendationReason:'문맥 기준', relatedTerms:[]
};
const body = {term:'capacitor', context:'', course:'전기', autoCourse:false, notebooks:[{course:'전기',words:[]}]};
const token = 'wc_' + 'a'.repeat(64);

for (const target of ['server', 'worker']) {
  test(`${target}: analysis returns exactly two related words for the flashcard`, async t => {
    let generated, sent;
    const upstream = async (_, options) => {
      sent = JSON.parse(options.body);
      return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(generated)}]}}]}));
    };
    let send;
    if (target === 'server') {
      const server = createServer({apiKey:'test-only', fetchImpl:upstream});
      server.listen(0, '127.0.0.1'); await once(server, 'listening');
      t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
      send = payload => fetch(`http://127.0.0.1:${server.address().port}/api/analyze`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    } else {
      const worker = (await import('../cloudflare/worker.mjs')).default;
      const original = globalThis.fetch;
      globalThis.fetch = upstream; t.after(() => { globalThis.fetch = original; });
      const env = {GEMINI_API_KEY:'test-only', ENABLE_LIVE_ANALYSIS:'true', DB:{
        prepare(sql) { return {bind(){ return this; }, async first(){
          return sql.includes('FROM testers') ? {tester_id:'test', is_active:1} : {request_count:0};
        }, async run(){ return {success:true}; }}; },
        async batch(){ return [{success:true,meta:{changes:1}},{success:true,meta:{changes:1}}]; }
      }};
      send = payload => worker.fetch(new Request('https://test/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer ' + token},
        body:JSON.stringify(payload)}), env);
    }

    generated = {...base, relatedWords:[
      {englishTerm:'capacitance', koreanMeaning:'정전용량'},
      {englishTerm:'dielectric', koreanMeaning:'유전체'}]};
    let res = await send(body), data = await res.json();
    assert.equal(res.status, 200, JSON.stringify(data));
    const schema = sent.generationConfig.responseSchema;
    assert.ok(schema.required.includes('relatedWords'));
    assert.equal(schema.properties.relatedWords.minItems, 2);
    assert.equal(schema.properties.relatedWords.maxItems, 2);
    assert.deepEqual(data.relatedWords, [{en:'capacitance', ko:'정전용량'}, {en:'dielectric', ko:'유전체'}]);

    // The word itself, duplicates and bad entries are dropped; never an error.
    generated = {...base, relatedWords:[{englishTerm:'Capacitor', koreanMeaning:'축전기'},
      {englishTerm:'inductor', koreanMeaning:'인덕터'}, {englishTerm:'Inductor', koreanMeaning:'x'}, 7]};
    res = await send(body); data = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(data.relatedWords, [{en:'inductor', ko:'인덕터'}]);

    generated = {...base};
    res = await send(body); data = await res.json();
    assert.equal(res.status, 200, 'missing related words do not fail the analysis');
    assert.deepEqual(data.relatedWords, []);
  });
}

test('flashcard shows "관련 단어" instead of the formula box; review lets the user edit them', () => {
  const card = fs.readFileSync('www/flashcard.html', 'utf8');
  assert.doesNotMatch(card, /data-field="formula"/);
  assert.equal((card.match(/data-field="related"/g) || []).length, 6);
  assert.match(card, />관련 단어</);
  const app = fs.readFileSync('www/app.js', 'utf8');
  assert.match(app, /related: typeof term\.related === 'string'/);
  assert.match(app, /box\.hidden = !related/);
  const review = fs.readFileSync('www/quick_capture/analysis.js', 'utf8');
  assert.match(review, /related: '관련 단어'/);
  assert.match(review, /result\.related = Array\.isArray\(result\.relatedWords\)/);
});
