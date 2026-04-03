import Book from '../models/Book.js';
import { generateSecureUrl } from '../utils/generateSignedUrl.js';
import { deleteFromR2, uploadToR2 } from '../utils/r2.js';
import {
  createValidationError,
  detectAudioType,
  detectCoverType,
  detectEbookType,
} from '../utils/fileValidation.js';

const uploadBuffer = async (buffer, { fileName, mimeType, folder }) => {
  const key = await uploadToR2(buffer, fileName, mimeType, folder);
  return {
    key,
    size: buffer.length,
    duration: 0,
  };
};

const findBook = async (bookId) => Book.findById(bookId);

const deleteStoredAsset = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    await deleteFromR2(publicId);
  } catch (error) {
    console.warn(`Failed to delete R2 asset "${publicId}":`, error.message);
  }
};

const ensureFile = (file, label) => {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw createValidationError(`${label} file is required`);
  }
};

const normalizeRequestedEbookType = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) {
    return '';
  }
  if (!['epub', 'pdf'].includes(normalized)) {
    throw createValidationError('fileType must be epub or pdf');
  }
  return normalized;
};

const serializeCoverAssetUrl = async (value) => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue || /^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return generateSecureUrl(normalizedValue, { expiresIn: 3600 });
};

export const uploadBookCover = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureFile(req.file, 'Cover image');

    const detectedCoverType = detectCoverType(req.file.buffer);
    if (!detectedCoverType) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid cover image file. Allowed: JPG, PNG, WEBP.' });
    }

    const book = await findBook(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const previousPublicId = book.coverImage?.publicId;

    const uploaded = await uploadBuffer(req.file.buffer, {
      fileName: `cover.${detectedCoverType === 'jpeg' ? 'jpg' : detectedCoverType}`,
      mimeType: req.file.mimetype || `image/${detectedCoverType}`,
      folder: 'books/covers',
    });

    const thumbnail = uploaded.key;

    book.coverImage = {
      url: uploaded.key,
      publicId: uploaded.key,
      thumbnail,
    };
    await book.save();

    if (previousPublicId && previousPublicId !== uploaded.key) {
      await deleteStoredAsset(previousPublicId);
    }

    const signedUrl = await serializeCoverAssetUrl(uploaded.key);
    const signedThumbnail = await serializeCoverAssetUrl(thumbnail);

    return res.json({
      success: true,
      data: {
        url: signedUrl || uploaded.key,
        publicId: uploaded.key,
        thumbnail: signedThumbnail || thumbnail,
        detectedType: detectedCoverType,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadEbookFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureFile(req.file, 'Ebook');

    const requestedType = normalizeRequestedEbookType(req.body.fileType || req.query.fileType);
    const detectedType = detectEbookType(req.file.buffer);

    if (!detectedType) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid ebook file. Allowed: EPUB, PDF.' });
    }

    const fileType = requestedType || detectedType;
    if (requestedType && requestedType !== detectedType) {
      return res.status(400).json({
        success: false,
        error: `fileType mismatch. Received "${requestedType}", but uploaded file looks like "${detectedType}".`,
      });
    }

    const book = await findBook(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const previousPublicId = book.formats?.ebook?.files?.[fileType]?.publicId;

    const uploaded = await uploadBuffer(req.file.buffer, {
      fileName: `${book._id}-${fileType}-${Date.now()}.${fileType}`,
      mimeType:
        fileType === 'epub'
          ? 'application/epub+zip'
          : 'application/pdf',
      folder: 'books/ebooks',
    });

    book.formats.ebook.available = true;
    book.formats.ebook.files[fileType] = {
      url: uploaded.key,
      publicId: uploaded.key,
      size: uploaded.size,
    };
    await book.save();

    if (previousPublicId && previousPublicId !== uploaded.key) {
      await deleteStoredAsset(previousPublicId);
    }

    return res.json({
      success: true,
      data: {
        url: uploaded.key,
        publicId: uploaded.key,
        size: uploaded.size,
        fileType,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadAudiobook = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureFile(req.file, 'Audio');

    const detectedAudioType = detectAudioType(req.file.buffer);
    if (!detectedAudioType) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio file. Allowed: MP3, M4A, WAV.',
      });
    }

    const book = await findBook(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const previousPublicId = book.formats?.audiobook?.file?.publicId;

    const uploaded = await uploadBuffer(req.file.buffer, {
      fileName: `${book._id}-audio-${Date.now()}.${detectedAudioType}`,
      mimeType: req.file.mimetype || 'audio/mpeg',
      folder: 'books/audio',
    });

    book.formats.audiobook.available = true;
    book.formats.audiobook.file = {
      url: uploaded.key,
      publicId: uploaded.key,
      size: uploaded.size,
      duration: 0,
    };
    await book.save();

    if (previousPublicId && previousPublicId !== uploaded.key) {
      await deleteStoredAsset(previousPublicId);
    }

    return res.json({
      success: true,
      data: {
        url: uploaded.key,
        publicId: uploaded.key,
        size: uploaded.size,
        duration: 0,
        fileType: detectedAudioType,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const clearBookFileRef = (book, fileType) => {
  if (fileType === 'cover') {
    const publicId = book.coverImage?.publicId;
    book.coverImage = undefined;
    return { publicId };
  }

  if (fileType === 'epub' || fileType === 'pdf') {
    const publicId = book.formats.ebook.files[fileType]?.publicId;
    book.formats.ebook.files[fileType] = undefined;
    return { publicId };
  }

  if (fileType === 'audio') {
    const publicId = book.formats.audiobook.file?.publicId;
    book.formats.audiobook.file = undefined;
    return { publicId };
  }

  return { publicId: null };
};

export const deleteFile = async (req, res, next) => {
  try {
    const { id, fileType } = req.params;

    const book = await findBook(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { publicId } = clearBookFileRef(book, fileType);
    if (!publicId) {
      return res.status(404).json({ success: false, error: 'File not found for selected type' });
    }

    await deleteStoredAsset(publicId);
    await book.save();

    return res.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error) {
    return next(error);
  }
};
