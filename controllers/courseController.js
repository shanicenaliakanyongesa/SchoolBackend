// controllers/courseController.js
import mongoose from "mongoose";
import Course from "../models/Course.js";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createCourse = async (req, res) => {
  try {
    const { name, description, teacher } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    if (teacher) {
      if (!isValidId(teacher)) return res.status(400).json({ message: "invalid teacher id" });
      const t = await User.findById(teacher);
      if (!t || t.role !== "teacher")
        return res.status(400).json({ message: "teacher id is not a teacher user" });
    }

    const course = await Course.create({ name, description: description || "", teacher: teacher || null });
    return res.status(201).json({ course });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("teacher", "name email").lean();
    return res.json({ courses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const course = await Course.findById(id).populate("teacher", "name email").lean();
    if (!course) return res.status(404).json({ message: "course not found" });

    // Add list of classrooms using this course (helpful)
    const classrooms = await Classroom.find({ course: id }).populate("teacher", "name email").lean();
    return res.json({ course, classrooms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const { name, description, teacher } = req.body;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "course not found" });

    if (teacher) {
      if (!isValidId(teacher)) return res.status(400).json({ message: "invalid teacher id" });
      const t = await User.findById(teacher);
      if (!t || t.role !== "teacher")
        return res.status(400).json({ message: "teacher id is not a teacher user" });
      course.teacher = teacher;
    } else if (teacher === null || teacher === "") {
      course.teacher = undefined;
    }

    if (name) course.name = name;
    if (description !== undefined) course.description = description;

    await course.save();
    const out = await Course.findById(id).populate("teacher", "name email");
    return res.json({ course: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "course not found" });

    // Unlink this course from classrooms (set course to null)
    await Classroom.updateMany({ course: course._id }, { $unset: { course: "" } });

    await Course.deleteOne({ _id: course._id });
    return res.json({ message: "course deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};
