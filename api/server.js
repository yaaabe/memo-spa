// api/server.js で、listen前に初期化を呼ぶ
const app = require('./src/app');
const { initSchema } = require('./src/db');

const PORT = process.env.PORT || 4000;
initSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`API ready: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('DB init error:', err);
  process.exit(1);
});
