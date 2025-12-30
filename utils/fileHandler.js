// backend/utils/fileHandler.js
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Upload file to Cloudinary
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'gallery',
      ...options
    });
    
    // Remove the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId, resource_type = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resource_type === 'video' ? 'video' : 'image'
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url) return null;
  
  // For Cloudinary URLs
  const cloudinaryRegex = /cloudinary\.com\/.*\/upload\/.*\/([^\/]+)\.(jpg|png|jpeg|gif|mp4|avi|mov|wmv|flv|mkv|webm)/;
  const match = url.match(cloudinaryRegex);
  
  if (match) {
    // Remove file extension and decode URL encoded parts
    const parts = match[1].split('.');
    return parts[0];
  }
  
  return null;
};