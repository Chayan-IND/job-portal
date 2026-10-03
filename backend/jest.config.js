module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/silenceLogs.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/seed/**',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  // bcrypt (12 rounds) + a DB per test file makes tests CPU-heavy; keep workers modest
  maxWorkers: 2,
};
