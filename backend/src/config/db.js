const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('../utils/logger');

const CONNECTION_OPTIONS = {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

async function connectDB() {
  mongoose.set('strictQuery', true);
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { error: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  await mongoose.connect(env.mongoUri, CONNECTION_OPTIONS);
}

async function disconnectDB() {
  await mongoose.connection.close(false);
  logger.info('MongoDB connection closed gracefully');
}

module.exports = { connectDB, disconnectDB };
