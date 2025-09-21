// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usersRouter from "./routes/users.js";
import coursesRouter from "./routes/courses.js";
import classroomsRouter from "./routes/classrooms.js";
import assignmentsRouter from "./routes/assignment.js"; // ✅ NEW
import announcementRoutes from "./routes/announcementRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";



// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ============================
// Global Middleware
// ============================

// ✅ CORS Setup (allow localhost + production URL)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://your-frontend-url.com", // change when deploying
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// ✅ JSON & URL-encoded Body Parsing
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================
// Routes
// ============================
app.use("/api/auth", authRoutes);       // login & register
app.use("/api/users", usersRouter);     // admin creates users (role-based)
app.use("/api/courses", coursesRouter); // manage courses
app.use("/api/classrooms", classroomsRouter); // manage classrooms
app.use("/api/assignments", assignmentsRouter); // ✅ manage assignments
app.use("/api/admin", adminRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/submissions", submissionRoutes);

// ADD THIS LINE - Static file serving for uploads
app.use("/uploads", express.static("uploads"));
// ============================
// Health Check
// ============================
app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 API is running..." });
});

// ============================
// Error Handling Middleware
// ============================
app.use((req, res) => {
  res.status(404).json({ message: "❌ Route not found" });
});

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  )
);
