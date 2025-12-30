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

// ===================== MIDDLEWARES =====================

// ✅ CORS (Render + Localhost)
app.use(
  cors({
    origin: [
      "http://localhost:5173",        // React local
      "http://localhost:3000",
      process.env.FRONTEND_URL        // Render frontend URL
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== STATIC FILES =====================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/noticeupload", express.static(path.join(__dirname, "noticeupload")));

// ===================== DATABASE =====================
connectDB();

// ===================== TEST ROUTE =====================
app.get("/", (req, res) => {
  res.send("Jadhavar Educational Institute Backend Running Successfully");
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

// ===================== SERVER START =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
