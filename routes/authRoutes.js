// routes/authRoutes.js
import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admin should register users
router.post("/register", protect, authorizeRoles("admin"), registerUser);

// Anyone can login
router.post("/login", loginUser);

export default router;
