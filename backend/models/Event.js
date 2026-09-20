const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        clubId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        venue: {
            type: String,
            trim: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["planning", "ongoing", "completed", "cancelled"],
            default: "planning"
        },

        expectedParticipants: {
            type: Number,
            default: 0,
            min: 0
        },

        expectedVolunteers: {
            type: Number,
            default: 0,
            min: 0
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

eventSchema.index({ clubId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });

module.exports = mongoose.model("Event", eventSchema);