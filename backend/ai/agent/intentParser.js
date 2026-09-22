const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;


const parseIntent = async (command) => {

    if (!command || !command.trim()) {
        throw new Error("Command is empty");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error(
            "GEMINI_API_KEY is not configured in .env"
        );
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
    "query": "the factual question, guidelines query, contract lookup, or document search topic"
}

Important rules:

1. Do NOT invent MongoDB IDs.
2. Do NOT invent people.
3. If a person's name is mentioned, return it as assigneeName or recipientName.
4. If a value is not provided, use null.
5. Do not guess missing information.
6. For CREATE_TASK, title is required if the command clearly asks to create a task.
7. Priority must be one of:
   low, medium, high, critical
8. Status must be one of:
   pending, in_progress, completed, overdue, cancelled
9. Risk severity must be one of:
   low, medium, high, critical
10. Risk probability must be one of:
   low, medium, high
11. If the user is asking a question about event documents, policies, guidelines, venue rules, schedules, or contracts, return QUERY_KNOWLEDGE.
12. If the command does not match any supported intent, use UNKNOWN.
13. Return valid JSON only.

User command:

${command}
`;


    let parsedResponse;

    try {
        if (!genAI) {
            throw new Error("Gemini API key not configured");
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const cleanedResponse = response
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        parsedResponse = JSON.parse(cleanedResponse);

    } catch (llmError) {
        console.warn("Gemini intent parser fallback triggered:", llmError.message);

        // Fallback rule-based parser for offline / timeout scenarios
        const lower = command.toLowerCase().trim();

        if (lower.includes("notif") || lower.includes("announc") || lower.includes("broadcast") || lower.includes("alert")) {
            const recipientMatch = command.match(/to\s+([A-Za-z0-9_\s]+?)(?:\s+that|\s+about|\s+to|$)/i);
            const msgMatch = command.match(/(?:that|about|message:?)\s+(.+)$/i);
            parsedResponse = {
                intent: "SEND_NOTIFICATION",
                parameters: {
                    recipientName: recipientMatch ? recipientMatch[1].trim() : (lower.includes("all") ? "all" : undefined),
                    message: msgMatch ? msgMatch[1].trim() : command,
                    priority: lower.includes("critical") ? "critical" : lower.includes("high") ? "high" : "medium",
                    type: "announcement"
                }
            };
        } else if (lower.includes("mark") || lower.includes("update") || (lower.includes("task") && lower.includes("complet"))) {
            const taskMatch = command.match(/(?:task\s+)?["']?([^"']+)["']?\s+(?:as\s+)?(completed|in_progress|pending)/i) ||
                              command.match(/mark\s+(?:the\s+)?(.+?)\s+(?:task\s+)?(?:as\s+)?(completed|in_progress|pending)/i);
            parsedResponse = {
                intent: "UPDATE_TASK",
                parameters: {
                    taskIdentifier: taskMatch ? taskMatch[1].trim() : command.replace(/mark\s+/i, "").replace(/as completed/i, "").trim(),
                    status: lower.includes("complete") ? "completed" : lower.includes("progress") ? "in_progress" : "pending"
                }
            };
        } else if (lower.includes("risk") || lower.includes("flag")) {
            parsedResponse = {
                intent: "CREATE_RISK",
                parameters: {
                    title: command.replace(/flag a |report a |create a |risk:?/gi, "").trim(),
                    severity: lower.includes("high") ? "high" : lower.includes("critical") ? "critical" : "medium",
                    probability: "medium",
                    recommendedAction: "Review and assign coordinator"
                }
            };
        } else if (
            lower.startsWith("what") ||
            lower.startsWith("how") ||
            lower.startsWith("where") ||
            lower.includes("according to") ||
            lower.includes("guideline") ||
            lower.includes("document") ||
            lower.includes("contract") ||
            lower.includes("rules")
        ) {
            parsedResponse = {
                intent: "QUERY_KNOWLEDGE",
                parameters: {
                    query: command.trim()
                }
            };
        } else {
            const assigneeMatch = command.match(/for\s+([A-Za-z]+)/i) || command.match(/assign\s+([A-Za-z]+)/i);
            parsedResponse = {
                intent: "CREATE_TASK",
                parameters: {
                    title: command.replace(/^create a (high priority |medium priority )?task (for \w+ )?(to )?|^assign \w+ (to )?/i, "").trim(),
                    assigneeName: assigneeMatch ? assigneeMatch[1].trim() : undefined,
                    priority: lower.includes("high") ? "high" : lower.includes("critical") ? "critical" : "medium",
                    deadline: lower.includes("tomorrow") ? "tomorrow" : lower.includes("today") ? "today" : undefined
                }
            };
        }
    }

    if (
        typeof parsedResponse !== "object" ||
        parsedResponse === null
    ) {
        parsedResponse = { intent: "UNKNOWN", parameters: {} };
    }

    if (!parsedResponse.intent) {
        parsedResponse.intent = "UNKNOWN";
    }

    if (!parsedResponse.parameters) {
        parsedResponse.parameters = {};
    }

    return parsedResponse;
};


module.exports = {
    parseIntent
};
