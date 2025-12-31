// routes/reviewRoutes.js
import express from "express";
import Review from "../models/Review.js";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Rate limiting for review submissions
const submitReviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 review submissions per windowMs
  message: {
    success: false,
    message: "Too many review submissions from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateReview = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  
  body("role")
    .optional()
    .isIn(["student", "parent", "alumni", "visitor"]).withMessage("Invalid role"),
  
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  
  body("message")
    .trim()
    .notEmpty().withMessage("Review message is required")
    .isLength({ min: 10, max: 500 }).withMessage("Review must be between 10 and 500 characters"),
];

// Get all approved reviews
router.get("/", async (req, res) => {
  try {
    const { limit = 20, page = 1, sort = "-date", role } = req.query;
    
    const query = { status: "approved" };
    if (role && ["student", "parent", "alumni", "visitor"].includes(role)) {
      query.role = role;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-email -ipAddress -userAgent -__v -updatedAt");
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews"
    });
  }
});

// Get latest reviews for homepage
router.get("/latest", async (req, res) => {
  try {
    const reviews = await Review.find({ status: "approved" })
      .sort("-date")
      .limit(10)
      .select("name role rating title message date");
    
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching latest reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest reviews"
    });
  }
});

// Submit new review
router.post("/", submitReviewLimiter, validateReview, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Check for duplicate submissions from same IP/email
    const recentSubmission = await Review.findOne({
      email: req.body.email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours
    });
    
    if (recentSubmission) {
      return res.status(429).json({
        success: false,
        message: "You have already submitted a review recently. Please try again later."
      });
    }
    
    // Create new review
    const reviewData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent")
    };
    
    const review = new Review(reviewData);
    await review.save();
    
    // Send success response with sanitized data
    res.status(201).json({
      success: true,
      message: "Review submitted successfully and is pending approval",
      data: {
        _id: review._id,
        name: review.name,
        role: review.role,
        rating: review.rating,
        title: review.title,
        message: review.message,
        date: review.date,
        status: review.status
      }
    });
    
  } catch (error) {
    console.error("Error submitting review:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error submitting review"
    });
  }
});

// Get review statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          roleDistribution: { $push: "$role" }
        }
      }
    ]);
    
    // Calculate rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalReviews: stats[0]?.totalReviews || 0,
        averageRating: stats[0]?.averageRating ? Math.round(stats[0].averageRating * 10) / 10 : 0,
        ratingDistribution: ratingStats,
        roleDistribution: stats[0]?.roleDistribution || []
      }
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching review statistics"
    });
  }
});

export default router;