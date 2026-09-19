const AgentAction = require("../models/AgentAction");

let runAgent;
try {
    runAgent = require("../ai/agent/agent").runAgent;
} catch (e) {
    runAgent = null;
}


// POST /api/agent/command
const createAgentAction = async (req, res) => {
    try {
        let {
            command,
            intent,
            tool,
            parameters,
            eventId
        } = req.body;

        if (!command) {
            return res.status(400).json({
                success: false,
                message: "command is required"
            });
        }

        let result = null;
        let status = "pending";

        if (!intent && runAgent && eventId) {
            try {
                const agentRes = await runAgent({
                    command,
                    userId: req.user.userId,
                    eventId
                });
                intent = agentRes.intent;
                parameters = agentRes.parameters;
                result = agentRes.result;
                status = "completed";
            } catch (err) {
                console.error("runAgent error:", err.message);
                intent = intent || "UNKNOWN";
                status = "failed";
                result = { error: err.message };
            }
        }

        const action = await AgentAction.create({
            userId: req.user.userId,
            eventId: eventId || undefined,
            command,
            intent: intent || "GENERAL_QUERY",
            tool: tool || (intent ? intent.toLowerCase() : undefined),
            parameters: parameters || {},
            status: status || "pending",
            result
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
        const query = {
            userId: req.user.userId
        };

        if (req.query.eventId) {
            query.eventId = req.query.eventId;
        }

        const actions = await AgentAction.find(query)
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