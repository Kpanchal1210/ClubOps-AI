const Notification = require("../../../models/Notification");
const Event = require("../../../models/Event");
const Club = require("../../../models/Club");
const User = require("../../../models/User");
const Volunteer = require("../../../models/Volunteer");

const resolveRecipient = async (recipientName, eventId) => {
    if (!recipientName || !recipientName.trim()) {
        return null;
    }

    const trimmed = recipientName.trim();

    // 1. Check User collection
    const user = await User.findOne({
        name: {
            $regex: trimmed,
            $options: "i"
        }
    });

    if (user) {
        return user._id;
    }

    // 2. Check Volunteer roster if eventId is provided
    if (eventId) {
        const volunteer = await Volunteer.findOne({
            eventId,
            name: {
                $regex: trimmed,
                $options: "i"
            }
        });

        if (volunteer && volunteer.userId) {
            return volunteer.userId;
        }
    }

    throw new Error(`User "${recipientName}" not found`);
};

const sendNotificationTool = async ({
    eventId,
    userId,
    recipientName,
    recipientId,
    message,
    title,
    priority,
    type
}) => {
    // 1. Validate required fields
    if (!userId) {
        throw new Error("userId is required");
    }

    if (!message || !message.trim()) {
        throw new Error("Notification message is required");
    }

    let event = null;
    let club = null;

    // 2. Check event and club access if eventId is provided
    if (eventId) {
        event = await Event.findById(eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        club = await Club.findById(event.clubId);
        if (!club) {
            throw new Error("Club not found");
        }

        const isMember = club.members.some(
            member => member.toString() === userId.toString()
        );

        if (!isMember) {
            throw new Error("You are not a member of this event's club");
        }
    }

    // 3. Normalize priority and type
    const validPriorities = ["low", "medium", "high", "critical"];
    const normalizedPriority = priority && validPriorities.includes(priority.toLowerCase().trim())
        ? priority.toLowerCase().trim()
        : "medium";

    const validTypes = [
        "task_assigned",
        "task_deadline",
        "risk_detected",
        "announcement",
        "event_update"
    ];
    const normalizedType = type && validTypes.includes(type.toLowerCase().trim())
        ? type.toLowerCase().trim()
        : "announcement";

    // 4. Determine notification title
    const notificationTitle = title && title.trim()
        ? title.trim()
        : event && event.name
            ? `${event.name}: Announcement`
            : "ClubOps Announcement";

    // 5. Check for broadcast keywords (all, everyone, team, volunteers, members)
    const isBroadcast = recipientName && /^(all|everyone|team|volunteers|members|committee|everybody)$/i.test(recipientName.trim());

    if (isBroadcast && club && Array.isArray(club.members) && club.members.length > 0) {
        const notifications = [];
        for (const memberId of club.members) {
            const notif = await Notification.create({
                userId: memberId,
                eventId: eventId || undefined,
                type: normalizedType,
                title: notificationTitle,
                message: message.trim(),
                priority: normalizedPriority
            });
            notifications.push(notif);
        }

        return {
            broadcast: true,
            recipientCount: notifications.length,
            notifications
        };
    }

    // 6. Resolve single recipient
    let targetUserId = recipientId;

    if (!targetUserId && recipientName) {
        targetUserId = await resolveRecipient(recipientName, eventId);
    }

    // If no recipient specified, default to caller (or broadcast to club members if club exists)
    if (!targetUserId) {
        if (club && Array.isArray(club.members) && club.members.length > 0) {
            const notifications = [];
            for (const memberId of club.members) {
                const notif = await Notification.create({
                    userId: memberId,
                    eventId: eventId || undefined,
                    type: normalizedType,
                    title: notificationTitle,
                    message: message.trim(),
                    priority: normalizedPriority
                });
                notifications.push(notif);
            }

            return {
                broadcast: true,
                recipientCount: notifications.length,
                notifications
            };
        }

        targetUserId = userId;
    }

    // 7. Create single notification
    const notification = await Notification.create({
        userId: targetUserId,
        eventId: eventId || undefined,
        type: normalizedType,
        title: notificationTitle,
        message: message.trim(),
        priority: normalizedPriority
    });

    return notification;
};

module.exports = sendNotificationTool;
