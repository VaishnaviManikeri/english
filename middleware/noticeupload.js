// backend/middleware/noticeupload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'notices');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  // accept pdf, docx, images
  const allowed = /pdf|doc|docx|png|jpg|jpeg/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext.replace('.', ''))) cb(null, true);
  else cb(new Error('Unsupported file type'), false);
};

// max 5MB
export const uploadNoticeFile = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
