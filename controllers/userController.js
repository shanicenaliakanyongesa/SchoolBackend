// Updated controllers/userController.js

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Classroom from "../models/Classroom.js";

const SALT_ROUNDS = 10;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// =======================
// PROFILE CONTROLLERS
// =======================
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "user not found" });

    return res.json({ user });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "user not found" });

    const { name, email, password } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: "email already in use" });
      user.email = email;
    }

    if (name) user.name = name;

    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();
    const out = user.toObject();
    delete out.password;
    return res.json({ user: out });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ message: "server error" });
  }
};

// =======================
// USER MANAGEMENT
// =======================
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }
    if (!["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({ message: "role must be one of admin, teacher, student" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "email already in use" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, password: hashed, role });

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(201).json({ user: userObj });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "duplicate key error" });
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password").lean();
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

// Fixed getUserById function for student dashboard
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "user not found" });

    if (user.role === "teacher") {
      const courses = await Course.find({ teacher: id }).lean();
      const classrooms = await Classroom.find({ teacher: id })
        .populate("course", "name")
        .populate("students", "name email")
        .lean();
      return res.json({ user, courses, classrooms });
    }

    if (user.role === "student") {
      // FIXED: Find ALL classrooms (not just one) and return as array
      const classrooms = await Classroom.find({ students: id })
        .populate("course", "name description")
        .populate("teacher", "name email")
        .populate("students", "name email")
        .lean();
      
      // Also get courses the student is enrolled in through classrooms
      const courseIds = classrooms.map(c => c.course?._id).filter(Boolean);
      const courses = await Course.find({ _id: { $in: courseIds } }).lean();
      
      return res.json({ user, classrooms, courses }); // Returns 'classrooms' plural
    }

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const { name, email, password, role } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "user not found" });

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: "email already in use" });
      user.email = email;
    }
    if (name) user.name = name;
    if (password) user.password = await bcrypt.hash(password, SALT_ROUNDS);

    if (role && role !== user.role) {
      if (!["admin", "teacher", "student"].includes(role))
        return res.status(400).json({ message: "invalid role" });

      if (user.role === "teacher" && role !== "teacher") {
        await Course.updateMany({ teacher: user._id }, { $unset: { teacher: "" } });
        await Classroom.updateMany({ teacher: user._id }, { $unset: { teacher: "" } });
      }

      if (user.role === "student" && role !== "student") {
        await Classroom.updateMany({ students: user._id }, { $pull: { students: user._id } });
      }

      user.role = role;
    }

    await user.save();
    const out = user.toObject();
    delete out.password;
    return res.json({ user: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "user not found" });

    if (user.role === "teacher") {
      await Course.updateMany({ teacher: user._id }, { $unset: { teacher: "" } });
      await Classroom.updateMany({ teacher: user._id }, { $unset: { teacher: "" } });
    }

    if (user.role === "student") {
      await Classroom.updateMany({ students: user._id }, { $pull: { students: user._id } });
    }

    await User.deleteOne({ _id: user._id });
    return res.json({ message: "user deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};