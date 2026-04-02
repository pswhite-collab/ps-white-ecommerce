import fs from 'fs';
import path from 'path';
import { uploadToR2 } from './r2.js';

const inferMimeType = (lowerPath) => {
  if (lowerPath.endsWith('.epub')) return 'application/epub+zip';
  if (lowerPath.endsWith('.pdf')) return 'application/pdf';
  if (lowerPath.endsWith('.mp3')) return 'audio/mpeg';
  if (lowerPath.endsWith('.wav')) return 'audio/wav';
  if (lowerPath.endsWith('.m4a')) return 'audio/x-m4a';
  if (lowerPath.endsWith('.png')) return 'image/png';
  if (lowerPath.endsWith('.webp')) return 'image/webp';
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};

export const uploadFileToStorage = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;

    const lowerPath = localFilePath.toLowerCase();
    const fileName = path.basename(localFilePath);
    const mimeType = inferMimeType(lowerPath);
    const fileBuffer = fs.readFileSync(localFilePath);
    const key = await uploadToR2(fileBuffer, fileName, mimeType, folderName || 'general');

    fs.unlinkSync(localFilePath);

    return {
      url: key,
      publicId: key,
      size: fileBuffer.length,
      duration: 0,
    };
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};
