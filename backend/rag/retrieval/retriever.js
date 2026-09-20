const DocumentChunk = require("../../models/DocumentChunk");
const { generateEmbedding } = require("../embeddings/embedder");

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
 * Fallback retrieval in case MongoDB Atlas $vectorSearch index is not configured or unavailable.
 * Computes cosine similarity in-process against candidate chunks.
 */
async function fallbackSimilaritySearch(query, queryEmbedding, limit, filterObj) {
  try {
    const candidates = await DocumentChunk.find(filterObj).lean();
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const scored = candidates.map((chunk) => {
      let sim = 0;
      if (Array.isArray(chunk.embedding) && chunk.embedding.length > 0 && queryEmbedding) {
        sim = cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // Fallback keyword frequency
        const qTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const txt = (chunk.text || "").toLowerCase();
        let matches = 0;
        for (const term of qTerms) {
          if (txt.includes(term)) matches++;
        }
        sim = qTerms.length > 0 ? matches / qTerms.length : 0;
      }
      return {
        _id: chunk._id,
        documentId: chunk.documentId,
        clubId: chunk.clubId,
        eventId: chunk.eventId,
        fileName: chunk.fileName || "document.pdf",
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        metadata: chunk.metadata || {},
        score: sim
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

  // Build filter object for both Atlas vectorSearch and in-process fallback
  const filters = [];
  const queryFilter = {};

  if (documentId) {
    filters.push({ documentId });
    queryFilter.documentId = documentId;
  }
  if (clubId) {
    filters.push({ clubId });
    queryFilter.clubId = clubId;
  }
  if (eventId) {
    filters.push({ eventId });
    queryFilter.eventId = eventId;
  }

  // 1. Try MongoDB Atlas $vectorSearch if queryEmbedding is available
  if (queryEmbedding) {
    try {
      const vectorSearch = {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: limit
      };

      if (filters.length === 1) {
        vectorSearch.filter = filters[0];
      } else if (filters.length > 1) {
        vectorSearch.filter = { $and: filters };
      }

      const results = await DocumentChunk.aggregate([
        {
          $vectorSearch: vectorSearch
        },
        {
          $project: {
            _id: 1,
            documentId: 1,
            clubId: 1,
            eventId: 1,
            fileName: 1,
            chunkIndex: 1,
            text: 1,
            metadata: 1,
            score: {
              $meta: "vectorSearchScore"
            }
          }
        }
      ]);

      if (results && results.length > 0) {
        return results;
      }
    } catch (atlasErr) {
      console.warn("MongoDB Atlas $vectorSearch index not available, using in-memory similarity fallback:", atlasErr.message);
    }
  }

  // 2. Fallback to in-process cosine similarity / keyword search
  return await fallbackSimilaritySearch(query, queryEmbedding, limit, queryFilter);
}

module.exports = {
  retrieveRelevantChunks
};
