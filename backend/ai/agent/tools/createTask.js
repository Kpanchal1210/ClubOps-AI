const Task = require("../../../models/Task");
const Event = require("../../../models/Event");
const Club = require("../../../models/Club");


const convertDeadline = (deadline) => {

    if (!deadline) {
        return undefined;
    }

    // Already a Date
    if (deadline instanceof Date) {
        return deadline;
    }

    // Handle natural language deadline
    if (typeof deadline === "string") {

        const value = deadline.toLowerCase().trim();

        // Tomorrow
        if (value === "tomorrow") {

            const date = new Date();

            date.setDate(date.getDate() + 1);

            // Set deadline to 11:59 PM tomorrow
            date.setHours(23, 59, 59, 999);

            return date;
        }

        // Today
        if (value === "today") {

            const date = new Date();

            date.setHours(23, 59, 59, 999);

            return date;
        }

        // Try normal date strings
        const parsedDate = new Date(deadline);

        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }
    }

    throw new Error(
        `Invalid deadline: ${deadline}`
    );
};


const createTaskTool = async ({
    eventId,
    userId,
    title,
    description,
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


    // 6. Create task

    const task = await Task.create({
        eventId,
        title,
        description,
        assignedTo,
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