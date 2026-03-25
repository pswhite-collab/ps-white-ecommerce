import multer from 'multer';
import fs from 'fs';
import path from 'path';

// ─── Disk Storage (used for multi-field book create/update) ───────────────────
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${file.fieldname}-${unique}-${safeName}`);
  },
});

// ─── Memory Storage (used for single-file upload endpoints) ───────────────────
// These controllers use req.file.buffer for magic-byte detection (fileValidation.js)
const memoryStorage = multer.memoryStorage();

// ─── MIME Type Groups ─────────────────────────────────────────────────────────
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const EBOOK_MIME_TYPES = [
  'application/epub+zip',
  'application/pdf',
  'application/zip',
  'application/octet-stream',
];
const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
];

// ─── Uploader Factories ───────────────────────────────────────────────────────
const createMemoryUploader = ({ maxSize, allowedMimeTypes }) =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      const isAllowed = allowedMimeTypes.some((type) => file.mimetype === type);
      if (!isAllowed) {
        const err = new Error(`Unsupported file type: ${file.mimetype}`);
        err.statusCode = 400;
        return cb(err);
      }
      return cb(null, true);
    },
  });

const createDiskUploader = ({ maxSize, allowedMimeTypes }) =>
  multer({
    storage: diskStorage,
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      const isAllowed = allowedMimeTypes.some((type) => file.mimetype === type);
      if (!isAllowed) {
        const err = new Error(`Unsupported file type: ${file.mimetype}`);
        err.statusCode = 400;
        return cb(err);
      }
      return cb(null, true);
    },
  });

// ─── Named Single-File Uploaders (memory — for dedicated upload routes) ───────
export const uploadCover = createMemoryUploader({
  maxSize: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: IMAGE_MIME_TYPES,
}).single('file');

export const uploadEbook = createMemoryUploader({
  maxSize: 50 * 1024 * 1024, // 50 MB
  allowedMimeTypes: EBOOK_MIME_TYPES,
}).single('file');

export const uploadAudio = createMemoryUploader({
  maxSize: 500 * 1024 * 1024, // 500 MB
  allowedMimeTypes: AUDIO_MIME_TYPES,
}).single('file');

// ─── Multi-Field Uploader (disk — for book create/update) ─────────────────────
const bookFilesUploader = createDiskUploader({
  maxSize: 500 * 1024 * 1024,
  allowedMimeTypes: [...IMAGE_MIME_TYPES, ...EBOOK_MIME_TYPES, ...AUDIO_MIME_TYPES],
});

export const uploadBookFiles = bookFilesUploader.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'epubFile',   maxCount: 1 },
  { name: 'pdfFile',    maxCount: 1 },
  { name: 'audioFile',  maxCount: 1 },
]);

export default bookFilesUploader;
