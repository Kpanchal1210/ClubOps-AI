const express = require("express");

const {
    createTask,
    getEventTasks,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createTask);

router.get("/event/:eventId", protect, getEventTasks);

router.put("/:taskId", protect, updateTask);

router.patch("/:taskId", protect, updateTask);

router.delete("/:taskId", protect, deleteTask);

module.exports = router;