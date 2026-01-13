import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const adminExists = await Admin.findOne({ username: "admin" });

if (adminExists) {
  console.log("❗ Admin already exists");
  process.exit();
}

const hashedPassword = await bcrypt.hash("admin123", 10);

await Admin.create({
  username: "admin",
  password: hashedPassword
});

console.log("✅ Admin created successfully");
process.exit();
