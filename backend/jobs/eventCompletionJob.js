const cron = require("node-cron");
const Event = require("../models/Event");

const eventCompletionJob = () => {
    cron.schedule("* * * * *", async () => {
        console.log("[Event Completion Job] Running...");
        try {
            const now = new Date();

            const result = await Event.updateMany(
                {
                    endDate: { $lt: now },
                    status: { $in: ["planning", "ongoing"] }
                },
                {
                    $set: {
                        status: "completed"
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(
                    `[Event Completion Job] ${result.modifiedCount} event(s) marked as completed`
                );
            }

        } catch (error) {
            console.error(
                "[Event Completion Job] Error:",
                error
            );
        }
    });

    console.log("[Event Completion Job] Started");
};

module.exports = eventCompletionJob;