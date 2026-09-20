const mongoose = require("mongoose");
const Meeting = require("../models/Meeting");
const AIAnalysis = require("../models/AIAnalysis");
const Task = require("../models/Task");
const Risk = require("../models/Risk");
const Event = require("../models/Event");
const Club = require("../models/Club");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");

const {
    analyzeMeetingTranscript
} = require("../services/aiService");


// --------------------------------------------------
// Helper: Check event access
// --------------------------------------------------

const checkEventAccess = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) {
        return { allowed: false, message: "Event not found" };
    }

    const club = await Club.findById(event.clubId);
    if (!club) {
        return { allowed: false, message: "Club not found" };
    }

    const isMember = club.members.some(
        memberId => memberId.toString() === userId.toString()
    );

    if (!isMember) {
        return { allowed: false, message: "You are not a member of this club" };
    }

    return { allowed: true, event, club };
};


// --------------------------------------------------
// POST /api/meetings/:meetingId/process
// --------------------------------------------------

const analyzeMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        const access = await checkEventAccess(meeting.eventId, req.user.userId);
        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        const { event, club } = access;

        if (!meeting.transcript || !meeting.transcript.trim()) {
            return res.status(400).json({
                success: false,
                message: "Meeting transcript is empty"
            });
        }

        // ------------------------------------------
        // Build Team Roster for Task Auto-Distribution
        // ------------------------------------------

        const clubMembers = await User.find({
            _id: { $in: club.members }
        }).select("_id name email role skills");

        const volunteers = await Volunteer.find({
            eventId: event._id
        }).populate("userId", "_id name email role skills");

        const roster = [];
        const seenUserIds = new Set();

        // Meeting participants
        if (meeting.participants && meeting.participants.length > 0) {
            const participants = await User.find({
                _id: { $in: meeting.participants }
            }).select("_id name email role skills");

            for (const p of participants) {
                if (!seenUserIds.has(p._id.toString())) {
                    roster.push({ id: p._id.toString(), name: p.name, role: p.role, skills: p.skills || [] });
                    seenUserIds.add(p._id.toString());
                }
            }
        }

        // Registered Volunteers
        for (const v of volunteers) {
            if (v.userId && !seenUserIds.has(v.userId._id.toString())) {
                roster.push({
                    id: v.userId._id.toString(),
                    name: v.userId.name,
                    role: v.team || v.userId.role || "Volunteer",
                    skills: v.skills || v.userId.skills || []
                });
                seenUserIds.add(v.userId._id.toString());
            }
        }

        // Club Members & Organizers
        for (const m of clubMembers) {
            if (!seenUserIds.has(m._id.toString())) {
                roster.push({
                    id: m._id.toString(),
                    name: m.name,
                    role: m.role || "Member",
                    skills: m.skills || []
                });
                seenUserIds.add(m._id.toString());
            }
        }

        // ------------------------------------------
        // Send transcript & roster to Gemini AI
        // ------------------------------------------

        const analysis = await analyzeMeetingTranscript(meeting.transcript, roster);

        if (!analysis || typeof analysis !== "object") {
            return res.status(500).json({
                success: false,
                message: "Invalid AI analysis response"
            });
        }

        const summary = typeof analysis.summary === "string" ? analysis.summary : "";
        const tasks = Array.isArray(analysis.tasks) ? analysis.tasks : [];
        const risks = Array.isArray(analysis.risks) ? analysis.risks : [];
        const decisions = Array.isArray(analysis.decisions) ? analysis.decisions : [];
        const actionItems = Array.isArray(analysis.actionItems) ? analysis.actionItems : [];

        // ------------------------------------------
        // Create Tasks from AI Output with Auto-Distribution
        // ------------------------------------------

        const createdTasks = [];
        let autoDistributeIndex = 0;

        for (const aiTask of tasks) {
            if (!aiTask.title) continue;

            let assignedUserId = null;

            // 1. Check if AI matched a specific user ID in the roster
            if (aiTask.assigneeId && mongoose.Types.ObjectId.isValid(aiTask.assigneeId) && seenUserIds.has(aiTask.assigneeId.toString())) {
                assignedUserId = aiTask.assigneeId;
            }
            // 2. Fuzzy match assigneeName against roster
            else if (aiTask.assigneeName) {
                const searchName = aiTask.assigneeName.toLowerCase();
                const matched = roster.find(m =>
                    m.name &&
                    (m.name.toLowerCase() === searchName ||
                     m.name.toLowerCase().includes(searchName) ||
                     searchName.includes(m.name.toLowerCase().split(" ")[0]))
                );
                if (matched) {
                    assignedUserId = matched.id;
                }
            }

            // 3. Auto-distribute to available roster member if unassigned
            if (!assignedUserId && roster.length > 0) {
                assignedUserId = roster[autoDistributeIndex % roster.length].id;
                autoDistributeIndex++;
            }

            let parsedDeadline = undefined;
            if (aiTask.deadline) {
                const parsed = Date.parse(aiTask.deadline);
                if (!isNaN(parsed)) {
                    parsedDeadline = new Date(parsed);
                }
            }

            const task = await Task.create({
                eventId: event._id,
                title: aiTask.title,
                description: aiTask.description || "",
                assignedTo: assignedUserId || undefined,
                createdBy: req.user.userId,
                priority: aiTask.priority || "medium",
                deadline: parsedDeadline,
                source: "ai_meeting",
                aiGenerated: true
            });

            // Link to volunteer assignedTasks if user is an event volunteer
            if (assignedUserId) {
                await Volunteer.updateOne(
                    { eventId: event._id, userId: assignedUserId },
                    { $addToSet: { assignedTasks: task._id } }
                );
            }

            createdTasks.push(task);
        }

        // Populate created tasks with user details
        await Task.populate(createdTasks, {
            path: "assignedTo",
            select: "name email role"
        });

        // ------------------------------------------
        // Create Risks from AI Output
        // ------------------------------------------

        const createdRisks = [];

        for (const aiRisk of risks) {
            if (!aiRisk.title) continue;

            const risk = await Risk.create({
                eventId: event._id,
                title: aiRisk.title,
                description: aiRisk.description || "",
                severity: aiRisk.severity || "medium",
                detectedBy: "ai"
            });

            createdRisks.push(risk);
        }

        // ------------------------------------------
        // Save / Update AI Analysis
        // ------------------------------------------

        const aiAnalysis = await AIAnalysis.findOneAndUpdate(
            { meetingId: meeting._id },
            {
                meetingId: meeting._id,
                eventId: event._id,
                summary,
                tasks: createdTasks.map(t => ({
                    title: t.title,
                    ownerId: t.assignedTo?._id || t.assignedTo || undefined,
                    deadline: t.deadline || undefined,
                    priority: t.priority || "medium"
                })),
                risks: createdRisks.map(r => ({
                    title: r.title,
                    severity: r.severity || "medium",
                    description: r.description || ""
                })),
                decisions,
                actionItems
            },
            { upsert: true, new: true }
        );

        // ------------------------------------------
        // Update Meeting record
        // ------------------------------------------

        meeting.summary = summary;
        meeting.processedByAI = true;
        await meeting.save();

        return res.json({
            success: true,
            message: "Meeting analyzed successfully",
            data: {
                analysis: {
                    ...aiAnalysis.toObject(),
                    tasks: createdTasks,
                    risks: createdRisks
                },
                createdTasks,
                createdRisks,
                meeting
            }
        });

    } catch (error) {
        console.error("AI meeting analysis error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to analyze meeting",
            error: error.message
        });
    }
};


// --------------------------------------------------
// GET /api/meetings/:meetingId/analysis
// --------------------------------------------------

const getMeetingAnalysis = async (req, res) => {
    try {
        const { meetingId } = req.params;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found"
            });
        }

        const access = await checkEventAccess(meeting.eventId, req.user.userId);
        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message: access.message
            });
        }

        let analysis = await AIAnalysis.findOne({ meetingId }).sort({ createdAt: -1 });

        // If not analyzed yet but transcript is present, automatically process it on demand!
        if (!analysis && meeting.transcript && meeting.transcript.trim()) {
            return analyzeMeeting(req, res);
        }

        if (!analysis && !meeting.processedByAI) {
            return res.status(404).json({
                success: false,
                message: "No AI analysis available for this meeting."
            });
        }

        // Fetch associated tasks and risks created by AI for this event/meeting
        const createdTasks = await Task.find({
            eventId: meeting.eventId,
            source: "ai_meeting"
        })
            .populate("assignedTo", "name email role")
            .sort({ createdAt: -1 });

        const createdRisks = await Risk.find({
            eventId: meeting.eventId,
            detectedBy: "ai"
        }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: {
                analysis: {
                    ...(analysis ? analysis.toObject() : {}),
                    summary: analysis?.summary || meeting.summary || "Summary not available.",
                    tasks: createdTasks.length > 0 ? createdTasks : (analysis?.tasks || []),
                    risks: createdRisks.length > 0 ? createdRisks : (analysis?.risks || []),
                    decisions: analysis?.decisions || [],
                    actionItems: analysis?.actionItems || []
                },
                createdTasks,
                createdRisks,
                meeting
            }
        });

    } catch (error) {
        console.error("Get meeting analysis error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get meeting analysis",
            error: error.message
        });
    }
};


module.exports = {
    analyzeMeeting,
    getMeetingAnalysis
};