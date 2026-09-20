const mongoose = require("mongoose");
const DocumentChunk = require("../../models/DocumentChunk");
const { generateEmbedding } = require("../embeddings/embedder");

/**
 * Builds a flexible filter matching both String and ObjectId representations
 * in MongoDB Schema.Types.Mixed fields.
 */
function buildFlexibleIdMatch(id) {
  if (!id) return null;
  const idStr = id.toString().trim();
  const values = [idStr];
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    try {
      values.push(new mongoose.Types.ObjectId(idStr));
    } catch (_) {}
  }
  return { $in: values };
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-process similarity search against candidate chunks using hybrid dense + keyword scoring.
 */
async function fallbackSimilaritySearch(query, queryEmbedding, limit, filterObj, altFilterObj = null) {
  try {
    let candidates = await DocumentChunk.find(filterObj).lean();
    
    // If combined filter returned 0, try alternate broader filter (e.g. eventId only)
    if ((!candidates || candidates.length === 0) && altFilterObj) {
      candidates = await DocumentChunk.find(altFilterObj).lean();
    }

    if (!candidates || candidates.length === 0) {
      // Final fallback: fetch any chunks if database has any for this context
      return [];
    }

    const qTerms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = candidates.map((chunk) => {
      let semScore = 0;
      if (Array.isArray(chunk.embedding) && chunk.embedding.length > 0 && queryEmbedding) {
        semScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      }

      // Keyword match frequency & phrase matching
      const txt = (chunk.text || "").toLowerCase();
      let matches = 0;
      for (const term of qTerms) {
        if (txt.includes(term)) matches++;
      }
      const kwScore = qTerms.length > 0 ? matches / qTerms.length : 0;

      // Hybrid score: balance dense semantic similarity with exact keyword presence
      let finalScore = semScore > 0 ? (0.7 * semScore) + (0.3 * kwScore) : kwScore;

      return {
        _id: chunk._id,
        documentId: chunk.documentId,
        clubId: chunk.clubId,
        eventId: chunk.eventId,
        fileName: chunk.fileName || "document.pdf",
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        metadata: chunk.metadata || {},
        score: finalScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  } catch (err) {
    console.warn("Fallback similarity search error:", err.message);
    return [];
  }
}

/**
 * Retrieve top relevant document chunks using vector search with automatic fallback.
 *
 * @param {string} query
 * @param {number} limit
 * @param {string|null} documentId
 * @param {string|null} clubId
 * @param {string|null} eventId
 * @returns {Promise<Array>}
 */
async function retrieveRelevantChunks(
  query,
  limit = 3,
  documentId = null,
  clubId = null,
  eventId = null
) {
  let queryEmbedding = null;
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (embedErr) {
    console.warn("Could not generate query embedding, proceeding with text fallback:", embedErr.message);
  }

  // Build filter object supporting both String and ObjectId BSON types
  const queryFilter = {};
  if (documentId) {
    queryFilter.documentId = buildFlexibleIdMatch(documentId);
  }
  if (clubId) {
    queryFilter.clubId = buildFlexibleIdMatch(clubId);
  }
  if (eventId) {
    queryFilter.eventId = buildFlexibleIdMatch(eventId);
  }

  // Alternate filter with only eventId or documentId in case clubId was unlinked
  let altFilter = null;
  if (eventId) {
    altFilter = { eventId: buildFlexibleIdMatch(eventId) };
  } else if (clubId) {
    altFilter = { clubId: buildFlexibleIdMatch(clubId) };
  }

  // Fallback to in-process cosine similarity / keyword search
  return await fallbackSimilaritySearch(query, queryEmbedding, limit, queryFilter, altFilter);
}

module.exports = {
  retrieveRelevantChunks,
  buildFlexibleIdMatch,
};
