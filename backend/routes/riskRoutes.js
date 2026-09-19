const express = require("express");

const {
    createRisk,
    getEventRisks,
    updateRisk,
    deleteRisk
} = require("../controllers/riskController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRisk);

router.get("/event/:eventId", protect, getEventRisks);

router.put("/:riskId", protect, updateRisk);

router.delete("/:riskId", protect, deleteRisk);

module.exports = router;