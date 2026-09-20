const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

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

/**
 * Extract plain text from Word document (.docx) buffer using mammoth.
 */
async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value || "",
      pages: Math.max(1, Math.ceil((result.value || "").length / 2500))
    };
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error(`Failed to extract DOCX text: ${error.message}`);
  }
}

/**
 * Extract plain text from file buffer based on mimetype or extension.
 */
async function extractTextFromFile(buffer, fileName, mimetype) {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  if (ext === "pdf" || mimetype === "application/pdf") {
    return await extractTextFromPDF(buffer);
  }
  if (ext === "docx" || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return await extractTextFromDocx(buffer);
  }
  if (ext === "doc" || mimetype === "application/msword") {
    try {
      return await extractTextFromDocx(buffer);
    } catch (_) {
      const text = buffer.toString("utf-8").replace(/[^\x20-\x7E\t\r\n]/g, " ").replace(/\s{2,}/g, " ").trim();
      return { text, pages: 1 };
    }
  }
  if (ext === "txt" || ext === "md" || mimetype?.startsWith("text/")) {
    return { text: buffer.toString("utf-8"), pages: 1 };
  }
  return { text: buffer.toString("utf-8"), pages: 1 };
}

module.exports = {
  extractTextFromPDF,
  extractTextFromDocx,
  extractTextFromFile
};
