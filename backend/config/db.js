const mongoose = require("mongoose");

const connectDB = async () => {
  const atlasUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/ganpati-bappa-mandal";

  const tryConnect = async (uri, label) => {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected (${label}): ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error (${label}): ${error.message}`);
      return false;
    }
  };

  if (atlasUri) {
    const connected = await tryConnect(atlasUri, "Atlas");
    if (connected) return;
    console.warn("⚠️ Atlas connection failed. Trying local MongoDB fallback...");
  } else {
    console.warn("⚠️ MONGO_URI is not defined. Attempting local MongoDB fallback.");
  }

  const localConnected = await tryConnect(localUri, "Local");
  if (!localConnected) {
    console.error("❌ Unable to connect to MongoDB. Use a valid MONGO_URI or install/start local MongoDB.");
    process.exit(1);
  }
};

module.exports = connectDB;
