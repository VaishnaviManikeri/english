import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  relation: {
    type: String,
    enum: ["Parent", "Student", "Alumni", "Teacher", "Other"],
    default: "Parent/Student"
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
reviewSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;