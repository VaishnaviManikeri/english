import express from "express";
import Blog from "../models/blogModel.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/blogs"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  },
});

// Create blog post
router.post("/", upload.single("featuredImage"), async (req, res) => {
  try {
    const { title, content, excerpt, author, category, tags, isPublished, metaTitle, metaDescription } = req.body;

    const blogData = {
      title,
      content,
      excerpt,
      author,
      category,
      isPublished: isPublished !== undefined ? isPublished : true,
      metaTitle,
      metaDescription,
    };

    if (req.file) {
      blogData.featuredImage = `/uploads/blogs/${req.file.filename}`;
    }

    if (tags) {
      blogData.tags = typeof tags === "string" ? tags.split(",").map(tag => tag.trim()) : tags;
    }

    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({
      success: false,
      message: "Error creating blog",
      error: error.message,
    });
  }
});

// Get all blogs (with optional query parameters)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search, publishedOnly = true } = req.query;
    const query = {};

    if (publishedOnly === "true") {
      query.isPublished = true;
    }

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content"); // Exclude content for listing

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blogs",
      error: error.message,
    });
  }
});

// Get single blog by ID or slug
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };

    const blog = await Blog.findOneAndUpdate(
      query,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Get related blogs
    const relatedBlogs = await Blog.find({
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } },
      ],
      _id: { $ne: blog._id },
      isPublished: true,
    })
      .limit(3)
      .select("title slug featuredImage excerpt createdAt");

    res.json({
      success: true,
      data: blog,
      relatedBlogs,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blog",
      error: error.message,
    });
  }
});

// Update blog post
router.put("/:id", upload.single("featuredImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.featuredImage = `/uploads/blogs/${req.file.filename}`;
    }

    if (updateData.tags && typeof updateData.tags === "string") {
      updateData.tags = updateData.tags.split(",").map(tag => tag.trim());
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
});

// Delete blog post
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting blog",
      error: error.message,
    });
  }
});

// Get blog categories
router.get("/categories/all", async (req, res) => {
  try {
    const categories = await Blog.distinct("category", { isPublished: true });
    res.json({
      success: true,
      data: categories.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Get blog tags
router.get("/tags/all", async (req, res) => {
  try {
    const tags = await Blog.distinct("tags", { isPublished: true });
    const allTags = [].concat(...tags).filter(Boolean);
    const uniqueTags = [...new Set(allTags)];
    res.json({
      success: true,
      data: uniqueTags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tags",
      error: error.message,
    });
  }
});

export default router;