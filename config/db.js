// backend/config/db.js

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // MongoDB URI from .env or fallback local DB
    const mongoURI =
      process.env.MONGO_URI || "mongodb+srv://English:enlish123@cluster0.zejp6zu.mongodb.net/?appName=Cluster0";

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`
    );
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Stop server if DB fails
  }
};

export default connectDB;
