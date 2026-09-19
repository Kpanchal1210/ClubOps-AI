const express = require("express");

const {
    createMeeting,
    getEventMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting
} = require("../controllers/meetingController");

const {
    analyzeMeeting
} = require("../controllers/aiAnalysisController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// --------------------------------------------------
// Meeting routes
// --------------------------------------------------

router.post("/", protect, createMeeting);

router.get("/event/:eventId", protect, getEventMeetings);

router.get("/:meetingId", protect, getMeetingById);

router.put("/:meetingId", protect, updateMeeting);

router.patch("/:meetingId", protect, updateMeeting);

router.delete("/:meetingId", protect, deleteMeeting);


// --------------------------------------------------
// AI Meeting Processing
// Both endpoints call the same controller
// --------------------------------------------------

router.post(
    "/:meetingId/process",
    protect,
    analyzeMeeting
);

// Backward-compatible endpoint
router.post(
    "/:meetingId/analyze",
    protect,
    analyzeMeeting
);


module.exports = router;