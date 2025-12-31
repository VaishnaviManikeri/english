import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

import connectDB from "./config/db.js";

// ===================== ROUTES =====================
import announcementRoutes from "./routes/announcementRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import reviewRoutes from "./routes/reviews.js";              // public reviews
import adminReviewRoutes from "./routes/adminReviewRoutes.js"; // admin reviews
import facultyRoutes from "./routes/faculties.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import careerRoutes from "./routes/careerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

// ===================== DIRNAME FIX =====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===================== SECURITY MIDDLEWARE =====================
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  })
);

app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss());           // Prevent XSS attacks

// ===================== RATE LIMITING =====================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", apiLimiter);

// ===================== BODY PARSING =====================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ===================== STATIC FILES =====================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/noticeupload", express.static(path.join(__dirname, "noticeupload")));

// ===================== DATABASE =====================
connectDB();

// ===================== TEST ROUTE =====================
app.get("/", (req, res) => {
  res.send("✅ Jadhavar Educational Institute Backend Running Successfully");
});

// ===================== API ROUTES =====================
app.use("/api/reviews", reviewRoutes);              // public reviews (GET, POST)
app.use("/api/admin/reviews", adminReviewRoutes);  // admin moderation

app.use("/api/admissions", admissionRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/admin", adminRoutes);

// ===================== GLOBAL ERROR HANDLER =====================
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===================== SERVER START =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
