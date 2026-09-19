const DocumentChunk = require("../models/DocumentChunk");
const { generateEmbedding } = require("../embeddings/embedder");

async function retrieveRelevantChunks(query, limit = 3, documentId = null) {
  try {
    // Convert question into embedding
    const queryEmbedding = await generateEmbedding(query);

    const vectorSearch = {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 50,
      limit: limit,
    };

    // Search only inside a specific document if documentId is provided
    if (documentId) {
      vectorSearch.filter = {
        documentId: documentId,
      };
    }

    const results = await DocumentChunk.aggregate([
      {
        $vectorSearch: vectorSearch,
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          fileName: 1,
          chunkIndex: 1,
          text: 1,
          metadata: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ]);

    return results;
  } catch (error) {
    console.error("Vector search error:", error.message);
    throw new Error("Failed to retrieve relevant chunks");
  }
}

module.exports = {
  retrieveRelevantChunks,
};