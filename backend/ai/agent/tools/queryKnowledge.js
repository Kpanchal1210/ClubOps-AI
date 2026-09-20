const Event = require("../../../models/Event");
const Club = require("../../../models/Club");
const Task = require("../../../models/Task");
const Risk = require("../../../models/Risk");
const Volunteer = require("../../../models/Volunteer");
const Meeting = require("../../../models/Meeting");
const { GoogleGenAI } = require("@google/genai");

let genAIClient = null;
function getGenAI() {
    if (!genAIClient) {
        genAIClient = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    }
    return genAIClient;
}

/**
 * Intelligent deterministic extractor to answer questions directly from live database records
 * if Gemini API is rate-limited (429) or offline.
 */
function extractDirectAnswer(trimmedQuery, liveTasks, liveRisks, liveVolunteers, ragChunks) {
    const qLower = trimmedQuery.toLowerCase();

    // 1. Check Tasks (who completed, who is assigned, status, priority)
    for (const t of liveTasks) {
        const titleLower = t.title.toLowerCase();
        const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
        const matchCount = titleWords.filter(w => qLower.includes(w)).length;
        if (matchCount >= 2 || qLower.includes(titleLower) || titleLower.includes(qLower)) {
            const assignee = t.assignedTo?.name ? `${t.assignedTo.name} (${t.assignedTo.role || "Organizer"})` : "Unassigned";
            const deadlineStr = t.deadline ? ` with deadline ${new Date(t.deadline).toLocaleDateString()}` : "";
            const statusStr = t.status === "completed" ? "has been completed" : `is currently ${t.status}`;
            return `The task "${t.title}" in this event was assigned to ${assignee} and ${statusStr}${deadlineStr}.`;
        }
    }

    // 2. Check Volunteers (who is in what team, availability)
    for (const v of liveVolunteers) {
        const vName = (v.userId?.name || v.name || "").toLowerCase();
        if (vName && qLower.includes(vName)) {
            const volName = v.userId?.name || v.name;
            return `${volName} is registered on the "${v.team || "General"}" team with availability marked as "${v.availability || "available"}", assigned to ${v.assignedTasks?.length || 0} task(s).`;
        }
    }

    // 3. Check Risks
    for (const r of liveRisks) {
        const rTitle = r.title.toLowerCase();
        const rWords = rTitle.split(/\s+/).filter(w => w.length > 3);
        const matchCount = rWords.filter(w => qLower.includes(w)).length;
        if (matchCount >= 2 || qLower.includes(rTitle)) {
            return `The risk "${r.title}" is rated ${r.severity.toUpperCase()} severity and is currently ${r.status.toUpperCase()}. Recommended action: ${r.recommendedAction || "Monitor actively"}.`;
        }
    }

    // 4. Check Document Chunks
    if (ragChunks && ragChunks.length > 0 && ragChunks[0].text) {
        return `From ${ragChunks[0].fileName || "event guidelines"}:\n${ragChunks[0].text.trim()}`;
    }

    return null;
}

const queryKnowledgeTool = async ({
    query,
    eventId: providedEventId,
    userId,
    clubId: providedClubId
}) => {
    // 1. Validate required fields
    if (!query || !query.trim()) {
        throw new Error("Knowledge query is required");
    }

    if (!userId) {
        throw new Error("userId is required");
    }

    let eventId = providedEventId;
    let clubId = providedClubId;
    let event = null;

    // 2. Resolve event and club
    if (eventId) {
        event = await Event.findById(eventId);
        if (event) {
            clubId = event.clubId;
        }
    } else if (clubId) {
        // If eventId wasn't passed, find the most active or recent event for this club
        event = await Event.findOne({ clubId }).sort({ createdAt: -1 });
        if (event) {
            eventId = event._id;
        }
    } else {
        // Fallback: find any event the user belongs to
        const userClub = await Club.findOne({ members: userId });
        if (userClub) {
            clubId = userClub._id;
            event = await Event.findOne({ clubId }).sort({ createdAt: -1 });
            if (event) {
                eventId = event._id;
            }
        }
    }

    // 3. Validate club membership
    if (clubId) {
        const club = await Club.findById(clubId);
        if (club) {
            const isMember = club.members.some(
                member => member.toString() === userId.toString()
            );
            if (!isMember) {
                throw new Error("You are not a member of this event's club");
            }
        }
    }

    const trimmedQuery = query.trim();

    // 4. Fetch Live Event Operational Records
    let liveTasks = [];
    let liveRisks = [];
    let liveVolunteers = [];
    let liveMeetings = [];

    if (eventId) {
        [liveTasks, liveRisks, liveVolunteers, liveMeetings] = await Promise.all([
            Task.find({ eventId })
                .populate("assignedTo", "name email role")
                .populate("createdBy", "name email")
                .lean(),
            Risk.find({ eventId })
                .populate("assignedTo", "name email")
                .lean(),
            Volunteer.find({ eventId })
                .populate("userId", "name email")
                .lean(),
            Meeting.find({ eventId }).lean()
        ]);
    }

    // 5. Query In-Process RAG Document Chunks
    let ragChunks = [];
    try {
        const { retrieveRelevantChunks: getChunks } = require("../../../rag/retrieval/retriever");
        ragChunks = await getChunks(
            trimmedQuery,
            3,
            null,
            clubId ? clubId.toString() : null,
            eventId ? eventId.toString() : null
        );
    } catch (ragErr) {
        console.warn("RAG chunk retrieval warning:", ragErr.message);
    }

    // 6. Format Operational & Document Context for Gemini Synthesis
    const tasksSummary = liveTasks.length > 0
        ? liveTasks.map((t, i) => {
            const assignee = t.assignedTo?.name || "Unassigned";
            const creator = t.createdBy?.name || "Organizer";
            const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None";
            return `Task ${i + 1}: "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Assigned To: ${assignee} | Created By: ${creator} | Deadline: ${deadline}`;
        }).join("\n")
        : "No tasks recorded for this event.";

    const risksSummary = liveRisks.length > 0
        ? liveRisks.map((r, i) => {
            const assignee = r.assignedTo?.name || "Unassigned";
            return `Risk ${i + 1}: "${r.title}" | Severity: ${r.severity} | Probability: ${r.probability} | Status: ${r.status} | Assigned: ${assignee}`;
        }).join("\n")
        : "No risks reported for this event.";

    const volunteersSummary = liveVolunteers.length > 0
        ? liveVolunteers.map((v, i) => {
            const name = v.userId?.name || v.name || "Volunteer";
            return `Volunteer ${i + 1}: ${name} | Team: ${v.team || "General"} | Availability: ${v.availability || "available"} | Assigned Tasks Count: ${v.assignedTasks?.length || 0}`;
        }).join("\n")
        : "No volunteers assigned.";

    const meetingsSummary = liveMeetings.length > 0
        ? liveMeetings.map((m, i) => `Meeting ${i + 1}: "${m.title}" (${new Date(m.date).toLocaleDateString()}) - Summary: ${m.summary || "No summary"}`).join("\n")
        : "No meetings logged.";

    const ragSummary = ragChunks.length > 0
        ? ragChunks.map((chunk, i) => `Source ${i + 1} (${chunk.fileName || "document.pdf"} - chunk ${chunk.chunkIndex}):\n${chunk.text}`).join("\n\n")
        : "No matching document chunks found.";

    const prompt = `
You are the ClubOps AI Agent knowledge and operations assistant.
Answer the user's question accurately using ONLY the live event data and document archives provided below.

Rules:
1. Be clear, concise, direct, and professional.
2. When answering questions about tasks (e.g. who completed a task, who is assigned, task statuses, priorities, deadlines), refer directly to the [LIVE EVENT TASKS] roster.
3. When answering questions about volunteers, risks, or meetings, refer directly to their respective sections.
4. When answering questions about rules, venue safety, noise curfew, guidelines, or contracts, refer directly to the [EVENT DOCUMENT ARCHIVES (RAG)].
5. If the exact answer cannot be determined from the records, state clearly what is currently recorded.

Event: ${event?.name || "Current Event"}
Venue: ${event?.venue || "Main Campus"}
Status: ${event?.status || "active"}

[LIVE EVENT TASKS]
${tasksSummary}

[LIVE EVENT RISKS]
${risksSummary}

[LIVE VOLUNTEER ROSTER]
${volunteersSummary}

[MEETING LOGS]
${meetingsSummary}

[EVENT DOCUMENT ARCHIVES (RAG)]
${ragSummary}

User Question:
${trimmedQuery}

Answer:
`;

    let answer = null;
    const matchedSources = [];

    if (process.env.GEMINI_API_KEY) {
        try {
            const ai = getGenAI();
            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt
            });
            answer = response.text?.trim() || null;
        } catch (genErr) {
            console.warn("Gemini query generation fallback:", genErr.message);
        }
    }

    if (!answer) {
        const direct = extractDirectAnswer(trimmedQuery, liveTasks, liveRisks, liveVolunteers, ragChunks);
        if (direct) {
            answer = direct;
        } else {
            answer = "I could not find matching records for this query in the event database or document archives.";
        }
    }

    // Populate matched sources
    const qLower = trimmedQuery.toLowerCase();
    for (const t of liveTasks) {
        const titleLower = t.title.toLowerCase();
        const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
        const matchCount = titleWords.filter(w => qLower.includes(w)).length;
        if (matchCount >= 2 || qLower.includes(titleLower) || titleLower.includes(qLower)) {
            matchedSources.push({
                type: "task",
                title: t.title,
                status: t.status,
                assignedTo: t.assignedTo?.name || "Unassigned"
            });
        }
    }
    for (const chunk of ragChunks) {
        matchedSources.push({
            type: "document",
            documentId: chunk.documentId,
            fileName: chunk.fileName,
            chunkIndex: chunk.chunkIndex,
            score: typeof chunk.score === "number" ? Math.round(chunk.score * 100) / 100 : null
        });
    }

    return {
        query: trimmedQuery,
        answer,
        sources: matchedSources,
        sourceCount: matchedSources.length
    };
};

module.exports = queryKnowledgeTool;
