const DocumentChunk = require("../models/DocumentChunk");
const { generateEmbedding } = require("../embeddings/embedder");

async function retrieveRelevantChunks(
  query,
  limit = 3,
  documentId = null,
  clubId = null,
  eventId = null
) {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const vectorSearch = {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 50,
      limit: limit
    };

    const filters = [];

    if (documentId) {
      filters.push({
        documentId: documentId
      });
    }

    if (clubId) {
      filters.push({
        clubId: clubId
      });
    }

    if (eventId) {
      filters.push({
        eventId: eventId
      });
    }

    if (filters.length === 1) {
      vectorSearch.filter = filters[0];
    }

    if (filters.length > 1) {
      vectorSearch.filter = {
        $and: filters
      };
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

    return results;

  } catch (error) {
    console.error(
      "Vector search error:",
      error.message
    );

    throw new Error(
      "Failed to retrieve relevant chunks"
    );
  }
}

module.exports = {
  retrieveRelevantChunks
};