// routes/userRoutes.js
import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";

const router = express.Router();

// User management routes
router.post("/", /* requireRole("admin"), */ createUser);
router.get("/", /* requireRole("admin"), */ getUsers);

// Profile routes
router.get("/profile/:id", getProfile);
router.put("/profile/:id", updateProfile);

// Standard user CRUD routes
router.get("/:id", getUserById);
router.put("/:id", /* requireRole("admin"), */ updateUser);
router.delete("/:id", /* requireRole("admin"), */ deleteUser);

export default router;