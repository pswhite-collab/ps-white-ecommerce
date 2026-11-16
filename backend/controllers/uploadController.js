import cloudinary from '../config/cloudinary.js';
import Book from '../models/Book.js';
import {
  createValidationError,
  detectAudioType,
  detectCoverType,
  detectEbookType,
} from '../utils/fileValidation.js';

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    stream.end(buffer);
  });

const findBook = async (bookId) => Book.findById(bookId);

const deleteCloudinaryAsset = async (
  publicId,
  { resourceType = 'raw', type = 'private' } = {}
) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type,
      invalidate: true,
    });
  } catch (error) {
    console.warn(`Failed to delete Cloudinary asset "${publicId}":`, error.message);
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
      folder: 'books/covers',
      resource_type: 'image',
      format: detectedCoverType === 'jpeg' ? 'jpg' : detectedCoverType,
      transformation: [{ width: 1200, crop: 'limit' }],
    });

    const thumbnail = cloudinary.url(uploaded.public_id, {
      resource_type: 'image',
      width: 420,
      height: 620,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
      secure: true,
    });

    book.coverImage = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      thumbnail,
    };
    await book.save();

    if (previousPublicId && previousPublicId !== uploaded.public_id) {
      await deleteCloudinaryAsset(previousPublicId, {
        resourceType: 'image',
        type: 'upload',
      });
    }

    return res.json({
      success: true,
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        thumbnail,
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
      folder: 'books/ebooks',
      resource_type: 'raw',
      type: 'private',
      format: fileType,
      public_id: `${book._id}-${fileType}-${Date.now()}`,
      use_filename: true,
      unique_filename: false,
    });

    book.formats.ebook.available = true;
    book.formats.ebook.files[fileType] = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      size: uploaded.bytes,
    };
    await book.save();

    if (previousPublicId && previousPublicId !== uploaded.public_id) {
      await deleteCloudinaryAsset(previousPublicId, {
        resourceType: 'raw',
        type: 'private',
      });
    }

    return res.json({
      success: true,
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        size: uploaded.bytes,
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
      folder: 'books/audio',
      resource_type: 'video',
      type: 'private',
      format: detectedAudioType === 'wav' ? 'wav' : detectedAudioType,
      public_id: `${book._id}-audio-${Date.now()}`,
    });

    book.formats.audiobook.available = true;
    book.formats.audiobook.file = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      size: uploaded.bytes,
      duration: uploaded.duration || 0,
    };
    await book.save();

    if (previousPublicId && previousPublicId !== uploaded.public_id) {
      await deleteCloudinaryAsset(previousPublicId, {
        resourceType: 'video',
        type: 'private',
      });
    }

    return res.json({
      success: true,
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        size: uploaded.bytes,
        duration: uploaded.duration || 0,
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
    return { publicId, resourceType: 'image', type: 'upload' };
  }

  if (fileType === 'epub' || fileType === 'pdf') {
    const publicId = book.formats.ebook.files[fileType]?.publicId;
    book.formats.ebook.files[fileType] = undefined;
    return { publicId, resourceType: 'raw', type: 'private' };
  }

  if (fileType === 'audio') {
    const publicId = book.formats.audiobook.file?.publicId;
    book.formats.audiobook.file = undefined;
    return { publicId, resourceType: 'video', type: 'private' };
  }

  return { publicId: null, resourceType: 'raw', type: 'private' };
};

export const deleteFile = async (req, res, next) => {
  try {
    const { id, fileType } = req.params;

    const book = await findBook(id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { publicId, resourceType, type } = clearBookFileRef(book, fileType);
    if (!publicId) {
      return res.status(404).json({ success: false, error: 'File not found for selected type' });
    }

    await deleteCloudinaryAsset(publicId, { resourceType, type });
    await book.save();

    return res.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error) {
    return next(error);
  }
};

