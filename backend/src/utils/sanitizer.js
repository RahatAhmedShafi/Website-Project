/**
 * XSS (Cross-Site Scripting) Payload Sanitizer Utility
 * Sanitizes user text inputs to prevent HTML tag injection, script execution, and event handler exploits.
 */

/**
 * Sanitizes a single string value to prevent XSS payloads.
 * @param {string} str - Input text
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  // 1. Remove script and iframe tag blocks
  let cleaned = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');

  // 2. Strip inline DOM event handlers (e.g. onerror=, onload=, onclick=)
  cleaned = cleaned.replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

  // 3. Escape dangerous HTML characters (< and >)
  cleaned = cleaned
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return cleaned.trim();
}

/**
 * Recursively sanitizes all string properties of an object.
 * Omits password and raw binary/image fields from string manipulation.
 * @param {object} obj - Object to sanitize
 * @param {string[]} skipKeys - Keys to skip from sanitization
 * @returns {object} Sanitized object
 */
function sanitizeObject(obj, skipKeys = ['password', 'confirmPassword', 'image', 'profilePicture']) {
  if (!obj || typeof obj !== 'object') return obj;

  for (let key in obj) {
    if (skipKeys.includes(key)) continue;

    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitizeObject(obj[key], skipKeys);
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(item => {
        if (typeof item === 'string') return sanitizeString(item);
        if (typeof item === 'object' && item !== null) return sanitizeObject(item, skipKeys);
        return item;
      });
    }
  }

  return obj;
}

/**
 * Express middleware to automatically sanitize req.body text fields
 */
function xssSanitizerMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  xssSanitizerMiddleware
};
