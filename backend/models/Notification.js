const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
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

        type: {
            type: String,
            enum: [
                "task_assigned",
                "task_deadline",
                "risk_detected",
                "announcement",
                "event_update"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ eventId: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);