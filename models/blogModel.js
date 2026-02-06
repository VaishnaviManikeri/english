import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "Admin",
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    featuredImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    metaTitle: String,
    metaDescription: String,
  },
  {
    timestamps: true,
  }
);

// Generate slug from title before saving
blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-");
  }
  next();
});

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;