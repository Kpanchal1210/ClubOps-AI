const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const eventCompletionJob = require("./jobs/eventCompletionJob");
const taskDeadlineJob = require("./jobs/taskDeadlineJob");

dotenv.config();


// --------------------------------------------------
// App
// --------------------------------------------------

const app = express();


// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());



// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ClubOps API is running"
    });
});


// --------------------------------------------------
// Routes
// --------------------------------------------------

const authRoutes = require("./routes/authRoutes");
const clubRoutes = require("./routes/clubRoutes");
const eventRoutes = require("./routes/eventRoutes");
const taskRoutes = require("./routes/taskRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const riskRoutes = require("./routes/riskRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const agentRoutes = require("./routes/agentRoutes");
const userRoutes = require("./routes/userRoutes");
const ragRoutes = require("./routes/ragRoutes");


// --------------------------------------------------
// API Mounting
// --------------------------------------------------

app.use("/api/auth", authRoutes);

app.use("/api/clubs", clubRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/volunteers", volunteerRoutes);

app.use("/api/risks", riskRoutes);

app.use("/api/meetings", meetingRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/agent", agentRoutes);

app.use("/api/users", userRoutes);

app.use("/api/rag", ragRoutes);


// --------------------------------------------------
// Event Dashboard
// --------------------------------------------------

const {
    getEventDashboard
} = require("./controllers/dashboardController");

const {
    protect
} = require("./middleware/authMiddleware");


app.get(
    "/api/events/:eventId/dashboard",
    protect,
    getEventDashboard
);


// --------------------------------------------------
// 404 Handler
// --------------------------------------------------

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});


// --------------------------------------------------
// Server
// --------------------------------------------------

const PORT = process.env.PORT || 5002;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        eventCompletionJob();
        taskDeadlineJob();
    });
        
    } catch (error) {
        console.error("Error starting server:", error.message);
        process.exit(1);
    } 
}


startServer();
