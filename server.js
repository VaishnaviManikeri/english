// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Import ALL routes
import announcementRoutes from "./routes/announcementRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js"; // Changed from reviews.js to reviewRoutes.js
import facultyRoutes from "./routes/faculties.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import careerRoutes from "./routes/careerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Import security middleware
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

dotenv.config();

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===================== SECURITY MIDDLEWARES =====================
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Prevent MongoDB injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ✅ CORS (Render + Localhost)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // React local
      "http://localhost:3000",
      process.env.FRONTEND_URL // Render frontend URL
    ].filter(Boolean), // Remove undefined values
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===================== STATIC FILES =====================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/noticeupload", express.static(path.join(__dirname, "noticeupload")));

// ===================== DATABASE =====================
connectDB();

// ===================== TEST ROUTE =====================
app.get("/", (req, res) => {
  res.json({
    message: "Jadhavar Educational Institute Backend Running Successfully",
    version: "1.0.0",
    endpoints: {
      reviews: "/api/reviews",
      announcements: "/api/announcements",
      admissions: "/api/admissions",
      gallery: "/api/gallery",
      faculties: "/api/faculties",
      notices: "/api/notices",
      careers: "/api/careers",
      admin: "/api/admin"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===================== API ROUTES =====================
app.use("/api/reviews", reviewRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/admin", adminRoutes);

// ===================== ERROR HANDLING MIDDLEWARE =====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// ===================== SERVER START =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
});