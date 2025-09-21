// routes/classrooms.js
import express from "express";
import * as classCtrl from "../controllers/classroomController.js";

const router = express.Router();

router.post("/", /* requireRole("admin"), */ classCtrl.createClassroom);
router.get("/", classCtrl.getClassrooms);

// ✅ Move this above the :id route
router.get("/student/:studentId", classCtrl.getClassroomsByStudent);

router.get("/:id", classCtrl.getClassroomById);
router.put("/:id", /* requireRole("admin"), */ classCtrl.updateClassroom);
router.delete("/:id", /* requireRole("admin"), */ classCtrl.deleteClassroom);

// optional endpoints
router.post("/:id/add-student", /* requireRole("admin"), */ classCtrl.addStudentToClassroom);
router.post("/:id/remove-student", /* requireRole("admin"), */ classCtrl.removeStudentFromClassroom);

export default router;
