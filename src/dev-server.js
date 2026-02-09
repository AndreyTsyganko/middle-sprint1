
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'GET' && req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'API работает!', 
      time: new Date().toISOString() 
    }));
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { login, password } = JSON.parse(body);
        
        if (login === 'ivanov' && password === 'Password123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token: 'mock-token-123' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ reason: 'Неверный логин или пароль' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reason: 'Некорректный запрос' }));
      }
    });
    return;
  }
  

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  

  if (filePath.endsWith('.ts')) {
    const jsPath = filePath.replace('.ts', '.js');
    if (fs.existsSync(jsPath)) {
      filePath = jsPath;
    }
  }

  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';
  

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {

        if (req.url.startsWith('/api/')) {

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ reason: 'API endpoint not found' }));
        } else {

          fs.readFile('./index.html', (err, html) => {
            if (err) {
              res.writeHead(404);
              res.end('File not found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(html);
            }
          });
        }
      } else {

        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('Dev сервер запущен!');
  console.log(`http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/test`);
  console.log(`Логин: ivanov / Password123`);
  console.log('Для выхода: Ctrl+C');
  console.log('\nУбедись что TypeScript скомпилирован!');
  console.log('Запусти в другом терминале:');
  console.log('npm run build  или  tsc');
});
