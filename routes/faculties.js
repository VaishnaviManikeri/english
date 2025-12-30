// backend/routes/faculties.js
import express from "express";
import path from "path";
import fs from "fs";
import upload from "../middleware/upload.js";
import Faculty from "../models/Faculty.js";
import { fileURLToPath } from "url";

const router = express.Router();

// Helper to delete file if exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function deleteFileIfExists(relPath) {
  if (!relPath) return;
  // relPath might be like /uploads/faculties/12345-name.jpg or uploads/faculties/...
  const p = relPath.startsWith("/") ? relPath.slice(1) : relPath;
  const full = path.join(__dirname, "..", p);
  if (fs.existsSync(full)) {
    try { fs.unlinkSync(full); } catch (err) { console.warn("Could not delete file:", full, err); }
  }
}

// CREATE
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, qualification, experience } = req.body;
    const photoPath = req.file ? `/uploads/faculties/${req.file.filename}` : "";

    const faculty = new Faculty({ name, qualification, experience, photo: photoPath });
    await faculty.save();
    res.status(201).json({ success: true, faculty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create faculty" });
  }
});

// READ ALL
router.get("/", async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ createdAt: -1 });
    res.json(faculties);
  } catch (err) {
    res.status(500).json({ error: "Error fetching faculties" });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: "Error fetching faculty" });
  }
});

// UPDATE
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      qualification: req.body.qualification,
      experience: req.body.experience,
    };

    const existing = await Faculty.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (req.file) {
      // remove old file if exists
      deleteFileIfExists(existing.photo);
      updateData.photo = `/uploads/faculties/${req.file.filename}`;
    }

    const updated = await Faculty.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating faculty" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ error: "Not found" });

    // delete file
    deleteFileIfExists(faculty.photo);

    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting faculty" });
  }
});

export default router;
