import express from "express";
import Blog from "../models/Blog.js";

const router = express.Router();

// CREATE BLOG
router.post("/", async (req, res) => {
  const blog = await Blog.create(req.body);
  res.json(blog);
});

// GET ALL BLOGS
router.get("/", async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

// UPDATE BLOG
router.put("/:id", async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(blog);
});

// DELETE BLOG
router.delete("/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
