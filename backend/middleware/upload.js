import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
  }
});

const createUploader = ({ maxSize, allowedMimeTypes }) =>
  multer({
    storage: storage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (_req, file, cb) => {
      const isAllowed = allowedMimeTypes.some((type) => file.mimetype === type);
      if (!isAllowed) {
        const error = new Error(`Unsupported file type: ${file.mimetype}`);
        error.statusCode = 400;
        cb(error);
        return;
      }
      cb(null, true);
    },
  });

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

export const uploadCover = createUploader({
  maxSize: 10 * 1024 * 1024,
  allowedMimeTypes: IMAGE_MIME_TYPES,
}).single('file');

export const uploadEbook = createUploader({
  maxSize: 50 * 1024 * 1024,
  allowedMimeTypes: EBOOK_MIME_TYPES,
}).single('file');

export const uploadAudio = createUploader({
  maxSize: 500 * 1024 * 1024,
  allowedMimeTypes: AUDIO_MIME_TYPES,
}).single('file');

const upload = createUploader({
  maxSize: 500 * 1024 * 1024, // 500MB global max to accommodate audio
  allowedMimeTypes: [...IMAGE_MIME_TYPES, ...EBOOK_MIME_TYPES, ...AUDIO_MIME_TYPES],
});

export const uploadBookFiles = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'epubFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 },
]);

export default upload;
