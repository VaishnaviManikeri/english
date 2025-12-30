// backend/routes/galleryRoutes.js
import express from "express";
import {
  getAllGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  getVideoStats
} from "../controllers/galleryController.js";

import galleryUpload from "../middleware/galleryUpload.js";
import videoUpload from "../middleware/videoUpload.js";

const router = express.Router();

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// -------------------------------------------
// GET /api/gallery -> Fetch all gallery items
// -------------------------------------------
router.get("/", getAllGallery);

// -------------------------------------------
// GET /api/gallery/stats/videos -> Video statistics
// -------------------------------------------
router.get("/stats/videos", getVideoStats);

// -------------------------------------------
// GET /api/gallery/:id -> Fetch specific item
// -------------------------------------------
router.get("/:id", getGalleryById);

// -------------------------------------------
// POST /api/gallery
// -------------------------------------------
router.post("/",
  (req, res, next) => {
    // Check media type from request
    const mediaType = req.body.mediaType || (req.body.videoUrl ? "video" : "image");
    
    if (mediaType === 'video') {
      videoUpload.fields([
        { name: 'videoupload', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    } else {
      galleryUpload.single('galleryupload')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    }
  },
  createGallery
);

// -------------------------------------------
// PUT /api/gallery/:id
// -------------------------------------------
router.put("/:id",
  (req, res, next) => {
    // Check if we're updating to video
    const mediaType = req.body.mediaType;
    
    if (mediaType === 'video') {
      videoUpload.fields([
        { name: 'videoupload', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
      ])(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    } else {
      galleryUpload.single('galleryupload')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    }
  },
  updateGallery
);

// -------------------------------------------
// DELETE /api/gallery/:id -> Remove item
// -------------------------------------------
router.delete("/:id", deleteGallery);

export default router;