import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// Admin login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Hardcoded admin credentials (demo purpose)
  if (username === "jadhavar" && password === "jadhavar2020") {
    const token = jwt.sign(
      { id: "admin", role: "admin" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { username: "jadhavar", role: "admin" },
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// Verify token
router.post("/verify", (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    res.json({ valid: true });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

export default router;
