import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Assignment", 
      required: true 
    },
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    submissionText: { 
      type: String, 
      trim: true 
    },
    submissionFile: { 
      type: String // URL or file path
    },
    originalFileName: { 
      type: String 
    },
    fileSize: { 
      type: Number 
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    },
    grade: { 
      type: String, 
      trim: true 
    },
    feedback: { 
      type: String, 
      trim: true 
    },
    gradedAt: { 
      type: Date 
    },
    gradedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }
  },
  { timestamps: true }
);

// Ensure one submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);