
import express from "express";
import Career from "../models/Career.js";

const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  const job = await Career.create(req.body);
  res.json(job);
});

// READ
router.get("/", async (req, res) => {
  const jobs = await Career.find();
  res.json(jobs);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const job = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(job);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Career.findByIdAndDelete(req.params.id);
  res.json({ message: "Job deleted" });
});

export default router;
