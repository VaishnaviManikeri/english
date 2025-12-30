// backend/routes/noticeRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import Notice from "../models/Notice.js";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/notices');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET all notices
router.get("/", async (req, res) => {
  try {
    const notices = await Notice.find().sort({ date: -1 });
    res.json(notices);
  } catch (err) {
    console.error('Error in GET /api/notices:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET single notice
router.get("/:id", async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    res.json(notice);
  } catch (err) {
    console.error('Error in GET /api/notices/:id:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST create new notice
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        message: "Title and description are required" 
      });
    }
    
    const fileUrl = req.file ? `/uploads/notices/${req.file.filename}` : null;
    
    const newNotice = new Notice({
      title,
      description,
      category: category || "General",
      date: new Date(),
      fileUrl
    });
    
    const savedNotice = await newNotice.save();
    res.status(201).json(savedNotice);
  } catch (err) {
    console.error('Error in POST /api/notices:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT update notice
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Update fields
    notice.title = req.body.title || notice.title;
    notice.description = req.body.description || notice.description;
    notice.category = req.body.category || notice.category;
    notice.date = req.body.date ? new Date(req.body.date) : notice.date;
    
    // Update file if new file uploaded
    if (req.file) {
      notice.fileUrl = `/uploads/notices/${req.file.filename}`;
    }
    
    const updatedNotice = await notice.save();
    res.json(updatedNotice);
  } catch (err) {
    console.error('Error in PUT /api/notices/:id:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE notice
router.delete("/:id", async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    
    // Optionally: Delete the file from server if needed
    // if (notice.fileUrl) {
    //   const filePath = path.join(__dirname, '..', notice.fileUrl);
    //   fs.unlinkSync(filePath);
    // }
    
    res.json({ 
      message: "Notice deleted successfully",
      deletedId: req.params.id 
    });
  } catch (err) {
    console.error('Error in DELETE /api/notices/:id:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;