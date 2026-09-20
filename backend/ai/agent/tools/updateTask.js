const Task = require("../../../models/Task");
const Event = require("../../../models/Event");
const Club = require("../../../models/Club");


const convertDeadline = (deadline) => {

    if (!deadline) {
        return undefined;
    }

    if (deadline instanceof Date) {
        return deadline;
    }

    if (typeof deadline === "string") {

        const value = deadline.toLowerCase().trim();

        if (value === "tomorrow") {

            const date = new Date();

            date.setDate(date.getDate() + 1);
            date.setHours(23, 59, 59, 999);

            return date;
        }

        if (value === "today") {

            const date = new Date();

            date.setHours(23, 59, 59, 999);

            return date;
        }

        const parsedDate = new Date(deadline);

        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }
    }

    throw new Error(
        `Invalid deadline: ${deadline}`
    );
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