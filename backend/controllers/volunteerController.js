const Volunteer = require("../models/Volunteer");
const Event = require("../models/Event");
const Club = require("../models/Club");
const User = require("../models/User");


// CREATE VOLUNTEER
// POST /api/volunteers
const createVolunteer = async (req, res) => {
    try {
        const {
            eventId,
            userId,
            team,
            skills,
            availability
        } = req.body;

        if (!eventId || !userId) {
            return res.status(400).json({
                success: false,
                message: "eventId and userId are required"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const club = await Club.findById(event.clubId);

        const isMember = club.members.some(
            member => member.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const existing = await Volunteer.findOne({
            eventId,
            userId
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "User is already a volunteer for this event"
            });
        }

        const volunteer = await Volunteer.create({
            eventId,
            userId,
            team,
            skills: skills || user.skills || [],
            availability: availability || user.availability
        });

        return res.status(201).json({
            success: true,
            message: "Volunteer added successfully",
            data: { volunteer }
        });

    } catch (error) {
        console.error("Create volunteer error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating volunteer"
        });
    }
};


// GET EVENT VOLUNTEERS
// GET /api/volunteers/event/:eventId
const getEventVolunteers = async (req, res) => {
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

        const isMember = club.members.some(
            member => member.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const volunteers = await Volunteer.find({ eventId })
            .populate(
                "userId",
                "name email role skills availability"
            )
            .populate("assignedTasks");

        return res.status(200).json({
            success: true,
            message: "Volunteers fetched successfully",
            data: { volunteers }
        });

    } catch (error) {
        console.error("Get volunteers error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching volunteers"
        });
    }
};


// UPDATE VOLUNTEER
// PUT /api/volunteers/:volunteerId
const updateVolunteer = async (req, res) => {
    try {
        const { volunteerId } = req.params;

        const volunteer = await Volunteer.findById(volunteerId);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        const event = await Event.findById(volunteer.eventId);
        const club = await Club.findById(event.clubId);

        const isMember = club.members.some(
            member => member.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const {
            team,
            skills,
            availability,
            assignedTasks
        } = req.body;

        if (team !== undefined) volunteer.team = team;
        if (skills !== undefined) volunteer.skills = skills;
        if (availability !== undefined) {
            volunteer.availability = availability;
        }
        if (assignedTasks !== undefined) {
            volunteer.assignedTasks = assignedTasks;
        }

        await volunteer.save();

        return res.status(200).json({
            success: true,
            message: "Volunteer updated successfully",
            data: { volunteer }
        });

    } catch (error) {
        console.error("Update volunteer error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating volunteer"
        });
    }
};


// REMOVE VOLUNTEER
// DELETE /api/volunteers/:volunteerId
const deleteVolunteer = async (req, res) => {
    try {
        const { volunteerId } = req.params;

        const volunteer = await Volunteer.findById(volunteerId);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        const event = await Event.findById(volunteer.eventId);
        const club = await Club.findById(event.clubId);

        const isAdmin =
            club.adminId.toString() === req.user.userId.toString();

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only club admin can remove volunteers"
            });
        }

        await Volunteer.findByIdAndDelete(volunteerId);

        return res.status(200).json({
            success: true,
            message: "Volunteer removed successfully"
        });

    } catch (error) {
        console.error("Delete volunteer error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while removing volunteer"
        });
    }
};


module.exports = {
    createVolunteer,
    getEventVolunteers,
    updateVolunteer,
    deleteVolunteer
};