/**
 * Image Security & Payload Bomb Protection Utility
 * Validates Base64 image uploads for MIME types, Magic Byte headers, and maximum 5MB size limits.
 */

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates a base64 image string for size, format, and magic bytes file signature.
 * @param {string} base64String - Image data URI (e.g. data:image/png;base64,...)
 * @param {object} options - Custom options (maxSizeBytes, allowedTypes)
 * @returns {object} { valid: boolean, message?: string }
 */
function validateBase64Image(base64String, options = {}) {
  if (!base64String || typeof base64String !== 'string') {
    return { valid: true }; // Optional field if not provided
  }

  const maxBytes = options.maxSizeBytes || MAX_IMAGE_SIZE_BYTES;

  // 1. Check Data URI format
  if (!base64String.startsWith('data:image/') || !base64String.includes(';base64,')) {
    // If it's a external HTTP URL string (e.g. Unsplash URL), allow it
    if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
      return { valid: true };
    }
    return { valid: false, message: 'Invalid image payload format. Must be a valid image Data URI.' };
  }

  // Extract mime type and raw base64 data
  const parts = base64String.split(';base64,');
  const mimeMatch = parts[0].match(/^data:image\/(jpeg|jpg|png|webp|gif)/i);
  if (!mimeMatch) {
    return { valid: false, message: 'Unsupported image type. Only JPEG, PNG, WEBP, and GIF are allowed.' };
  }

  const rawBase64 = parts[1];
  if (!rawBase64) {
    return { valid: false, message: 'Empty or corrupted image base64 data payload.' };
  }

  try {
    const buffer = Buffer.from(rawBase64, 'base64');

    // 2. Enforce strict Max Size Limit (Protect against Memory Exhaustion / DoS)
    if (buffer.length > maxBytes) {
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
      return { valid: false, message: `Image payload size (${sizeMB}MB) exceeds the maximum allowed limit of 5MB.` };
    }

    if (buffer.length < 4) {
      return { valid: false, message: 'Corrupted image file header payload.' };
    }

    // 3. Verify Magic Bytes (File Signatures)
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWEBP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF
    const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // GIF

    if (!isJPEG && !isPNG && !isWEBP && !isGIF) {
      return { valid: false, message: 'Invalid file header signature (Magic Bytes mismatch). Executable or fake image payload blocked.' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, message: 'Failed to parse image payload bytes.' };
  }
}

module.exports = {
  validateBase64Image,
  MAX_IMAGE_SIZE_BYTES
};
