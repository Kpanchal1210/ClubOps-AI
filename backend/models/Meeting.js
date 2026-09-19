const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
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

        date: {
            type: Date,
            required: true
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        transcript: {
            type: String
        },

        summary: {
            type: String
        },

        processedByAI: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

meetingSchema.index({ eventId: 1 });
meetingSchema.index({ date: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);