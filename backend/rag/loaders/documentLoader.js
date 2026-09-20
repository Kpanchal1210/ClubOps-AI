const pdfParse = require("pdf-parse");

/**
 * Extract plain text and page count from a PDF buffer.
 * Supports both pdf-parse v1 (function-style) and v2 (class-style).
 */
async function extractTextFromPDF(buffer) {
  try {
    if (typeof pdfParse === "function") {
      const result = await pdfParse(buffer);
      return {
        text: result.text || "",
        pages: result.numpages || 1
      };
    } else if (pdfParse && pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({
        data: buffer
      });
      const result = await parser.getText();
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
      return {
        text: result.text || "",
        pages: result.total || 1
      };
    } else {
      // Fallback invocation
      const result = await pdfParse(buffer);
      return {
        text: result.text || "",
        pages: result.numpages || 1
      };
    }
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF
};
