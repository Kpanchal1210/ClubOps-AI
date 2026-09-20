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

const GREETING_DEFAULT = "Hello! I am your ClubOps AI Assistant. I can help you create and update tasks, flag operational risks, broadcast committee notifications, search event documents, and check live schedules or rosters. How can I assist you today?";

const conversationalTool = async ({
    command,
    query,
    userId,
    eventId
}) => {
    const input = (command || query || "").trim();
    const lower = input.toLowerCase();

    // 1. Direct detection for standard greetings
    const isGreeting =
        !lower ||
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower === "help" ||
        lower.startsWith("hi ") ||
        lower.startsWith("hello ") ||
        lower.startsWith("hey ") ||
        lower.startsWith("good morning") ||
        lower.startsWith("good afternoon") ||
        lower.startsWith("good evening") ||
        lower.startsWith("who are you") ||
        lower.startsWith("what can you do");

    if (isGreeting) {
        return {
            query: input || "greeting",
            answer: GREETING_DEFAULT,
            message: GREETING_DEFAULT,
            type: "conversational"
        };
    }

    // 2. If Gemini is available, answer conversationally with event ops context
    if (process.env.GEMINI_API_KEY) {
        try {
            const ai = getGenAI();
            const prompt = `
You are the ClubOps AI Agent assistant for university club event management and operations.
The user said: "${input}"

Respond politely, directly, and concisely (under 3 sentences).
Explain how you can assist them with organizing events, creating deliverables, assigning tasks to team members, identifying operational risks, or querying event documents.

Response:
`;
            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt
            });

            const reply = response.text?.trim();
            if (reply) {
                return {
                    query: input,
                    answer: reply,
                    message: reply,
                    type: "conversational"
                };
            }
        } catch (err) {
            console.warn("Conversational Gemini fallback:", err.message);
        }
    }

    // 3. Fallback response
    const fallbackMessage = `I am your ClubOps AI Assistant. I can help manage your events, schedule deliverables, flag liabilities, search uploaded documents, or dispatch team notifications. You can try commands like "Create a high priority task for [Name]", "Flag a risk: [Description]", or "According to our documents, what are the venue safety guidelines?".`;

    return {
        query: input,
        answer: fallbackMessage,
        message: fallbackMessage,
        type: "conversational"
    };
};

module.exports = conversationalTool;
