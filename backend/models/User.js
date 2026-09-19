const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["admin", "organizer", "member"],
            default: "member"
        },

        clubId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Club"
        },

        skills: {
            type: [String],
            default: []
        },

        availability: {
            type: String,
            enum: ["available", "busy", "unavailable"],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ clubId: 1 });

module.exports = mongoose.model("User", userSchema);