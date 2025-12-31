import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

// ✅ POST - Submit a new review
router.post("/", async (req, res) => {
  try {
    const { name, email, relation, rating, message } = req.body;

    // Validation
    if (!name || !message) {
      return res.status(400).json({ 
        message: "Name and message are required" 
      });
    }

    const newReview = new Review({
      name,
      email: email || "",
      relation: relation || "Parent/Student",
      rating: rating || 5,
      message,
      status: "pending", // Default status (for moderation)
      createdAt: new Date()
    });

    const savedReview = await newReview.save();
    
    res.status(201).json({
      message: "Review submitted successfully! It will appear after approval.",
      review: savedReview
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ 
      message: "Error submitting review", 
      error: error.message 
    });
  }
});

// ✅ GET - Fetch all approved reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({ status: "approved" })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50);

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ 
      message: "Error fetching reviews", 
      error: error.message 
    });
  }
});

// ✅ GET - Fetch single review by ID
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ 
      message: "Error fetching review", 
      error: error.message 
    });
  }
});

// ✅ PUT - Update review status (admin)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status" 
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({
      message: `Review ${status} successfully`,
      review
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ 
      message: "Error updating review", 
      error: error.message 
    });
  }
});

export default router;