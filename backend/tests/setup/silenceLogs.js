const logger = require('../../src/utils/logger');
logger.silent = !process.env.SHOW_LOGS;
