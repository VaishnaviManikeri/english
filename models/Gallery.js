import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // Add mediaType field to distinguish between image and video
  mediaType: {
    type: String,
    enum: ["image", "video"],
    default: "image"
  },

  category: {
    type: String,
    enum: ["campus", "events", "classroom", "achievements", "other", "video"],
    default: "other",
  },

  // For images
  galleryupload: { type: String },  
  imageUrl: { type: String },

  // For videos (YouTube URL or uploaded video)
  videoUrl: { type: String },
  thumbnailUrl: { type: String }, // For video thumbnail
  duration: { type: String }, // Video duration in MM:SS format

  isFeatured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;