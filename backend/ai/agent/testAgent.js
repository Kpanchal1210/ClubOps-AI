require("dotenv").config({
    path: "../../.env"
});

const mongoose = require("mongoose");

const { runAgent } = require("./agent");

const test = async () => {
    try {

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);

        console.log("MongoDB connected");

        // Replace these with real values from your database
        const userId = "6aae1d32e50392a4ecc2a5c1";
        const eventId = "6aae51195cedadca22591f70";

        const command =
            "Create a high priority task for me to contact sponsors tomorrow";

        console.log("\nRunning agent...\n");

        const result = await runAgent({
            command,
            userId,
            eventId
        });

        console.log("Agent Result:");
        console.log(
            JSON.stringify(result, null, 2)
        );

    } catch (error) {

        console.error(
            "Agent Error:",
            error
        );

    } finally {

        await mongoose.connection.close();

    }
};

test();