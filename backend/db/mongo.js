const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mentor_platform';

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 8000,
  });
  console.log(`MongoDB connected -> ${MONGODB_URI}`);
}

module.exports = { connectDB, mongoose };
