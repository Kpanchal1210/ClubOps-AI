const Task = require("../../../models/Task");
const Event = require("../../../models/Event");
const Club = require("../../../models/Club");
const User = require("../../../models/User");


const Volunteer = require("../../../models/Volunteer");

const resolveAssignee = async (assigneeName, eventId) => {

    if (!assigneeName) {
        return undefined;
    }

    const user = await User.findOne({
        name: {
            $regex: assigneeName,
            $options: "i"
        }
    });

    if (user) {
        return user._id;
    }

    if (eventId) {
        const volunteer = await Volunteer.findOne({
            eventId,
            name: {
                $regex: assigneeName,
                $options: "i"
            }
        });

        if (volunteer) {
            if (volunteer.userId) {
                return volunteer.userId;
            }
            if (volunteer.email) {
                const userByEmail = await User.findOne({ email: volunteer.email });
                if (userByEmail) {
                    return userByEmail._id;
                }
            }
        }
    }

    throw new Error(
        `User "${assigneeName}" not found`
    );
};


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


const createTaskTool = async ({
    eventId,
    userId,
    title,
    description,
    assigneeName,
    assignedTo,
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

    if (!title) {
        throw new Error("Task title is required");
    }


    // 2. Check event exists

    const event = await Event.findById(eventId);

    if (!event) {
        throw new Error("Event not found");
    }


    // 3. Check club exists

    const club = await Club.findById(event.clubId);

    if (!club) {
        throw new Error("Club not found");
    }


    // 4. Check user has access to the event's club

    const isMember = club.members.some(
        member => member.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error(
            "You are not a member of this event's club"
        );
    }


    // 5. Convert deadline

    const convertedDeadline = convertDeadline(deadline);

    const resolvedAssignee = assignedTo ||
        await resolveAssignee(assigneeName, eventId);

    // 6. Create task

    const task = await Task.create({
        eventId,
        title,
        description,
        assignedTo: resolvedAssignee,
        createdBy: userId,
        priority: priority || "medium",
        deadline: convertedDeadline,
        source: "ai_agent",
        aiGenerated: true
    });


    // 7. Return created task

    return task;
};


module.exports = createTaskTool;