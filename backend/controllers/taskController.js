const Task = require("../models/Task");
const Event = require("../models/Event");
const Club = require("../models/Club");

const checkEventAccess = async (eventId, userId) => {
    const event = await Event.findById(eventId);

    if (!event) {
        return { error: "EVENT_NOT_FOUND" };
    }

    const club = await Club.findById(event.clubId);

    if (!club) {
        return { error: "CLUB_NOT_FOUND" };
    }

    const isMember = club.members.some(
        member => member.toString() === userId.toString()
    );

    if (!isMember) {
        return { error: "FORBIDDEN" };
    }

    return { event, club };
};


// CREATE TASK
// POST /api/tasks
const createTask = async (req, res) => {
    try {
        const {
            eventId,
            title,
            description,
            assignedTo,
            priority,
            deadline,
            source
        } = req.body;

        if (!eventId || !title) {
            return res.status(400).json({
                success: false,
                message: "eventId and title are required"
            });
        }

        const access = await checkEventAccess(
            eventId,
            req.user.userId
        );

        if (access.error === "EVENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        if (access.error === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this event's club"
            });
        }

        const task = await Task.create({
            eventId,
            title,
            description,
            assignedTo,
            createdBy: req.user.userId,
            priority: priority || "medium",
            deadline,
            source: source || "manual",
            aiGenerated: source === "ai_meeting" || source === "ai_agent"
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: { task }
        });

    } catch (error) {
        console.error("Create task error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating task"
        });
    }
};


// GET EVENT TASKS
// GET /api/tasks/event/:eventId
const getEventTasks = async (req, res) => {
    try {
        const { eventId } = req.params;

        const access = await checkEventAccess(
            eventId,
            req.user.userId
        );

        if (access.error === "EVENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        if (access.error === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const tasks = await Task.find({ eventId })
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .sort({ deadline: 1 });

        return res.status(200).json({
            success: true,
            message: "Tasks fetched successfully",
            data: { tasks }
        });

    } catch (error) {
        console.error("Get tasks error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching tasks"
        });
    }
};


// UPDATE TASK
// PUT /api/tasks/:taskId
const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const access = await checkEventAccess(
            task.eventId,
            req.user.userId
        );

        if (access.error === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const {
            title,
            description,
            assignedTo,
            priority,
            status,
            deadline
        } = req.body;

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;
        if (priority !== undefined) task.priority = priority;
        if (status !== undefined) task.status = status;
        if (deadline !== undefined) task.deadline = deadline;

        await task.save();

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: { task }
        });

    } catch (error) {
        console.error("Update task error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating task"
        });
    }
};


// DELETE TASK
// DELETE /api/tasks/:taskId
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const access = await checkEventAccess(
            task.eventId,
            req.user.userId
        );

        if (access.error === "FORBIDDEN") {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        await Task.findByIdAndDelete(taskId);

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting task"
        });
    }
};


module.exports = {
    createTask,
    getEventTasks,
    updateTask,
    deleteTask
};