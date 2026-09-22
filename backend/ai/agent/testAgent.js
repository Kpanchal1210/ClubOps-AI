const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const mongoose = require("mongoose");
const User = require("../../models/User");
const Event = require("../../models/Event");
const Club = require("../../models/Club");
const { runAgent } = require("./agent");

const test = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/clubops";
        await mongoose.connect(uri);

        console.log("MongoDB connected");

        // Find or use test user & event
        let user = await User.findOne({ role: "organizer" }) || await User.findOne();
        let club = user ? await Club.findOne({ members: user._id }) : null;
        let event = club ? await Event.findOne({ clubId: club._id }) : null;

        if (!user || !event) {
            console.log("No existing user/event found for test run.");
            return;
        }

        const userId = user._id.toString();
        const eventId = event._id.toString();

        console.log(`Using User: ${user.name} (${userId}), Event: ${event.name} (${eventId})`);

        const command = "Send an announcement to all that final rehearsal starts in 1 hour";

        console.log(`\nRunning agent with command: "${command}"...\n`);

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
        console.error("Agent Error:", error);
    } finally {
        await mongoose.connection.close();
    }
};

test();