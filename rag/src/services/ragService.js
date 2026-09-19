const { GoogleGenAI } = require("@google/genai");
const { retrieveRelevantChunks } = require("../retrieval/retriever");

require("dotenv").config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateRAGAnswer(query, documentId = null) {
  try {
    // 1. Retrieve relevant chunks
    const chunks = await retrieveRelevantChunks(
      query,
      3,
      documentId
    );

    if (!chunks || chunks.length === 0) {
      return {
        answer:
          "I could not find relevant information in the provided documents.",
        sources: [],
      };
    }

    // 2. Create context
    const context = chunks
      .map((chunk, index) => {
        return `Source ${index + 1}:
File: ${chunk.fileName}
Document ID: ${chunk.documentId}
Chunk: ${chunk.chunkIndex}

Content:
${chunk.text}`;
      })
      .join("\n\n");

    // 3. Prompt Gemini
    const prompt = `
You are the ClubOps AI assistant.

Answer the user's question using ONLY the information
provided in the context below.

Rules:
- Do not invent information.
- Do not make assumptions.
- If the answer is not present in the context, say:
"I could not find this information in the provided documents."
- Give a clear and concise answer.

Context:
${context}

User Question:
${query}

Answer:
`;

    // 4. Generate answer
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    // 5. Return answer and sources
    return {
      answer: response.text,
      sources: chunks.map((chunk) => ({
        documentId: chunk.documentId,
        fileName: chunk.fileName,
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
      })),
    };
  } catch (error) {
    console.error("RAG generation error:", error.message);
    throw new Error("Failed to generate RAG answer");
  }
}

module.exports = {
  generateRAGAnswer,
};