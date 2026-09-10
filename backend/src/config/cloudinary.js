const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Robustly extract Cloudinary public ID from a URL or raw public ID string.
 * Example URLs:
 * https://res.cloudinary.com/pddxfqxe/image/upload/v1726000000/ecom_products/sample.jpg -> "ecom_products/sample"
 * https://res.cloudinary.com/pddxfqxe/image/upload/ecom_products/sample.jpg -> "ecom_products/sample"
 */
function extractPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  // If already a public ID without http/https
  if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://')) {
    // Strip file extension if present
    return urlOrId.replace(/\.[^/.]+$/, '');
  }

  // Must be a Cloudinary URL to delete from Cloudinary
  if (!urlOrId.includes('res.cloudinary.com')) {
    return null;
  }

  const cleanUrl = urlOrId.split('?')[0];
  // Match path after /upload/ (skipping optional v123456789/ version) up to file extension
  const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Upload an image file or buffer to Cloudinary
 */
async function uploadImage(filePathOrBuffer, options = {}) {
  const uploadOptions = {
    folder: 'ecom_products',
    resource_type: 'auto',
    ...options
  };
  return await cloudinary.uploader.upload(filePathOrBuffer, uploadOptions);
}

/**
 * Delete a single asset from Cloudinary storage by URL or public ID
 */
async function deleteImage(publicIdOrUrl) {
  if (!publicIdOrUrl) return null;
  const publicId = extractPublicId(publicIdOrUrl);
  if (!publicId) return null;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary asset deleted [${publicId}]:`, result);
    return result;
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset [${publicId}]:`, err.message);
    return null;
  }
}

/**
 * Delete multiple assets from Cloudinary storage
 */
async function deleteImages(urlsOrIds = []) {
  if (!Array.isArray(urlsOrIds) || urlsOrIds.length === 0) return [];
  const results = await Promise.all(
    urlsOrIds.map(item => deleteImage(item))
  );
  return results;
}

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  deleteImages,
  extractPublicId
};
