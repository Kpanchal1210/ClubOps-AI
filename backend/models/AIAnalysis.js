const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
    {
        meetingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        summary: {
            type: String
        },

        tasks: [
            {
                title: {
                    type: String,
                    required: true
                },

                ownerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },

                deadline: {
                    type: Date
                },

                priority: {
                    type: String,
                    enum: ["low", "medium", "high", "critical"]
                }
            }
        ],

        risks: [
            {
                title: {
                    type: String,
                    required: true
                },

                severity: {
                    type: String,
                    enum: ["low", "medium", "high", "critical"]
                },

                description: {
                    type: String
                }
            }
        ],

        decisions: {
            type: [String],
            default: []
        },

        actionItems: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

aiAnalysisSchema.index({ meetingId: 1 });
aiAnalysisSchema.index({ eventId: 1 });

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);