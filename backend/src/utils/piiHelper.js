/**
 * PII (Personally Identifiable Information) Redaction & Masking Utility
 * Implements privacy-preserving data filtering as specified in the Vibora security architecture.
 */

/**
 * Masks a phone number by obfuscating the middle digits.
 * Example: "01712345890" -> "017*****890"
 * Example: "+8801712345890" -> "+88017*****890"
 * 
 * @param {string} phone - Original phone number
 * @returns {string} Obfuscated phone number
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '***-****-***';
  
  const cleanPhone = phone.trim();
  const len = cleanPhone.length;

  if (len <= 6) {
    return cleanPhone.slice(0, 2) + '***' + cleanPhone.slice(-1);
  }

  // Handle +880 or +88 international prefix
  if (cleanPhone.startsWith('+880') && len >= 13) {
    const prefix = cleanPhone.slice(0, 6); // e.g. +88017
    const suffix = cleanPhone.slice(-3);   // e.g. 890
    return `${prefix}*****${suffix}`;
  }

  // Handle standard 11-digit Bangladesh phone (e.g. 01712345890)
  if (len >= 10) {
    const prefix = cleanPhone.slice(0, 3); // e.g. 017
    const suffix = cleanPhone.slice(-3);   // e.g. 890
    return `${prefix}*****${suffix}`;
  }

  // Generic fallback masking
  const visibleStart = Math.min(3, Math.floor(len / 3));
  const visibleEnd = Math.min(3, Math.floor(len / 3));
  const prefix = cleanPhone.slice(0, visibleStart);
  const suffix = cleanPhone.slice(-visibleEnd);
  return `${prefix}*****${suffix}`;
}

/**
 * Masks an email address.
 * Example: "shafi@vibora.com" -> "s***i@vibora.com"
 * 
 * @param {string} email - Original email
 * @returns {string} Obfuscated email
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Sanitizes a Blood Donor record by masking PII (Phone) unless the requesting user is the owner.
 * 
 * @param {object} donor - Blood donor record
 * @param {string|null} requestingUserId - ID of user querying the data
 * @returns {object} Sanitized donor record with PII metadata
 */
function sanitizeBloodDonor(donor, requestingUserId = null) {
  if (!donor) return null;
  const isOwner = requestingUserId && donor.user && (
    donor.user.toString() === requestingUserId.toString() ||
    (donor.user._id && donor.user._id.toString() === requestingUserId.toString())
  );

  if (isOwner) {
    return {
      ...donor,
      isMasked: false,
      piiStatus: 'OWNER_ACCESS'
    };
  }

  return {
    ...donor,
    phone: maskPhoneNumber(donor.phone),
    isMasked: true,
    piiStatus: 'PROTECTED'
  };
}

/**
 * Sanitizes a Tuition posting record by masking PII.
 * 
 * @param {object} post - Tuition post record
 * @param {string|null} requestingUserId - ID of user querying the data
 * @returns {object} Sanitized tuition record
 */
function sanitizeTuitionPost(post, requestingUserId = null) {
  if (!post) return null;
  const isOwner = requestingUserId && post.user && (
    post.user.toString() === requestingUserId.toString() ||
    (post.user._id && post.user._id.toString() === requestingUserId.toString())
  );

  if (isOwner) {
    return {
      ...post,
      isMasked: false,
      piiStatus: 'OWNER_ACCESS'
    };
  }

  return {
    ...post,
    phone: maskPhoneNumber(post.phone),
    isMasked: true,
    piiStatus: 'PROTECTED'
  };
}

module.exports = {
  maskPhoneNumber,
  maskEmail,
  sanitizeBloodDonor,
  sanitizeTuitionPost
};
