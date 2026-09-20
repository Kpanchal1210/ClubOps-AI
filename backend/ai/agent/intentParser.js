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


function fallbackParseIntent(command) {
    const lower = command.toLowerCase().trim();

    // 1. Question / status check
    if (
        lower.startsWith("who") ||
        lower.startsWith("what") ||
        lower.startsWith("where") ||
        lower.startsWith("when") ||
        lower.startsWith("why") ||
        lower.startsWith("how") ||
        lower.startsWith("which") ||
        lower.startsWith("is ") ||
        lower.startsWith("are ") ||
        lower.startsWith("can you") ||
        lower.startsWith("tell me") ||
        lower.endsWith("?") ||
        lower.includes("status of") ||
        lower.includes("who done") ||
        lower.includes("who completed") ||
        lower.includes("who is") ||
        lower.includes("who was") ||
        lower.includes("assigned to") ||
        lower.includes("according to") ||
        lower.includes("guideline") ||
        lower.includes("contract") ||
        lower.includes("rules") ||
        lower.includes("policy")
    ) {
        return {
            intent: "QUERY_KNOWLEDGE",
            parameters: { query: command }
        };
    }

    // 2. Notification / announcement
    if (lower.includes("notif") || lower.includes("announc") || lower.includes("broadcast") || lower.includes("alert")) {
        const msgMatch = command.match(/(?:that|about|message:?)\s+(.+)$/i);
        const toMatch = command.match(/to\s+([A-Za-z0-9_\s]+?)(?:\s+that|\s+about|\s+to|$)/i);
        return {
            intent: "SEND_NOTIFICATION",
            parameters: {
                recipientName: toMatch ? toMatch[1].trim() : null,
                message: msgMatch ? msgMatch[1].trim() : command,
                priority: lower.includes("critical") ? "critical" : lower.includes("high") ? "high" : "medium"
            }
        };
    }

    // 3. Risk
    if (lower.includes("risk") || lower.includes("liability") || lower.includes("hazard")) {
        return {
            intent: "CREATE_RISK",
            parameters: {
                title: command.replace(/flag a |report a |create a /i, ""),
                severity: lower.includes("critical") ? "critical" : lower.includes("high") ? "high" : "medium"
            }
        };
    }

    // 4. Update Task
    if (lower.startsWith("mark") || lower.startsWith("update") || lower.includes("task as complete")) {
        return {
            intent: "UPDATE_TASK",
            parameters: {
                taskIdentifier: command,
                status: lower.includes("complete") ? "completed" : "in_progress"
            }
        };
    }

    // 5. Create Task
    if (lower.includes("create task") || lower.includes("assign ") || lower.includes("add task")) {
        const assigneeMatch = command.match(/assign\s+([A-Za-z]+)/i) || command.match(/for\s+([A-Za-z]+)/i);
        return {
            intent: "CREATE_TASK",
            parameters: {
                title: command.replace(/^create a (high priority |medium priority )?task (for \w+ )?(to )?|^assign \w+ (to )?/i, ""),
                assigneeName: assigneeMatch ? assigneeMatch[1] : null,
                priority: lower.includes("high") ? "high" : lower.includes("critical") ? "critical" : "medium"
            }
        };
    }

    return {
        intent: "QUERY_KNOWLEDGE",
        parameters: { query: command }
    };
}


const parseIntent = async (command) => {

    if (!command || !command.trim()) {
        throw new Error("Command is empty");
    }

    if (!process.env.GEMINI_API_KEY) {
        return fallbackParseIntent(command);
    }

    const prompt = `
You are the intent parser for ClubOps, an event management system.

Analyze the user's natural language command and determine what action they want.

Return ONLY valid JSON.
Do not return markdown.
Do not return code fences.
Do not return explanations outside JSON.

Supported intents:

CREATE_TASK
UPDATE_TASK
CREATE_RISK
SEND_NOTIFICATION
QUERY_KNOWLEDGE
UNKNOWN

Use exactly this structure:

{
    "intent": "CREATE_TASK",
    "parameters": {}
}

For CREATE_TASK, parameters may contain:

{
    "title": "task title",
    "description": "task description",
    "assigneeName": "person name or null",
    "priority": "low | medium | high | critical",
    "deadline": "date/time or null"
}

For UPDATE_TASK, parameters may contain:

{
    "taskIdentifier": "task description or identifier",
    "status": "pending | in_progress | completed | overdue | cancelled or null",
    "priority": "low | medium | high | critical or null",
    "deadline": "date/time or null"
}

For CREATE_RISK, parameters may contain:

{
    "title": "risk title",
    "description": "risk description",
    "severity": "low | medium | high | critical",
    "probability": "low | medium | high",
    "recommendedAction": "recommended action"
}

For SEND_NOTIFICATION, parameters may contain:

{
    "recipientName": "person name or null",
    "message": "notification message",
    "priority": "low | medium | high | critical"
}

For QUERY_KNOWLEDGE, parameters may contain:

{
    "query": "the factual question, who-done-what query, status check, guidelines query, contract lookup, or document search topic"
}

Important rules:

1. Do NOT invent MongoDB IDs.
2. Do NOT invent people.
3. If a person's name is mentioned, return it as assigneeName or recipientName.
4. If a value is not provided, use null.
5. Do not guess missing information.
6. For CREATE_TASK, title is required if the command clearly asks to create a task. Do NOT return CREATE_TASK if the user is asking a question (e.g. who completed a task, who is assigned, or what is the status).
7. Priority must be one of:
   low, medium, high, critical
8. Status must be one of:
   pending, in_progress, completed, overdue, cancelled
9. Risk severity must be one of:
   low, medium, high, critical
10. Risk probability must be one of:
   low, medium, high
11. If the user is asking any question (e.g. who done/completed a task, who is assigned to a task, task status, volunteer availability, risks identified, meeting decisions, venue guidelines, rules, schedules, or documents), return QUERY_KNOWLEDGE.
12. If the command does not match any supported intent, use UNKNOWN.
13. Return valid JSON only.

User command:

${command}
`;

    try {
        const genAI = getGenAI();
        const result = await genAI.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        const response = result.text;
        const cleanedResponse = response
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const parsedResponse = JSON.parse(cleanedResponse);
        if (parsedResponse && parsedResponse.intent) {
            if (!parsedResponse.parameters) {
                parsedResponse.parameters = {};
            }
            return parsedResponse;
        }
    } catch (error) {
        console.warn("Gemini intent parser fallback:", error.message);
        return fallbackParseIntent(command);
    }

    return fallbackParseIntent(command);
};


module.exports = {
    parseIntent
};
