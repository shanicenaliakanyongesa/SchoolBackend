// controllers/classroomController.js
import mongoose from "mongoose";
import Classroom from "../models/Classroom.js";
import Course from "../models/Course.js";
import User from "../models/User.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createClassroom = async (req, res) => {
  try {
    const { name, course: courseId, teacher: teacherId, students: studentIds } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    // Validate course
    if (!courseId || !isValidId(courseId)) return res.status(400).json({ message: "valid course id is required" });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "course not found" });

    // Validate teacher if provided
    let teacher = null;
    if (teacherId) {
      if (!isValidId(teacherId)) return res.status(400).json({ message: "invalid teacher id" });
      teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== "teacher") return res.status(400).json({ message: "given teacher id is not a teacher" });
    }

    // Validate students if provided
    let students = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      // unique
      const uniqueIds = [...new Set(studentIds)];
      for (const sid of uniqueIds) {
        if (!isValidId(sid)) return res.status(400).json({ message: `invalid student id: ${sid}` });
      }

      // ensure they exist and are students
      const foundUsers = await User.find({ _id: { $in: uniqueIds } });
      const notFound = uniqueIds.filter((id) => !foundUsers.some((u) => u._id.equals(id)));
      if (notFound.length) return res.status(404).json({ message: `students not found: ${notFound.join(", ")}` });

      const nonStudents = foundUsers.filter((u) => u.role !== "student").map((u) => u._id.toString());
      if (nonStudents.length) return res.status(400).json({ message: `these users are not students: ${nonStudents.join(", ")}` });

      // ensure none are already in another classroom
      const occupying = await Classroom.find({ students: { $in: uniqueIds } });
      if (occupying.length) {
        // collect ids that are already assigned
        const alreadyAssigned = [];
        for (const c of occupying) {
          for (const s of c.students) {
            if (uniqueIds.some((id) => s.equals(id))) alreadyAssigned.push(s.toString());
          }
        }
        if (alreadyAssigned.length) return res.status(400).json({ message: `these students already belong to a classroom: ${[...new Set(alreadyAssigned)].join(", ")}` });
      }

      students = uniqueIds;
    }

    const classroom = await Classroom.create({
      name,
      course: course._id,
      teacher: teacher ? teacher._id : undefined,
      students
    });

    const out = await Classroom.findById(classroom._id)
      .populate("course", "name")
      .populate("teacher", "name email")
      .populate("students", "name email");

    return res.status(201).json({ classroom: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find()
      .populate("course", "name")
      .populate("teacher", "name email")
      .populate("students", "name email");
    return res.json({ classrooms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const getClassroomById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const classroom = await Classroom.findById(id)
      .populate("course", "name description")
      .populate("teacher", "name email")
      .populate("students", "name email");

    if (!classroom) return res.status(404).json({ message: "classroom not found" });
    return res.json({ classroom });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

// NEW FUNCTION: Get classrooms by student ID
export const getClassroomsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!isValidId(studentId)) return res.status(400).json({ message: "invalid student id" });

    const classrooms = await Classroom.find({ students: studentId })
      .populate("course", "name description")
      .populate("teacher", "name email")
      .populate("students", "name email")
      .lean();
    
    res.json(classrooms);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const classroom = await Classroom.findById(id);
    if (!classroom) return res.status(404).json({ message: "classroom not found" });

    const { name, course: courseId, teacher: teacherId, students: studentIds } = req.body;

    if (name) classroom.name = name;

    if (courseId) {
      if (!isValidId(courseId)) return res.status(400).json({ message: "invalid course id" });
      const c = await Course.findById(courseId);
      if (!c) return res.status(404).json({ message: "course not found" });
      classroom.course = c._id;
    }

    if (teacherId !== undefined) {
      if (teacherId === null || teacherId === "") {
        classroom.teacher = undefined;
      } else {
        if (!isValidId(teacherId)) return res.status(400).json({ message: "invalid teacher id" });
        const t = await User.findById(teacherId);
        if (!t || t.role !== "teacher") return res.status(400).json({ message: "teacher id is not a teacher user" });
        classroom.teacher = t._id;
      }
    }

    if (studentIds !== undefined) {
      // Replace student list: validate
      if (!Array.isArray(studentIds)) return res.status(400).json({ message: "students must be an array of ids" });
      const uniqueIds = [...new Set(studentIds)];
      for (const sid of uniqueIds) if (!isValidId(sid)) return res.status(400).json({ message: `invalid student id: ${sid}` });

      const foundUsers = await User.find({ _id: { $in: uniqueIds } });
      const notFound = uniqueIds.filter((id) => !foundUsers.some((u) => u._id.equals(id)));
      if (notFound.length) return res.status(404).json({ message: `students not found: ${notFound.join(", ")}` });

      const nonStudents = foundUsers.filter((u) => u.role !== "student").map((u) => u._id.toString());
      if (nonStudents.length) return res.status(400).json({ message: `these users are not students: ${nonStudents.join(", ")}` });

      // ensure none are assigned to OTHER classrooms
      const occupying = await Classroom.find({ students: { $in: uniqueIds }, _id: { $ne: classroom._id } });
      if (occupying.length) {
        const alreadyAssigned = [];
        for (const c of occupying) {
          for (const s of c.students) {
            if (uniqueIds.some((id) => s.equals(id))) alreadyAssigned.push(s.toString());
          }
        }
        if (alreadyAssigned.length) return res.status(400).json({ message: `these students already belong to another classroom: ${[...new Set(alreadyAssigned)].join(", ")}` });
      }

      classroom.students = uniqueIds;
    }

    await classroom.save();
    const out = await Classroom.findById(classroom._id)
      .populate("course", "name")
      .populate("teacher", "name email")
      .populate("students", "name email");
    return res.json({ classroom: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "invalid id" });

    const classroom = await Classroom.findById(id);
    if (!classroom) return res.status(404).json({ message: "classroom not found" });

    await Classroom.deleteOne({ _id: classroom._id });
    return res.json({ message: "classroom deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

// Small helpers: add/remove single student (optional endpoints)
export const addStudentToClassroom = async (req, res) => {
  try {
    const { id } = req.params; // classroom id
    const { studentId } = req.body;
    if (!isValidId(id) || !isValidId(studentId)) return res.status(400).json({ message: "invalid id(s)" });

    const classroom = await Classroom.findById(id);
    if (!classroom) return res.status(404).json({ message: "classroom not found" });

    const user = await User.findById(studentId);
    if (!user || user.role !== "student") return res.status(400).json({ message: "studentId must be a student user" });

    // ensure not in another classroom
    const occupying = await Classroom.findOne({ students: studentId });
    if (occupying && !occupying._id.equals(classroom._id)) return res.status(400).json({ message: "student already in another classroom" });

    if (!classroom.students.some((s) => s.equals(studentId))) classroom.students.push(studentId);
    await classroom.save();

    const out = await Classroom.findById(classroom._id).populate("students", "name email");
    return res.json({ classroom: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const removeStudentFromClassroom = async (req, res) => {
  try {
    const { id } = req.params; // classroom id
    const { studentId } = req.body;
    if (!isValidId(id) || !isValidId(studentId)) return res.status(400).json({ message: "invalid id(s)" });

    const classroom = await Classroom.findById(id);
    if (!classroom) return res.status(404).json({ message: "classroom not found" });

    classroom.students = classroom.students.filter((s) => !s.equals(studentId));
    await classroom.save();
    const out = await Classroom.findById(classroom._id).populate("students", "name email");
    return res.json({ classroom: out });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};