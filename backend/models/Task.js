const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
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

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        status: {
            type: String,
            enum: [
                "pending",
                "in_progress",
                "completed",
                "overdue",
                "cancelled"
            ],
            default: "pending"
        },

        deadline: {
            type: Date
        },

        source: {
            type: String,
            enum: ["manual", "ai_meeting", "ai_agent"],
            default: "manual"
        },

        aiGenerated: {
            type: Boolean,
            default: false
        },

        dependencies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task"
            }
        ]
    },
    {
        timestamps: true
    }
);

taskSchema.index({ eventId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model("Task", taskSchema);