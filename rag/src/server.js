const express = require("express");
const multer = require("multer");
require("dotenv").config();

const { extractTextFromPDF } = require("./loaders/documentLoader");
const { chunkText } = require("./chunking/chunker");
const { generateEmbedding } = require("./embeddings/embedder");
const DocumentChunk = require("./models/DocumentChunk");
const connectDB = require("./config");
const { generateRAGAnswer } = require("./services/ragService");

const app = express();

app.use(express.json());

// Connect to MongoDB Atlas
connectDB();

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
});

// ==========================================
// Health Check
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ClubOps RAG Service is running",
  });
});

// ==========================================
// Upload PDF
// PDF → Extract → Chunk → Embed → MongoDB
// ==========================================

app.post(
  "/api/rag/upload",
  upload.single("document"),
  async (req, res) => {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No document uploaded",
        });
      }

      // Only PDF files
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are supported",
        });
      }

      console.log(`Processing: ${req.file.originalname}`);

      // ------------------------------------------
      // 1. Extract text from PDF
      // ------------------------------------------

      const result = await extractTextFromPDF(req.file.buffer);

      console.log(`Extracted ${result.text.length} characters`);

      // ------------------------------------------
      // 2. Split text into chunks
      // ------------------------------------------

      const chunks = chunkText(result.text, 500, 50);

      console.log(`Created ${chunks.length} chunks`);

      // ------------------------------------------
      // 3. Generate embeddings + save to MongoDB
      // ------------------------------------------

      const documentId = `doc-${Date.now()}`;

      const savedChunks = [];

      for (const chunk of chunks) {
        console.log(`Embedding chunk ${chunk.chunkIndex}...`);

        // Generate Gemini embedding
        const embedding = await generateEmbedding(chunk.text);

        // Save chunk
        const savedChunk = await DocumentChunk.create({
          documentId,
          fileName: req.file.originalname,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          embedding,
          metadata: {
            pages: result.pages,
          },
        });

        savedChunks.push(savedChunk);
      }

      console.log("All chunks saved successfully");

      // ------------------------------------------
      // 4. Send response
      // ------------------------------------------

      res.json({
        success: true,
        message: "Document processed successfully",
        documentId,
        fileName: req.file.originalname,
        pages: result.pages,
        totalChunks: savedChunks.length,
      });
    } catch (error) {
      console.error("Upload processing error:", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// Ask Question
// Question + Document ID
// → Vector Search → Gemini → Answer
// ==========================================

app.post("/api/rag/ask", async (req, res) => {
  try {
    const { question, documentId } = req.body;

    // Check question
    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    console.log(`RAG question: ${question}`);

    // Show document ID if provided
    if (documentId) {
      console.log(`Document ID: ${documentId}`);
    } else {
      console.log("No document ID provided. Searching all documents.");
    }

    // Generate RAG answer
    const result = await generateRAGAnswer(
      question,
      documentId
    );

    // Send response
    res.json({
      success: true,
      question,
      documentId: documentId || null,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("RAG ask error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `RAG server running on http://localhost:${PORT}`
  );
});