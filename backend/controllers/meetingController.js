const Meeting = require("../models/Meeting");
const AIAnalysis = require("../models/AIAnalysis");
const Event = require("../models/Event");
const Club = require("../models/Club");
const { processMeetingAnalysisInternal } = require("./aiAnalysisController");


// --------------------------------------------------
// Helper: Check event access
// --------------------------------------------------

const checkEventAccess = async (eventId, userId) => {
    const event = await Event.findById(eventId);

    if (!event) {
        return {
            allowed: false,
            event: null,
            message: "Event not found"
        };
    }

    const club = await Club.findById(event.clubId);

    if (!club) {
        return {
            allowed: false,
            event: null,
            message: "Club not found"
        };
    }

    const isMember = club.members.some(
        memberId =>
            memberId.toString() === userId.toString()
    );

    if (!isMember) {
        return {
            allowed: false,
            event: null,
            message: "You are not a member of this club"
        };
    }

    return {
        allowed: true,
        event,
        club
    };
};


// --------------------------------------------------
// POST /api/meetings
// --------------------------------------------------

const createMeeting = async (req, res) => {
    try {
        const {
            eventId,
            title,
            date,
            participants,
            transcript
        } = req.body;

        if (!eventId || !title || !date) {
            return res.status(400).json({
                success: false,
                message: "eventId, title and date are required"
            });
        }

        const access = await checkEventAccess(
            eventId,
            req.user.userId
        );

        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        const meeting = await Meeting.create({
            eventId,
            title,
            date,
            participants: participants || [],
            transcript
        });

        // Automatically analyze transcript, prioritize tasks, and allocate to volunteers
        if (transcript && transcript.trim()) {
            try {
                const analysisResult = await processMeetingAnalysisInternal({
                    meetingId: meeting._id,
                    userId: req.user.userId
                });

                return res.status(201).json({
                    success: true,
                    message: "Meeting created and analyzed with tasks allocated successfully",
                    data: {
                        meeting: analysisResult.meeting || meeting,
                        analysis: analysisResult.analysis,
                        createdTasks: analysisResult.createdTasks,
                        createdRisks: analysisResult.createdRisks,
                        _id: meeting._id,
                        title: meeting.title,
                        date: meeting.date,
                        summary: analysisResult.meeting?.summary || meeting.summary,
                        processedByAI: true
                    }
                });
            } catch (aiErr) {
                console.warn("[Create Meeting] Auto-analysis warning:", aiErr.message);
                return res.status(201).json({
                    success: true,
                    message: "Meeting created successfully (AI processing pending)",
                    data: meeting
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: "Meeting created successfully",
            data: meeting
        });

    } catch (error) {
        console.error("Create meeting error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create meeting",
            error: error.message
        });
    }
};


// --------------------------------------------------
// GET /api/meetings/event/:eventId
// --------------------------------------------------

const getEventMeetings = async (req, res) => {
    try {
        const { eventId } = req.params;

        const access = await checkEventAccess(
            eventId,
            req.user.userId
        );

        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        const meetings = await Meeting.find({
            eventId
        })
            .populate(
                "participants",
                "name email role"
            )
            .sort({
                date: -1
            });

        return res.json({
            success: true,
            data: meetings
        });

    } catch (error) {
        console.error(
            "Get event meetings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get meetings",
            error: error.message
        });
    }
};


// --------------------------------------------------
// GET /api/meetings/:meetingId
// --------------------------------------------------

const getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(
            req.params.meetingId
        )
            .populate(
                "participants",
                "name email role"
            )
            .populate(
                "eventId",
                "name clubId startDate endDate"
            );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        const access = await checkEventAccess(
            meeting.eventId._id,
            req.user.userId
        );

        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        return res.json({
            success: true,
            data: meeting
        });

    } catch (error) {
        console.error(
            "Get meeting error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get meeting",
            error: error.message
        });
    }
};


// --------------------------------------------------
// PUT /api/meetings/:meetingId
// --------------------------------------------------

const updateMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(
            req.params.meetingId
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        const access = await checkEventAccess(
            meeting.eventId,
            req.user.userId
        );

        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        const {
            title,
            date,
            participants,
            transcript
        } = req.body;

        if (title !== undefined) {
            meeting.title = title;
        }

        if (date !== undefined) {
            meeting.date = date;
        }

        if (participants !== undefined) {
            meeting.participants = participants;
        }

        if (transcript !== undefined) {
            meeting.transcript = transcript;
            meeting.processedByAI = false;
        }

        await meeting.save();

        return res.json({
            success: true,
            message: "Meeting updated successfully",
            data: meeting
        });

    } catch (error) {
        console.error(
            "Update meeting error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update meeting",
            error: error.message
        });
    }
};


// --------------------------------------------------
// DELETE /api/meetings/:meetingId
// --------------------------------------------------

const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(
            req.params.meetingId
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        const access = await checkEventAccess(
            meeting.eventId,
            req.user.userId
        );

        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        await AIAnalysis.deleteMany({
            meetingId: meeting._id
        });

        await Meeting.findByIdAndDelete(
            meeting._id
        );

        return res.json({
            success: true,
            message: "Meeting deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete meeting error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete meeting",
            error: error.message
        });
    }
};


module.exports = {
    createMeeting,
    getEventMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting
};