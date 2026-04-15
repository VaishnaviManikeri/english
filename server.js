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

// ===================== SAFE CORS FIX =====================

const origins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://www.jadhavarenglishschool.com",
  "https://jadhavarenglishschool.com"
];

// Add env URL safely
if (process.env.FRONTEND_URL) {
  origins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: origins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  })
);

// ===================== BODY PARSER =====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== STATIC FILES =====================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/noticeupload", express.static(path.join(__dirname, "noticeupload")));

// ===================== DATABASE =====================

connectDB();

// ===================== ROOT ROUTE =====================

app.get("/", (req, res) => {
  res.send("Jadhavar Educational Institute Backend Running Successfully");
});

// ===================== ✅ PING ROUTE =====================

app.get("/ping", (req, res) => {
  res.send("✅ Server is alive");
});

// ===================== ✅ HOSTINGER STATUS API =====================

app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully on Hostinger 🚀",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// ===================== API ROUTES =====================

app.use("/api/blogs", blogRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/admin", adminRoutes);

// ===================== ERROR HANDLER =====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    details: err.message
  });
});

// ===================== SERVER START =====================

const PORT = 5006; // ✅ Updated port

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
