const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const VIDEO_DIR = path.join(__dirname, '..', '..', 'uploads', 'videos');
const THUMB_DIR = path.join(__dirname, '..', '..', 'uploads', 'thumbnails');

[VIDEO_DIR, THUMB_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_VIDEO_EXT = ['.mp4', '.webm', '.mov'];
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

const MAX_VIDEO_BYTES = (Number(process.env.MAX_VIDEO_SIZE_MB) || 200) * 1024 * 1024;
const MAX_THUMB_BYTES = (Number(process.env.MAX_THUMBNAIL_SIZE_MB) || 5) * 1024 * 1024;

function safeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const unique = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}-${unique}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') return cb(null, VIDEO_DIR);
    if (file.fieldname === 'thumbnail') return cb(null, THUMB_DIR);
    cb(new Error('Unexpected field'), null);
  },
  filename: (req, file, cb) => cb(null, safeFilename(file.originalname))
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'video') {
    if (!ALLOWED_VIDEO_MIME.includes(file.mimetype) || !ALLOWED_VIDEO_EXT.includes(ext)) {
      return cb(new Error('Invalid video file. Allowed formats: MP4, WebM, MOV'));
    }
    return cb(null, true);
  }

  if (file.fieldname === 'thumbnail') {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype) || !ALLOWED_IMAGE_EXT.includes(ext)) {
      return cb(new Error('Invalid thumbnail file. Allowed formats: JPG, PNG, WebP'));
    }
    return cb(null, true);
  }

  cb(new Error('Unexpected field'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(MAX_VIDEO_BYTES, MAX_THUMB_BYTES)
  }
});

// Per-field size enforcement (multer's `limits.fileSize` is global, so we
// double-check the actual size per field after upload in the controller too).
const uploadVideoFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

module.exports = {
  uploadVideoFields,
  VIDEO_DIR,
  THUMB_DIR,
  MAX_VIDEO_BYTES,
  MAX_THUMB_BYTES
};
