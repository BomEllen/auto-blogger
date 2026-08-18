require('dotenv').config();
const express = require('express');
const path = require('path');
const { GEMINI_MODEL } = require('./lib/ai');

console.log(`[config] Gemini 모델: ${GEMINI_MODEL}`);

const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`[${req.method}] ${req.path}`);
  next();
});

app.use('/api', require('./routes/review-blog'));
app.use('/api', require('./routes/info-blog'));
app.use('/api', require('./routes/title-gen'));
app.use('/api', require('./routes/image-gen'));

app.use(express.static(path.join(__dirname, 'public')));

const PORT = parseInt(process.env.PORT || '4000');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n찍기만 해! 서버: http://localhost:${PORT}\n`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n포트 ${PORT}가 이미 사용 중입니다. PORT=4001 node server.js 로 시도해보세요.\n`);
  } else {
    throw err;
  }
  process.exit(1);
});
