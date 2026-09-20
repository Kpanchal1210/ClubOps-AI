const Event = require("../../../models/Event");
const Club = require("../../../models/Club");
const Document = require("../../../models/Document");
const { GoogleGenAI } = require("@google/genai");
const { generateRAGAnswer } = require("../../../rag/services/ragService");

const queryKnowledgeTool = async ({
    query,
    eventId,
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

    let clubId = providedClubId;
    let event = null;

    // 2. Validate event and club access if eventId is provided
    if (eventId) {
        event = await Event.findById(eventId);
        if (!event) {
            throw new Error("Event not found");
        }
        clubId = event.clubId;
    }

    if (clubId) {
        const club = await Club.findById(clubId);
        if (!club) {
            throw new Error("Club not found");
        }

        const isMember = club.members.some(
            member => member.toString() === userId.toString()
        );

        if (!isMember) {
            throw new Error("You are not a member of this event's club");
        }
    }

    const trimmedQuery = query.trim();
    let answer = null;
    let sources = [];

    // 3. Query in-process RAG service directly (vector embeddings + Gemini)
    try {
        const ragRes = await generateRAGAnswer(
            trimmedQuery,
            null,
            clubId ? clubId.toString() : null,
            eventId ? eventId.toString() : null
        );

        if (ragRes && ragRes.answer && ragRes.sources && ragRes.sources.length > 0) {
            answer = ragRes.answer;
            sources = ragRes.sources;
        }
    } catch (ragErr) {
        console.log("In-process RAG query fallback to database documents:", ragErr.message);
    }

    // 4. Grounded Document Fallback using MongoDB Document records + Gemini
    if (!answer) {
        const docFilter = {};
        if (eventId) {
            docFilter.$or = [{ eventId }, { clubId }];
        } else if (clubId) {
            docFilter.clubId = clubId;
        }

        const documents = await Document.find(docFilter).limit(5);

        if (documents.length > 0 && process.env.GEMINI_API_KEY) {
            const contextText = documents
                .map((d, i) => `[Source ${i + 1}] Title: ${d.title} | File: ${d.fileName}\nContent:\n${d.content || "Uploaded document registered in event archives."}`)
                .join("\n\n---\n\n");

            const prompt = `
You are the ClubOps AI Agent knowledge assistant.
Answer the question based on the following club event documents.

Context:
${contextText}

Question:
${trimmedQuery}

Rules:
- Be clear, concise, and professional.
- Ground your answer in the provided documents where possible.
- If the exact answer is not in the text, summarize the relevant document topics available.
`;

            const genAI = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY
            });

            const genResult = await genAI.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt
            });

            answer = genResult.text?.trim() || "No detailed answer generated.";
            sources = documents.map(d => ({
                documentId: d._id,
                fileName: d.fileName,
                title: d.title
            }));
        } else if (documents.length > 0) {
            answer = `Found ${documents.length} document(s) for this event (${documents.map(d => d.title).join(", ")}), but live AI synthesis is currently unavailable.`;
            sources = documents.map(d => ({
                documentId: d._id,
                fileName: d.fileName,
                title: d.title
            }));
        } else {
            answer = `No event guidelines or documents have been uploaded for "${event?.name || "this event"}" yet. You can upload safety manuals, schedules, or contracts in the Documents tab for AI-grounded retrieval.`;
            sources = [];
        }
    }

    return {
        query: trimmedQuery,
        answer,
        sources,
        sourceCount: sources.length
    };
};

module.exports = queryKnowledgeTool;
