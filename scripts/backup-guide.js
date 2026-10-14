#!/usr/bin/env node
// prompts/*.md, *.txt 가이드 파일을 날짜별로 백업한다.
// 사용법:
//   node scripts/backup-guide.js                     전체 백업
//   node scripts/backup-guide.js info-blog-guide.md   특정 파일만 백업
// 가이드 파일을 고치기 전엔 반드시 먼저 실행할 것 (CLAUDE.md 절대 규칙).

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '../prompts');
const BACKUP_DIR = path.join(PROMPTS_DIR, 'backups');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function backupFile(filename) {
  const src = path.join(PROMPTS_DIR, filename);
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
    console.error(`✗ 파일 없음: ${filename}`);
    return;
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const date = todayStr();
  let dest = path.join(BACKUP_DIR, `${base}.${date}${ext}`);
  let n = 2;
  while (fs.existsSync(dest)) {
    dest = path.join(BACKUP_DIR, `${base}.${date}-${n}${ext}`);
    n++;
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ 백업됨: ${path.relative(process.cwd(), dest)}`);
}

const target = process.argv[2];
if (target) {
  backupFile(target);
} else {
  fs.readdirSync(PROMPTS_DIR)
    .filter((f) => (f.endsWith('.md') || f.endsWith('.txt')) && fs.statSync(path.join(PROMPTS_DIR, f)).isFile())
    .forEach(backupFile);
}
