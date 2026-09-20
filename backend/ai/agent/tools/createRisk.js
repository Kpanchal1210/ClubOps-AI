const Risk = require("../../../models/Risk");
const Event = require("../../../models/Event");
const Club = require("../../../models/Club");


const createRiskTool = async ({
    eventId,
    userId,
    title,
    description,
    severity,
    probability,
    recommendedAction,
    assignedTo
}) => {

    // 1. Validate required fields

    if (!eventId) {
        throw new Error("eventId is required");
    }

    if (!userId) {
        throw new Error("userId is required");
    }

    if (!title) {
        throw new Error("Risk title is required");
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


    // 5. Create risk

    const risk = await Risk.create({
        eventId,
        title,
        description,
        severity: severity || "medium",
        probability: probability || "medium",
        recommendedAction,
        assignedTo,
        detectedBy: "ai"
    });


    // 6. Return created risk

    return risk;
};


module.exports = createRiskTool;