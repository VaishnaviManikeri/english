// backend/controllers/galleryController.js
import Gallery from "../models/Gallery.js";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from "../utils/fileHandler.js";

// Extract YouTube ID from URL
const extractYouTubeId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&]+)/,
    /youtu\.be\/([^?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// ===============================================================
// GET ALL GALLERY
// ===============================================================
export const getAllGallery = async (req, res) => {
  try {
    const { category, mediaType, featured } = req.query;
    
    let filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (mediaType) {
      filter.mediaType = mediaType;
    }
    
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const items = await Gallery.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("Error fetching gallery items:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ===============================================================
// GET SINGLE GALLERY ITEM
// ===============================================================
export const getGalleryById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Gallery item not found" });
    
    // Increment view count for videos
    if (item.mediaType === "video") {
      item.views += 1;
      await item.save();
    }
    
    res.json(item);
  } catch (err) {
    console.error("Error fetching gallery item:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================================================
// CREATE GALLERY ITEM
// ===============================================================
export const createGallery = async (req, res) => {
  try {
    const { title, description, category, mediaType, videoUrl, isFeatured } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Determine media type
    const media = mediaType || (videoUrl ? "video" : "image");
    let imageUrl = "";
    let galleryupload = "";
    let videoUploadFile = "";
    let thumbnailUrl = "";
    let duration = "";

    // Handle Image Upload
    if (media === "image") {
      if (!req.file && !req.body.imageUrl) {
        return res.status(400).json({ message: "Image is required for image type" });
      }

      if (req.file) {
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.path, {
          folder: 'gallery/images'
        });
        imageUrl = uploadResult.url;
        galleryupload = uploadResult.public_id;
      } else {
        imageUrl = req.body.imageUrl;
      }
    }

    // Handle Video Upload
    if (media === "video") {
      // For YouTube URLs
      if (videoUrl) {
        const youtubeId = extractYouTubeId(videoUrl);
        if (!youtubeId) {
          return res.status(400).json({ message: "Invalid YouTube URL" });
        }
        
        videoUploadFile = `https://www.youtube.com/watch?v=${youtubeId}`;
        thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      }
      // For uploaded videos
      else if (req.files && req.files.videoupload) {
        const videoFile = req.files.videoupload[0];
        
        // Upload video to Cloudinary
        const videoResult = await uploadToCloudinary(videoFile.path, {
          folder: 'gallery/videos',
          resource_type: 'video'
        });
        
        videoUploadFile = videoResult.url;
        
        // Handle thumbnail
        if (req.files.thumbnail && req.files.thumbnail[0]) {
          const thumbFile = req.files.thumbnail[0];
          const thumbResult = await uploadToCloudinary(thumbFile.path, {
            folder: 'gallery/thumbnails'
          });
          thumbnailUrl = thumbResult.url;
        } else {
          // Use default thumbnail
          thumbnailUrl = "";
        }
        
        duration = req.body.duration || "00:00";
      } else {
        return res.status(400).json({ message: "Video URL or file is required for video type" });
      }
    }

    // Create new gallery item
    const newItem = new Gallery({
      title,
      description: description || "",
      category: category || (media === "video" ? "video" : "other"),
      mediaType: media,
      imageUrl,
      galleryupload,
      videoUrl: videoUploadFile,
      thumbnailUrl,
      duration,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error("Error creating gallery item:", err);
    res.status(500).json({ 
      message: "Failed to create gallery item", 
      error: err.message 
    });
  }
};

// ===============================================================
// UPDATE GALLERY ITEM
// ===============================================================
export const updateGallery = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    const { title, description, category, mediaType, videoUrl, isFeatured } = req.body;

    // Update media type if changed
    const newMediaType = mediaType || item.mediaType;
    
    if (newMediaType !== item.mediaType) {
      // If changing from image to video, delete old image from Cloudinary
      if (item.mediaType === "image" && newMediaType === "video" && item.galleryupload) {
        await deleteFromCloudinary(item.galleryupload);
        item.imageUrl = "";
        item.galleryupload = "";
      }
      // If changing from video to image, handle video cleanup
      else if (item.mediaType === "video" && newMediaType === "image") {
        // Clean up video resources if not YouTube
        if (item.videoUrl && !item.videoUrl.includes('youtube.com')) {
          const videoPublicId = extractPublicId(item.videoUrl);
          if (videoPublicId) {
            await deleteFromCloudinary(videoPublicId, 'video');
          }
        }
        // Clean up thumbnail if not from YouTube
        if (item.thumbnailUrl && !item.thumbnailUrl.includes('youtube.com')) {
          const thumbPublicId = extractPublicId(item.thumbnailUrl);
          if (thumbPublicId) {
            await deleteFromCloudinary(thumbPublicId);
          }
        }
        
        item.videoUrl = "";
        item.thumbnailUrl = "";
        item.duration = "";
      }
      
      item.mediaType = newMediaType;
    }

    // Handle Image Updates
    if (item.mediaType === "image" && req.file) {
      // Delete old image from Cloudinary
      if (item.galleryupload) {
        await deleteFromCloudinary(item.galleryupload);
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(req.file.path, {
        folder: 'gallery/images'
      });
      
      item.imageUrl = uploadResult.url;
      item.galleryupload = uploadResult.public_id;
    }

    // Handle Video Updates
    if (item.mediaType === "video") {
      // If new video file uploaded
      if (req.files && req.files.videoupload) {
        const videoFile = req.files.videoupload[0];
        
        // Delete old video if exists and not YouTube
        if (item.videoUrl && !item.videoUrl.includes('youtube.com')) {
          const oldVideoId = extractPublicId(item.videoUrl);
          if (oldVideoId) {
            await deleteFromCloudinary(oldVideoId, 'video');
          }
        }
        
        // Upload new video
        const videoResult = await uploadToCloudinary(videoFile.path, {
          folder: 'gallery/videos',
          resource_type: 'video'
        });
        
        item.videoUrl = videoResult.url;
      }
      
      // If new thumbnail uploaded
      if (req.files && req.files.thumbnail) {
        const thumbFile = req.files.thumbnail[0];
        
        // Delete old thumbnail if exists and not from YouTube
        if (item.thumbnailUrl && !item.thumbnailUrl.includes('youtube.com')) {
          const oldThumbId = extractPublicId(item.thumbnailUrl);
          if (oldThumbId) {
            await deleteFromCloudinary(oldThumbId);
          }
        }
        
        // Upload new thumbnail
        const thumbResult = await uploadToCloudinary(thumbFile.path, {
          folder: 'gallery/thumbnails'
        });
        
        item.thumbnailUrl = thumbResult.url;
      }
      
      // If YouTube URL updated
      if (videoUrl && videoUrl.includes('youtube.com')) {
        const youtubeId = extractYouTubeId(videoUrl);
        if (youtubeId) {
          item.videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
          item.thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
        }
      }
    }

    // Update other fields
    item.title = title || item.title;
    item.description = description !== undefined ? description : item.description;
    item.category = category || item.category;
    item.isFeatured = isFeatured === "true" || isFeatured === true;
    item.updatedAt = Date.now();

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    console.error("Error updating gallery item:", err);
    res.status(500).json({ 
      message: "Failed to update gallery item", 
      error: err.message 
    });
  }
};

// ===============================================================
// DELETE GALLERY ITEM
// ===============================================================
export const deleteGallery = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Delete files from Cloudinary
    if (item.mediaType === "image" && item.galleryupload) {
      await deleteFromCloudinary(item.galleryupload);
    } else if (item.mediaType === "video") {
      // Delete video if not YouTube
      if (item.videoUrl && !item.videoUrl.includes('youtube.com')) {
        const videoPublicId = extractPublicId(item.videoUrl);
        if (videoPublicId) {
          await deleteFromCloudinary(videoPublicId, 'video');
        }
      }
      
      // Delete thumbnail if not from YouTube
      if (item.thumbnailUrl && !item.thumbnailUrl.includes('youtube.com')) {
        const thumbPublicId = extractPublicId(item.thumbnailUrl);
        if (thumbPublicId) {
          await deleteFromCloudinary(thumbPublicId);
        }
      }
    }

    // Delete from database
    await Gallery.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: "Gallery item deleted successfully",
      deletedId: req.params.id 
    });
  } catch (err) {
    console.error("Error deleting gallery item:", err);
    res.status(500).json({ 
      message: "Failed to delete gallery item", 
      error: err.message 
    });
  }
};

// ===============================================================
// GET VIDEO COUNT
// ===============================================================
export const getVideoStats = async (req, res) => {
  try {
    const totalVideos = await Gallery.countDocuments({ mediaType: "video" });
    const featuredVideos = await Gallery.countDocuments({ 
      mediaType: "video", 
      isFeatured: true 
    });
    const totalViews = await Gallery.aggregate([
      { $match: { mediaType: "video" } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    res.json({
      totalVideos,
      featuredVideos,
      totalViews: totalViews[0]?.totalViews || 0
    });
  } catch (err) {
    console.error("Error getting video stats:", err);
    res.status(500).json({ message: err.message });
  }
};