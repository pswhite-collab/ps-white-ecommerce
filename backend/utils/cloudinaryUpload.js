import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;
    
    const lowerPath = localFilePath.toLowerCase();
    let resourceType = 'auto';
    
    if (lowerPath.endsWith('.epub') || lowerPath.endsWith('.pdf')) {
      resourceType = 'raw';
    } else if (lowerPath.endsWith('.mp3') || lowerPath.endsWith('.wav') || lowerPath.endsWith('.m4a')) {
      resourceType = 'video';
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folderName,
      resource_type: resourceType,
    });
    
    fs.unlinkSync(localFilePath);
    
    return {
      url: response.secure_url,
      publicId: response.public_id,
      size: response.bytes,
      duration: response.duration || 0,
    };
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};
