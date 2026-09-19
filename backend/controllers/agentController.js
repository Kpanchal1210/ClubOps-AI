const AgentAction = require("../models/AgentAction");


// POST /api/agent/command
const createAgentAction = async (req, res) => {
    try {
        const {
            command,
            intent,
            tool,
            parameters,
            eventId
        } = req.body;

        if (!command || !intent) {
            return res.status(400).json({
                success: false,
                message: "command and intent are required"
            });
        }

        const action = await AgentAction.create({
            userId: req.user.userId,
            eventId,
            command,
            intent,
            tool,
            parameters: parameters || {},
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Agent action created",
            data: action
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create agent action",
            error: error.message
        });
    }
};


// GET /api/agent/actions
const getAgentActions = async (req, res) => {
    try {
        const actions = await AgentAction.find({
            userId: req.user.userId
        })
            .populate("eventId", "name")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: actions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get agent actions",
            error: error.message
        });
    }
};


// GET /api/agent/actions/:id
const getAgentActionById = async (req, res) => {
    try {
        const action = await AgentAction.findById(req.params.id)
            .populate("eventId", "name");

        if (!action) {
            return res.status(404).json({
                success: false,
                message: "Agent action not found"
            });
        }

        if (
            action.userId.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        res.json({
            success: true,
            data: action
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get agent action",
            error: error.message
        });
    }
};


// Internal helper
const updateAgentAction = async (
    actionId,
    status,
    result = null
) => {
    return await AgentAction.findByIdAndUpdate(
        actionId,
        {
            status,
            result
        },
        { new: true }
    );
};


module.exports = {
    createAgentAction,
    getAgentActions,
    getAgentActionById,
    updateAgentAction
};