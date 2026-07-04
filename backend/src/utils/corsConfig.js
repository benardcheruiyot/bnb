function parseAllowedOrigins() {
  const configured = String(process.env.ALLOWED_ORIGINS || '').trim();
  if (!configured) {
    return ['http://localhost:3000'];
  }

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedByWildcard(origin, wildcardPattern) {
  if (!wildcardPattern.includes('*')) {
    return origin === wildcardPattern;
  }

  // Supports patterns like https://*.example.com
  const escaped = wildcardPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace('\\*', '.*');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(origin);
}

function isOriginAllowed(origin, allowedOrigins) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === origin) {
      return true;
    }

    return isAllowedByWildcard(origin, allowedOrigin);
  });
}

module.exports = {
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = parseAllowedOrigins();

    // Allow non-browser requests (curl, health checks, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin, allowedOrigins)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};
