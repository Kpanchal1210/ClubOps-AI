const { GoogleGenAI } = require("@google/genai");
const { retrieveRelevantChunks } = require("../retrieval/retriever");

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
 * Generates an answer to a question grounded strictly in retrieved document chunks.
 *
 * @param {string} query
 * @param {string|null} documentId
 * @param {string|null} clubId
 * @param {string|null} eventId
 * @returns {Promise<{ answer: string, sources: Array }>}
 */
async function generateRAGAnswer(
  query,
  documentId = null,
  clubId = null,
  eventId = null
) {
  try {
    const chunks = await retrieveRelevantChunks(
      query,
      3,
      documentId,
      clubId,
      eventId
    );

    if (!chunks || chunks.length === 0) {
      return {
        answer: "I could not find relevant information in the provided documents.",
        sources: [],
      };
    }

    const context = chunks
      .map((chunk, index) => {
        return `Source ${index + 1}:
File: ${chunk.fileName || "document.pdf"}
Document ID: ${chunk.documentId}
Club ID: ${chunk.clubId || "N/A"}
Event ID: ${chunk.eventId || "N/A"}
Chunk: ${chunk.chunkIndex}

Content:
${chunk.text}`;
      })
      .join("\n\n");

    const prompt = `
You are the ClubOps AI assistant.

Answer the user's question using ONLY the information provided in the context below.

Rules:
- Do not invent information.
- Do not make assumptions.
- If the answer is not present in the context, say:
"I could not find this information in the provided documents."
- Give a clear, structured, and concise answer.

Context:
${context}

User Question:
${query}

Answer:
`;

    let generatedAnswer = null;

    // Attempt Gemini Generation
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      if (response && response.text && response.text.trim()) {
        generatedAnswer = response.text.trim();
      }
    } catch (llmErr) {
      console.warn("[RAG Service] Gemini generation failed, using intelligent extractive fallback:", llmErr.message);
    }

    // If Gemini was unavailable, quota-exhausted (429), or empty, synthesize from retrieved chunks
    if (!generatedAnswer) {
      generatedAnswer = synthesizeExtractiveAnswer(query, chunks);
    }

    return {
      answer: generatedAnswer || "I could not find relevant information in the provided documents.",
      sources: chunks.map((chunk) => ({
        documentId: chunk.documentId?.toString() || "",
        clubId: chunk.clubId?.toString() || null,
        eventId: chunk.eventId?.toString() || null,
        fileName: chunk.fileName || "document.pdf",
        title: chunk.metadata?.title || chunk.fileName || "Document",
        chunkIndex: chunk.chunkIndex,
        score: typeof chunk.score === "number" ? Math.round(chunk.score * 100) / 100 : null,
      })),
    };
  } catch (error) {
    console.error("RAG generation error:", error.message);
    return {
      answer: "I encountered an error retrieving or analyzing the documents. Please verify document status and try again.",
      sources: [],
    };
  }
}

/**
 * Synthesizes a structured grounded answer directly from retrieved chunks
 * when LLM rate limits/quotas are exceeded or external API is unavailable.
 */
function synthesizeExtractiveAnswer(query, chunks) {
  if (!chunks || chunks.length === 0) {
    return "I could not find relevant information in the provided documents.";
  }

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const decisions = [];
  const risks = [];
  const actions = [];
  const specificMatches = [];

  for (const chunk of chunks) {
    const lines = (chunk.text || "").split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lower = line.toLowerCase();

      const matchedTerms = queryTerms.filter((t) => lower.includes(t));
      if (matchedTerms.length > 0 && !lower.startsWith("transcript") && !lower.startsWith("source")) {
        specificMatches.push({ line, matchCount: matchedTerms.length });
      }

      if (
        lower.startsWith("key decision") ||
        lower.startsWith("decision:") ||
        lower.includes("decision: ") ||
        lower.includes("key decisions:")
      ) {
        decisions.push(line.replace(/^(krish|team|key decisions?):\s*/i, "").trim());
      } else if (
        lower.includes("risk") ||
        lower.includes("hazard") ||
        lower.includes("warning") ||
        lower.includes("liability")
      ) {
        risks.push(line.replace(/^(krish|flagged risk):\s*/i, "").trim());
      } else if (
        lower.startsWith("-") ||
        lower.startsWith("•") ||
        lower.includes("priority") ||
        lower.includes("actions from")
      ) {
        actions.push(line);
      }
    }
  }

  const docNames = [...new Set(chunks.map((c) => c.fileName).filter(Boolean))].join(", ");
  let output = `Based on retrieved document records (${docNames || "Event Documents"}):\n\n`;

  const queryLower = query.toLowerCase();
  const asksDecisions = queryLower.includes("decision") || queryLower.includes("rule") || queryLower.includes("policy") || queryLower.includes("protocol");
  const asksRisks = queryLower.includes("risk") || queryLower.includes("hazard") || queryLower.includes("safety") || queryLower.includes("contract") || queryLower.includes("liability");
  const asksTasks = queryLower.includes("task") || queryLower.includes("action") || queryLower.includes("who") || queryLower.includes("timeline") || queryLower.includes("volunteer");

  let sectionsAdded = 0;

  if (specificMatches.length > 0) {
    specificMatches.sort((a, b) => b.matchCount - a.matchCount);
    const topMatches = specificMatches.slice(0, 4);
    output += `**Direct Grounded Excerpts:**\n`;
    topMatches.forEach((m) => {
      output += `• ${m.line}\n`;
    });
    output += "\n";
    sectionsAdded++;
  }

  if ((asksDecisions || sectionsAdded === 0) && decisions.length > 0) {
    output += `**Key Decisions & Directives:**\n`;
    [...new Set(decisions)].slice(0, 3).forEach((d) => {
      output += `• ${d}\n`;
    });
    output += "\n";
    sectionsAdded++;
  }

  if ((asksRisks || sectionsAdded === 0) && risks.length > 0) {
    output += `**Identified Operational Risks & Compliance:**\n`;
    [...new Set(risks)].slice(0, 3).forEach((r) => {
      output += `• ${r}\n`;
    });
    output += "\n";
    sectionsAdded++;
  }

  if ((asksTasks || sectionsAdded === 0) && actions.length > 0) {
    output += `**Operational Actions & Assignments:**\n`;
    [...new Set(actions)].slice(0, 4).forEach((a) => {
      const cleanA = a.startsWith("-") || a.startsWith("•") ? a : `• ${a}`;
      output += `${cleanA}\n`;
    });
    output += "\n";
    sectionsAdded++;
  }

  if (sectionsAdded === 0) {
    output += `**Document Overview:**\n${chunks[0].text.slice(0, 400)}...\n`;
  }

  return output.trim();
}

module.exports = {
  generateRAGAnswer,
};
