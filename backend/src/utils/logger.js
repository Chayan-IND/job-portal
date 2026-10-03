const winston = require('winston');
const { env } = require('../config/env');

const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: env.isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      ),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = logger;
