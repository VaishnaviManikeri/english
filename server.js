import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Import ALL routes
import blogRoutes from "./routes/blogRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import reviewRoutes from "./routes/reviews.js";
import facultyRoutes from "./routes/faculties.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import careerRoutes from "./routes/careerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===================== IMPROVED CORS CONFIGURATION =====================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://www.jadhavarenglishschool.com",
  "https://jadhavarenglishschool.com",
  "https://www.jadhavarsemienglish.in",
  "https://jadhavarsemienglish.in"
];

// Add env URL safely
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"]
  })
);

// ===================== BODY PARSER =====================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===================== STATIC FILES =====================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/noticeupload", express.static(path.join(__dirname, "noticeupload")));

// ===================== DATABASE =====================

connectDB();

// ===================== ROOT ROUTE =====================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Jadhavar Educational Institute Backend Running Successfully",
    timestamp: new Date().toISOString()
  });
});

// ===================== HEALTH CHECK ROUTES =====================

app.get("/ping", (req, res) => {
  res.status(200).send("✅ Server is alive");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running smoothly",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ===================== HOSTINGER STATUS API =====================

app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully on Hostinger 🚀",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// ===================== API ROUTES =====================

// Debug middleware to log all API requests
app.use("/api", (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount all routes
app.use("/api/blogs", blogRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/admin", adminRoutes);

// ===================== 404 HANDLER =====================

app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// ===================== GLOBAL ERROR HANDLER =====================

app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: "CORS error: Origin not allowed",
      message: err.message
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" 
      ? "Something went wrong on the server" 
      : err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
});

// ===================== SERVER START =====================

const PORT = process.env.PORT || 5006;

const server = app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`=================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
