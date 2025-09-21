import express from "express";
import {
  getAnnouncements,
  getAnnouncementsByClassroom,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

const router = express.Router();

router.get("/", getAnnouncements);
router.get("/classroom/:classroomId", getAnnouncementsByClassroom);
router.post("/", createAnnouncement);
router.put("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);

export default router;
