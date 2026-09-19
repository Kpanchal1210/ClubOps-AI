const cron = require("node-cron");
const Task = require("../models/Task");
const Notification = require("../models/Notification");

const taskDeadlineJob = () => {

    cron.schedule("* * * * *", async () => {

        try {

            const now = new Date();

            const next24Hours = new Date(
                now.getTime() + 24 * 60 * 60 * 1000
            );

            const tasks = await Task.find({
                deadline: {
                    $gte: now,
                    $lte: next24Hours
                },
                status: {
                    $nin: ["completed", "cancelled"]
                },
                assignedTo: {
                    $exists: true,
                    $ne: null
                }
            });

            for (const task of tasks) {

                const existingNotification =
                    await Notification.findOne({
                        userId: task.assignedTo,
                        eventId: task.eventId,
                        type: "task_deadline",
                        message: `Task "${task.title}" is due within 24 hours.`
                    });

                if (existingNotification) {
                    continue;
                }

                await Notification.create({
                    userId: task.assignedTo,
                    eventId: task.eventId,
                    type: "task_deadline",
                    title: "Task deadline approaching",
                    message: `Task "${task.title}" is due within 24 hours.`,
                    priority: task.priority === "critical"
                        ? "critical"
                        : task.priority === "high"
                            ? "high"
                            : "medium"
                });

                console.log(
                    `[Task Deadline Job] Notification created for task: ${task.title}`
                );
            }

        } catch (error) {

            console.error(
                "[Task Deadline Job] Error:",
                error
            );

        }

    });

    console.log("[Task Deadline Job] Started");
};

module.exports = taskDeadlineJob;