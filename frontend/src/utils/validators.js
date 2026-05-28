// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation (3-30 chars, alphanumeric + underscore)
export const isValidUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
};

// Password validation (6+ chars)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Message validation
export const isValidMessage = (content) => {
  return content && content.trim().length > 0 && content.length <= 5000;
};

// Rate limit check (max N requests in duration ms)
export const createRateLimiter = (maxRequests = 5, durationMs = 1000) => {
  const requests = [];
  
  return () => {
    const now = Date.now();
    // Remove old requests outside the duration window
    const validRequests = requests.filter(time => now - time < durationMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limited
    }
    
    validRequests.push(now);
    requests.length = 0;
    requests.push(...validRequests);
    return true; // Request allowed
  };
};

export const registerValidator = (username, email, password) => {
  if (!isValidUsername(username)) {
    return 'Username must be 3-30 characters (letters, numbers, underscore only)';
  }
  if (!isValidEmail(email)) {
    return 'Invalid email address';
  }
  if (!isValidPassword(password)) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const loginValidator = (email, password) => {
  if (!email || !password) {
    return 'Email and password required';
  }
  if (!isValidEmail(email) && !isValidUsername(email)) {
    return 'Invalid email or username';
  }
  return null;
};

export default {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidMessage,
  createRateLimiter,
  registerValidator,
  loginValidator
};
