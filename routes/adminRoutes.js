import express from "express";
import Classroom from "../models/Classroom.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/admin/summary
 * @desc    Get summary of students (with class + course + teacher) 
 *          and teachers (with classes + students)
 * @access  Admin
 */
router.get(
  "/summary",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // Fetch all classrooms with populated data
      const classrooms = await Classroom.find()
        .populate("course", "name")
        .populate("teacher", "name email")
        .populate("students", "name email");

      // Fetch all students from Users collection
      const allStudents = await User.find({ role: "student" }, "name email");

      // STUDENT SUMMARY - Include all students, even those not in classrooms
      const students = [];
      
      // First, add students who are in classrooms
      const studentsInClassrooms = new Set();
      classrooms.forEach((cls) => {
        cls.students.forEach((student) => {
          studentsInClassrooms.add(student._id.toString());
          students.push({
            name: student.name,
            email: student.email,
            class: cls.name,
            course: cls.course?.name || "-",
            teacher: cls.teacher?.name || "-",
          });
        });
      });

      // Then, add students who are NOT in any classroom
      allStudents.forEach((student) => {
        if (!studentsInClassrooms.has(student._id.toString())) {
          students.push({
            name: student.name,
            email: student.email,
            class: "Not Assigned",
            course: "Not Assigned",
            teacher: "Not Assigned",
          });
        }
      });

      // TEACHER SUMMARY
      const teachers = [];
      classrooms.forEach((cls) => {
        if (cls.teacher) {
          let teacherEntry = teachers.find(
            (t) => t.email === cls.teacher.email
          );
          if (!teacherEntry) {
            teacherEntry = {
              name: cls.teacher.name,
              email: cls.teacher.email,
              classes: [],
            };
            teachers.push(teacherEntry);
          }

          teacherEntry.classes.push({
            name: cls.name,
            course: cls.course?.name || "-",
            students: cls.students.map((s) => s.name),
          });
        }
      });

      // Get counts for summary
      const counts = {
        totalStudents: allStudents.length,
        studentsInClasses: studentsInClassrooms.size,
        studentsNotAssigned: allStudents.length - studentsInClassrooms.size,
        totalTeachers: await User.countDocuments({ role: "teacher" }),
        totalCourses: await Course.countDocuments(),
        totalClasses: classrooms.length,
      };

      res.json({ students, teachers, counts });
    } catch (err) {
      console.error("Error fetching admin summary:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
