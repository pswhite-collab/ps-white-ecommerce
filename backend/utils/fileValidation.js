const toAscii = (buffer, start = 0, end = 64) => buffer.slice(start, end).toString('ascii');

const startsWithBytes = (buffer, signature) =>
  signature.every((byte, index) => buffer[index] === byte);

const hasAsciiSnippet = (buffer, snippet, maxBytes = 12 * 1024) =>
  buffer.slice(0, maxBytes).toString('ascii').includes(snippet);

export const isPdfBuffer = (buffer) =>
  buffer && buffer.length >= 5 && startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

export const isZipBuffer = (buffer) =>
  buffer &&
  buffer.length >= 4 &&
  (startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08]));

export const isEpubBuffer = (buffer) =>
  Boolean(
    buffer &&
      isZipBuffer(buffer) &&
      (hasAsciiSnippet(buffer, 'mimetypeapplication/epub+zip') ||
        hasAsciiSnippet(buffer, 'META-INF/container.xml'))
  );

export const isJpegBuffer = (buffer) =>
  buffer && buffer.length >= 3 && startsWithBytes(buffer, [0xff, 0xd8, 0xff]);

export const isPngBuffer = (buffer) =>
  buffer &&
  buffer.length >= 8 &&
  startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const isWebpBuffer = (buffer) =>
  buffer &&
  buffer.length >= 12 &&
  toAscii(buffer, 0, 4) === 'RIFF' &&
  toAscii(buffer, 8, 12) === 'WEBP';

export const isWavBuffer = (buffer) =>
  buffer &&
  buffer.length >= 12 &&
  toAscii(buffer, 0, 4) === 'RIFF' &&
  toAscii(buffer, 8, 12) === 'WAVE';

export const isMp3Buffer = (buffer) =>
  Boolean(
    buffer &&
      buffer.length >= 3 &&
      (toAscii(buffer, 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))
  );

export const isM4aBuffer = (buffer) =>
  Boolean(
    buffer &&
      buffer.length >= 16 &&
      toAscii(buffer, 4, 8) === 'ftyp' &&
      ['M4A ', 'M4B ', 'isom', 'mp42', 'mp41'].includes(toAscii(buffer, 8, 12))
  );

export const detectCoverType = (buffer) => {
  if (isJpegBuffer(buffer)) {
    return 'jpeg';
  }
  if (isPngBuffer(buffer)) {
    return 'png';
  }
  if (isWebpBuffer(buffer)) {
    return 'webp';
  }
  return null;
};

export const detectEbookType = (buffer) => {
  if (isPdfBuffer(buffer)) {
    return 'pdf';
  }
  if (isEpubBuffer(buffer)) {
    return 'epub';
  }
  return null;
};

export const detectAudioType = (buffer) => {
  if (isMp3Buffer(buffer)) {
    return 'mp3';
  }
  if (isM4aBuffer(buffer)) {
    return 'm4a';
  }
  if (isWavBuffer(buffer)) {
    return 'wav';
  }
  return null;
};

export const createValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

