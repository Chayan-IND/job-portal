const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connects mongoose to a throwaway database for this test file.
 *
 * - If TEST_MONGO_URI is set (e.g. a Mongo service in CI), use it with a unique DB name.
 * - Otherwise start an in-memory MongoDB via mongodb-memory-server.
 *
 * Each test file gets its own database name so files can run in parallel safely.
 */
async function connect() {
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  const dbName = `jobportal_test_${process.pid}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await mongoose.connect(uri, { dbName });
  // Make sure unique indexes (e.g. one application per student per job) exist before tests run.
  // Some Mongo-compatible stand-ins (e.g. FerretDB) don't support text indexes; ignore only that error.
  await Promise.all(
    Object.values(mongoose.models).map((m) =>
      m.init().catch((err) => {
        if (!/text/i.test(err.message)) throw err;
      })
    )
  );
}

async function clearCollections() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

async function disconnect() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connect, clearCollections, disconnect };
