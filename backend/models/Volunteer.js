const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        team: {
            type: String,
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        availability: {
            type: String,
            enum: ["available", "busy", "unavailable"],
            default: "available"
        },

        assignedTasks: [
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

volunteerSchema.index({ eventId: 1 });
volunteerSchema.index({ userId: 1 });

module.exports = mongoose.model("Volunteer", volunteerSchema);