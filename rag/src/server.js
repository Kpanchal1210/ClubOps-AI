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

// ==========================================
// Connect to MongoDB Atlas
// ==========================================

connectDB();

// ==========================================
// File Upload Configuration
// ==========================================

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
      // ------------------------------------------
      // Get club and event information
      // ------------------------------------------

      const { clubId, eventId } = req.body;

      // clubId is required
      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: "clubId is required",
        });
      }

      // ------------------------------------------
      // Check if file exists
      // ------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No document uploaded",
        });
      }

      // ------------------------------------------
      // Only PDF files
      // ------------------------------------------

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are supported",
        });
      }

      console.log(`Processing: ${req.file.originalname}`);
      console.log(`Club ID: ${clubId}`);
      console.log(`Event ID: ${eventId || "N/A"}`);

      // ------------------------------------------
      // 1. Extract text from PDF
      // ------------------------------------------

      const result = await extractTextFromPDF(req.file.buffer);

      console.log(
        `Extracted ${result.text.length} characters`
      );

      // ------------------------------------------
      // 2. Split text into chunks
      // ------------------------------------------

      const chunks = chunkText(
        result.text,
        500,
        50
      );

      console.log(
        `Created ${chunks.length} chunks`
      );

      // ------------------------------------------
      // 3. Generate document ID
      // ------------------------------------------

      const documentId = `doc-${Date.now()}`;

      const savedChunks = [];

      // ------------------------------------------
      // 4. Generate embeddings + save to MongoDB
      // ------------------------------------------

      for (const chunk of chunks) {
        console.log(
          `Embedding chunk ${chunk.chunkIndex}...`
        );

        // Generate Gemini embedding
        const embedding = await generateEmbedding(
          chunk.text
        );

        // Save chunk
        const savedChunk =
          await DocumentChunk.create({
            documentId,

            clubId,

            eventId: eventId || null,

            fileName:
              req.file.originalname,

            chunkIndex:
              chunk.chunkIndex,

            text: chunk.text,

            embedding,

            metadata: {
              pages: result.pages,
            },
          });

        savedChunks.push(savedChunk);
      }

      console.log(
        "All chunks saved successfully"
      );

      // ------------------------------------------
      // 5. Send response
      // ------------------------------------------

      return res.json({
        success: true,
        message:
          "Document processed successfully",

        documentId,

        clubId,

        eventId: eventId || null,

        fileName:
          req.file.originalname,

        pages: result.pages,

        totalChunks:
          savedChunks.length,
      });

    } catch (error) {
      console.error(
        "Upload processing error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// Ask Question
//
// Question
// + documentId
// + clubId
// + eventId
//
// → Vector Search
// → Gemini
// → Answer
// ==========================================

app.post(
  "/api/rag/ask",
  async (req, res) => {
    try {
      // ------------------------------------------
      // Get request data
      // ------------------------------------------

      const {
        question,
        documentId,
        clubId,
        eventId,
      } = req.body;

      // ------------------------------------------
      // Validate question
      // ------------------------------------------

      if (
        !question ||
        question.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required",
        });
      }

      // ------------------------------------------
      // Validate clubId
      // ------------------------------------------

      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: "clubId is required",
        });
      }

      console.log(
        `RAG question: ${question}`
      );

      console.log(
        `Club ID: ${clubId}`
      );

      // ------------------------------------------
      // Show document ID
      // ------------------------------------------

      if (documentId) {
        console.log(
          `Document ID: ${documentId}`
        );
      } else {
        console.log(
          "No document ID provided."
        );
      }

      // ------------------------------------------
      // Show event ID
      // ------------------------------------------

      if (eventId) {
        console.log(
          `Event ID: ${eventId}`
        );
      } else {
        console.log(
          "No event ID provided."
        );
      }

      // ------------------------------------------
      // Generate RAG answer
      // ------------------------------------------

      const result =
        await generateRAGAnswer(
          question,
          documentId || null,
          clubId,
          eventId || null
        );

      // ------------------------------------------
      // Send response
      // ------------------------------------------

      return res.json({
        success: true,

        question,

        documentId:
          documentId || null,

        clubId,

        eventId:
          eventId || null,

        answer:
          result.answer,

        sources:
          result.sources,
      });

    } catch (error) {
      console.error(
        "RAG ask error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// Start Server
// ==========================================

const PORT =
  process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `RAG server running on http://localhost:${PORT}`
  );
});