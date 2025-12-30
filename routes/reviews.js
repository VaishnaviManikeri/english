import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: 1 });
    res.json(reviews);
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    res.status(500).send("Server error");
  }
});

// POST new review
router.post("/", async (req, res) => {
  try {
    const { name, relation, rating, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const review = new Review({
      name: name || "Anonymous",
      relation: relation || "Parent / Student",
      rating: Number(rating) || 0,
      message: message.trim(),
    });

    const saved = await review.save();
    res.status(201).json(saved);

  } catch (err) {
    console.error("POST /api/reviews error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
