import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    dueDate: { type: Date, required: true },
    fileUrl: String, // optional file upload link
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // teacher
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
