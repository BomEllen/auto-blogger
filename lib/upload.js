const multer = require('multer');
const fs = require('fs');
const os = require('os');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, _file, cb) => cb(null, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 100 },
});

function imagePart(file) {
  const data = fs.readFileSync(file.path).toString('base64');
  return { inlineData: { data, mimeType: file.mimetype || 'image/jpeg' } };
}

function cleanupFiles(files) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  for (const f of list) {
    try { fs.unlinkSync(f.path); } catch {}
  }
}

module.exports = { upload, imagePart, cleanupFiles };
