const express = require("express");

const {
    createEvent,
    getClubEvents,
    getEventById,
    updateEvent,
    deleteEvent
} = require("../controllers/eventController");

const {
    getEventTasks
} = require("../controllers/taskController");

const {
    getEventVolunteers
} = require("../controllers/volunteerController");

const {
    getEventRisks
} = require("../controllers/riskController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// --------------------------------------------------
// Event routes
// --------------------------------------------------

router.post("/", protect, createEvent);

router.get("/club/:clubId", protect, getClubEvents);


// --------------------------------------------------
// Event related data
// IMPORTANT: These must come BEFORE /:eventId
// --------------------------------------------------

router.get("/:eventId/tasks", protect, getEventTasks);

router.get("/:eventId/volunteers", protect, getEventVolunteers);

router.get("/:eventId/risks", protect, getEventRisks);


// --------------------------------------------------
// Single event routes
// --------------------------------------------------

router.get("/:eventId", protect, getEventById);

router.put("/:eventId", protect, updateEvent);

router.delete("/:eventId", protect, deleteEvent);


module.exports = router;