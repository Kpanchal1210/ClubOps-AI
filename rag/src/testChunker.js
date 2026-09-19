const { chunkText } = require("./chunking/chunker");

const text = `
Lab Assignment 1: Exploring 8086 Architecture using DEBUG UTILITY.

Task 1
Display registers using R. Record AX, BX, CX, DX, SP, BP, SI, DI, CS, DS, ES, SS, IP and Flags.

Task 2
Modify AX=1234H, BX=ABCDH, CX=0010H and DX=FFFFH using R. Verify Changes.

Task 3
Dump memory using D 100. Observe hexadecimal and ASCII representations.
`;

const chunks = chunkText(text, 200, 30);

console.log(`Total chunks: ${chunks.length}`);

chunks.forEach((chunk) => {
  console.log("\n==============================");
  console.log(`Chunk ${chunk.chunkIndex}`);
  console.log("==============================");
  console.log(chunk.text);
});