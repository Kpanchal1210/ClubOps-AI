const mongoose = require("mongoose");

const riskSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        probability: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        status: {
            type: String,
            enum: ["open", "investigating", "resolved", "ignored"],
            default: "open"
        },

        detectedBy: {
            type: String,
            enum: ["manual", "ai"],
            default: "manual"
        },

        recommendedAction: {
            type: String,
            trim: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

riskSchema.index({ eventId: 1 });
riskSchema.index({ severity: 1 });
riskSchema.index({ status: 1 });

module.exports = mongoose.model("Risk", riskSchema);