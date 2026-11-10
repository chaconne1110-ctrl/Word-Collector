const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

function createServer() {
  const root = path.join(__dirname, 'public');
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json'};
  return http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, {Allow: 'GET, HEAD'}); res.end(); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep) || !types[path.extname(file)]) throw new Error('Not found');
      const bytes = await fs.readFile(file);
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] + '; charset=utf-8',
        'Content-Length': bytes.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT는 1~65535의 숫자여야 합니다.');
  const server = createServer();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? '포트가 사용 중입니다. 다른 PORT를 선택해 주세요.' : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log('Word Collector 웹 테스트: http://127.0.0.1:' + port));
}
module.exports = {createServer};
