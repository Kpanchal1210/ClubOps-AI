const express = require("express");

const {
    createVolunteer,
    getEventVolunteers,
    updateVolunteer,
    deleteVolunteer
} = require("../controllers/volunteerController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createVolunteer);

router.get("/event/:eventId", protect, getEventVolunteers);

router.put("/:volunteerId", protect, updateVolunteer);

router.delete("/:volunteerId", protect, deleteVolunteer);

module.exports = router;