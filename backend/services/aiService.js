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

        // Check for risks
        if (lower.includes("risk") || lower.includes("delay") || lower.includes("warning") || lower.includes("issue") || lower.includes("pending")) {
            let severity = "medium";
            if (lower.includes("critical") || lower.includes("penalty") || lower.includes("urgent")) {
                severity = "high";
            }
            risks.push({
                title: content.slice(0, 80).replace(/^risk( check)?[:\s-]*/i, "").trim() || "Operational Risk Identified",
                description: content,
                severity,
                probability: "medium"
            });
        }

        // Check for decisions
        if (lower.includes("locked") || lower.includes("decided") || lower.includes("agreed") || lower.includes("confirmed") || lower.includes("approved")) {
            decisions.push(content);
        }

        // Check for tasks
        if (
            lower.includes("will ") ||
            lower.includes("need to ") ||
            lower.includes("must ") ||
            lower.includes("should ") ||
            lower.includes("assigned to ") ||
            lower.includes("prepare") ||
            lower.includes("coordinate") ||
            lower.includes("check")
        ) {
            let assigneeName = null;
            let assigneeId = null;

            if (lower.includes("i will") || lower.includes("i'll") || lower.includes("i can")) {
                assigneeName = speaker;
            } else {
                for (const member of roster) {
                    if (member.name && lower.includes(member.name.toLowerCase().split(" ")[0])) {
                        assigneeName = member.name;
                        assigneeId = member.id || member._id;
                        break;
                    }
                }
                if (!assigneeName && speaker) {
                    assigneeName = speaker;
                }
            }

            if (assigneeName && !assigneeId) {
                const match = roster.find(m => m.name && m.name.toLowerCase().includes(assigneeName.toLowerCase()));
                if (match) assigneeId = match.id || match._id;
            }

            let deadline = null;
            const dateMatch = content.match(/\b(by|before|on|due)\s+([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?|\d{1,2}\/\d{1,2}\/?\d{0,4})/i);
            if (dateMatch) {
                deadline = dateMatch[0].replace(/^(by|before|on|due)\s+/i, "");
            }

            tasks.push({
                title: content.slice(0, 90),
                description: content,
                assigneeName: assigneeName || "Team Member",
                assigneeId: assigneeId || null,
                deadline,
                priority: lower.includes("must") || lower.includes("urgent") || lower.includes("critical") ? "high" : "medium"
            });
            actionItems.push(content.slice(0, 100));
        }
    }

    // Auto-distribute tasks if still unassigned and roster exists
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
        ? roster.map(m => `- Name: "${m.name}", ID: "${m.id || m._id}", Role: "${m.role || 'Member'}", Skills: [${(m.skills || []).join(', ')}]`).join("\n")
        : "No predefined roster provided. Extract names directly from transcript speakers and mentions.";

    const prompt = `
You are an expert AI meeting operations assistant for ClubOps.
Analyze the following meeting transcript.

Available Event Team Roster:
${rosterText}

Extract the following in strictly valid JSON:
1. "summary": A clear, executive 2-3 sentence overview of the meeting, goals, and key discussion outcomes.
2. "tasks": Concrete action items mentioned in the meeting.
   For each task:
   - "title": Action-oriented title (e.g. "Test stage PA system and projectors")
   - "description": Context from the transcript
   - "assigneeName": The person's name who volunteered or was assigned. If no one was named, intelligently AUTO-DISTRIBUTE to the best-suited team member from the roster based on their skills/role!
   - "assigneeId": The MongoDB ObjectId string from the roster if matched, or null.
   - "deadline": Target date mentioned (e.g. "Sep 22" or formatted YYYY-MM-DD), or null.
   - "priority": "low", "medium", "high", or "critical"
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