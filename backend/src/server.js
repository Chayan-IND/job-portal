const { env, validateEnv } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { disconnectRedis } = require('./config/redis');
const logger = require('./utils/logger');

validateEnv();
const app = require('./app');
let server;

async function start() {
  await connectDB();
  server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed - no longer accepting connections');
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.message || reason });
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
