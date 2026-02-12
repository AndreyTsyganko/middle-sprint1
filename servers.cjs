const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Проксирование API
app.use('/api/v2', createProxyMiddleware({
  target: 'https://ya-praktikum.tech',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v2': '/api/v2',
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  }
}));

// Раздаём статические файлы из dist (для тестов)
app.use(express.static(path.join(__dirname, 'dist')));
// Также раздаём из корня (для разработки)
app.use(express.static(__dirname));

// Для SPA - все GET запросы отдаём index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/v2')) {
    // Сначала пробуем из dist, потом из корня
    const distPath = path.join(__dirname, 'dist', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    
    res.sendFile(distPath, { root: '.' }, (err) => {
      if (err) {
        res.sendFile(rootPath, { root: '.' });
      }
    });
  } else {
    next();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`Dev сервер запущен: http://localhost:${PORT}`);
  console.log(`Проксирование API на: https://ya-praktikum.tech/api/v2`);
  console.log('='.repeat(50));
});
