import express from "express";
import * as assignmentCtrl from "../controllers/assignmentController.js";

const router = express.Router();

router.post("/", assignmentCtrl.createAssignment);
router.get("/", assignmentCtrl.getAssignments);
router.get("/classroom/:classroomId", assignmentCtrl.getAssignmentsByClassroom); // ✅ for TeachersDashboard
router.get("/:id", assignmentCtrl.getAssignmentById);
router.put("/:id", assignmentCtrl.updateAssignment);
router.delete("/:id", assignmentCtrl.deleteAssignment);

export default router;
