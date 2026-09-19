const { GoogleGenAI } = require("@google/genai");

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


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
11. If the command does not match any supported intent, use UNKNOWN.
12. Return valid JSON only.

User command:

${command}
`;


    const result = await genAI.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
    });


    const response = result.text;


    const cleanedResponse = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();


    let parsedResponse;

    try {

        parsedResponse = JSON.parse(cleanedResponse);

    } catch (error) {

        console.error(
            "Gemini raw response:",
            response
        );

        throw new Error(
            "Gemini returned invalid JSON"
        );
    }


    if (
        typeof parsedResponse !== "object" ||
        parsedResponse === null
    ) {
        throw new Error(
            "Invalid intent parser response"
        );
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
