const Club = require("../models/Club");
const User = require("../models/User");

// ======================================================
// CREATE CLUB
// POST /api/clubs
// ======================================================
const createClub = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Club name is required"
            });
        }

        // Logged-in user becomes club admin
        const adminId = req.user.userId;

        const club = await Club.create({
            name,
            description,
            adminId,
            members: [adminId]
        });

        // Add club to user's profile
        await User.findByIdAndUpdate(adminId, {
            clubId: club._id
        });

        return res.status(201).json({
            success: true,
            message: "Club created successfully",
            data: {
                club
            }
        });

    } catch (error) {
        console.error("Create club error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating club",
            error: {
                code: "CREATE_CLUB_ERROR"
            }
        });
    }
};


// ======================================================
// GET MY CLUB
// GET /api/clubs/my-club
// ======================================================
const getMyClub = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user || !user.clubId) {
            return res.status(404).json({
                success: false,
                message: "You are not part of any club"
            });
        }

        const club = await Club.findById(user.clubId)
            .populate("adminId", "name email role")
            .populate("members", "name email role skills availability");

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Club fetched successfully",
            data: {
                club
            }
        });

    } catch (error) {
        console.error("Get club error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching club",
            error: {
                code: "GET_CLUB_ERROR"
            }
        });
    }
};


// ======================================================
// GET CLUB BY ID
// GET /api/clubs/:clubId
// ======================================================
const getClubById = async (req, res) => {
    try {
        const { clubId } = req.params;

        const club = await Club.findById(clubId)
            .populate("adminId", "name email role")
            .populate("members", "name email role skills availability");

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // Check whether logged-in user belongs to this club
        const isMember = club.members.some(
            member => member._id.toString() === req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this club"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Club fetched successfully",
            data: {
                club
            }
        });

    } catch (error) {
        console.error("Get club by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching club",
            error: {
                code: "GET_CLUB_BY_ID_ERROR"
            }
        });
    }
};


// ======================================================
// UPDATE CLUB
// PUT /api/clubs/:clubId
// ======================================================
const updateClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const { name, description } = req.body;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // Only club admin can update
        if (club.adminId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the club admin can update the club"
            });
        }

        if (name !== undefined) {
            club.name = name;
        }

        if (description !== undefined) {
            club.description = description;
        }

        await club.save();

        return res.status(200).json({
            success: true,
            message: "Club updated successfully",
            data: {
                club
            }
        });

    } catch (error) {
        console.error("Update club error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating club",
            error: {
                code: "UPDATE_CLUB_ERROR"
            }
        });
    }
};


// ======================================================
// ADD MEMBER
// POST /api/clubs/:clubId/members
// ======================================================
const addMember = async (req, res) => {
    try {
        const { clubId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // Only club admin can add members
        if (club.adminId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the club admin can add members"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent duplicate members
        const alreadyMember = club.members.some(
            member => member.toString() === userId
        );

        if (alreadyMember) {
            return res.status(409).json({
                success: false,
                message: "User is already a member of this club"
            });
        }

        club.members.push(userId);
        await club.save();

        user.clubId = club._id;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            data: {
                club
            }
        });

    } catch (error) {
        console.error("Add member error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while adding member",
            error: {
                code: "ADD_MEMBER_ERROR"
            }
        });
    }
};


// ======================================================
// REMOVE MEMBER
// DELETE /api/clubs/:clubId/members/:userId
// ======================================================
const removeMember = async (req, res) => {
    try {
        const { clubId, userId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // Only club admin can remove members
        if (club.adminId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the club admin can remove members"
            });
        }

        // Admin cannot remove themselves
        if (club.adminId.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: "Club admin cannot be removed"
            });
        }

        const isMember = club.members.some(
            member => member.toString() === userId
        );

        if (!isMember) {
            return res.status(404).json({
                success: false,
                message: "User is not a member of this club"
            });
        }

        club.members = club.members.filter(
            member => member.toString() !== userId
        );

        await club.save();

        await User.findByIdAndUpdate(userId, {
            $unset: {
                clubId: ""
            }
        });

        return res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });

    } catch (error) {
        console.error("Remove member error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while removing member",
            error: {
                code: "REMOVE_MEMBER_ERROR"
            }
        });
    }
};


// ======================================================
// DELETE CLUB
// DELETE /api/clubs/:clubId
// ======================================================
const deleteClub = async (req, res) => {
    try {
        const { clubId } = req.params;

        const club = await Club.findById(clubId);

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        // Only club admin can delete
        if (club.adminId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the club admin can delete the club"
            });
        }

        // Remove clubId from all members
        await User.updateMany(
            { clubId: club._id },
            {
                $unset: {
                    clubId: ""
                }
            }
        );

        await Club.findByIdAndDelete(clubId);

        return res.status(200).json({
            success: true,
            message: "Club deleted successfully"
        });

    } catch (error) {
        console.error("Delete club error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting club",
            error: {
                code: "DELETE_CLUB_ERROR"
            }
        });
    }
};


// ======================================================
// GET ALL CLUBS
// GET /api/clubs
// ======================================================
const getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find({})
            .populate("adminId", "name email role")
            .populate("members", "name email role skills availability")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            message: "Clubs fetched successfully",
            data: { clubs }
        });
    } catch (error) {
        console.error("Get all clubs error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching clubs"
        });
    }
};


module.exports = {
    createClub,
    getMyClub,
    getClubById,
    getAllClubs,
    updateClub,
    addMember,
    removeMember,
    deleteClub
};