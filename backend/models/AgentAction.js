const mongoose = require("mongoose");

const agentActionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        },

        command: {
            type: String,
            required: true
        },

        intent: {
            type: String,
            required: true
        },

        tool: {
            type: String
        },

        parameters: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        status: {
            type: String,
            enum: [
                "pending",
                "running",
                "completed",
                "failed"
            ],
            default: "pending"
        },

        result: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
);

agentActionSchema.index({ userId: 1 });
agentActionSchema.index({ eventId: 1 });
agentActionSchema.index({ createdAt: -1 });
agentActionSchema.index({ status: 1 });

module.exports = mongoose.model(
    "AgentAction",
    agentActionSchema
);