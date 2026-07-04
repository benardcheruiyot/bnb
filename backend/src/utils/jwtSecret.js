const crypto = require('crypto');

let cachedFallbackSecret = null;

const isValidExpiresIn = (value) => {
  if (!value) return false;
  const raw = String(value).trim();
  if (!raw) return false;

  // Supports plain seconds (e.g. 3600) and time span strings (e.g. 7d, 12h).
  return /^\d+$/.test(raw) || /^\d+(ms|s|m|h|d|w|y)$/i.test(raw);
};

const getJwtSecret = () => {
  const envSecret = String(process.env.JWT_SECRET || '').trim();
  if (envSecret) {
    return envSecret;
  }

  if (!cachedFallbackSecret) {
    cachedFallbackSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Auth] JWT_SECRET is missing. Using an in-memory fallback secret.');
  }

  return cachedFallbackSecret;
};

const getJwtExpiresIn = () => {
  const envValue = String(process.env.JWT_EXPIRE || '').trim();
  if (isValidExpiresIn(envValue)) {
    return envValue;
  }

  if (envValue) {
    console.warn(`[Auth] Invalid JWT_EXPIRE value "${envValue}". Falling back to 7d.`);
  }

  return '7d';
};

module.exports = { getJwtSecret, getJwtExpiresIn };