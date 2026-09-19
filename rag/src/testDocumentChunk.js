require("dotenv").config();

const connectDB = require("./config");
const DocumentChunk = require("./models/DocumentChunk");
const { generateEmbedding } = require("./embeddings/embedder");

async function testDocumentChunk() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Sample chunk
    const text =
      "ClubOps manages college club events, tasks, members, and documents.";

    // Generate Gemini embedding
    const embedding = await generateEmbedding(text);

    // Save chunk to MongoDB
    const chunk = await DocumentChunk.create({
      documentId: "test-document-001",
      fileName: "test.pdf",
      chunkIndex: 0,
      text: text,
      embedding: embedding,
      metadata: {
        source: "test",
      },
    });

    console.log("✅ Document chunk saved successfully!");
    console.log("MongoDB ID:", chunk._id);
    console.log("Vector dimensions:", chunk.embedding.length);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testDocumentChunk();