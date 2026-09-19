const express = require("express");

const {
    createAgentAction,
    getAgentActions,
    getAgentActionById
} = require("../controllers/agentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/command", protect, createAgentAction);

router.get("/actions", protect, getAgentActions);

router.get("/actions/:id", protect, getAgentActionById);

module.exports = router;