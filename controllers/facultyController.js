import Faculty from "../models/Faculty.js";

// GET all faculties
export const getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ createdAt: -1 });
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ADD faculty
export const addFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.json(faculty);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
};

// UPDATE faculty
export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(faculty);
  } catch (error) {
    res.status(400).json({ error: "Invalid update" });
  }
};

// DELETE faculty
export const deleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: "Faculty deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};
