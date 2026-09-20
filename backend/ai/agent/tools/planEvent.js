const Event = require("../../../models/Event");
const Club = require("../../../models/Club");
const User = require("../../../models/User");
const Task = require("../../../models/Task");
const { generateEventPlan } = require("../../../services/aiService");

const planEventTool = async ({ query, prompt, eventName, userId }) => {
    const input = prompt || query || eventName || "Campus Technology Showcase";

    // Find club
    const user = await User.findById(userId);
    let club = null;
    if (user?.clubId) {
        club = await Club.findById(user.clubId);
    } else {
        club = await Club.findOne({
            $or: [{ adminId: userId }, { members: userId }]
        });
    }

    const plan = await generateEventPlan(input, club?.name || "Student Operations Club");

    const now = new Date();
    const start = new Date(now.getTime() + 14 * 86400000);
    const end = new Date(start.getTime() + (plan.durationDays || 2) * 86400000);

    let createdEvent = null;
    const createdTasks = [];

    if (club) {
        createdEvent = await Event.create({
            clubId: club._id,
            name: plan.name,
            description: plan.description,
            venue: plan.venue,
            startDate: start,
            endDate: end,
            expectedParticipants: plan.expectedParticipants || 100,
            expectedVolunteers: plan.expectedVolunteers || 10,
            createdBy: userId,
            status: "planning"
        });

        if (Array.isArray(plan.suggestedTasks)) {
            for (const st of plan.suggestedTasks) {
                const task = await Task.create({
                    eventId: createdEvent._id,
                    title: st.title,
                    description: st.description || "",
                    priority: st.priority || "medium",
                    status: "pending",
                    deadline: new Date(start.getTime() - 2 * 86400000),
                    createdBy: userId,
                    source: "ai_agent",
                    aiGenerated: true
                });
                createdTasks.push(task);
            }
        }
    }

    return {
        action: "PLAN_EVENT",
        message: `Generated execution plan for "${plan.name}" at ${plan.venue} with ${createdTasks.length} milestone tasks.`,
        plan,
        event: createdEvent,
        tasks: createdTasks
    };
};

module.exports = planEventTool;
