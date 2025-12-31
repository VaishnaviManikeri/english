const Review = require("../models/Review");

exports.getReviews = async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
};

exports.createReview = async (req, res) => {
  const { name, rating, message } = req.body;

  if (!name || !message)
    return res.status(400).json({ error: "All fields required" });

  const review = await Review.create({ name, rating, message });
  res.status(201).json(review);
};
