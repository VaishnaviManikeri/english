// backend/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Main uploads directory
const uploadRoot = path.join(process.cwd(), "uploads");

// Faculty-specific directory
const facultyUploadDir = path.join(uploadRoot, "faculties");

// Ensure folders exist
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot);
if (!fs.existsSync(facultyUploadDir)) fs.mkdirSync(facultyUploadDir);

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, facultyUploadDir); // save inside uploads/faculties
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();
    cb(null, `${Date.now()}-${basename}${ext}`);
  },
});

// Only images allowed
const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif|jpg)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Final multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

export default upload;
