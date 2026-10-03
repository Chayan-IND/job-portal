// Runs before every test file, BEFORE any app code is required.
// config/env.js reads process.env once at load time, so this must come first.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unused';
process.env.FRONTEND_URL = 'http://localhost:5173';
delete process.env.REDIS_URL; // tests never need Redis; the app degrades gracefully without it

// Rate limits are per-IP and tests all come from one IP, so raise them.
// (rateLimit.test.js has its own file where we test the limiter separately.)
process.env.RATE_LIMIT_MAX_LOGIN = '1000';
process.env.RATE_LIMIT_MAX_REGISTER = '1000';
process.env.RATE_LIMIT_MAX_PASSWORD_RESET = '1000';
process.env.RATE_LIMIT_MAX_UPLOAD = '1000';
