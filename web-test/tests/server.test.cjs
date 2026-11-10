const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createServer} = require('../server.cjs');
test('Standalone web server serves the exact demo and blocks repository files', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    let response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /Word Collector · 웹 테스트/);
    for (const name of ['data.js', 'word-export.js', 'csv-export.js', 'demo-data.js', 'demo-editor.js']) {
      response = await fetch(base + '/' + name);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/javascript/);
    }
    response = await fetch(base, {method: 'HEAD'});
    assert.equal(response.status, 200); assert.equal(await response.text(), '');
    for (const name of ['server.cjs', '.env', 'README.md', '..%2fserver.cjs', '%E0%A4%A']) {
      assert.equal((await fetch(base + '/' + name)).status, 404);
    }
    assert.equal((await fetch(base, {method: 'POST', body: '{}'})).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
