const express = require("express");

const {
    createClub,
    getMyClub,
    getClubById,
    getAllClubs,
    updateClub,
    addMember,
    removeMember,
    deleteClub
} = require("../controllers/clubController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// Get all clubs
router.get("/", protect, getAllClubs);

// Create club
router.post("/", protect, createClub);


// Get logged-in user's club
router.get("/my-club", protect, getMyClub);


// Get specific club
router.get("/:clubId", protect, getClubById);


// Update club
router.put("/:clubId", protect, updateClub);


// Add member
router.post("/:clubId/members", protect, addMember);


// Remove member
router.delete(
    "/:clubId/members/:userId",
    protect,
    removeMember
);


// Delete club
router.delete("/:clubId", protect, deleteClub);


module.exports = router;