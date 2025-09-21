
// routes/submissionRoutes.js
import express from "express";
import {
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  createSubmission,
  updateSubmission,
  gradeSubmission,
  deleteSubmission,
  getSubmissionStats,
  uploadMiddleware
} from "../controllers/submissionController.js";

const router = express.Router();

// Get submissions by assignment (for teachers)
router.get("/assignment/:assignmentId", getSubmissionsByAssignment);

// Get submissions by student
router.get("/student/:studentId", getSubmissionsByStudent);

// Get submission statistics for a teacher
router.get("/stats/:teacherId", getSubmissionStats);

// Create new submission (with file upload)
router.post("/", uploadMiddleware, createSubmission);

// Update submission (with file upload)
router.put("/:id", uploadMiddleware, updateSubmission);

// Grade a submission (for teachers)
router.put("/:id/grade", gradeSubmission);

// Delete submission
router.delete("/:id", deleteSubmission);

export default router;