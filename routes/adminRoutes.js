import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Add this for password hashing in production

const router = express.Router();

// Simple admin storage (in production, use MongoDB)
const admins = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // Plain text for demo - hash in production
    role: "admin",
    email: "admin@jadhavar.edu"
  }
];

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        message: "Username and password are required" 
      });
    }

    console.log(`Login attempt for username: ${username}`);
    
    // Find admin (in production, query from MongoDB)
    const admin = admins.find(a => a.username === username);
    
    if (!admin) {
      console.log(`Admin not found: ${username}`);
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Verify password (plain text comparison for demo)
    // In production, use: await bcrypt.compare(password, admin.password)
    if (password !== admin.password) {
      console.log(`Invalid password for: ${username}`);
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        email: admin.email 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    console.log(`Login successful for: ${username}`);

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        email: admin.email
      },
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Server error during authentication",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify token
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        valid: false, 
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        valid: false, 
        message: "Invalid token format" 
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "your-secret-key"
    );

    res.json({
      valid: true,
      user: decoded,
      message: "Token is valid"
    });

  } catch (error) {
    console.error("Token verification error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        valid: false, 
        message: "Token has expired" 
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        valid: false, 
        message: "Invalid token" 
      });
    }

    res.status(500).json({ 
      valid: false, 
      message: "Token verification failed" 
    });
  }
});

// Get admin profile
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Find admin (in production, query from DB)
    const admin = admins.find(a => a.id === decoded.id);
    
    if (!admin) {
      return res.status(404).json({ 
        message: "Admin not found" 
      });
    }

    // Remove password from response
    const { password, ...adminData } = admin;
    
    res.json({
      success: true,
      user: adminData
    });

  } catch (error) {
    console.error("Profile error:", error);
    res.status(401).json({ 
      message: "Invalid or expired token" 
    });
  }
});

// Logout (client-side operation, but can be implemented for server-side blacklisting)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout successful (client should remove token)"
  });
});

export default router;