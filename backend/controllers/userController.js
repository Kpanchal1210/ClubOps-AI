const User = require("../models/User");
const Club = require("../models/Club");


// --------------------------------------------------
// GET /api/users/:id
// --------------------------------------------------

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("clubId", "name description");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: error.message
        });
    }
};


// --------------------------------------------------
// PATCH /api/users/:id
// --------------------------------------------------

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // User can update only their own profile
        if (userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own profile"
            });
        }

        const {
            name,
            skills,
            availability
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (name !== undefined) {
            user.name = name.trim();
        }

        if (skills !== undefined) {
            user.skills = skills;
        }

        if (availability !== undefined) {
            user.availability = availability;
        }

        await user.save();

        return res.json({
            success: true,
            message: "User updated successfully",
            data: user
        });

    } catch (error) {
        console.error("Update user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};


// --------------------------------------------------
// GET /api/users/:id/club
// --------------------------------------------------

const getUserClub = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.clubId) {
            return res.json({
                success: true,
                data: null
            });
        }

        const club = await Club.findById(user.clubId)
            .populate("adminId", "name email")
            .populate("members", "name email role");

        return res.json({
            success: true,
            data: club
        });

    } catch (error) {
        console.error("Get user club error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get user club",
            error: error.message
        });
    }
};


module.exports = {
    getUserById,
    updateUser,
    getUserClub
};