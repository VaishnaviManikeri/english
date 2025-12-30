// backend/models/Faculty.js
import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  qualification: { type: String, default: "" },
  experience: { type: String, default: "" },
  photo: { type: String, default: "" }, // stores filename or path like /uploads/faculties/xxx.jpg
}, { timestamps: true });

export default mongoose.model("Faculty", FacultySchema);
