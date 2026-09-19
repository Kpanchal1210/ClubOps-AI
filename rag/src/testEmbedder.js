const { chunkText } = require("./chunking/chunker");
const { generateEmbedding } = require("./embeddings/embedder");

async function testChunkEmbeddings() {
  try {
    const text = `
Lab Assignment 1: Exploring 8086 Architecture using DEBUG UTILITY.

Task 1
Display registers using R. Record AX, BX, CX, DX, SP, BP, SI, DI, CS, DS, ES, SS, IP and Flags.

Task 2
Modify AX=1234H, BX=ABCDH, CX=0010H and DX=FFFFH using R. Verify Changes.

Task 3
Dump memory using D 100. Observe hexadecimal and ASCII representations.
`;

    // Step 1: Create chunks
    const chunks = chunkText(text, 200, 30);

    console.log(`Total chunks: ${chunks.length}`);

    // Step 2: Generate embedding for every chunk
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      console.log("\n==============================");
      console.log(`Chunk ${chunk.chunkIndex}`);
      console.log("==============================");

      console.log("Text:", chunk.text);
      console.log("Vector dimensions:", embedding.length);
      console.log("First 5 values:", embedding.slice(0, 5));
    }

    console.log("\n✅ All chunks embedded successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testChunkEmbeddings();