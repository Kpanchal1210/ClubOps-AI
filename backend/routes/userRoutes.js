const express = require("express");

const {
    getUserById,
    updateUser,
    getUserClub
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// Get user
router.get("/:id", protect, getUserById);


// Update own user profile
router.patch("/:id", protect, updateUser);


// Get user's club
router.get("/:id/club", protect, getUserClub);


module.exports = router;