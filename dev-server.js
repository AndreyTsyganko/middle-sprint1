const http = require('http');
const _fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

const app = express();
const PORT = 8080;

app.use('/api/v2', createProxyMiddleware({
  target: 'https://ya-praktikum.tech',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v2': '/api/v2',
  },
  secure: false,
  onProxyReq: (proxyReq, _req, _res) => {
    console.log(`[PROXY] ${proxyReq.method} ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, _res) => {
    console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
}));

app.use(express.static('.'));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`API прокси: http://localhost:${PORT}/api/v2 -> https://ya-praktikum.tech/api/v2`);
  console.log('='.repeat(50));
  console.log('Убедись, что в client.ts установлен правильный BASE_URL:');
  console.log(`const BASE_URL = 'http://localhost:${PORT}/api/v2';`);
  console.log('='.repeat(50));
});
