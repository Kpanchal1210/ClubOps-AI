const { GoogleGenAI } = require("@google/genai");

let aiClient = null;

function getAIClient() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
}

/**
 * Generate a dense vector embedding for a given text snippet using Gemini.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const ai = getAIClient();
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

    if (
      response.embeddings &&
      response.embeddings[0] &&
      response.embeddings[0].values
    ) {
      return response.embeddings[0].values;
    }

    if (response.embedding && response.embedding.values) {
      return response.embedding.values;
    }

    throw new Error("Invalid embedding response format from Gemini");
  } catch (error) {
    console.error("Embedding error:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

module.exports = {
  generateEmbedding,
};
