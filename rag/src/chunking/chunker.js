function chunkText(text, chunkSize = 500, overlap = 50) {
    if (!text || typeof text !== "string") {
      throw new Error("Text is required for chunking");
    }
  
    const chunks = [];
  
    let start = 0;
  
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
  
      const chunk = text.slice(start, end).trim();
  
      if (chunk.length > 0) {
        chunks.push({
          text: chunk,
          chunkIndex: chunks.length
        });
      }
  
      if (end === text.length) {
        break;
      }
  
      start = end - overlap;
    }
  
    return chunks;
  }
  
  module.exports = {
    chunkText
  };