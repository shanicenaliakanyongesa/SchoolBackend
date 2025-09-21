// routes/courses.js
import express from "express";
import * as courseCtrl from "../controllers/courseController.js";
const router = express.Router();

router.post("/", /* requireRole("admin"), */ courseCtrl.createCourse);
router.get("/", courseCtrl.getCourses);
router.get("/:id", courseCtrl.getCourseById);
router.put("/:id", /* requireRole("admin"), */ courseCtrl.updateCourse);
router.delete("/:id", /* requireRole("admin"), */ courseCtrl.deleteCourse);

export default router;
