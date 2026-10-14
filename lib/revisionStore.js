// 퇴고 학습 데이터 저장소 — DB 없이 글 한 건당 JSON 파일 하나.
// 로컬 개발: ./data/revisions (gitignore됨)
// 배포(Fly.io): DATA_DIR=/data 환경변수로 볼륨 경로를 가리킴
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const REVISIONS_DIR = path.join(DATA_DIR, 'revisions');

function ensureDir() {
  fs.mkdirSync(REVISIONS_DIR, { recursive: true });
}

function filePath(id) {
  return path.join(REVISIONS_DIR, `${id}.json`);
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function save(record) {
  ensureDir();
  const id = record.id || genId();
  const full = { ...record, id };
  fs.writeFileSync(filePath(id), JSON.stringify(full, null, 2), 'utf-8');
  return full;
}

function list(blogType) {
  ensureDir();
  const files = fs.readdirSync(REVISIONS_DIR).filter((f) => f.endsWith('.json'));
  const records = files
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(REVISIONS_DIR, f), 'utf-8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return blogType ? records.filter((r) => r.blogType === blogType) : records;
}

function get(id) {
  try {
    return JSON.parse(fs.readFileSync(filePath(id), 'utf-8'));
  } catch {
    return null;
  }
}

function update(id, patch) {
  const rec = get(id);
  if (!rec) return null;
  const updated = { ...rec, ...patch };
  fs.writeFileSync(filePath(id), JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

function remove(id) {
  try {
    fs.unlinkSync(filePath(id));
  } catch {
    /* 이미 없으면 무시 */
  }
}

module.exports = { save, list, get, update, remove, ensureDir, REVISIONS_DIR };
