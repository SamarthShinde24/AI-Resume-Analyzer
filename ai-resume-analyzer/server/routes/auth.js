import { Router } from "express";
import { registerUser, loginUser, getCurrentUser, updateUserRole } from "../services/authService.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// POST /api/auth/register (Protected with sliding window rate limiter against account spamming)
router.post("/register", authRateLimiter, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await registerUser({ email, password, name, role });
    res.status(201).json({
      message: "User registered successfully.",
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to register user." });
  }
});

// POST /api/auth/login (Protected with sliding window rate limiter against brute-force attacks)
router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.json({
      message: "Login successful.",
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    res.status(401).json({ error: err.message || "Authentication failed." });
  }
});

// GET /api/auth/me (Protected route to fetch current session user)
router.get("/me", requireAuth, (req, res) => {
  const user = getCurrentUser(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User account not found." });
  }
  res.json({ user });
});

// PUT /api/auth/role (Protected route allowing user to switch or upgrade their RBAC role)
router.put("/role", requireAuth, (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: "Role is required." });
    }
    const result = updateUserRole(req.user.id, role);
    res.json({
      message: `User role successfully updated to '${result.user.role}'.`,
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to update user role." });
  }
});

export default router;
