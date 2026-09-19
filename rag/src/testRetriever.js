require("dotenv").config();

const connectDB = require("./config");
const { retrieveRelevantChunks } = require("./retrieval/retriever");

async function testRetriever() {
  try {
    await connectDB();

    const query = "What does ClubOps manage?";

    const results = await retrieveRelevantChunks(query, 3);

    console.log("\nQuery:");
    console.log(query);

    console.log("\nRetrieved chunks:");

    results.forEach((result, index) => {
      console.log("\n==============================");
      console.log(`Result ${index + 1}`);
      console.log("==============================");
      console.log("Score:", result.score);
      console.log("File:", result.fileName);
      console.log("Chunk:", result.chunkIndex);
      console.log("Text:", result.text);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testRetriever();