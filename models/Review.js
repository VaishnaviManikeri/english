// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ["student", "parent", "alumni", "visitor"],
    default: "parent"
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  message: {
    type: String,
    required: [true, "Review message is required"],
    trim: true,
    minlength: [10, "Review must be at least 10 characters"],
    maxlength: [500, "Review cannot exceed 500 characters"]
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  date: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    select: false
  },
  userAgent: {
    type: String,
    select: false
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectionReason: String
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ status: 1, date: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ email: 1 });

// Virtual for formatted date
reviewSchema.virtual("formattedDate").get(function() {
  return this.date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;