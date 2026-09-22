const { GoogleGenerativeAI } = require("@google/generative-ai");


// --------------------------------------------------
// Gemini Configuration
// --------------------------------------------------

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);


// --------------------------------------------------
// Analyze Meeting Transcript
// --------------------------------------------------

const analyzeMeetingTranscript = async (transcript) => {

    if (!transcript || !transcript.trim()) {
        throw new Error(
            "Meeting transcript is empty"
        );
    }


    if (!process.env.GEMINI_API_KEY) {
        throw new Error(
            "GEMINI_API_KEY is not configured in .env"
        );
    }


    // Gemini model
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });


    // --------------------------------------------------
    // Prompt
    // --------------------------------------------------

    const prompt = `
You are an AI meeting analysis assistant for ClubOps.

Analyze the following meeting transcript.

Return ONLY valid JSON.

Do not return:
- Markdown
- Code fences
- Explanations outside JSON

Use exactly this structure:

{
    "summary": "short summary of the meeting",

    "tasks": [
        {
            "title": "task title",
            "description": "task description",
            "ownerId": null,
            "deadline": null,
            "priority": "low"
        }
    ],

    "risks": [
        {
            "title": "risk title",
            "description": "risk description",
            "severity": "medium",
            "probability": "medium",
            "recommendedAction": "recommended action"
        }
    ],

    "decisions": [],

    "actionItems": []
}

Important rules:

1. Do NOT invent people.
2. Do NOT invent MongoDB user IDs.
3. If the transcript does not provide an ownerId, use null.
4. If there is no deadline, use null.
5. Priority must be one of:
   low, medium, high, critical

6. Risk severity must be one of:
   low, medium, high, critical

7. Risk probability must be one of:
   low, medium, high

8. decisions must be an array of strings.
9. actionItems must be an array of strings.
10. Return valid JSON only.

Meeting transcript:

${transcript}
`;


    // --------------------------------------------------
    // Call Gemini
    // --------------------------------------------------

    const result =
        await model.generateContent(prompt);


    const response =
        result.response.text();


    // --------------------------------------------------
    // Clean Gemini response
    // --------------------------------------------------

    const cleanedResponse =
        response
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();


    // --------------------------------------------------
    // Parse JSON
    // --------------------------------------------------

    let parsedResponse;

    try {

        parsedResponse =
            JSON.parse(cleanedResponse);

    } catch (error) {

        console.error(
            "Gemini raw response:",
            response
        );

        throw new Error(
            "Gemini returned invalid JSON"
        );
    }


    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------

    if (
        typeof parsedResponse !== "object" ||
        parsedResponse === null
    ) {
        throw new Error(
            "Invalid Gemini response format"
        );
    }


    if (
        typeof parsedResponse.summary !==
        "string"
    ) {
        parsedResponse.summary = "";
    }


    if (
        !Array.isArray(parsedResponse.tasks)
    ) {
        parsedResponse.tasks = [];
    }


    if (
        !Array.isArray(parsedResponse.risks)
    ) {
        parsedResponse.risks = [];
    }


    if (
        !Array.isArray(parsedResponse.decisions)
    ) {
        parsedResponse.decisions = [];
    }


    if (
        !Array.isArray(parsedResponse.actionItems)
    ) {
        parsedResponse.actionItems = [];
    }


    return parsedResponse;
};


module.exports = {
    analyzeMeetingTranscript
};