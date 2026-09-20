const Notification = require("../models/Notification");


// GET /api/notifications
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            userId: req.user.userId
        })
            .populate("eventId", "name")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: notifications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get notifications",
            error: error.message
        });
    }
};


// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(
            req.params.id
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        if (
            notification.userId.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot modify this notification"
            });
        }

        notification.read = true;

        await notification.save();

        res.json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update notification",
            error: error.message
        });
    }
};


// Helper used by other backend modules
const createNotification = async ({
    userId,
    eventId,
    type,
    title,
    message,
    priority = "medium"
}) => {
    return await Notification.create({
        userId,
        eventId,
        type,
        title,
        message,
        priority
    });
};


module.exports = {
    getMyNotifications,
    markAsRead,
    createNotification
};