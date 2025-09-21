import Announcement from "../models/Announcement.js";

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate("createdBy", "name");
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAnnouncementsByClassroom = async (req, res) => {
  try {
    const announcements = await Announcement.find({ classroom: req.params.classroomId })
      .populate("createdBy", "name");
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const newAnnouncement = await Announcement.create(req.body);
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
