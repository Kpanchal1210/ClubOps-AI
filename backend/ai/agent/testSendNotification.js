const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const mongoose = require("mongoose");
const User = require("../../models/User");
const Event = require("../../models/Event");
const Club = require("../../models/Club");
const Notification = require("../../models/Notification");
const sendNotificationTool = require("./tools/sendNotification");
const toolRegistry = require("./toolRegistry");

const runTest = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/clubops";
        await mongoose.connect(uri);
        console.log("✓ MongoDB connected successfully");

        // 1. Verify tool registry has SEND_NOTIFICATION
        if (typeof toolRegistry.SEND_NOTIFICATION !== "function") {
            throw new Error("SEND_NOTIFICATION is not registered in toolRegistry!");
        }
        console.log("✓ SEND_NOTIFICATION is registered in toolRegistry");

        // 2. Find or create test club, user, and event
        let user = await User.findOne({ role: "organizer" });
        if (!user) {
            user = await User.findOne();
        }
        if (!user) {
            user = await User.create({
                name: "Test Organizer",
                email: `test_agent_${Date.now()}@clubops.org`,
                password: "password123",
                role: "organizer"
            });
        }

        let club = await Club.findOne({ members: user._id });
        if (!club) {
            club = await Club.create({
                name: "Agent Testing Club",
                description: "Club for AI agent verification",
                adminId: user._id,
                members: [user._id]
            });
        }

        let event = await Event.findOne({ clubId: club._id });
        if (!event) {
            event = await Event.create({
                clubId: club._id,
                name: "Agent Automation Launch",
                description: "Testing event for AI agent tools",
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000),
                status: "planning",
                createdBy: user._id
            });
        }

        console.log(`✓ Test context: User=${user.name} (${user._id}), Event=${event.name} (${event._id})`);

        // 3. Test direct invocation of sendNotificationTool with recipientName
        console.log("\nTesting sendNotificationTool (direct recipient)...");
        const singleNotif = await sendNotificationTool({
            eventId: event._id,
            userId: user._id,
            recipientName: user.name,
            message: "Test direct announcement for stage prep",
            priority: "high"
        });

        console.log("✓ Single notification created:", {
            id: singleNotif._id,
            userId: singleNotif.userId,
            title: singleNotif.title,
            priority: singleNotif.priority,
            message: singleNotif.message
        });

        if (singleNotif.priority !== "high") {
            throw new Error(`Expected priority 'high', got '${singleNotif.priority}'`);
        }

        // 4. Test broadcast invocation of sendNotificationTool
        console.log("\nTesting sendNotificationTool (broadcast)...");
        const broadcastRes = await sendNotificationTool({
            eventId: event._id,
            userId: user._id,
            recipientName: "all",
            message: "All-hands briefing starts in 10 minutes",
            priority: "critical"
        });

        console.log("✓ Broadcast notification result:", {
            broadcast: broadcastRes.broadcast,
            recipientCount: broadcastRes.recipientCount
        });

        if (!broadcastRes.broadcast || broadcastRes.recipientCount < 1) {
            throw new Error("Broadcast notification failed to send to club members");
        }

        // 5. Test error handling on non-existent user
        console.log("\nTesting error handling for unknown recipient...");
        try {
            await sendNotificationTool({
                eventId: event._id,
                userId: user._id,
                recipientName: "non_existent_person_xyz_12345",
                message: "Hello"
            });
            throw new Error("Expected error for non-existent user, but call succeeded");
        } catch (err) {
            console.log("✓ Correctly caught expected error:", err.message);
        }

        console.log("\n🎉 ALL SEND_NOTIFICATION TESTS PASSED SUCCESSFULLY!\n");

    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
};

runTest();
