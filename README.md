🚀 Phase 1: Project Setup
🔹 Step 1: Backend Setup (Node + Express + MongoDB)

1. Create Backend Folder

mkdir student-management-backend
cd student-management-backend
npm init -y

2. Install Dependencies


npm install express mongoose cors dotenv
npm install --save-dev nodemon

3. Setup Server

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Student Management API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

4. Add .env File

MONGO_URI=mongodb://127.0.0.1:27017/student_management

5. Run Server

npx nodemon server.js

✅ Backend is now ready.