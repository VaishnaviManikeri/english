import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  relation: { type: String, default: "Parent / Student" },
  rating: { type: Number, min: 0, max: 5, default: 5 },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", ReviewSchema);

export default Review;
