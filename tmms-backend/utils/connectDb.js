const mongoose = require('mongoose');
const { ensureAdminSeed } = require('./seed');

let initPromise = null;

async function connectDb() {
  if (mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing. Add it to your .env file.');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
}

async function initDbAndSeed() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDb();
      await ensureAdminSeed();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

module.exports = {
  connectDb,
  initDbAndSeed
};
