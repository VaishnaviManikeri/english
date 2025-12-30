import mongoose from "mongoose";

const careerSchema = new mongoose.Schema({
  title: String,
  description: String,
  qualifications: String,
  experience: String,
});

export default mongoose.model("Career", careerSchema);
