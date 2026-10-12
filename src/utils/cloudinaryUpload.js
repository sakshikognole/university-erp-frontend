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
 *   const url = await uploadToCloudinary(file, 'event-notices');
 *
 * Environment variables required (in root .env, prefixed with VITE_):
 *   VITE_CLOUDINARY_CLOUD_NAME    — your Cloudinary cloud name (e.g. bhsipfy8)
 *   VITE_CLOUDINARY_UPLOAD_PRESET — an UNSIGNED upload preset name (e.g. erp_unsigned)
 *
 * How to create an unsigned upload preset (one-time Cloudinary dashboard step):
 *   1. Log in to https://cloudinary.com/console
 *   2. Go to Settings → Upload → Upload presets → Add upload preset
 *   3. Set "Signing mode" to Unsigned
 *   4. Copy the preset name and paste it into .env as VITE_CLOUDINARY_UPLOAD_PRESET
 *
 * For local dev these variables are read from the root .env file because
 * vite.config.js sets  envDir: '..'  (one level up from frontend-react/).
 * For Docker / CI builds pass them as build-time ARGs:
 *   --build-arg VITE_CLOUDINARY_CLOUD_NAME=...
 *   --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=...
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Emit a single diagnostic line at module load time so developers can
// immediately see whether the env vars were injected by Vite.
// This appears in the browser console, not in production output.
if (import.meta.env.DEV) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn(
      '[cloudinaryUpload] ⚠  Cloudinary env vars are MISSING.\n' +
      '  VITE_CLOUDINARY_CLOUD_NAME   =', CLOUD_NAME  || '(not set)', '\n' +
      '  VITE_CLOUDINARY_UPLOAD_PRESET=', UPLOAD_PRESET || '(not set)', '\n' +
      '  Ensure both are present in the root .env and that vite.config.js ' +
      'has  envDir: ".."  (already set).  In Docker pass them as build ARGs.'
    );
  } else {
    console.info(
      '[cloudinaryUpload] ✓  Cloud:', CLOUD_NAME,
      '| Preset:', UPLOAD_PRESET
    );
  }
}

/**
 * Upload a File object to Cloudinary via the unsigned upload API.
 *
 * @param {File}   file           - The File object from an <input type="file">
 * @param {string} folder         - Cloudinary folder (e.g. 'event-notices')
 * @param {function} [onProgress] - Optional callback(percent: number)
 * @returns {Promise<string>}     - Resolves to the secure Cloudinary URL
 */
export const uploadToCloudinary = (file, folder = 'uploads', onProgress) => {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(
        new Error(
          'Cloudinary is not configured. ' +
          'Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET ' +
          'to the root .env file, then restart the Vite dev server. ' +
          'See the comment at the top of cloudinaryUpload.js for full instructions.'
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    // For raw files (PDF, DOC, DOCX) Cloudinary needs resource_type=raw in
    // the URL.  Images default to 'image'.
    const isImage = file.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (!data.secure_url) {
            reject(new Error('Cloudinary returned a response without a secure_url.'));
            return;
          }
          resolve(data.secure_url);
        } catch {
          reject(new Error('Unexpected (non-JSON) response from Cloudinary.'));
        }
      } else {
        let message = `Cloudinary upload failed (HTTP ${xhr.status}).`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) message = `Cloudinary: ${err.error.message}`;
        } catch { /* ignore parse error */ }
        reject(new Error(message));
      }
    };

    xhr.onerror   = () => reject(new Error('Network error while uploading to Cloudinary. Check your internet connection.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out after 60 s. Try a smaller file or check your connection.'));
    xhr.timeout   = 60000; // 60 s

    xhr.send(formData);
  });
};
