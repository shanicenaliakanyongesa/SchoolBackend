// ============== CONTROLLERS ==============

// controllers/submissionController.js
import Submission from "../models/Submission.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/submissions/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `submission-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|rtf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and document files are allowed!'));
    }
  }
});

export const uploadMiddleware = upload.single('submissionFile');

// Get all submissions for a specific assignment (for teachers)
export const getSubmissionsByAssignment = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email')
      .populate('assignment', 'title description dueDate')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all submissions by a specific student
export const getSubmissionsByStudent = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.params.studentId })
      .populate('assignment', 'title description dueDate classroom')
      .populate({
        path: 'assignment',
        populate: {
          path: 'classroom',
          select: 'name course',
          populate: {
            path: 'course',
            select: 'name'
          }
        }
      })
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new submission
export const createSubmission = async (req, res) => {
  try {
    const { assignment, student, submissionText } = req.body;
    
    // Check if submission already exists
    const existingSubmission = await Submission.findOne({ assignment, student });
    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted. Use update instead.' });
    }

    const submissionData = {
      assignment,
      student,
      submissionText: submissionText || ''
    };

    // Handle file upload if present
    if (req.file) {
      submissionData.submissionFile = req.file.path;
      submissionData.originalFileName = req.file.originalname;
      submissionData.fileSize = req.file.size;
    }

    const newSubmission = await Submission.create(submissionData);
    
    const populatedSubmission = await Submission.findById(newSubmission._id)
      .populate('student', 'name email')
      .populate('assignment', 'title description dueDate');
    
    res.status(201).json(populatedSubmission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a submission (for resubmissions)
export const updateSubmission = async (req, res) => {
  try {
    const { submissionText } = req.body;
    
    const updateData = {
      submissionText: submissionText || '',
      submittedAt: new Date() // Update submission time
    };

    // Handle new file upload if present
    if (req.file) {
      // Delete old file if it exists
      const oldSubmission = await Submission.findById(req.params.id);
      if (oldSubmission && oldSubmission.submissionFile && fs.existsSync(oldSubmission.submissionFile)) {
        fs.unlinkSync(oldSubmission.submissionFile);
      }

      updateData.submissionFile = req.file.path;
      updateData.originalFileName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('student', 'name email')
     .populate('assignment', 'title description dueDate');
    
    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(updatedSubmission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Grade a submission (for teachers)
export const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    
    // Get teacher ID from the request - handle both auth middleware and direct approach
    let gradedBy = null;
    if (req.user && req.user.id) {
      gradedBy = req.user.id;
    } else if (req.user && req.user._id) {
      gradedBy = req.user._id;
    }
    // If no auth middleware, gradedBy will remain null (optional field)
    
    const updateData = {
      grade: grade || '',
      feedback: feedback || '',
      gradedAt: new Date()
    };
    
    // Only add gradedBy if we have a user ID
    if (gradedBy) {
      updateData.gradedBy = gradedBy;
    }
    
    const updatedSubmission = await Submission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('student', 'name email')
     .populate('assignment', 'title description dueDate');
    
    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(updatedSubmission);
  } catch (err) {
    console.error('Error grading submission:', err);
    res.status(400).json({ message: err.message });
  }
};

// Delete a submission
export const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Delete associated file if it exists
    if (submission.submissionFile && fs.existsSync(submission.submissionFile)) {
      fs.unlinkSync(submission.submissionFile);
    }

    await Submission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Submission deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get submission statistics for a teacher's assignments
export const getSubmissionStats = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    const stats = await Submission.aggregate([
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignment',
          foreignField: '_id',
          as: 'assignmentData'
        }
      },
      {
        $unwind: '$assignmentData'
      },
      {
        $match: {
          'assignmentData.createdBy': mongoose.Types.ObjectId(teacherId)
        }
      },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          gradedSubmissions: {
            $sum: {
              $cond: [{ $ne: ['$grade', null] }, 1, 0]
            }
          },
          pendingSubmissions: {
            $sum: {
              $cond: [{ $eq: ['$grade', null] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalSubmissions: 0,
      gradedSubmissions: 0,
      pendingSubmissions: 0
    };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};