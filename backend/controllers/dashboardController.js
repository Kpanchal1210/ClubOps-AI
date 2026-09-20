const Event = require("../models/Event");
const Task = require("../models/Task");
const Risk = require("../models/Risk");
const Volunteer = require("../models/Volunteer");
const Meeting = require("../models/Meeting");
const Notification = require("../models/Notification");
const Club = require("../models/Club");


// GET /api/events/:eventId/dashboard
const getEventDashboard = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId)
            .populate("clubId", "name")
            .populate("createdBy", "name email");

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const club = await Club.findById(event.clubId._id);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        const isMember = club.members.some(
            memberId =>
                memberId.toString() === req.user.userId
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }


        // Fetch everything in parallel
        const [
            tasks,
            risks,
            volunteers,
            meetings,
            notifications
        ] = await Promise.all([
            Task.find({ eventId })
                .populate("assignedTo", "name email")
                .sort({ deadline: 1 }),

            Risk.find({ eventId })
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 }),

            Volunteer.find({ eventId })
                .populate("userId", "name email"),

            Meeting.find({ eventId })
                .populate("participants", "name email")
                .sort({ date: -1 })
                .limit(10),

            Notification.find({
                eventId,
                userId: req.user.userId
            })
                .sort({ createdAt: -1 })
                .limit(10)
        ]);


        // Statistics
        const totalTasks = tasks.length;

        const completedTasks = tasks.filter(
            task => task.status === "completed"
        ).length;

        const pendingTasks = tasks.filter(
            task =>
                task.status === "pending" ||
                task.status === "in_progress"
        ).length;

        const overdueTasks = tasks.filter(
            task => task.status === "overdue"
        ).length;

        const openRisks = risks.filter(
            risk =>
                risk.status === "open" ||
                risk.status === "investigating"
        ).length;


        res.json({
            success: true,

            data: {
                event,

                statistics: {
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    overdueTasks,
                    openRisks,
                    volunteers: volunteers.length
                },

                tasks,

                risks,

                volunteers,

                recentMeetings: meetings,

                notifications
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load event dashboard",
            error: error.message
        });
    }
};


module.exports = {
    getEventDashboard
};