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
// Internal Helper: Process meeting transcript and allocate tasks to volunteers
// --------------------------------------------------

const processMeetingAnalysisInternal = async ({ meetingId, userId, force = false }) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
        throw new Error("Meeting not found");
    }

    const event = await Event.findById(meeting.eventId);
    if (!event) {
        throw new Error("Associated event not found");
    }

    const club = await Club.findById(event.clubId);
    if (!club) {
        throw new Error("Associated club not found");
    }

    if (userId) {
        const isMember = club.members.some(
            memberId => memberId.toString() === userId.toString()
        );
        if (!isMember) {
            throw new Error("You are not a member of this club");
        }
    }

    if (!meeting.transcript || !meeting.transcript.trim()) {
        throw new Error("Meeting transcript is empty");
    }

    // If already processed and not forced, return existing analysis without duplicating tasks
    if (meeting.processedByAI && !force) {
        const existingAnalysis = await AIAnalysis.findOne({ meetingId }).sort({ createdAt: -1 });
        if (existingAnalysis) {
            const existingTasks = await Task.find({ eventId: event._id, source: "ai_meeting" })
                .populate("assignedTo", "name email role");
            const existingRisks = await Risk.find({ eventId: event._id, detectedBy: "ai" });
            return {
                analysis: {
                    ...existingAnalysis.toObject(),
                    tasks: existingTasks,
                    risks: existingRisks
                },
                createdTasks: existingTasks,
                createdRisks: existingRisks,
                meeting
            };
        }
    }

    // ------------------------------------------
    // Build Event Volunteer Roster & Workload Tracker
    // ------------------------------------------

    const volunteers = await Volunteer.find({ eventId: event._id })
        .populate("userId", "_id name email role skills");

    const clubMembers = await User.find({ _id: { $in: club.members } })
        .select("_id name email role skills");

    // Track volunteers for allocation
    const volunteerList = [];
    const seenUserIds = new Set();

    for (const v of volunteers) {
        if (v.userId && !seenUserIds.has(v.userId._id.toString())) {
            volunteerList.push({
                volunteerDocId: v._id,
                userId: v.userId._id.toString(),
                userObj: v.userId,
                name: v.userId.name,
                email: v.userId.email,
                team: v.team || "Operations",
                skills: Array.isArray(v.skills) && v.skills.length > 0 ? v.skills : (v.userId.skills || []),
                availability: v.availability || "available",
                activeTaskCount: (v.assignedTasks || []).length
            });
            seenUserIds.add(v.userId._id.toString());
        }
    }

    // Roster sent to AI
    const roster = volunteerList.map(v => ({
        id: v.userId,
        name: v.name,
        role: v.team,
        skills: v.skills
    }));

    // If no volunteers registered, add club members
    if (roster.length === 0) {
        for (const m of clubMembers) {
            roster.push({
                id: m._id.toString(),
                name: m.name,
                role: m.role || "Member",
                skills: m.skills || []
            });
        }
    }

    // ------------------------------------------
    // Send transcript & roster to AI Analysis
    // ------------------------------------------

    const analysis = await analyzeMeetingTranscript(meeting.transcript, roster);

    if (!analysis || typeof analysis !== "object") {
        throw new Error("Invalid AI analysis response");
    }

    const summary = typeof analysis.summary === "string" ? analysis.summary : "";
    const rawTasks = Array.isArray(analysis.tasks) ? analysis.tasks : [];
    const rawRisks = Array.isArray(analysis.risks) ? analysis.risks : [];
    const decisions = Array.isArray(analysis.decisions) ? analysis.decisions : [];
    const actionItems = Array.isArray(analysis.actionItems) ? analysis.actionItems : [];

    // ------------------------------------------
    // Allocate Tasks to Volunteers & Prioritize
    // ------------------------------------------

    const createdTasks = [];

    for (const aiTask of rawTasks) {
        if (!aiTask.title) continue;

        let assignedVolunteer = null;
        const taskText = `${aiTask.title} ${aiTask.description || ""}`.toLowerCase();

        // 1. Direct Name Matching against event volunteers
        if (aiTask.assigneeId && seenUserIds.has(aiTask.assigneeId.toString())) {
            assignedVolunteer = volunteerList.find(v => v.userId === aiTask.assigneeId.toString());
        } else if (aiTask.assigneeName) {
            const searchName = aiTask.assigneeName.toLowerCase();
            assignedVolunteer = volunteerList.find(v => {
                const vName = v.name.toLowerCase();
                const firstName = vName.split(" ")[0];
                return vName === searchName || vName.includes(searchName) || searchName.includes(firstName);
            });
        }

        // Also check if taskText mentions any volunteer name directly
        if (!assignedVolunteer) {
            for (const v of volunteerList) {
                const firstName = v.name.toLowerCase().split(" ")[0];
                if (taskText.includes(v.name.toLowerCase()) || (firstName.length >= 3 && taskText.includes(firstName))) {
                    assignedVolunteer = v;
                    break;
                }
            }
        }

        // 2. Skill & Team Matching for Unassigned Tasks
        if (!assignedVolunteer && volunteerList.length > 0) {
            let matchedCandidates = [];

            // AV / Audio / Stage / Lighting / Projectors
            if (
                taskText.includes("sound") ||
                taskText.includes("audio") ||
                taskText.includes("mic") ||
                taskText.includes("projector") ||
                taskText.includes("lighting") ||
                taskText.includes("stage") ||
                taskText.includes("laser") ||
                taskText.includes("camera") ||
                taskText.includes("stream") ||
                taskText.includes("pa line")
            ) {
                matchedCandidates = volunteerList.filter(v =>
                    v.team.toLowerCase().includes("stage") ||
                    v.team.toLowerCase().includes("av") ||
                    v.skills.some(s => /audio|lighting|hardware|av|stage/i.test(s))
                );
            }
            // Security / Logistics / Loading Bay / Crowd / Netting
            else if (
                taskText.includes("security") ||
                taskText.includes("loading bay") ||
                taskText.includes("perimeter") ||
                taskText.includes("crowd") ||
                taskText.includes("barrier") ||
                taskText.includes("netting") ||
                taskText.includes("fire") ||
                taskText.includes("safety")
            ) {
                matchedCandidates = volunteerList.filter(v =>
                    v.team.toLowerCase().includes("logistics") ||
                    v.team.toLowerCase().includes("security") ||
                    v.skills.some(s => /security|logistics|operations|safety/i.test(s))
                );
            }
            // Catering / Hospitality / Food / Dietary
            else if (
                taskText.includes("catering") ||
                taskText.includes("food") ||
                taskText.includes("dietary") ||
                taskText.includes("lunch") ||
                taskText.includes("dinner") ||
                taskText.includes("meal") ||
                taskText.includes("speaker travel") ||
                taskText.includes("hospitality")
            ) {
                matchedCandidates = volunteerList.filter(v =>
                    v.team.toLowerCase().includes("hospitality") ||
                    v.team.toLowerCase().includes("catering") ||
                    v.skills.some(s => /hospitality|catering|guest/i.test(s))
                );
            }
            // Registration / Badges / NFC / Check-in / Helpdesk
            else if (
                taskText.includes("badge") ||
                taskText.includes("nfc") ||
                taskText.includes("check-in") ||
                taskText.includes("registration") ||
                taskText.includes("swag") ||
                taskText.includes("t-shirt") ||
                taskText.includes("transponder")
            ) {
                matchedCandidates = volunteerList.filter(v =>
                    v.team.toLowerCase().includes("registration") ||
                    v.team.toLowerCase().includes("helpdesk") ||
                    v.skills.some(s => /registration|helpdesk|communication/i.test(s))
                );
            }

            // Pick least-loaded volunteer among matching candidates
            const availableMatches = matchedCandidates.filter(v => v.availability !== "unavailable");
            if (availableMatches.length > 0) {
                availableMatches.sort((a, b) => a.activeTaskCount - b.activeTaskCount);
                assignedVolunteer = availableMatches[0];
            }
        }

        // 3. Workload Balancing (Pick available volunteer with fewest tasks)
        if (!assignedVolunteer && volunteerList.length > 0) {
            const availableAll = volunteerList.filter(v => v.availability !== "unavailable");
            const pool = availableAll.length > 0 ? availableAll : volunteerList;
            pool.sort((a, b) => a.activeTaskCount - b.activeTaskCount);
            assignedVolunteer = pool[0];
        }

        // If a volunteer was selected, increment their tracked workload for this batch
        if (assignedVolunteer) {
            assignedVolunteer.activeTaskCount++;
        }

        const assignedUserId = assignedVolunteer
            ? assignedVolunteer.userId
            : (roster[0]?.id || undefined);

        // Parse deadline
        let parsedDeadline = undefined;
        if (aiTask.deadline) {
            const parsed = Date.parse(aiTask.deadline);
            if (!isNaN(parsed)) {
                parsedDeadline = new Date(parsed);
            }
        }

        // Prioritize task strictly across 4 tiers
        const validPriorities = ["critical", "high", "medium", "low"];
        let priority = (aiTask.priority || "").toLowerCase();
        if (!validPriorities.includes(priority)) {
            if (
                taskText.includes("critical") ||
                taskText.includes("emergency") ||
                taskText.includes("immediately") ||
                taskText.includes("penalty") ||
                taskText.includes("safety") ||
                taskText.includes("blocker")
            ) {
                priority = "critical";
            } else if (
                taskText.includes("must") ||
                taskText.includes("urgent") ||
                taskText.includes("keynote") ||
                taskText.includes("sound check") ||
                taskText.includes("security") ||
                taskText.includes("contract")
            ) {
                priority = "high";
            } else if (
                taskText.includes("optional") ||
                taskText.includes("when possible") ||
                taskText.includes("post-event") ||
                taskText.includes("retrospective")
            ) {
                priority = "low";
            } else {
                priority = "medium";
            }
        }

        const task = await Task.create({
            eventId: event._id,
            title: aiTask.title,
            description: aiTask.description || aiTask.title,
            assignedTo: assignedUserId,
            createdBy: userId || club.organizers?.[0] || club.members?.[0],
            priority,
            status: "pending",
            deadline: parsedDeadline,
            source: "ai_meeting",
            aiGenerated: true
        });

        // Link directly to volunteer assignedTasks
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

    for (const aiRisk of rawRisks) {
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
    // Update Meeting Record
    // ------------------------------------------

    meeting.summary = summary;
    meeting.processedByAI = true;
    await meeting.save();

    return {
        analysis: {
            ...aiAnalysis.toObject(),
            tasks: createdTasks,
            risks: createdRisks
        },
        createdTasks,
        createdRisks,
        meeting
    };
};

// --------------------------------------------------
// POST /api/meetings/:meetingId/process
// --------------------------------------------------

const analyzeMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;

        const result = await processMeetingAnalysisInternal({
            meetingId,
            userId: req.user.userId,
            force: req.query.force === "true" || req.body?.force === true
        });

        return res.json({
            success: true,
            message: "Meeting analyzed successfully",
            data: result
        });

    } catch (error) {
        console.error("AI meeting analysis error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze meeting",
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
    getMeetingAnalysis,
    processMeetingAnalysisInternal
};