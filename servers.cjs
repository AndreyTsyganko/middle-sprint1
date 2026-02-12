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
  }
}));

// Статические файлы
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(__dirname));

// ✅ ИСПРАВЛЕНО: используем middleware вместо app.get('/*')
app.use((req, res, next) => {
  // Пропускаем API запросы
  if (req.path.startsWith('/api/v2')) {
    return next();
  }
  
  // Отдаём index.html для всех маршрутов (SPA)
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`Dev сервер запущен: http://localhost:${PORT}`);
  console.log(`Проксирование API на: https://ya-praktikum.tech/api/v2`);
  console.log('='.repeat(50));
});
