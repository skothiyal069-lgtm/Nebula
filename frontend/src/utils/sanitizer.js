// Simple XSS protection - escape HTML special characters
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

// Allow safe markdown-like formatting but prevent XSS
export const sanitizeMessageContent = (content) => {
  if (typeof content !== 'string') return '';
  
  // Remove potentially dangerous HTML
  let sanitized = content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Escape remaining HTML
  return sanitizeText(sanitized);
};

// Validate and sanitize URLs
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http(s) and data protocols
    if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

export default {
  sanitizeText,
  sanitizeMessageContent,
  sanitizeUrl
};
