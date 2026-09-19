const pdfParse = require("pdf-parse");

async function extractTextFromPDF(buffer) {
  try {
    const parser = new pdfParse.PDFParse({
      data: buffer
    });

    const result = await parser.getText();

    await parser.destroy();

    return {
      text: result.text,
      pages: result.total
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract PDF text");
  }
}

module.exports = {
  extractTextFromPDF
};