require("dotenv").config();

const connectDB = require("./config");
const { generateRAGAnswer } = require("./services/ragService");

async function testRAG() {
  try {
    await connectDB();

    const query = "What does ClubOps manage?";

    const result = await generateRAGAnswer(query);

    console.log("\n==============================");
    console.log("RAG ANSWER");
    console.log("==============================");

    console.log(result.answer);

    console.log("\nSOURCES:");
    console.log(result.sources);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testRAG();