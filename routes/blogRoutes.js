import express from "express";
import multer from "multer";
import path from "path";
import Blog from "../models/Blog.js";

const router = express.Router();

// ================= MULTER =================

const storage = multer.diskStorage({
  destination: "./uploads/blogs",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================= CREATE =================

router.post("/", upload.single("image"), async (req, res) => {
  const blog = await Blog.create({
    title: req.body.title,
    description: req.body.description,
    image: `/uploads/blogs/${req.file.filename}`,
  });

  res.json(blog);
});

// ================= READ =================

router.get("/", async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

// ================= DELETE =================

router.delete("/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
