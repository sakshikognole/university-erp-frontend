/**
 * cloudinaryUpload.js
 *
 * Uploads a file directly from the browser to Cloudinary using an unsigned
 * upload preset.  This avoids routing the binary through the Node backend,
 * which fixes ETIMEDOUT errors when the backend container cannot reach the
 * Cloudinary API (common in Docker Desktop on Windows).
 *
 * Usage:
 *   import { uploadToCloudinary } from '../utils/cloudinaryUpload';
 *   const url = await uploadToCloudinary(file, 'system-announcements');
 *
 * Environment variables required (in root .env, prefixed with VITE_):
 *   VITE_CLOUDINARY_CLOUD_NAME    â-- e.g. bhsipfy8
 *   VITE_CLOUDINARY_UPLOAD_PRESET â-- e.g. erp_unsigned
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a File object to Cloudinary via the unsigned upload API.
 *
 * @param {File}   file        - The File object from an <input type="file">
 * @param {string} folder      - Cloudinary folder to store the file in
 *                               (e.g. 'system-announcements' or 'event-notices')
 * @param {function} [onProgress] - Optional callback(percent: number)
 * @returns {Promise<string>}  - Resolves to the secure Cloudinary URL
 */
export const uploadToCloudinary = (file, folder = 'uploads', onProgress) => {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(
        new Error(
          'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and ' +
          'VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    // For raw files (PDF, DOC, DOCX) Cloudinary needs resource_type=raw in the URL.
    // For images it defaults to 'image'. We auto-detect here.
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch {
          reject(new Error('Unexpected response from Cloudinary.'));
        }
      } else {
        let message = `Cloudinary upload failed (HTTP ${xhr.status}).`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) message = `Cloudinary: ${err.error.message}`;
        } catch { /* ignore */ }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out.'));
    xhr.timeout = 60000; // 60 s

    xhr.send(formData);
  });
};
