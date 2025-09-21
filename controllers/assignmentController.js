import Assignment from "../models/Assignment.js"; // <-- make sure you have this model

// Create a new assignment
export const createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      classroom: req.body.classroom,
      createdBy: req.body.createdBy,
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(500).json({ message: "Failed to create assignment" });
  }
};

// Get all assignments (optional, mostly for admin)
export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("classroom").populate("createdBy");
    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// Get one assignment by ID
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("classroom")
      .populate("createdBy");

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    res.json(assignment);
  } catch (err) {
    console.error("Error fetching assignment:", err);
    res.status(500).json({ message: "Failed to fetch assignment" });
  }
};

// ✅ Get assignments by classroom
export const getAssignmentsByClassroom = async (req, res) => {
  try {
    const assignments = await Assignment.find({ classroom: req.params.classroomId })
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments for classroom:", err);
    res.status(500).json({ message: "Failed to fetch classroom assignments" });
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
      },
      { new: true } // returns updated document
    );

    if (!updated) return res.status(404).json({ message: "Assignment not found" });

    res.json(updated);
  } catch (err) {
    console.error("Error updating assignment:", err);
    res.status(500).json({ message: "Failed to update assignment" });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found" });

    res.json({ message: "Assignment deleted successfully", _id: deleted._id });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
};
