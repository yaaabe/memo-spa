const path = require('path');                    // ← 先に読み込む
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 
// ここで api/.env を読むようにする

const express = require('express');
const cors = require('cors');

const notesRouter = require('./routes/notes');
const app = express();

// --- ミドルウェアと静的配信 ---
app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, '..', 'public')));

// React の dist を静的配信
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

// --- まずは API を登録 ---
app.get('/api/healthz', (req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});
app.use('/api/notes', notesRouter);

// --- 404 (API向け) ---
app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found' }));

// --- SPA フォールバック（/api 以外すべて index.html を返す）---
// Express v5 / path-to-regexp v6 では '*' や '/*' はNG。
// 正規表現で「/api 以外」をマッチさせます。
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

module.exports = app;
