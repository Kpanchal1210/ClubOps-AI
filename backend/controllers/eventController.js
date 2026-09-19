const Event = require("../models/Event");
const Club = require("../models/Club");
const User = require("../models/User");

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
                const club = await Club.findOne({
                    $or: [{ adminId: req.user.userId }, { members: req.user.userId }]
                });
                if (club) clubId = club._id;
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

        let clubId = user.clubId;
        if (!clubId) {
            const club = await Club.findOne({
                $or: [{ adminId: req.user.userId }, { members: req.user.userId }]
            });
            if (club) clubId = club._id;
        }

        if (!clubId) {
            return res.status(200).json({
                success: true,
                message: "No club associated with user",
                data: { events: [] }
            });
        }

        const events = await Event.find({ clubId })
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


module.exports = {
    createEvent,
    getClubEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getMyEvents
};