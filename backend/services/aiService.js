const { GoogleGenerativeAI } = require("@google/generative-ai");

// --------------------------------------------------
// Gemini Configuration
// --------------------------------------------------

let genAI = null;
function getGenAI() {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * Helper: Smart relative deadline parser for transcripts
 * Converts phrases like "Friday 5 PM", "by Sep 22", "before Saturday morning" into realistic Date objects.
 */
function parseTranscriptDeadline(text, baseDate = new Date()) {
    if (!text || typeof text !== "string") return null;

    const lower = text.toLowerCase();
    const target = new Date(baseDate.getTime());

    // 1. Check for specific Month & Day (e.g. "Sep 22", "October 3rd", "Oct 1")
    const monthDayMatch = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
    if (monthDayMatch) {
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const mPrefix = monthDayMatch[1].slice(0, 3).toLowerCase();
        const mIdx = monthNames.indexOf(mPrefix);
        const day = parseInt(monthDayMatch[2], 10);
        if (mIdx !== -1 && day >= 1 && day <= 31) {
            target.setMonth(mIdx);
            target.setDate(day);
            target.setHours(17, 0, 0, 0); // Default to 5 PM
            // If target date is more than 3 months in the past, assume current or next year
            if (target.getTime() < baseDate.getTime() - 90 * 86400000) {
                target.setFullYear(baseDate.getFullYear() + 1);
            } else {
                target.setFullYear(baseDate.getFullYear());
            }
            return target;
        }
    }

    // 2. Check for weekdays (e.g. "by Friday", "before Saturday 5 PM")
    const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
        if (lower.includes(dayName)) {
            const currentDay = baseDate.getDay();
            let distance = dayIndex - currentDay;
            if (distance <= 0) distance += 7; // Next occurrence
            target.setDate(baseDate.getDate() + distance);

            // Check for specific time of day
            const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1], 10);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
                const ampm = timeMatch[3].toLowerCase();
                if (ampm === "pm" && hours < 12) hours += 12;
                if (ampm === "am" && hours === 12) hours = 0;
                target.setHours(hours, minutes, 0, 0);
            } else if (lower.includes("morning")) {
                target.setHours(9, 0, 0, 0);
            } else if (lower.includes("evening")) {
                target.setHours(18, 0, 0, 0);
            } else {
                target.setHours(17, 0, 0, 0);
            }
            return target;
        }
    }

    // 3. Check for "today" or "tomorrow"
    if (lower.includes("today")) {
        target.setHours(19, 0, 0, 0);
        return target;
    }
    if (lower.includes("tomorrow")) {
        target.setDate(baseDate.getDate() + 1);
        target.setHours(17, 0, 0, 0);
        return target;
    }

    return null;
}

/**
 * Helper: Intelligently determine task priority across 4 tiers
 */
function detectTaskPriority(text, deadline) {
    const lower = (text || "").toLowerCase();

    // Critical: Emergency, safety perimeter, class-D extinguishers, showstoppers, financial penalty
    if (
        lower.includes("critical") ||
        lower.includes("emergency") ||
        lower.includes("showstopper") ||
        lower.includes("safety perimeter") ||
        lower.includes("fire hazard") ||
        lower.includes("immediately") ||
        lower.includes("asap") ||
        lower.includes("penalty") ||
        lower.includes("blocker")
    ) {
        return "critical";
    }

    // High: Core deliverables, signing contracts, keynote setup, stage sound check, security check
    if (
        lower.includes("must ") ||
        lower.includes("urgent") ||
        lower.includes("keynote") ||
        lower.includes("contract") ||
        lower.includes("security check") ||
        lower.includes("sound check") ||
        lower.includes("pa line") ||
        lower.includes("before doors open") ||
        lower.includes("before public entry") ||
        lower.includes("deadline today")
    ) {
        return "high";
    }

    // Low: Post-event wrap-ups, optional retrospective items, nice-to-haves
    if (
        lower.includes("optional") ||
        lower.includes("nice to have") ||
        lower.includes("when possible") ||
        lower.includes("post-event") ||
        lower.includes("retrospective") ||
        lower.includes("after showcase") ||
        lower.includes("archive") ||
        lower.includes("clean up")
    ) {
        return "low";
    }

    // Boost priority if deadline is within 24 hours
    if (deadline instanceof Date && !isNaN(deadline.getTime())) {
        const diffHours = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 24) {
            return "high";
        }
    }

    return "medium";
}

/**
 * Helper: Clean action title from conversational speech
 */
function cleanTaskTitle(raw) {
    if (!raw) return "Operational Task";

    let cleaned = raw
        .replace(/^[A-Za-z\s]+,\s*(?:please|can you|could you|kindly|make sure to|ensure)\s*/i, "")
        .replace(/^(?:we need to|we must|we should|i will|i'll|i can|please|make sure to|ensure to|don't forget to|let's)\s*/i, "")
        .replace(/\b(?:urgently|asap|before \w+|\bby \w+ \d+.*$)/i, "")
        .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Strip trailing punctuation
    cleaned = cleaned.replace(/[.,:;!?]+$/, "").trim();

    if (cleaned.length > 85) {
        const truncated = cleaned.slice(0, 85);
        cleaned = truncated.slice(0, truncated.lastIndexOf(" ")) || truncated;
    }

    return cleaned || "Operational Task";
}

/**
 * Intelligent Rule-based Transcript Parser Fallback
 * Used when Gemini API is rate-limited, offline, or returns non-JSON.
 */
function fallbackAnalyzeMeetingTranscript(transcript, roster = []) {
    const lines = transcript.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tasks = [];
    const risks = [];
    const decisions = [];
    const actionItems = [];
    const participants = new Set();

    for (const line of lines) {
        let speaker = null;
        let content = line;
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0 && colonIdx < 30) {
            speaker = line.substring(0, colonIdx).trim();
            content = line.substring(colonIdx + 1).trim();
            participants.add(speaker);
        }

        const lower = content.toLowerCase();

        // 1. Check for risks
        if (
            lower.includes("risk") ||
            lower.includes("delay") ||
            lower.includes("warning") ||
            lower.includes("issue") ||
            lower.includes("pending") ||
            lower.includes("penalty")
        ) {
            let severity = "medium";
            if (lower.includes("critical") || lower.includes("penalty") || lower.includes("urgent") || lower.includes("immediate")) {
                severity = "high";
            }
            risks.push({
                title: content.slice(0, 80).replace(/^risk( check)?[:\s-]*/i, "").trim() || "Operational Risk Identified",
                description: content,
                severity,
                probability: "medium"
            });
        }

        // 2. Check for decisions
        if (
            lower.includes("locked") ||
            lower.includes("decided") ||
            lower.includes("agreed") ||
            lower.includes("confirmed") ||
            lower.includes("approved")
        ) {
            decisions.push(content);
        }

        // 3. Split content into sentences to catch discrete action items
        const sentences = content
            .split(/(?<=[.?!])\s+/)
            .map(s => s.trim())
            .filter(Boolean);

        for (const sentence of sentences) {
            const sLower = sentence.toLowerCase();

            // Ignore pure greetings or meeting management statements
            if (
                sLower.startsWith("welcome") ||
                sLower.startsWith("hi team") ||
                sLower.startsWith("hello") ||
                sLower.startsWith("thanks") ||
                sLower.startsWith("let's align") ||
                sLower.startsWith("opening meeting")
            ) {
                continue;
            }

            // Check if sentence contains actionable commitment or instruction
            if (
                sLower.includes("will ") ||
                sLower.includes("need to ") ||
                sLower.includes("must ") ||
                sLower.includes("should ") ||
                sLower.includes("assigned to ") ||
                sLower.includes("please ") ||
                sLower.includes("test ") ||
                sLower.includes("coordinate ") ||
                sLower.includes("check ") ||
                sLower.includes("verify ") ||
                sLower.includes("prepare ") ||
                sLower.includes("sign ") ||
                sLower.includes("deploy ") ||
                sLower.includes("setup ")
            ) {
                let assigneeName = null;
                let assigneeId = null;

                // Check for first-person assignment ("I will", "I'll", "I can")
                if (sLower.includes("i will") || sLower.includes("i'll") || sLower.includes("i can")) {
                    assigneeName = speaker;
                } else {
                    // Check if any roster member is named in this specific sentence
                    for (const member of roster) {
                        if (member.name) {
                            const firstName = member.name.toLowerCase().split(" ")[0];
                            if (sLower.includes(member.name.toLowerCase()) || sLower.includes(firstName)) {
                                assigneeName = member.name;
                                assigneeId = member.id || member._id;
                                break;
                            }
                        }
                    }
                    if (!assigneeName && speaker) {
                        assigneeName = speaker;
                    }
                }

                // Match ID if name was found without ID
                if (assigneeName && !assigneeId) {
                    const match = roster.find(m =>
                        m.name &&
                        (m.name.toLowerCase() === assigneeName.toLowerCase() ||
                         m.name.toLowerCase().includes(assigneeName.toLowerCase()) ||
                         assigneeName.toLowerCase().includes(m.name.toLowerCase().split(" ")[0]))
                    );
                    if (match) assigneeId = match.id || match._id;
                }

                const parsedDeadline = parseTranscriptDeadline(sentence);
                const priority = detectTaskPriority(sentence, parsedDeadline);
                const title = cleanTaskTitle(sentence);

                tasks.push({
                    title,
                    description: sentence,
                    assigneeName: assigneeName || null,
                    assigneeId: assigneeId || null,
                    deadline: parsedDeadline ? parsedDeadline.toISOString() : null,
                    priority
                });
                actionItems.push(title);
            }
        }
    }

    // Auto-distribute unassigned tasks to roster members with workload balancing
    if (roster.length > 0) {
        let rIdx = 0;
        for (const t of tasks) {
            if (!t.assigneeId && (!t.assigneeName || t.assigneeName === "Team Member")) {
                const member = roster[rIdx % roster.length];
                t.assigneeName = member.name;
                t.assigneeId = member.id || member._id;
                rIdx++;
            }
        }
    }

    return {
        summary: `Meeting attended by ${Array.from(participants).join(", ") || "the committee"}. Core items discussed included task coordination, scheduling logistics, and risk mitigation.`,
        tasks,
        risks,
        decisions: decisions.length > 0 ? decisions : ["Key logistical and operational items reviewed and prioritized."],
        actionItems: actionItems.length > 0 ? actionItems : tasks.map(t => t.title)
    };
}

/**
 * Analyze Meeting Transcript using Gemini with Roster-Aware Task Auto-Distribution
 */
const analyzeMeetingTranscript = async (transcript, roster = []) => {
    if (!transcript || !transcript.trim()) {
        throw new Error("Meeting transcript is empty");
    }

    const rosterText = Array.isArray(roster) && roster.length > 0
        ? roster.map(m => `- Name: "${m.name}", ID: "${m.id || m._id}", Team: "${m.role || 'Volunteer'}", Skills: [${(m.skills || []).join(', ')}]`).join("\n")
        : "No predefined roster provided. Extract names directly from transcript speakers and mentions.";

    const prompt = `
You are an expert AI operations coordinator for ClubOps.
Analyze the following meeting transcript.

Available Event Team Roster:
${rosterText}

Extract the following in strictly valid JSON:
1. "summary": A concise executive 2-3 sentence overview of the meeting, goals, and key discussion outcomes.
2. "tasks": Concrete action items mentioned in the meeting. Split distinct requests into individual discrete tasks with clean, action-oriented titles (e.g., "Calibrate stage lighting & laser projectors", "Coordinate loading bay security check").
   For each task:
   - "title": Action-oriented, concise title (max 80 chars, e.g. "Test stage PA system and projectors")
   - "description": Context from the transcript
   - "assigneeName": The volunteer or team member who volunteered or was assigned. If no one was named, intelligently suggest the best-suited volunteer from the roster based on their skills/team!
   - "assigneeId": The MongoDB ObjectId string from the roster if matched, or null.
   - "deadline": Target date (ISO string or YYYY-MM-DD), or null.
   - "priority": Strictly one of "critical", "high", "medium", or "low".
     * "critical": Blockers, emergency repairs, safety hazard checks, penalty clauses, immediate needs.
     * "high": Core operational deliverables, signing contracts, main stage readiness, security checks.
     * "medium": Standard logistics, dietary confirmations, badge printing, wi-fi setup.
     * "low": Non-blocking items, post-event retrospectives, general clean up.
3. "risks": Potential blockers, pending dependencies, or issues raised in the transcript.
   - "title": Concise risk title
   - "description": Explanation and impact
   - "severity": "low", "medium", "high", or "critical"
4. "decisions": Array of definitive decisions reached or locked in during the meeting (strings).
5. "actionItems": Array of high-level next steps (strings).

Return ONLY valid JSON with this exact structure:
{
  "summary": "...",
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "assigneeName": "...",
      "assigneeId": null,
      "deadline": null,
      "priority": "medium"
    }
  ],
  "risks": [
    {
      "title": "...",
      "description": "...",
      "severity": "medium"
    }
  ],
  "decisions": [ "..." ],
  "actionItems": [ "..." ]
}

Meeting transcript:
${transcript}
`;

    // Attempt Gemini call
    const client = getGenAI();
    if (client) {
        const candidateModels = [
            process.env.GEMINI_MODEL,
            "gemini-3.6-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ].filter(Boolean);

        for (const modelName of candidateModels) {
            try {
                const model = client.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = result.response.text();

                const cleaned = response
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

                const parsed = JSON.parse(cleaned);

                if (parsed && typeof parsed === "object") {
                    parsed.summary = typeof parsed.summary === "string" ? parsed.summary : "";
                    parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
                    parsed.risks = Array.isArray(parsed.risks) ? parsed.risks : [];
                    parsed.decisions = Array.isArray(parsed.decisions) ? parsed.decisions : [];
                    parsed.actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : [];

                    // Auto-distribute tasks if assigneeId is not set but name matches roster
                    if (Array.isArray(roster) && roster.length > 0) {
                        let rIdx = 0;
                        for (const task of parsed.tasks) {
                            if (!task.assigneeId && task.assigneeName) {
                                const matched = roster.find(m =>
                                    m.name &&
                                    (m.name.toLowerCase() === task.assigneeName.toLowerCase() ||
                                     m.name.toLowerCase().includes(task.assigneeName.toLowerCase()) ||
                                     task.assigneeName.toLowerCase().includes(m.name.toLowerCase().split(" ")[0]))
                                );
                                if (matched) {
                                    task.assigneeId = matched.id || matched._id;
                                    task.assigneeName = matched.name;
                                }
                            }
                            // Auto-distribute to roster if still completely unassigned
                            if (!task.assigneeId && (!task.assigneeName || task.assigneeName === "Team Member")) {
                                const assignedMember = roster[rIdx % roster.length];
                                task.assigneeId = assignedMember.id || assignedMember._id;
                                task.assigneeName = assignedMember.name;
                                rIdx++;
                            }

                            // Validate and sanitize priority
                            const validPriorities = ["critical", "high", "medium", "low"];
                            if (!validPriorities.includes(task.priority)) {
                                task.priority = detectTaskPriority(task.title + " " + (task.description || ""));
                            }
                        }
                    }

                    return parsed;
                }
            } catch (err) {
                console.warn(`Gemini meeting analysis failed with ${modelName}:`, err.message);
            }
        }
    }

    console.warn("Using intelligent rule-based meeting transcript parser fallback.");
    return fallbackAnalyzeMeetingTranscript(transcript, roster);
};

module.exports = {
    analyzeMeetingTranscript
};