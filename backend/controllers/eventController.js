const Event = require("../models/Event");
const Club = require("../models/Club");
const User = require("../models/User");
const Task = require("../models/Task");
const { generateEventPlan } = require("../services/aiService");

// ======================================================
// CREATE EVENT
// POST /api/events
// ======================================================
const createEvent = async (req, res) => {
    try {
        let {
            clubId,
            name,
            description,
            venue,
            startDate,
            endDate,
            expectedParticipants,
            expectedVolunteers
        } = req.body;

        if (!clubId) {
            const user = await User.findById(req.user.userId);
            if (user?.clubId) {
                clubId = user.clubId;
            } else {
                let club = await Club.findOne({
                    $or: [{ adminId: req.user.userId }, { members: req.user.userId }]
                });
                if (!club) {
                    club = await Club.create({
                        name: user?.name ? `${user.name}'s Club` : "Campus Tech Club",
                        description: "Student Operations & Event Management Club",
                        adminId: req.user.userId,
                        members: [req.user.userId]
                    });
                    await User.findByIdAndUpdate(req.user.userId, { clubId: club._id });
                }
                clubId = club._id;
            }
        }

        if (!clubId || !name || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "clubId, name, startDate and endDate are required"
            });
        }

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // User must belong to the club
        const isMember = club.members.some(
            member => member.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this club"
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid startDate or endDate"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "endDate must be after startDate"
            });
        }

        const event = await Event.create({
            clubId,
            name,
            description,
            venue,
            startDate: start,
            endDate: end,
            expectedParticipants: expectedParticipants || 0,
            expectedVolunteers: expectedVolunteers || 0,
            createdBy: req.user.userId
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: {
                event
            }
        });

    } catch (error) {
        console.error("Create event error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating event",
            error: {
                code: "CREATE_EVENT_ERROR"
            }
        });
    }
};


// ======================================================
// GET ALL EVENTS OF A CLUB
// GET /api/events/club/:clubId
// ======================================================
const getClubEvents = async (req, res) => {
    try {
        const { clubId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        const isMember = club.members.some(
            member => member.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this club"
            });
        }

        const events = await Event.find({ clubId })
            .populate("createdBy", "name email role")
            .sort({ startDate: 1 });

        return res.status(200).json({
            success: true,
            message: "Events fetched successfully",
            data: {
                events
            }
        });

    } catch (error) {
        console.error("Get club events error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching events",
            error: {
                code: "GET_CLUB_EVENTS_ERROR"
            }
        });
    }
};


// ======================================================
// GET EVENT BY ID
// GET /api/events/:eventId
// ======================================================
const getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId)
            .populate("clubId", "name description")
            .populate("createdBy", "name email role");

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
                message: "Associated club not found"
            });
        }

        const isMember = club.members.some(
            member => member.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this club"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event fetched successfully",
            data: {
                event
            }
        });

    } catch (error) {
        console.error("Get event error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching event",
            error: {
                code: "GET_EVENT_ERROR"
            }
        });
    }
};


// ======================================================
// UPDATE EVENT
// PUT /api/events/:eventId
// ======================================================
const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const club = await Club.findById(event.clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Associated club not found"
            });
        }

        // Only club admin or event creator can update
        const isAdmin =
            club.adminId.toString() === req.user.userId.toString();

        const isCreator =
            event.createdBy.toString() === req.user.userId.toString();

        if (!isAdmin && !isCreator) {
            return res.status(403).json({
                success: false,
                message: "Only club admin or event creator can update the event"
            });
        }

        const {
            name,
            description,
            venue,
            startDate,
            endDate,
            status,
            expectedParticipants,
            expectedVolunteers
        } = req.body;

        if (name !== undefined) {
            event.name = name;
        }

        if (description !== undefined) {
            event.description = description;
        }

        if (venue !== undefined) {
            event.venue = venue;
        }

        if (status !== undefined) {
            event.status = status;
        }

        if (expectedParticipants !== undefined) {
            event.expectedParticipants = expectedParticipants;
        }

        if (expectedVolunteers !== undefined) {
            event.expectedVolunteers = expectedVolunteers;
        }

        if (startDate !== undefined) {
            event.startDate = new Date(startDate);
        }

        if (endDate !== undefined) {
            event.endDate = new Date(endDate);
        }

        if (event.endDate <= event.startDate) {
            return res.status(400).json({
                success: false,
                message: "endDate must be after startDate"
            });
        }

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: {
                event
            }
        });

    } catch (error) {
        console.error("Update event error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating event",
            error: {
                code: "UPDATE_EVENT_ERROR"
            }
        });
    }
};


// ======================================================
// DELETE EVENT
// DELETE /api/events/:eventId
// ======================================================
const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const club = await Club.findById(event.clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Associated club not found"
            });
        }

        // Only club admin can delete
        if (club.adminId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the club admin can delete the event"
            });
        }

        await Event.findByIdAndDelete(eventId);

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error("Delete event error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting event",
            error: {
                code: "DELETE_EVENT_ERROR"
            }
        });
    }
};


// ======================================================
// GET MY CLUB'S EVENTS
// GET /api/events
// ======================================================
const getMyEvents = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Find all clubs where user is admin or member (or all clubs if admin/organizer)
        const clubs = await Club.find({
            $or: [
                { adminId: req.user.userId },
                { members: req.user.userId },
                ...(user.role === "admin" || user.role === "organizer" ? [{}] : [])
            ]
        });

        const clubIds = clubs.map(c => c._id);
        if (user.clubId && !clubIds.some(id => id.toString() === user.clubId.toString())) {
            clubIds.push(user.clubId);
        }

        let query = {};
        if (clubIds.length > 0) {
            query = { clubId: { $in: clubIds } };
        }

        const events = await Event.find(query)
            .populate("clubId", "name description")
            .populate("createdBy", "name email role")
            .sort({ startDate: 1 });

        return res.status(200).json({
            success: true,
            message: "Events fetched successfully",
            data: { events }
        });
    } catch (error) {
        console.error("Get my events error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching events"
        });
    }
};


// ======================================================
// AI-ASSISTED EVENT PLANNING
// POST /api/events/ai-plan
// ======================================================
const planEventWithAI = async (req, res) => {
    try {
        const { prompt, clubId, createImmediately } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Event planning prompt is required"
            });
        }

        let club = null;
        if (clubId) {
            club = await Club.findById(clubId);
        } else {
            const user = await User.findById(req.user.userId);
            if (user?.clubId) {
                club = await Club.findById(user.clubId);
            } else {
                club = await Club.findOne({
                    $or: [{ adminId: req.user.userId }, { members: req.user.userId }]
                });
            }
        }

        const plan = await generateEventPlan(prompt, club?.name || "Student Operations Club");

        // If user requested to immediately create the planned event with its tasks
        let createdEvent = null;
        let createdTasks = [];

        if (createImmediately && club) {
            const now = new Date();
            const start = new Date(now.getTime() + 14 * 86400000); // 2 weeks out
            const end = new Date(start.getTime() + (plan.durationDays || 2) * 86400000);

            createdEvent = await Event.create({
                clubId: club._id,
                name: plan.name,
                description: plan.description,
                venue: plan.venue,
                startDate: start,
                endDate: end,
                expectedParticipants: plan.expectedParticipants || 100,
                expectedVolunteers: plan.expectedVolunteers || 10,
                createdBy: req.user.userId,
                status: "planning"
            });

            if (Array.isArray(plan.suggestedTasks)) {
                for (const st of plan.suggestedTasks) {
                    const task = await Task.create({
                        eventId: createdEvent._id,
                        title: st.title,
                        description: st.description || "",
                        priority: st.priority || "medium",
                        status: "pending",
                        deadline: new Date(start.getTime() - 2 * 86400000),
                        createdBy: req.user.userId,
                        source: "ai_agent",
                        aiGenerated: true
                    });
                    createdTasks.push(task);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "AI Event Plan generated successfully",
            data: {
                plan,
                event: createdEvent,
                tasks: createdTasks
            }
        });

    } catch (error) {
        console.error("AI Event planning error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate AI event plan",
            error: error.message
        });
    }
};


module.exports = {
    createEvent,
    getClubEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getMyEvents,
    planEventWithAI
};