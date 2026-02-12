const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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

app.use(express.static('.'));
/*
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/v2')) {
    res.sendFile('index.html', { root: '.' });
  } else {
    next();
  }
});
*/


app.get(/(.*)/, (req, res, next) => {
    if (!req.path.startsWith('/api/v2')) {
        res.sendFile('index.html', { root: '.' });
    } else {
        next();
    }
});


app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`Dev сервер запущен: http://localhost:${PORT}`);
  console.log('Проксирование API на: https://ya-praktikum.tech/api/v2');
  console.log('='.repeat(50));
});
