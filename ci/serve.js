const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
};
const ROOT = path.join(__dirname, '..');

function createServer() {
  return http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const filePath = path.join(ROOT, url === '/' ? 'index.html' : url);
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

module.exports = { createServer };
