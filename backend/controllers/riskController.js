const Risk = require("../models/Risk");
const Event = require("../models/Event");
const Club = require("../models/Club");


// CREATE RISK
// POST /api/risks
const createRisk = async (req, res) => {
    try {
        const {
            eventId,
            title,
            description,
            severity,
            probability,
            recommendedAction,
            assignedTo,
            detectedBy
        } = req.body;

        if (!eventId || !title) {
            return res.status(400).json({
                success: false,
                message: "eventId and title are required"
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

        const risk = await Risk.create({
            eventId,
            title,
            description,
            severity: severity || "medium",
            probability: probability || "medium",
            recommendedAction,
            assignedTo,
            detectedBy: detectedBy || "manual"
        });

        return res.status(201).json({
            success: true,
            message: "Risk created successfully",
            data: { risk }
        });

    } catch (error) {
        console.error("Create risk error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating risk"
        });
    }
};


// GET EVENT RISKS
// GET /api/risks/event/:eventId
const getEventRisks = async (req, res) => {
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

        const risks = await Risk.find({ eventId })
            .populate("assignedTo", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Risks fetched successfully",
            data: { risks }
        });

    } catch (error) {
        console.error("Get risks error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching risks"
        });
    }
};


// UPDATE RISK
// PUT /api/risks/:riskId
const updateRisk = async (req, res) => {
    try {
        const { riskId } = req.params;

        const risk = await Risk.findById(riskId);

        if (!risk) {
            return res.status(404).json({
                success: false,
                message: "Risk not found"
            });
        }

        const event = await Event.findById(risk.eventId);
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
            title,
            description,
            severity,
            probability,
            status,
            recommendedAction,
            assignedTo
        } = req.body;

        if (title !== undefined) risk.title = title;
        if (description !== undefined) risk.description = description;
        if (severity !== undefined) risk.severity = severity;
        if (probability !== undefined) risk.probability = probability;
        if (status !== undefined) risk.status = status;
        if (recommendedAction !== undefined) {
            risk.recommendedAction = recommendedAction;
        }
        if (assignedTo !== undefined) risk.assignedTo = assignedTo;

        await risk.save();

        return res.status(200).json({
            success: true,
            message: "Risk updated successfully",
            data: { risk }
        });

    } catch (error) {
        console.error("Update risk error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating risk"
        });
    }
};


// DELETE RISK
// DELETE /api/risks/:riskId
const deleteRisk = async (req, res) => {
    try {
        const { riskId } = req.params;

        const risk = await Risk.findById(riskId);

        if (!risk) {
            return res.status(404).json({
                success: false,
                message: "Risk not found"
            });
        }

        const event = await Event.findById(risk.eventId);
        const club = await Club.findById(event.clubId);

        const isAdmin =
            club.adminId.toString() === req.user.userId.toString();

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only club admin can delete risks"
            });
        }

        await Risk.findByIdAndDelete(riskId);

        return res.status(200).json({
            success: true,
            message: "Risk deleted successfully"
        });

    } catch (error) {
        console.error("Delete risk error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting risk"
        });
    }
};


module.exports = {
    createRisk,
    getEventRisks,
    updateRisk,
    deleteRisk
};