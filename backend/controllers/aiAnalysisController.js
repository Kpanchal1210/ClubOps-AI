const Meeting = require("../models/Meeting");
const AIAnalysis = require("../models/AIAnalysis");
const Task = require("../models/Task");
const Risk = require("../models/Risk");
const Event = require("../models/Event");
const Club = require("../models/Club");

const {
    analyzeMeetingTranscript
} = require("../services/aiService");


// --------------------------------------------------
// POST /api/meetings/:meetingId/process
// --------------------------------------------------

const analyzeMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;

        const meeting = await Meeting.findById(
            meetingId
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }


        // ------------------------------------------
        // Check event
        // ------------------------------------------

        const event = await Event.findById(
            meeting.eventId
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }


        // ------------------------------------------
        // Check club membership
        // ------------------------------------------

        const club = await Club.findById(
            event.clubId
        );

        if (!club) {
            return res.status(404).json({
                success: false,
                message: "Club not found"
            });
        }

        const isMember = club.members.some(
            memberId =>
                memberId.toString() ===
                req.user.userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not a member of this club"
            });
        }


        // ------------------------------------------
        // Check transcript
        // ------------------------------------------

        if (
            !meeting.transcript ||
            !meeting.transcript.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Meeting transcript is empty"
            });
        }


        // ------------------------------------------
        // Send transcript to Gemini
        // ------------------------------------------

        const analysis =
            await analyzeMeetingTranscript(
                meeting.transcript
            );


        // ------------------------------------------
        // Validate AI response
        // ------------------------------------------

        if (
            !analysis ||
            typeof analysis !== "object"
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Invalid AI analysis response"
            });
        }


        const summary =
            typeof analysis.summary === "string"
                ? analysis.summary
                : "";


        const tasks =
            Array.isArray(analysis.tasks)
                ? analysis.tasks
                : [];


        const risks =
            Array.isArray(analysis.risks)
                ? analysis.risks
                : [];


        const decisions =
            Array.isArray(analysis.decisions)
                ? analysis.decisions
                : [];


        const actionItems =
            Array.isArray(analysis.actionItems)
                ? analysis.actionItems
                : [];


        // ------------------------------------------
        // Save AI Analysis
        // ------------------------------------------

        const aiAnalysis =
            await AIAnalysis.create({
                meetingId: meeting._id,

                eventId: event._id,

                summary,

                tasks: tasks.map(task => ({
                    title: task.title,

                    ownerId:
                        task.ownerId || undefined,

                    deadline:
                        task.deadline || undefined,

                    priority:
                        task.priority || "medium"
                })),

                risks: risks.map(risk => ({
                    title: risk.title,

                    severity:
                        risk.severity || "medium",

                    description:
                        risk.description || ""
                })),

                decisions,

                actionItems
            });


        // ------------------------------------------
        // Create Tasks from AI output
        // ------------------------------------------

        const createdTasks = [];

        for (const aiTask of tasks) {

            if (!aiTask.title) {
                continue;
            }

            const task =
                await Task.create({
                    eventId: event._id,

                    title: aiTask.title,

                    description:
                        aiTask.description || "",

                    assignedTo:
                        aiTask.ownerId || undefined,

                    createdBy:
                        req.user.userId,

                    priority:
                        aiTask.priority || "medium",

                    deadline:
                        aiTask.deadline || undefined,

                    source: "ai_meeting",

                    aiGenerated: true
                });

            createdTasks.push(task);
        }


        // ------------------------------------------
        // Create Risks from AI output
        // ------------------------------------------

        const createdRisks = [];

        for (const aiRisk of risks) {

            if (!aiRisk.title) {
                continue;
            }

            const risk =
                await Risk.create({
                    eventId: event._id,

                    title: aiRisk.title,

                    description:
                        aiRisk.description || "",

                    severity:
                        aiRisk.severity || "medium",

                    detectedBy: "ai"
                });

            createdRisks.push(risk);
        }


        // ------------------------------------------
        // Update Meeting
        // ------------------------------------------

        meeting.summary = summary;

        meeting.processedByAI = true;

        await meeting.save();


        // ------------------------------------------
        // Response
        // ------------------------------------------

        return res.json({
            success: true,

            message:
                "Meeting analyzed successfully",

            data: {
                analysis: aiAnalysis,

                createdTasks,

                createdRisks
            }
        });

    } catch (error) {

        console.error(
            "AI meeting analysis error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to analyze meeting",
            error: error.message
        });
    }
};


module.exports = {
    analyzeMeeting
};