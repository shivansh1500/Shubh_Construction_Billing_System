'use strict';

const cloudinary = require('cloudinary').v2;
const streamifier = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a PDF buffer or local file path to Cloudinary with raw resource_type
 * @param {Buffer|string} localBufferOrPath
 * @param {string} billNumber
 * @returns {Promise<{ url: string, public_id: string }>}
 */
async function uploadPDF(localBufferOrPath, billNumber) {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }

  const safeNumber = String(billNumber || Date.now()).replace(/[^a-zA-Z0-9-_]/g, '_');
  const publicId = `${safeNumber}_${Date.now()}`;
  const folder = 'shubh-construction/bills';

  if (Buffer.isBuffer(localBufferOrPath)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      const readable = new streamifier.Readable();
      readable._read = () => {};
      readable.push(localBufferOrPath);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // If it's a file path string
  const result = await cloudinary.uploader.upload(localBufferOrPath, {
    folder,
    public_id: publicId,
    resource_type: 'raw',
    format: 'pdf',
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder - subfolder name e.g. 'logos' or 'signatures'
 * @returns {Promise<{ url: string, public_id: string }>}
 */
async function uploadImage(fileBuffer, folder = 'uploads') {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const targetFolder = `shubh-construction/${cleanFolder}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    const readable = new streamifier.Readable();
    readable._read = () => {};
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an asset from Cloudinary
 * @param {string} public_id
 * @param {string} [resource_type='image']
 */
async function deleteAsset(public_id, resource_type = 'image') {
  if (!isConfigured() || !public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type });
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete asset ${public_id}:`, err.message);
  }
}

module.exports = {
  isConfigured,
  uploadPDF,
  uploadImage,
  deleteAsset,
};
