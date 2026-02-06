import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: String,
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);
