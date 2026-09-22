const Task = require("../../../models/Task");
const Event = require("../../../models/Event");
const Club = require("../../../models/Club");


const convertDeadline = (deadline) => {
    if (!deadline) return undefined;
    if (deadline instanceof Date) return deadline;
    if (typeof deadline !== "string") return undefined;

    const value = deadline.toLowerCase().trim();
    const now = new Date();

    const applyTime = (targetDate, text) => {
        const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch && timeMatch[1]) {
            let hour = parseInt(timeMatch[1], 10);
            const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            const ampm = timeMatch[3]?.toLowerCase();
            if (ampm === "pm" && hour < 12) hour += 12;
            if (ampm === "am" && hour === 12) hour = 0;
            targetDate.setHours(hour, minute, 0, 0);
        } else {
            targetDate.setHours(23, 59, 59, 999);
        }
        return targetDate;
    };

    if (value.includes("today")) {
        return applyTime(new Date(), value);
    }

    if (value.includes("tomorrow")) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return applyTime(d, value);
    }

    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let i = 0; i < days.length; i++) {
        if (value.includes(days[i])) {
            const currentDay = now.getDay();
            let diff = i - currentDay;
            if (diff <= 0) diff += 7;
            const d = new Date();
            d.setDate(now.getDate() + diff);
            return applyTime(d, value);
        }
    }

    const inDaysMatch = value.match(/in\s+(\d+)\s+days?/i);
    if (inDaysMatch) {
        const d = new Date();
        d.setDate(now.getDate() + parseInt(inDaysMatch[1], 10));
        return applyTime(d, value);
    }

    const parsedDate = new Date(deadline);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }

    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    return applyTime(fallback, value);
};


const updateTaskTool = async ({
    eventId,
    userId,
    taskIdentifier,
    status,
    priority,
    deadline
}) => {

    // 1. Validate required fields

    if (!eventId) {
        throw new Error("eventId is required");
    }

    if (!userId) {
        throw new Error("userId is required");
    }

    if (!taskIdentifier) {
        throw new Error(
            "Task identifier is required"
        );
    }


    // 2. Check event

    const event = await Event.findById(eventId);

    if (!event) {
        throw new Error("Event not found");
    }


    // 3. Check club

    const club = await Club.findById(event.clubId);

    if (!club) {
        throw new Error("Club not found");
    }


    // 4. Check user access

    const isMember = club.members.some(
        member => member.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error(
            "You are not a member of this event's club"
        );
    }


    // 5. Find task

    const tasks = await Task.find({
        eventId,
        title: {
            $regex: taskIdentifier,
            $options: "i"
        }
    });


    if (tasks.length === 0) {
        throw new Error(
            `Task "${taskIdentifier}" not found`
        );
    }


    if (tasks.length > 1) {
        throw new Error(
            `Multiple tasks found matching "${taskIdentifier}". Please be more specific.`
        );
    }


    const task = tasks[0];


    // 6. Update fields

    if (status !== undefined && status !== null) {
        task.status = status;
    }

    if (priority !== undefined && priority !== null) {
        task.priority = priority;
    }

    if (deadline !== undefined && deadline !== null) {
        task.deadline = convertDeadline(deadline);
    }


    // 7. Save

    await task.save();


    // 8. Return updated task

    return task;
};


module.exports = updateTaskTool;