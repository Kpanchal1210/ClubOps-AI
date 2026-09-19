const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        clubId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club",
            required: true
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        fileName: {
            type: String,
            required: true
        },

        fileType: {
            type: String,
            required: true
        },

        fileUrl: {
            type: String
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String
        },

        processed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

documentSchema.index({ clubId: 1 });
documentSchema.index({ eventId: 1 });

module.exports = mongoose.model("Document", documentSchema);